"use server";

import { revalidatePath } from "next/cache";
import { firstIssue, type ActionResult } from "@/lib/action-result";
import { groupAccessWhere } from "@/server/access";
import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { createBillInput, type CreateBillInput } from "./schema";

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
