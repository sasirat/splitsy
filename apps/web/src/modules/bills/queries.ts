import "server-only";
import { billAccessWhere } from "@/server/access";
import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { myBillPart } from "@/modules/settlement/service";
import { billTotals } from "./service";

const person = { select: { id: true, displayName: true, email: true } } as const;

/** A bill the current user can access — payer, group members, items in receipt
 *  order with who shares each, plus computed totals. null when missing or not
 *  a member. */
export async function getBill(billId: string) {
  const user = await requireUser();
  const bill = await getDb().bill.findFirst({
    where: { id: billId, ...billAccessWhere(user.id) },
    include: {
      payer: person,
      group: {
        select: {
          id: true,
          name: true,
          type: true,
          members: { orderBy: { joinedAt: "asc" }, select: { user: person } },
        },
      },
      items: {
        // Concurrent adds can share a position; createdAt keeps order stable.
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        include: { splits: { include: { user: person } } },
      },
    },
  });
  if (!bill) return null;
  const { group, ...rest } = bill;
  return {
    ...rest,
    members: group.members.map((member) => member.user),
    /** The persistent group this bill is in; null for quick bills. */
    namedGroup: group.type === "PERSISTENT" ? { id: group.id, name: group.name } : null,
    totals: billTotals(bill.items),
  };
}

export type BillDetail = NonNullable<Awaited<ReturnType<typeof getBill>>>;

/** The current user's bills, newest first, with item count, subtotal and
 *  group name. */
export async function listMyBills() {
  const user = await requireUser();
  const bills = await getDb().bill.findMany({
    where: billAccessWhere(user.id),
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      number: true,
      title: true,
      status: true,
      createdAt: true,
      group: { select: { name: true, type: true } },
      items: { select: { priceSatang: true } },
      payerId: true,
      settlements: {
        select: { fromUserId: true, amountSatang: true, status: true, paidClaimedAt: true },
      },
    },
  });
  return bills.map(({ items, group, settlements, payerId, ...bill }) => ({
    ...bill,
    /** The viewer's part once settling (see myBillPart); null while open. */
    myPart: bill.status === "OPEN" ? null : myBillPart(settlements, payerId, user.id),
    /** Set for bills in a persistent group; quick bills have none. */
    groupName: group.type === "PERSISTENT" ? group.name : null,
    itemCount: items.length,
    subtotalSatang: items.reduce((sum, item) => sum + item.priceSatang, 0),
  }));
}
