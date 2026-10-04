"use server";

import { revalidatePath } from "next/cache";
import { firstIssue, type ActionResult } from "@/lib/action-result";
import { billSummary } from "@/modules/bills/service";
import { billAccessWhere } from "@/server/access";
import { requireUser } from "@/server/auth";
import { lockBillStatus } from "@/server/bill-lock";
import { getDb } from "@/server/db";
import {
  markPaidInput,
  paymentDetailsInput,
  startSettlingInput,
  type MarkPaidInput,
  type PaymentDetailsInput,
  type StartSettlingInput,
} from "./schema";
import { billDebts, imageType } from "./service";

type SettleStatus = "SETTLING" | "SETTLED";

/** Payer only: close the bill for claiming and record what each friend owes.
 *  Every item must be claimed first, so nobody's total changes afterwards.
 *  With nobody owing anything the bill is settled straight away. Idempotent:
 *  a second call returns the bill's current status and writes nothing. */
export async function startSettling(
  input: StartSettlingInput,
): Promise<ActionResult<{ status: SettleStatus }>> {
  const user = await requireUser();
  const parsed = startSettlingInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const { billId } = parsed.data;

  const db = getDb();
  const bill = await db.bill.findFirst({
    where: { id: billId, ...billAccessWhere(user.id) },
    select: { payerId: true, groupId: true },
  });
  if (!bill) return { ok: false, error: "Bill not found" };
  if (bill.payerId !== user.id) {
    return { ok: false, error: "Only the person who paid can settle up" };
  }

  // Read, check and snapshot under the bill's row lock: item writes wait on
  // it, so the claims can't change between reading them and saving the debts.
  // A second call finds the bill no longer OPEN and writes nothing.
  const result = await db.$transaction(
    async (tx): Promise<ActionResult<{ status: SettleStatus }>> => {
      const current = await lockBillStatus(tx, billId, "update");
      if (current === null) return { ok: false, error: "Bill not found" };
      if (current !== "OPEN") return { ok: true, status: current };

      const [items, members] = await Promise.all([
        tx.item.findMany({
          where: { billId },
          select: {
            id: true,
            name: true,
            priceSatang: true,
            splits: { select: { userId: true, shares: true } },
          },
        }),
        tx.groupMember.findMany({ where: { groupId: bill.groupId }, select: { userId: true } }),
      ]);
      if (items.length === 0) return { ok: false, error: "Add items before settling up" };

      const summary = billSummary(
        items,
        members.map((member) => ({ id: member.userId })),
        bill.payerId,
      );
      if (summary.unassignedItems.length > 0) {
        const names = summary.unassignedItems.map((item) => item.name).join(", ");
        const verb = summary.unassignedItems.length === 1 ? "isn't" : "aren't";
        return {
          ok: false,
          error: `${names} ${verb} claimed yet — claim every item before settling up`,
        };
      }

      const debts = billDebts(summary, bill.payerId);
      const status: SettleStatus = debts.length > 0 ? "SETTLING" : "SETTLED";
      await tx.bill.update({ where: { id: billId }, data: { status } });
      await tx.settlement.createMany({
        data: debts.map(({ fromId, toId, amountSatang }) => ({
          billId,
          fromUserId: fromId,
          toUserId: toId,
          amountSatang,
        })),
      });
      return { ok: true, status };
    },
  );
  if (!result.ok) return result;

  revalidatePath("/");
  revalidatePath(`/groups/${bill.groupId}`);
  // "layout" also covers the bill's summary and settle pages.
  revalidatePath(`/bills/${billId}`, "layout");
  return result;
}

/** Payment details show on every settle page of bills the user paid, so
 *  refresh all pages rather than tracking which bills those are. */
const revalidateEverything = () => revalidatePath("/", "layout");

/** Save how friends pay the current user back: bank, account number (stored
 *  as digits) and the name on the account. */
export async function savePaymentDetails(input: PaymentDetailsInput): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = paymentDetailsInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const { bankName, accountNumber, accountName } = parsed.data;

  await getDb().user.update({
    where: { id: user.id },
    data: { bankName, bankAccountNumber: accountNumber, bankAccountName: accountName },
  });
  revalidateEverything();
  return { ok: true };
}

export async function removePaymentDetails(): Promise<ActionResult> {
  const user = await requireUser();
  await getDb().user.update({
    where: { id: user.id },
    data: { bankName: null, bankAccountNumber: null, bankAccountName: null },
  });
  revalidateEverything();
  return { ok: true };
}

/** Kept under the 1 MB Server Action body limit with room to spare; the
 *  browser resizes QR screenshots well below this before uploading. */
const MAX_QR_BYTES = 512 * 1024;

/** Store (or replace) the current user's payment QR from form field "qr".
 *  The type comes from the file's bytes, never its name or declared type. */
export async function uploadPaymentQr(form: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const file = form.get("qr");
  if (!(file instanceof File)) return { ok: false, error: "Upload a PNG, JPEG or WebP image" };
  if (file.size > MAX_QR_BYTES) {
    return { ok: false, error: "That image is too big — keep it under 512 KB" };
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mimeType = imageType(bytes);
  if (!mimeType) return { ok: false, error: "Upload a PNG, JPEG or WebP image" };

  await getDb().paymentQr.upsert({
    where: { userId: user.id },
    create: { userId: user.id, image: bytes, mimeType },
    update: { image: bytes, mimeType },
  });
  revalidateEverything();
  return { ok: true };
}

export async function removePaymentQr(): Promise<ActionResult> {
  const user = await requireUser();
  await getDb().paymentQr.deleteMany({ where: { userId: user.id } });
  revalidateEverything();
  return { ok: true };
}

/** Payer only: mark a friend as paid back (or undo it). The bill is SETTLED
 *  once nobody is left pending, and back to SETTLING if a payment is undone. */
export async function markPaid(
  input: MarkPaidInput,
): Promise<ActionResult<{ billStatus: SettleStatus }>> {
  const user = await requireUser();
  const parsed = markPaidInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const { settlementId, paid } = parsed.data;

  const db = getDb();
  const settlement = await db.settlement.findFirst({
    where: { id: settlementId, bill: billAccessWhere(user.id) },
    select: { billId: true, toUserId: true, bill: { select: { groupId: true } } },
  });
  if (!settlement) return { ok: false, error: "Payment not found" };
  if (settlement.toUserId !== user.id) {
    return { ok: false, error: "Only the person who paid can mark payments" };
  }
  const { billId } = settlement;

  // Under the bill's lock, so two quick taps on different rows can't both
  // read "someone still pending" and leave a fully paid bill SETTLING.
  const billStatus = await db.$transaction(async (tx) => {
    await lockBillStatus(tx, billId, "update");
    await tx.settlement.update({
      where: { id: settlementId },
      data: paid ? { status: "PAID", paidAt: new Date() } : { status: "PENDING", paidAt: null },
    });
    const pending = await tx.settlement.count({ where: { billId, status: "PENDING" } });
    const status: SettleStatus = pending === 0 ? "SETTLED" : "SETTLING";
    await tx.bill.update({ where: { id: billId }, data: { status } });
    return status;
  });

  revalidatePath("/");
  revalidatePath(`/groups/${settlement.bill.groupId}`);
  revalidatePath(`/bills/${billId}`, "layout");
  return { ok: true, billStatus };
}
