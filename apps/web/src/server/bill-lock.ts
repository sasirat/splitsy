import "server-only";
import { Prisma } from "@/generated/prisma/client";

type Tx = Prisma.TransactionClient;

/** Lock a bill's row until the transaction ends and return its status (null
 *  if it's gone). Item writes take a "share" lock and settling an "update"
 *  lock, so no claim or new item can slip in between settling reading the
 *  bill and snapshotting what everyone owes. */
export async function lockBillStatus(tx: Tx, billId: string, mode: "share" | "update") {
  const lock = mode === "share" ? Prisma.sql`FOR SHARE` : Prisma.sql`FOR UPDATE`;
  const rows = await tx.$queryRaw<{ status: "OPEN" | "SETTLING" | "SETTLED" }[]>`
    SELECT "status" FROM "Bill" WHERE "id" = ${billId} ${lock}`;
  return rows[0]?.status ?? null;
}
