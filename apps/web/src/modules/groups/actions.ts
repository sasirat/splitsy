"use server";

import { revalidatePath } from "next/cache";
import { firstIssue, type ActionResult } from "@/lib/action-result";
import { isMember } from "@/server/access";
import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import {
  createGroupInput,
  createInviteInput,
  joinGroupInput,
  type CreateGroupInput,
  type CreateInviteInput,
  type JoinGroupInput,
} from "./schema";
import { inviteState, newInviteExpiry, newInviteToken } from "./service";

const NOT_FOUND = "Group not found";
const DEAD_LINK = "This invite link doesn't work any more";

type InviteLink = { path: string; expiresAt: Date };

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

/** Where a group's invite link lands: a quick bill's only bill, else the group. */
async function groupDestination(groupId: string) {
  const group = await getDb().group.findUniqueOrThrow({
    where: { id: groupId },
    select: { type: true, bills: { select: { id: true }, take: 1 } },
  });
  const bill = group.bills[0];
  return group.type === "AD_HOC" && bill ? `/bills/${bill.id}` : `/groups/${groupId}`;
}

async function issueInvite(groupId: string, userId: string): Promise<InviteLink> {
  const invite = await getDb().inviteToken.create({
    data: {
      token: newInviteToken(),
      groupId,
      createdById: userId,
      expiresAt: newInviteExpiry(new Date()),
    },
    select: { token: true, expiresAt: true },
  });
  return { path: `/join/${invite.token}`, expiresAt: invite.expiresAt };
}

/** The group's current invite link, creating one if none is live. Any member
 *  can invite, including into a quick bill's hidden group. Returns a path —
 *  the client prefixes its own origin, so we never trust the Host header. */
export async function getOrCreateInvite(
  input: CreateInviteInput,
): Promise<ActionResult<InviteLink>> {
  const user = await requireUser();
  const parsed = createInviteInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const { groupId } = parsed.data;
  if (!(await isMember(groupId, user.id))) return { ok: false, error: NOT_FOUND };

  const live = await getDb().inviteToken.findFirst({
    where: { groupId, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    select: { token: true, expiresAt: true },
  });
  if (live) return { ok: true, path: `/join/${live.token}`, expiresAt: live.expiresAt };
  return { ok: true, ...(await issueInvite(groupId, user.id)) };
}

/** Kill every live link for the group (e.g. it was shared too widely) and
 *  issue a fresh one. */
export async function resetInvite(input: CreateInviteInput): Promise<ActionResult<InviteLink>> {
  const user = await requireUser();
  const parsed = createInviteInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const { groupId } = parsed.data;
  if (!(await isMember(groupId, user.id))) return { ok: false, error: NOT_FOUND };

  await getDb().inviteToken.updateMany({
    where: { groupId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return { ok: true, ...(await issueInvite(groupId, user.id)) };
}

/** Join the group behind a live invite link. Idempotent: an existing member
 *  just gets sent on. Dead and unknown links fail the same way. */
export async function joinGroup(
  input: JoinGroupInput,
): Promise<ActionResult<{ redirectTo: string }>> {
  const user = await requireUser();
  const parsed = joinGroupInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: DEAD_LINK };

  const db = getDb();
  const invite = await db.inviteToken.findUnique({
    where: { token: parsed.data.token },
    select: { groupId: true, expiresAt: true, revokedAt: true },
  });
  if (!invite || inviteState(invite, new Date()) !== "valid") {
    return { ok: false, error: DEAD_LINK };
  }

  const { groupId } = invite;
  await db.groupMember.upsert({
    where: { groupId_userId: { groupId, userId: user.id } },
    create: { groupId, userId: user.id, role: "MEMBER" },
    update: {},
  });

  const redirectTo = await groupDestination(groupId);
  revalidatePath("/");
  revalidatePath(redirectTo);
  return { ok: true, redirectTo };
}
