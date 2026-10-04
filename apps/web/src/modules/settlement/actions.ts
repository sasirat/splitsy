"use server";

import { revalidatePath } from "next/cache";
import { firstIssue, type ActionResult } from "@/lib/action-result";
import { billSummary } from "@/modules/bills/service";
import { billAccessWhere } from "@/server/access";
import { requireUser } from "@/server/auth";
import { lockBillStatus } from "@/server/bill-lock";
import { getDb } from "@/server/db";
import { personName } from "@/lib/format";
import {
  claimPaidInput,
  markPaidInput,
  nudgeInput,
  paymentDetailsInput,
  startSettlingInput,
  type ClaimPaidInput,
  type MarkPaidInput,
  type NudgeInput,
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

/** A settlement on a bill the user can access, with who owes whom; null
 *  when missing or not a member (same answer, so ids can't be probed). */
function findSettlement(settlementId: string, userId: string) {
  return getDb().settlement.findFirst({
    where: { id: settlementId, bill: billAccessWhere(userId) },
    select: {
      billId: true,
      fromUserId: true,
      toUser: { select: { id: true, displayName: true, email: true } },
      bill: { select: { groupId: true } },
    },
  });
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
  const settlement = await findSettlement(settlementId, user.id);
  if (!settlement) return { ok: false, error: "Payment not found" };
  if (settlement.toUser.id !== user.id) {
    return { ok: false, error: "Only the person who paid can mark payments" };
  }
  const { billId } = settlement;

  // Under the bill's lock, so two quick taps on different rows can't both
  // read "someone still pending" and leave a fully paid bill SETTLING.
  const billStatus = await db.$transaction(async (tx) => {
    await lockBillStatus(tx, billId, "update");
    await tx.settlement.update({
      where: { id: settlementId },
      // Marking it either way settles any "I've paid" the friend sent.
      data: paid
        ? { status: "PAID", paidAt: new Date(), paidClaimedAt: null }
        : { status: "PENDING", paidAt: null, paidClaimedAt: null },
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

/** Payer only: note that they just reminded a friend who hasn't paid (the
 *  reminder itself goes out through the phone's share sheet). */
export async function recordNudge(input: NudgeInput): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = nudgeInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const { settlementId } = parsed.data;

  const settlement = await findSettlement(settlementId, user.id);
  if (!settlement) return { ok: false, error: "Payment not found" };
  if (settlement.toUser.id !== user.id) {
    return { ok: false, error: "Only the person who paid can nudge" };
  }
  // Conditional on PENDING, so it can't race a "mark paid".
  const { count } = await getDb().settlement.updateMany({
    where: { id: settlementId, status: "PENDING" },
    data: { nudgedAt: new Date() },
  });
  if (count === 0) return { ok: false, error: "They've already paid" };

  revalidatePath(`/bills/${settlement.billId}/settle`);
  return { ok: true };
}

/** The friend who owes: "I've paid" (or take it back). Only a hint for the
 *  payer, who still confirms by marking it paid. */
export async function claimPaid(input: ClaimPaidInput): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = claimPaidInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const { settlementId, claimed } = parsed.data;

  const settlement = await findSettlement(settlementId, user.id);
  if (!settlement) return { ok: false, error: "Payment not found" };
  if (settlement.fromUserId !== user.id) {
    return { ok: false, error: "Only the person who owes this can say they've paid" };
  }
  // Conditional on PENDING, so it can't race the payer marking it paid.
  const { count } = await getDb().settlement.updateMany({
    where: { id: settlementId, status: "PENDING" },
    data: { paidClaimedAt: claimed ? new Date() : null },
  });
  if (count === 0) {
    return { ok: false, error: `${personName(settlement.toUser)} has already marked this paid` };
  }

  revalidatePath(`/bills/${settlement.billId}/settle`);
  return { ok: true };
}
