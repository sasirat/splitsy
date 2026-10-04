"use server";

import { revalidatePath } from "next/cache";
import { firstIssue, type ActionResult } from "@/lib/action-result";
import { billSummary } from "@/modules/bills/service";
import { billAccessWhere } from "@/server/access";
import { requireUser } from "@/server/auth";
import { lockBillStatus } from "@/server/bill-lock";
import { getDb } from "@/server/db";
import { startSettlingInput, type StartSettlingInput } from "./schema";
import { billDebts } from "./service";

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
