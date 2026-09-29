"use server";

import { revalidatePath } from "next/cache";
import { firstIssue, type ActionResult } from "@/lib/action-result";
import { findAccessibleBill } from "@/server/access";
import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { addItemInput, type AddItemInput } from "./schema";

/** Append an item to a bill the current user can access. It starts unclaimed —
 *  people tick what they had in S11. */
export async function addItem(input: AddItemInput): Promise<ActionResult<{ itemId: string }>> {
  const user = await requireUser();
  const parsed = addItemInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const { billId, name, price } = parsed.data;

  const bill = await findAccessibleBill(billId, user.id);
  if (!bill) return { ok: false, error: "Bill not found" };

  const db = getDb();
  const last = await db.item.findFirst({
    where: { billId },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  const item = await db.item.create({
    data: { billId, name, priceSatang: price, position: (last?.position ?? -1) + 1 },
    select: { id: true },
  });

  revalidatePath(`/bills/${billId}`);
  return { ok: true, itemId: item.id };
}
