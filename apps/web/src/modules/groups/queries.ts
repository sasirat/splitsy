import "server-only";
import { personName } from "@/lib/format";
import { groupAccessWhere } from "@/server/access";
import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { inviteState } from "./service";

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

/** What an invite link points at, for the join page. null for links that
 *  don't work (unknown, expired, revoked) — all look the same to outsiders. */
export async function getInvitePreview(token: string) {
  const user = await requireUser();
  const invite = await getDb().inviteToken.findUnique({
    where: { token },
    select: {
      expiresAt: true,
      revokedAt: true,
      createdBy: person,
      group: {
        select: {
          id: true,
          name: true,
          type: true,
          members: { orderBy: { joinedAt: "asc" }, select: { user: person } },
          bills: { select: { id: true, title: true }, take: 1 },
        },
      },
    },
  });
  if (!invite || inviteState(invite, new Date()) !== "valid") return null;

  const { group } = invite;
  const quickBill = group.type === "AD_HOC" ? group.bills[0] : undefined;
  const members = group.members.map((member) => member.user);
  return {
    kind: quickBill ? ("bill" as const) : ("group" as const),
    name: quickBill?.title ?? group.name,
    inviterName: personName(invite.createdBy),
    members,
    alreadyMember: members.some((member) => member.id === user.id),
    destination: quickBill ? `/bills/${quickBill.id}` : `/groups/${group.id}`,
  };
}

export type InvitePreview = NonNullable<Awaited<ReturnType<typeof getInvitePreview>>>;

export type GroupDetail = NonNullable<Awaited<ReturnType<typeof getGroup>>>;
