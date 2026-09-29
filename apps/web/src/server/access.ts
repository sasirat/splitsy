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
    select: { id: true, groupId: true },
  });
}
