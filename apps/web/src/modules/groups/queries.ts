import "server-only";
import { groupAccessWhere } from "@/server/access";
import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";

const person = { select: { id: true, displayName: true, email: true } } as const;

/** The current user's persistent groups, newest first, with counts. */
export async function listMyGroups() {
  const user = await requireUser();
  const groups = await getDb().group.findMany({
    where: groupAccessWhere(user.id),
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      _count: { select: { members: true, bills: true } },
    },
  });
  return groups.map(({ _count, ...group }) => ({
    ...group,
    memberCount: _count.members,
    billCount: _count.bills,
  }));
}

/** A persistent group the current user is in — members in join order and its
 *  bills newest first with item count and subtotal. null when missing, not a
 *  member, or a quick-bill group. */
export async function getGroup(groupId: string) {
  const user = await requireUser();
  const group = await getDb().group.findFirst({
    where: { id: groupId, ...groupAccessWhere(user.id) },
    select: {
      id: true,
      name: true,
      members: { orderBy: { joinedAt: "asc" }, select: { user: person } },
      bills: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          number: true,
          title: true,
          status: true,
          createdAt: true,
          items: { select: { priceSatang: true } },
        },
      },
    },
  });
  if (!group) return null;
  return {
    id: group.id,
    name: group.name,
    members: group.members.map((member) => member.user),
    bills: group.bills.map(({ items, ...bill }) => ({
      ...bill,
      itemCount: items.length,
      subtotalSatang: items.reduce((sum, item) => sum + item.priceSatang, 0),
    })),
  };
}

export type GroupDetail = NonNullable<Awaited<ReturnType<typeof getGroup>>>;
