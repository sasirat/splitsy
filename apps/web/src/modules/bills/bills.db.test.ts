// Integration tests: real actions + queries against the local test Postgres.
// Run with `pnpm test:db`. Signs in as seeded users by mocking requireUser,
// and deletes every group it creates.
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { getDb } from "@/server/db";

const auth = vi.hoisted(() => ({ currentUserId: "" }));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/server/auth", () => ({
  requireUser: vi.fn(async () => {
    const user = await getDb().user.findUnique({ where: { id: auth.currentUserId } });
    if (!user) throw new Error(`Seed user ${auth.currentUserId} missing — run pnpm test:db:up`);
    return user;
  }),
}));

const { createBill } = await import("./actions");
const { getBill, listMyBills } = await import("./queries");
const { addItem } = await import("@/modules/items/actions");

const MINT = "seed_user_mint";
const BEAM = "seed_user_beam";
const createdBillIds: string[] = [];

async function newBill(title = "Test bill") {
  const result = await createBill({ title });
  if (!result.ok) throw new Error(result.error);
  createdBillIds.push(result.billId);
  return result.billId;
}

beforeEach(() => {
  auth.currentUserId = MINT;
});

afterAll(async () => {
  const bills = await getDb().bill.findMany({
    where: { id: { in: createdBillIds } },
    select: { groupId: true },
  });
  // Settlements restrict bill deletion, so clear them before the group cascade.
  await getDb().settlement.deleteMany({ where: { billId: { in: createdBillIds } } });
  // Deleting the group cascades to membership, bills, items and splits.
  await getDb().group.deleteMany({ where: { id: { in: bills.map((b) => b.groupId) } } });
});

describe("createBill", () => {
  it("creates the bill in a hidden group owned by the creator, who pays", async () => {
    const billId = await newBill("  Som Tam Nua  ");

    const bill = await getDb().bill.findUniqueOrThrow({
      where: { id: billId },
      include: { group: { include: { members: true } } },
    });
    expect(bill.title).toBe("Som Tam Nua");
    expect(bill.number).toBeGreaterThan(0);
    expect(bill.payerId).toBe(MINT);
    expect(bill.createdById).toBe(MINT);
    expect(bill.group.type).toBe("AD_HOC");
    expect(bill.group.members).toEqual([expect.objectContaining({ userId: MINT, role: "OWNER" })]);
  });

  it("returns a message instead of throwing on bad input", async () => {
    expect(await createBill({ title: "   " })).toEqual({
      ok: false,
      error: "Give the bill a name",
    });
  });
});

describe("addItem + getBill", () => {
  it("appends items in order and computes totals", async () => {
    const billId = await newBill();
    for (const [name, price] of [
      ["Tom yum goong", "320"],
      ["Pad thai", "180.50"],
      ["Singha", "90"],
    ]) {
      expect(await addItem({ billId, name, price })).toMatchObject({ ok: true });
    }

    // Claim two items directly (the claim action comes in S11).
    const [tomYum, padThai] = await getDb().item.findMany({
      where: { billId },
      orderBy: { position: "asc" },
    });
    await getDb().itemSplit.createMany({
      data: [
        { itemId: tomYum.id, userId: MINT },
        { itemId: tomYum.id, userId: BEAM },
        { itemId: padThai.id, userId: BEAM, shares: 1 },
      ],
    });
    await getDb().groupMember.create({
      data: {
        groupId: (await getDb().bill.findUniqueOrThrow({ where: { id: billId } })).groupId,
        userId: BEAM,
      },
    });

    const bill = await getBill(billId);
    expect(bill?.items.map((i) => [i.position, i.name, i.priceSatang])).toEqual([
      [0, "Tom yum goong", 32000],
      [1, "Pad thai", 18050],
      [2, "Singha", 9000],
    ]);
    expect(bill?.payer.id).toBe(MINT);
    expect(bill?.totals).toEqual({
      subtotalSatang: 59050,
      perPersonSatang: { [MINT]: 16000, [BEAM]: 16000 + 18050 },
      unassignedSatang: 9000,
    });
  });

  it("refuses new items once the bill is no longer open", async () => {
    const billId = await newBill();
    await getDb().bill.update({ where: { id: billId }, data: { status: "SETTLING" } });

    expect(await addItem({ billId, name: "Late snack", price: "40" })).toEqual({
      ok: false,
      error: "This bill is settling up — items are locked",
    });
    expect(await getDb().item.count({ where: { billId } })).toBe(0);
  });

  it("rejects a bad price with a message", async () => {
    const billId = await newBill();
    expect(await addItem({ billId, name: "Som tam", price: "abc" })).toEqual({
      ok: false,
      error: "Enter a price like 120 or 120.50",
    });
  });
});

describe("access", () => {
  it("hides a bill from non-members, as if it doesn't exist", async () => {
    const billId = await newBill("Mint only");

    auth.currentUserId = BEAM;
    expect(await getBill(billId)).toBeNull();
    expect(await addItem({ billId, name: "Sneaky", price: "1" })).toEqual({
      ok: false,
      error: "Bill not found",
    });
    expect((await listMyBills()).map((b) => b.id)).not.toContain(billId);
    expect(await getDb().item.count({ where: { billId } })).toBe(0);
  });

  it("returns not found for a bill id that doesn't exist", async () => {
    expect(await getBill("does-not-exist")).toBeNull();
  });
});

describe("listMyBills", () => {
  it("lists the user's bills newest first with count and subtotal", async () => {
    const older = await newBill("Older");
    const newer = await newBill("Newer");
    await addItem({ billId: newer, name: "Coffee", price: "65" });
    await addItem({ billId: newer, name: "Cake", price: "120" });

    const bills = await listMyBills();
    const mine = bills.filter((b) => b.id === older || b.id === newer);
    expect(mine.map((b) => [b.title, b.itemCount, b.subtotalSatang])).toEqual([
      ["Newer", 2, 18500],
      ["Older", 0, 0],
    ]);
    expect(mine[0].number).toBeGreaterThan(mine[1].number);
  });

  it("shows each bill's status, and how much is paid back once settling", async () => {
    const open = await newBill("Still open");
    const settling = await newBill("Settling");
    await getDb().bill.update({
      where: { id: settling },
      data: {
        status: "SETTLING",
        settlements: {
          create: [
            { fromUserId: BEAM, toUserId: MINT, amountSatang: 10000, status: "PAID" },
            { fromUserId: "seed_user_ploy", toUserId: MINT, amountSatang: 5000 },
          ],
        },
      },
    });

    const bills = await listMyBills();
    const byId = (id: string) => bills.find((b) => b.id === id);
    expect(byId(open)).toMatchObject({ status: "OPEN", progress: null });
    expect(byId(settling)).toMatchObject({
      status: "SETTLING",
      progress: { paidSatang: 10000, totalSatang: 15000 },
    });
  });
});
