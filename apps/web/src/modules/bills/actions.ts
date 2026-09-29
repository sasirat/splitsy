"use server";

import { revalidatePath } from "next/cache";
import { firstIssue, type ActionResult } from "@/lib/action-result";
import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { createBillInput, type CreateBillInput } from "./schema";

/** Create a bill paid by the current user, inside a new hidden (AD_HOC) group
 *  they own. One nested write, so it's atomic: no orphan group on failure. */
export async function createBill(
  input: CreateBillInput,
): Promise<ActionResult<{ billId: string }>> {
  const user = await requireUser();
  const parsed = createBillInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const { title } = parsed.data;

  const bill = await getDb().bill.create({
    data: {
      title,
      payer: { connect: { id: user.id } },
      createdBy: { connect: { id: user.id } },
      group: {
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
  return { ok: true, billId: bill.id };
}
