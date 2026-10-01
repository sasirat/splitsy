"use server";

import { revalidatePath } from "next/cache";
import { firstIssue, type ActionResult } from "@/lib/action-result";
import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { createGroupInput, type CreateGroupInput } from "./schema";

/** Create a named, reusable group owned by the current user. One nested
 *  write, so the owner membership can't be missing. */
export async function createGroup(
  input: CreateGroupInput,
): Promise<ActionResult<{ groupId: string }>> {
  const user = await requireUser();
  const parsed = createGroupInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const group = await getDb().group.create({
    data: {
      name: parsed.data.name,
      type: "PERSISTENT",
      createdBy: { connect: { id: user.id } },
      members: { create: { userId: user.id, role: "OWNER" } },
    },
    select: { id: true },
  });

  revalidatePath("/");
  return { ok: true, groupId: group.id };
}
