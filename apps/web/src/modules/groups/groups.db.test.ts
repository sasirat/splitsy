// Integration tests: persistent groups against the Neon dev branch.
// Run with `pnpm test:db`. Signs in as seeded users by mocking requireUser,
// and deletes every group it creates.
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

const { createGroup } = await import("./actions");
const { getGroup, listMyGroups } = await import("./queries");
const { createBill } = await import("@/modules/bills/actions");
const { getBill, listMyBills } = await import("@/modules/bills/queries");

const MINT = "seed_user_mint";
const PLOY = "seed_user_ploy";
const BEAM = "seed_user_beam";
const createdGroupIds: string[] = [];

async function newGroup(name = "Flatmates") {
  const result = await createGroup({ name });
  if (!result.ok) throw new Error(result.error);
  createdGroupIds.push(result.groupId);
  return result.groupId;
}

async function newBill(title: string, groupId?: string) {
  const result = await createBill({ title, groupId });
  if (!result.ok) throw new Error(result.error);
  const { groupId: billGroupId } = await getDb().bill.findUniqueOrThrow({
    where: { id: result.billId },
  });
  createdGroupIds.push(billGroupId);
  return result.billId;
}

beforeEach(() => {
  auth.currentUserId = MINT;
});

afterAll(async () => {
  // Deleting a group cascades to membership, bills, items and splits.
  await getDb().group.deleteMany({ where: { id: { in: createdGroupIds } } });
});

describe("createGroup", () => {
  it("creates a persistent group owned by the creator", async () => {
    const groupId = await newGroup("  Flatmates  ");

    const group = await getDb().group.findUniqueOrThrow({
      where: { id: groupId },
      include: { members: true },
    });
    expect(group.name).toBe("Flatmates");
    expect(group.type).toBe("PERSISTENT");
    expect(group.createdById).toBe(MINT);
    expect(group.members).toEqual([expect.objectContaining({ userId: MINT, role: "OWNER" })]);
  });

  it("returns a message instead of throwing on bad input", async () => {
    expect(await createGroup({ name: " " })).toEqual({
      ok: false,
      error: "Give the group a name",
    });
  });
});

describe("listMyGroups", () => {
  it("lists persistent groups newest first, hiding quick-bill groups", async () => {
    const older = await newGroup("Older group");
    const newer = await newGroup("Newer group");
    await newBill("Rent", newer);
    await newBill("Quick taxi"); // its hidden AD_HOC group must not show

    const groups = await listMyGroups();
    const mine = groups.filter((g) => g.id === older || g.id === newer);
    expect(mine.map((g) => [g.name, g.memberCount, g.billCount])).toEqual([
      ["Newer group", 1, 1],
      ["Older group", 1, 0],
    ]);
    expect(groups.every((g) => g.name !== "Quick taxi")).toBe(true);
  });

  it("doesn't list groups the user isn't in", async () => {
    const groupId = await newGroup("Mint's group");

    auth.currentUserId = BEAM;
    expect((await listMyGroups()).map((g) => g.id)).not.toContain(groupId);
  });
});

describe("getGroup", () => {
  it("returns members and bills, newest bill first, with subtotals", async () => {
    const groupId = await newGroup();
    await getDb().groupMember.create({ data: { groupId, userId: PLOY } });
    await newBill("September rent", groupId);
    await newBill("October rent", groupId);

    const group = await getGroup(groupId);
    expect(group?.name).toBe("Flatmates");
    expect(group?.members.map((m) => m.id)).toEqual([MINT, PLOY]);
    expect(group?.bills.map((b) => [b.title, b.itemCount, b.subtotalSatang])).toEqual([
      ["October rent", 0, 0],
      ["September rent", 0, 0],
    ]);
  });

  it("is null for outsiders, unknown ids and quick-bill groups", async () => {
    const groupId = await newGroup();
    const quickBillId = await newBill("Quick bill");
    const { groupId: hiddenGroupId } = await getDb().bill.findUniqueOrThrow({
      where: { id: quickBillId },
    });

    expect(await getGroup("does-not-exist")).toBeNull();
    expect(await getGroup(hiddenGroupId)).toBeNull();
    auth.currentUserId = BEAM;
    expect(await getGroup(groupId)).toBeNull();
  });
});

describe("createBill in a group", () => {
  it("puts the bill in the group, so every member can see it", async () => {
    const groupId = await newGroup();
    await getDb().groupMember.create({ data: { groupId, userId: PLOY } });

    const billId = await newBill("Rent", groupId);
    const bill = await getBill(billId);
    expect(bill?.groupId).toBe(groupId);
    expect(bill?.members.map((m) => m.id)).toEqual([MINT, PLOY]);
    expect(bill?.namedGroup).toEqual({ id: groupId, name: "Flatmates" });

    auth.currentUserId = PLOY;
    expect((await getBill(billId))?.title).toBe("Rent");
    const listed = (await listMyBills()).find((b) => b.id === billId);
    expect(listed?.groupName).toBe("Flatmates");
  });

  it("leaves groupName empty for quick bills", async () => {
    const billId = await newBill("Taxi");
    expect((await listMyBills()).find((b) => b.id === billId)?.groupName).toBeNull();
    expect((await getBill(billId))?.namedGroup).toBeNull();
  });

  it("refuses groups the user can't start bills in, as if they don't exist", async () => {
    const groupId = await newGroup();
    const quickBillId = await newBill("Quick bill");
    const { groupId: hiddenGroupId } = await getDb().bill.findUniqueOrThrow({
      where: { id: quickBillId },
    });

    expect(await createBill({ title: "Into a hidden group", groupId: hiddenGroupId })).toEqual({
      ok: false,
      error: "Group not found",
    });
    expect(await createBill({ title: "Nowhere", groupId: "does-not-exist" })).toEqual({
      ok: false,
      error: "Group not found",
    });
    auth.currentUserId = BEAM;
    expect(await createBill({ title: "Sneaky", groupId })).toEqual({
      ok: false,
      error: "Group not found",
    });
    // Scoped to these titles so other writes to the shared dev DB can't interfere.
    const attempted = ["Into a hidden group", "Nowhere", "Sneaky"];
    expect(await getDb().bill.count({ where: { title: { in: attempted } } })).toBe(0);
  });
});
