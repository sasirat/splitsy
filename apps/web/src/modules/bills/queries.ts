import "server-only";
import { billAccessWhere } from "@/server/access";
import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { billTotals } from "./service";

const person = { select: { id: true, displayName: true, email: true } } as const;

/** A bill the current user can access — payer, items in receipt order with
 *  who shares each, plus computed totals. null when missing or not a member. */
export async function getBill(billId: string) {
  const user = await requireUser();
  const bill = await getDb().bill.findFirst({
    where: { id: billId, ...billAccessWhere(user.id) },
    include: {
      payer: person,
      items: {
        // Concurrent adds can share a position; createdAt keeps order stable.
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        include: { splits: { include: { user: person } } },
      },
    },
  });
  if (!bill) return null;
  return { ...bill, totals: billTotals(bill.items) };
}

export type BillDetail = NonNullable<Awaited<ReturnType<typeof getBill>>>;

/** The current user's bills, newest first, with item count and subtotal. */
export async function listMyBills() {
  const user = await requireUser();
  const bills = await getDb().bill.findMany({
    where: billAccessWhere(user.id),
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      items: { select: { priceSatang: true } },
    },
  });
  return bills.map(({ items, ...bill }) => ({
    ...bill,
    itemCount: items.length,
    subtotalSatang: items.reduce((sum, item) => sum + item.priceSatang, 0),
  }));
}
