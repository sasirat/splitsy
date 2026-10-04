import "server-only";
import { billAccessWhere } from "@/server/access";
import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";

const person = { select: { id: true, displayName: true, email: true } } as const;

/** A bill's settle-up for the current user: the payer and who owes them,
 *  biggest debt first. null when missing or not a member. */
export async function getSettlement(billId: string) {
  const user = await requireUser();
  const bill = await getDb().bill.findFirst({
    where: { id: billId, ...billAccessWhere(user.id) },
    select: {
      id: true,
      number: true,
      title: true,
      status: true,
      createdAt: true,
      payer: person,
      settlements: {
        orderBy: [{ amountSatang: "desc" }, { fromUserId: "asc" }],
        select: { id: true, amountSatang: true, status: true, paidAt: true, fromUser: person },
      },
    },
  });
  if (!bill) return null;
  const sum = (list: { amountSatang: number }[]) =>
    list.reduce((total, s) => total + s.amountSatang, 0);
  return {
    ...bill,
    totalSatang: sum(bill.settlements),
    paidSatang: sum(bill.settlements.filter((s) => s.status === "PAID")),
  };
}

export type SettlementDetail = NonNullable<Awaited<ReturnType<typeof getSettlement>>>;
