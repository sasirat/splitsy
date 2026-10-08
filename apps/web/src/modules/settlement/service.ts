// Pure settlement math — no Prisma, no Next. All amounts are integer satang.
import { formatBaht } from "@/lib/format";
import type { BillSummary } from "@/modules/bills/service";

export type Payment = { fromId: string; toId: string; amountSatang: number };

/** Who owes whom on one bill: everyone but the payer pays the payer their
 *  total, in the summary's order. Anyone at ฿0 is skipped. */
export function billDebts(summary: Pick<BillSummary, "people">, payerId: string): Payment[] {
  return summary.people
    .filter((p) => p.userId !== payerId && p.owesPayerSatang > 0)
    .map((p) => ({ fromId: p.userId, toId: payerId, amountSatang: p.owesPayerSatang }));
}

/** Each person's net position across payments, by userId: positive means
 *  they're owed money, negative means they owe. Always sums to zero; anyone
 *  who comes out even is left out. */
export function netBalances(payments: Payment[]): Record<string, number> {
  const balances: Record<string, number> = {};
  for (const { fromId, toId, amountSatang } of payments) {
    balances[fromId] = (balances[fromId] ?? 0) - amountSatang;
    balances[toId] = (balances[toId] ?? 0) + amountSatang;
  }
  for (const [userId, balance] of Object.entries(balances)) {
    if (balance === 0) delete balances[userId];
  }
  return balances;
}

/** The fewest payments that settle the balances: repeatedly the biggest
 *  debtor pays the biggest creditor, so there are at most n−1 payments and
 *  nobody both pays and receives. Ties go to the lowest userId, so the result
 *  never depends on input order. */
export function simplifyDebts(balances: Record<string, number>): Payment[] {
  let sum = 0;
  for (const [userId, balance] of Object.entries(balances)) {
    if (!Number.isInteger(balance))
      throw new RangeError(`Invalid balance for ${userId}: ${balance}`);
    sum += balance;
  }
  if (sum !== 0) throw new RangeError(`Balances must sum to zero, got ${sum}`);

  const byId = (a: { userId: string }, b: { userId: string }) =>
    a.userId < b.userId ? -1 : a.userId > b.userId ? 1 : 0;
  const entries = Object.entries(balances)
    .map(([userId, balance]) => ({ userId, left: Math.abs(balance), owed: balance > 0 }))
    .filter((e) => e.left > 0)
    .sort(byId);
  const creditors = entries.filter((e) => e.owed);
  const debtors = entries.filter((e) => !e.owed);

  // First in id order among the largest — the stable tie-break.
  const largest = <T extends { left: number }>(list: T[]) =>
    list.reduce((best, e) => (e.left > best.left ? e : best));

  const payments: Payment[] = [];
  while (creditors.some((e) => e.left > 0)) {
    const creditor = largest(creditors);
    const debtor = largest(debtors);
    const amountSatang = Math.min(creditor.left, debtor.left);
    payments.push({ fromId: debtor.userId, toId: creditor.userId, amountSatang });
    creditor.left -= amountSatang;
    debtor.left -= amountSatang;
  }
  return payments;
}

/** An account number as Thai banks print it: 10 digits as 123-4-56789-0,
 *  12 digits (GSB) in fours. Anything else is returned unchanged. */
export function formatAccountNumber(digits: string): string {
  if (/^\d{10}$/.test(digits)) {
    return `${digits.slice(0, 3)}-${digits[3]}-${digits.slice(4, 9)}-${digits[9]}`;
  }
  if (/^\d{12}$/.test(digits)) return digits.replace(/(\d{4})(?=\d)/g, "$1-");
  return digits;
}

export type QrImageType = "image/png" | "image/jpeg" | "image/webp";

const startsWith = (bytes: Uint8Array, signature: number[], offset = 0) =>
  signature.every((byte, i) => bytes[offset + i] === byte);

/** The image type from a file's first bytes — never trust the name or the
 *  browser's declared type. Only PNG, JPEG and WebP; null for anything else. */
export function imageType(bytes: Uint8Array): QrImageType | null {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return "image/webp";
  }
  return null;
}

/** The payer's friendly reminder, ready to share on LINE and the like. */
export function nudgeMessage({
  name,
  billTitle,
  amountSatang,
  url,
}: {
  name: string;
  billTitle: string;
  amountSatang: number;
  url: string;
}): string {
  return (
    `Hi ${name}! Friendly reminder for ${billTitle} 🧾 — you owe ${formatBaht(amountSatang)}. ` +
    `Pay here: ${url} 🙏`
  );
}

/** Where the current user stands on a settling bill, for their bill card:
 *  the payer sees how much of what's owed is paid back; a friend sees their own
 *  debt and whether it's still owed, claimed ("I've paid") or confirmed paid. */
export type MyBillPart =
  | { role: "payer"; paidSatang: number; totalSatang: number }
  | { role: "debtor"; amountSatang: number; state: "owe" | "claimed" | "paid" }
  | { role: "none" };

export function myBillPart(
  settlements: {
    fromUserId: string;
    amountSatang: number;
    status: "PENDING" | "PAID";
    paidClaimedAt: Date | null;
  }[],
  payerId: string,
  userId: string,
): MyBillPart {
  if (userId === payerId) return { role: "payer", ...settleProgress(settlements) };
  const mine = settlements.find((settlement) => settlement.fromUserId === userId);
  if (!mine) return { role: "none" };
  const state = mine.status === "PAID" ? "paid" : mine.paidClaimedAt ? "claimed" : "owe";
  return { role: "debtor", amountSatang: mine.amountSatang, state };
}

/** How much of a bill's settlements is paid back, for "฿x of ฿y paid back". */
export function settleProgress(
  settlements: { amountSatang: number; status: "PENDING" | "PAID" }[],
) {
  let paidSatang = 0;
  let totalSatang = 0;
  for (const { amountSatang, status } of settlements) {
    totalSatang += amountSatang;
    if (status === "PAID") paidSatang += amountSatang;
  }
  return { paidSatang, totalSatang };
}
