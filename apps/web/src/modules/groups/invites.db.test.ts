// Integration tests: invite links + joining, against the Neon dev branch.
// Run with `pnpm test:db`. Signs in as seeded users by mocking requireUser,
// and deletes every group it creates (cascading to its invites).
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { getDb } from "@/server/db";

const auth = vi.hoisted(() => ({ currentUserId: "" }));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/server/auth", () => ({
  requireUser: vi.fn(async () => {
    const user = await getDb().user.findUnique({ where: { id: auth.currentUserId } });
    if (!user) throw new Error(`Seed user ${auth.currentUserId} missing — run pnpm db:seed`);
    return user;
  }),
}));

const { createGroup, getOrCreateInvite, joinGroup, resetInvite } = await import("./actions");
const { getInvitePreview } = await import("./queries");
const { createBill } = await import("@/modules/bills/actions");
const { getBill } = await import("@/modules/bills/queries");

const MINT = "seed_user_mint";
const PLOY = "seed_user_ploy";
const BEAM = "seed_user_beam";
const createdGroupIds: string[] = [];

async function newGroup() {
  const result = await createGroup({ name: "Invite test" });
  if (!result.ok) throw new Error(result.error);
  createdGroupIds.push(result.groupId);
  return result.groupId;
}

async function newQuickBill() {
  const result = await createBill({ title: "Invite dinner" });
  if (!result.ok) throw new Error(result.error);
  const { groupId } = await getDb().bill.findUniqueOrThrow({ where: { id: result.billId } });
  createdGroupIds.push(groupId);
  return { billId: result.billId, groupId };
}

async function inviteToken(groupId: string) {
  const result = await getOrCreateInvite({ groupId });
  if (!result.ok) throw new Error(result.error);
  return result.path.replace("/join/", "");
}

const isMember = async (groupId: string, userId: string) =>
  (await getDb().groupMember.count({ where: { groupId, userId } })) === 1;

beforeEach(() => {
  auth.currentUserId = MINT;
});

afterAll(async () => {
  await getDb().group.deleteMany({ where: { id: { in: createdGroupIds } } });
});

