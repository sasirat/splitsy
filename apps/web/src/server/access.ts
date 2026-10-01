import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { getDb } from "./db";

/** The single access rule: you can see a bill iff you're a member of its group.
 *  Use this filter in every bill read so the rule lives in one place. */
export function billAccessWhere(userId: string): Prisma.BillWhereInput {
  return { group: { members: { some: { userId } } } };
}

/** The bill if `userId` may access it, else null. Callers treat null as
 *  "not found" so outsiders can't tell whether a bill exists. */
export function findAccessibleBill(billId: string, userId: string) {
  return getDb().bill.findFirst({
    where: { id: billId, ...billAccessWhere(userId) },
    select: { id: true, groupId: true, status: true },
  });
}

/** A persistent group `userId` is a member of. Quick-bill (AD_HOC) groups are
 *  implementation details of a single bill, so they never match. */
export function groupAccessWhere(userId: string): Prisma.GroupWhereInput {
  return { type: "PERSISTENT", members: { some: { userId } } };
}

/** Whether `userId` is in the group — any type, including a quick bill's
 *  hidden group (invites need that; listings use groupAccessWhere). */
export async function isMember(groupId: string, userId: string): Promise<boolean> {
  const membership = await getDb().groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
    select: { userId: true },
  });
  return membership !== null;
}
