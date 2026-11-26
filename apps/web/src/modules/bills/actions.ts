"use server";

import { revalidatePath } from "next/cache";
import { firstIssue, type ActionResult } from "@/lib/action-result";
import { billAccessWhere, groupAccessWhere } from "@/server/access";
import { requireUser } from "@/server/auth";
import { lockBillStatus } from "@/server/bill-lock";
import { getDb } from "@/server/db";
import {
  createBillInput,
  deleteBillInput,
  type CreateBillInput,
  type DeleteBillInput,
} from "./schema";
import { billDeleteBlock } from "./service";

/** Create a bill paid by the current user. With `groupId` it goes into that
 *  persistent group (members only); otherwise into a new hidden (AD_HOC) group
 *  they own — one nested write, so there's no orphan group on failure. */
export async function createBill(
  input: CreateBillInput,
): Promise<ActionResult<{ billId: string }>> {
  const user = await requireUser();
  const parsed = createBillInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const { title, groupId } = parsed.data;

  const db = getDb();
  if (groupId) {
    const group = await db.group.findFirst({
      where: { id: groupId, ...groupAccessWhere(user.id) },
      select: { id: true },
    });
    // Same answer for "doesn't exist" and "not yours", so ids can't be probed.
    if (!group) return { ok: false, error: "Group not found" };
  }

  const bill = await db.bill.create({
    data: {
      title,
      payer: { connect: { id: user.id } },
      createdBy: { connect: { id: user.id } },
      group: groupId
        ? { connect: { id: groupId } }
        : {
            create: {
              name: title,
              type: "AD_HOC",
              createdBy: { connect: { id: user.id } },
              members: { create: { userId: user.id, role: "OWNER" } },
            },
          },
    },
    select: { id: true },
  });

  revalidatePath("/");
  if (groupId) revalidatePath(`/groups/${groupId}`);
  return { ok: true, billId: bill.id };
}

/** Delete a bill — anyone in it can, until money has moved to the payer (see
 *  billDeleteBlock). A quick bill takes its hidden group with it (members and
 *  invite links); a bill in a persistent group leaves the group alone. The UI
 *  asks first. Returns where to go next. */
export async function deleteBill(
  input: DeleteBillInput,
): Promise<ActionResult<{ redirectTo: string }>> {
  const user = await requireUser();
  const parsed = deleteBillInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const { billId } = parsed.data;

  const db = getDb();
  const bill = await db.bill.findFirst({
    where: { id: billId, ...billAccessWhere(user.id) },
    select: { groupId: true, group: { select: { type: true } } },
  });
  if (!bill) return { ok: false, error: "Bill not found" };
  const quick = bill.group.type === "AD_HOC";

  const error = await db.$transaction(async (tx) => {
    // The bill lock holds off new items, claims, settling and "mark paid";
    // the settlement rows are locked too, since "I've paid" writes them
    // without taking the bill lock.
    if ((await lockBillStatus(tx, billId, "update")) === null) return "Bill not found";
    const settlements = await tx.$queryRaw<
      { status: "PENDING" | "PAID"; paidClaimedAt: Date | null }[]
    >`SELECT "status", "paidClaimedAt" FROM "Settlement" WHERE "billId" = ${billId} FOR UPDATE`;
    const block = billDeleteBlock(settlements);
    if (block) return block;

    // Settlements restrict deleting the bill, so they go first.
    await tx.settlement.deleteMany({ where: { billId } });
    if (quick) await tx.group.delete({ where: { id: bill.groupId } });
    else await tx.bill.delete({ where: { id: billId } });
    return null;
  });
  if (error) return { ok: false, error };

  revalidatePath("/");
  if (!quick) revalidatePath(`/groups/${bill.groupId}`);
  return { ok: true, redirectTo: quick ? "/" : `/groups/${bill.groupId}` };
}
