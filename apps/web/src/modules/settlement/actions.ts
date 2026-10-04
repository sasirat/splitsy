"use server";

import { revalidatePath } from "next/cache";
import { firstIssue, type ActionResult } from "@/lib/action-result";
import { billSummary } from "@/modules/bills/service";
import { billAccessWhere } from "@/server/access";
import { requireUser } from "@/server/auth";
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
    select: {
      payerId: true,
      status: true,
      groupId: true,
      group: { select: { members: { select: { userId: true } } } },
      items: {
        select: {
          id: true,
          name: true,
          priceSatang: true,
          splits: { select: { userId: true, shares: true } },
        },
      },
    },
  });
  if (!bill) return { ok: false, error: "Bill not found" };
  if (bill.payerId !== user.id) {
    return { ok: false, error: "Only the person who paid can settle up" };
  }
  if (bill.status !== "OPEN") return { ok: true, status: bill.status };
  if (bill.items.length === 0) return { ok: false, error: "Add items before settling up" };

  const members = bill.group.members.map((member) => ({ id: member.userId }));
  const summary = billSummary(bill.items, members, bill.payerId);
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
  // The status flip only matches an OPEN bill, so a concurrent second call
  // writes nothing and can't duplicate the settlements.
  await db.$transaction(async (tx) => {
    const { count } = await tx.bill.updateMany({
      where: { id: billId, status: "OPEN" },
      data: { status },
    });
    if (count === 0) return;
    await tx.settlement.createMany({
      data: debts.map(({ fromId, toId, amountSatang }) => ({
        billId,
        fromUserId: fromId,
        toUserId: toId,
        amountSatang,
      })),
    });
  });

  revalidatePath("/");
  revalidatePath(`/groups/${bill.groupId}`);
  // "layout" also covers the bill's summary and settle pages.
  revalidatePath(`/bills/${billId}`, "layout");
  return { ok: true, status };
}
