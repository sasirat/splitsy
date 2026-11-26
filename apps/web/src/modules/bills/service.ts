// Pure bill math — no Prisma, no Next. All amounts are integer satang.
import { splitItem, type Split } from "@/modules/items/service";

export type BillTotals = {
  subtotalSatang: number;
  /** What each person owes for the items they've claimed, by userId. */
  perPersonSatang: Record<string, number>;
  /** Value of items nobody has claimed yet. */
  unassignedSatang: number;
};

export function billTotals(items: { priceSatang: number; splits: Split[] }[]): BillTotals {
  const totals: BillTotals = { subtotalSatang: 0, perPersonSatang: {}, unassignedSatang: 0 };

  for (const item of items) {
    totals.subtotalSatang += item.priceSatang;
    if (item.splits.length === 0) {
      totals.unassignedSatang += item.priceSatang;
      continue;
    }
    for (const [userId, amount] of Object.entries(splitItem(item.priceSatang, item.splits))) {
      totals.perPersonSatang[userId] = (totals.perPersonSatang[userId] ?? 0) + amount;
    }
  }
  return totals;
}

export type SummaryLine = {
  itemId: string;
  name: string;
  priceSatang: number;
  /** This person's part of the item. */
  shareSatang: number;
  /** How many people split it. */
  sharedWith: number;
};

export type PersonSummary = {
  userId: string;
  totalSatang: number;
  /** What they owe the payer — their total, or 0 for the payer themselves. */
  owesPayerSatang: number;
  lines: SummaryLine[];
};

export type BillSummary = {
  /** Payer first, then members in the given order, then anyone who claimed an
   *  item but is no longer a member (so their share never goes missing). */
  people: PersonSummary[];
  subtotalSatang: number;
  unassignedSatang: number;
  unassignedItems: { itemId: string; name: string; priceSatang: number }[];
  owedToPayerSatang: number;
};

/** The bill grouped by person: what each had, their share, and what they owe
 *  the payer. Same split math as billTotals, so every amount matches it. */
export function billSummary(
  items: { id: string; name: string; priceSatang: number; splits: Split[] }[],
  members: { id: string }[],
  payerId: string,
): BillSummary {
  const people = new Map<string, PersonSummary>();
  const person = (userId: string) => {
    let entry = people.get(userId);
    if (!entry) {
      entry = { userId, totalSatang: 0, owesPayerSatang: 0, lines: [] };
      people.set(userId, entry);
    }
    return entry;
  };
  for (const { id } of [{ id: payerId }, ...members]) person(id);

  const summary: BillSummary = {
    people: [],
    subtotalSatang: 0,
    unassignedSatang: 0,
    unassignedItems: [],
    owedToPayerSatang: 0,
  };

  for (const item of items) {
    summary.subtotalSatang += item.priceSatang;
    if (item.splits.length === 0) {
      summary.unassignedSatang += item.priceSatang;
      summary.unassignedItems.push({
        itemId: item.id,
        name: item.name,
        priceSatang: item.priceSatang,
      });
      continue;
    }
    const parts = splitItem(item.priceSatang, item.splits);
    for (const { userId } of item.splits) {
      const entry = person(userId);
      entry.totalSatang += parts[userId];
      entry.lines.push({
        itemId: item.id,
        name: item.name,
        priceSatang: item.priceSatang,
        shareSatang: parts[userId],
        sharedWith: item.splits.length,
      });
    }
  }

  for (const entry of people.values()) {
    if (entry.userId !== payerId) {
      entry.owesPayerSatang = entry.totalSatang;
      summary.owedToPayerSatang += entry.totalSatang;
    }
    summary.people.push(entry);
  }
  return summary;
}

/** Why a bill can't be deleted, or null if it can. Deleting is fine until
 *  money has (probably) moved to the payer: a confirmed payment, or a friend's
 *  "I've paid" the payer hasn't confirmed yet. Open bills have no settlements,
 *  and a settled bill always has payments, so only that check is needed. */
export function billDeleteBlock(
  settlements: { status: "PENDING" | "PAID"; paidClaimedAt: Date | null }[],
): string | null {
  const paid = settlements.some((s) => s.status === "PAID" || s.paidClaimedAt !== null);
  return paid ? "Someone has already paid — this bill can't be deleted." : null;
}