describe("getOrCreateInvite", () => {
  it("gives a member a 7-day link, and the same link when asked again", async () => {
    const groupId = await newGroup();

    const first = await getOrCreateInvite({ groupId });
    const second = await getOrCreateInvite({ groupId });
    if (!first.ok || !second.ok) throw new Error("expected ok");
    expect(first.path).toMatch(/^\/join\/[A-Za-z0-9_-]{43}$/);
    expect(second.path).toBe(first.path);
    const days = (first.expiresAt.getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(6.99);
    expect(days).toBeLessThanOrEqual(7);
  });

  it("works for a quick bill's hidden group", async () => {
    const { groupId } = await newQuickBill();
    expect(await getOrCreateInvite({ groupId })).toMatchObject({ ok: true });
  });

  it("refuses non-members, as if the group doesn't exist", async () => {
    const groupId = await newGroup();
    auth.currentUserId = BEAM;
    expect(await getOrCreateInvite({ groupId })).toEqual({ ok: false, error: "Group not found" });
    expect(await getDb().inviteToken.count({ where: { groupId } })).toBe(0);
  });

  it("issues a new link once the old one has expired", async () => {
    const groupId = await newGroup();
    const old = await inviteToken(groupId);
    await getDb().inviteToken.update({
      where: { token: old },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    expect(await inviteToken(groupId)).not.toBe(old);
  });
});

describe("resetInvite", () => {
  it("revokes the current link and returns a fresh one", async () => {
    const groupId = await newGroup();
    const old = await inviteToken(groupId);

    const reset = await resetInvite({ groupId });
    if (!reset.ok) throw new Error(reset.error);
    expect(reset.path).not.toBe(`/join/${old}`);

    auth.currentUserId = PLOY;
    expect(await joinGroup({ token: old })).toEqual({
      ok: false,
      error: "This invite link doesn't work any more",
    });
  });

  it("refuses non-members", async () => {
    const groupId = await newGroup();
    auth.currentUserId = BEAM;
    expect(await resetInvite({ groupId })).toEqual({ ok: false, error: "Group not found" });
  });
});

describe("joinGroup", () => {
  it("adds the user to a group and sends them to it; joining twice is harmless", async () => {
    const groupId = await newGroup();
    const token = await inviteToken(groupId);

    auth.currentUserId = PLOY;
    expect(await joinGroup({ token })).toEqual({ ok: true, redirectTo: `/groups/${groupId}` });
    expect(await joinGroup({ token })).toEqual({ ok: true, redirectTo: `/groups/${groupId}` });
    const membership = await getDb().groupMember.findUniqueOrThrow({
      where: { groupId_userId: { groupId, userId: PLOY } },
    });
    expect(membership.role).toBe("MEMBER");
  });

  it("joins a quick bill's group and sends the user to the bill", async () => {
    const { billId, groupId } = await newQuickBill();
    const token = await inviteToken(groupId);

    auth.currentUserId = PLOY;
    expect(await getBill(billId)).toBeNull();
    expect(await joinGroup({ token })).toEqual({ ok: true, redirectTo: `/bills/${billId}` });
    expect((await getBill(billId))?.members.map((m) => m.id)).toEqual([MINT, PLOY]);
  });

  it("rejects expired, revoked and unknown links the same way", async () => {
    const groupId = await newGroup();
    const expired = await inviteToken(groupId);
    await getDb().inviteToken.update({
      where: { token: expired },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    const revoked = await inviteToken(groupId);
    await getDb().inviteToken.update({
      where: { token: revoked },
      data: { revokedAt: new Date() },
    });

    auth.currentUserId = PLOY;
    for (const token of [expired, revoked, "not-a-real-token"]) {
      expect(await joinGroup({ token })).toEqual({
        ok: false,
        error: "This invite link doesn't work any more",
      });
    }
    expect(await isMember(groupId, PLOY)).toBe(false);
  });
});

describe("getInvitePreview", () => {
  it("shows who invited you to what, and whether you're already in", async () => {
    const groupId = await newGroup();
    const token = await inviteToken(groupId);

    auth.currentUserId = PLOY;
    expect(await getInvitePreview(token)).toMatchObject({
      name: "Invite test",
      kind: "group",
      inviterName: "Mint",
      alreadyMember: false,
      destination: `/groups/${groupId}`,
    });
    await joinGroup({ token });
    expect(await getInvitePreview(token)).toMatchObject({ alreadyMember: true });
  });

  it("names a quick bill by its title", async () => {
    const { billId, groupId } = await newQuickBill();
    const token = await inviteToken(groupId);
    auth.currentUserId = PLOY;
    expect(await getInvitePreview(token)).toMatchObject({
      name: "Invite dinner",
      kind: "bill",
      destination: `/bills/${billId}`,
    });
  });

  it("is null for links that don't work", async () => {
    expect(await getInvitePreview("not-a-real-token")).toBeNull();
  });
});

describe("invites shared from a bill in a named group", () => {
  it("lands the joiner on that bill and names it in the preview", async () => {
    const groupId = await newGroup();
    const bill = await createBill({ title: "Rent October", groupId });
    if (!bill.ok) throw new Error(bill.error);
    const token = await inviteToken(groupId);

    auth.currentUserId = PLOY;
    expect(await getInvitePreview(token, bill.billId)).toMatchObject({
      kind: "bill",
      name: "Rent October",
      groupName: "Invite test",
      destination: `/bills/${bill.billId}`,
    });
    expect(await joinGroup({ token, billId: bill.billId })).toEqual({
      ok: true,
      redirectTo: `/bills/${bill.billId}`,
    });
  });

  it("ignores a bill from a different group", async () => {
    const groupId = await newGroup();
    const { billId: otherBillId } = await newQuickBill();
    const token = await inviteToken(groupId);

    auth.currentUserId = PLOY;
    expect(await getInvitePreview(token, otherBillId)).toMatchObject({
      kind: "group",
      destination: `/groups/${groupId}`,
    });
    expect(await joinGroup({ token, billId: otherBillId })).toEqual({
      ok: true,
      redirectTo: `/groups/${groupId}`,
    });
  });
});
