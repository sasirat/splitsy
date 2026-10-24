"use server";

import { revalidatePath } from "next/cache";
import { firstIssue, type ActionResult } from "@/lib/action-result";
import { billAccessWhere, findAccessibleBill } from "@/server/access";
import { requireUser } from "@/server/auth";
import { lockBillStatus } from "@/server/bill-lock";
import { getDb } from "@/server/db";
import { addItemInput, setClaimInput, type AddItemInput, type SetClaimInput } from "./schema";

const LOCKED = "This bill is settling up — items are locked";

/** Append an item to an open bill the current user can access. It starts
 *  unclaimed — people tick what they had in S11. */
export async function addItem(input: AddItemInput): Promise<ActionResult<{ itemId: string }>> {
  const user = await requireUser();
  const parsed = addItemInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const { billId, name, price } = parsed.data;

  const bill = await findAccessibleBill(billId, user.id);
  if (!bill) return { ok: false, error: "Bill not found" };
  // Once settling starts, amounts are final — no new items.
  if (bill.status !== "OPEN") {
    return { ok: false, error: LOCKED };
  }

  // Re-check under a lock: settling may have started since the check above.
  const item = await getDb().$transaction(async (tx) => {
    if ((await lockBillStatus(tx, billId, "share")) !== "OPEN") return null;
    const last = await tx.item.findFirst({
      where: { billId },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    return tx.item.create({
      data: { billId, name, priceSatang: price, position: (last?.position ?? -1) + 1 },
      select: { id: true },
    });
  });
  if (!item) return { ok: false, error: LOCKED };

  revalidatePath(`/bills/${billId}`);
  return { ok: true, itemId: item.id };
}

/** Tick (or untick) who had an item. Anyone in the bill can set it for
 *  anyone in the bill (S22 feedback: one person ticks for the table), so the
 *  person being ticked must be a member of the bill's group too. */
export async function setClaim(input: SetClaimInput): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = setClaimInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const { itemId, userId, claimed } = parsed.data;

  const db = getDb();
  const item = await db.item.findFirst({
    where: { id: itemId, bill: billAccessWhere(user.id) },
    select: {
      billId: true,
      bill: {
        select: {
          status: true,
          group: { select: { members: { where: { userId }, select: { userId: true } } } },
        },
      },
    },
  });
  if (!item) return { ok: false, error: "Item not found" };
  if (item.bill.group.members.length === 0) return { ok: false, error: "They're not in this bill" };
  if (item.bill.status !== "OPEN") return { ok: false, error: LOCKED };

  // Re-check under a lock: settling may have started since the check above.
  const locked = await db.$transaction(async (tx) => {
    if ((await lockBillStatus(tx, item.billId, "share")) !== "OPEN") return true;
    if (claimed) {
      await tx.itemSplit.upsert({
        where: { itemId_userId: { itemId, userId } },
        create: { itemId, userId, shares: 1 },
        update: {},
      });
    } else {
      await tx.itemSplit.deleteMany({ where: { itemId, userId } });
    }
    return false;
  });
  if (locked) return { ok: false, error: LOCKED };

  revalidatePath(`/bills/${item.billId}`);
  return { ok: true };
}
