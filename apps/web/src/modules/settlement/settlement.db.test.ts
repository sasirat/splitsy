// Integration tests: starting a settle-up against the Neon dev branch.
// Run with `pnpm test:db`. Signs in as seeded users by mocking requireUser,
// and deletes every group (and settlement) it creates.
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

const { createBill } = await import("@/modules/bills/actions");
const { addItem, setMyClaim } = await import("@/modules/items/actions");
const { startSettling } = await import("./actions");
const { getSettlement } = await import("./queries");

const MINT = "seed_user_mint";
const PLOY = "seed_user_ploy";
const BEAM = "seed_user_beam";
const createdBillIds: string[] = [];

/** A bill paid by Mint, with Ploy and Beam in its group, and items claimed as
 *  given: { "Pad thai": ["180", [MINT, PLOY]] }. An empty list leaves it unclaimed. */
async function billWithClaims(items: Record<string, [string, string[]]>) {
  auth.currentUserId = MINT;
  const created = await createBill({ title: "Settle test" });
  if (!created.ok) throw new Error(created.error);
  const { billId } = created;
  createdBillIds.push(billId);

  const { groupId } = await getDb().bill.findUniqueOrThrow({ where: { id: billId } });
  await getDb().groupMember.createMany({
    data: [PLOY, BEAM].map((userId) => ({ groupId, userId })),
  });

  for (const [name, [price, claimers]] of Object.entries(items)) {
    auth.currentUserId = MINT;
    const added = await addItem({ billId, name, price });
    if (!added.ok) throw new Error(added.error);
    for (const userId of claimers) {
      auth.currentUserId = userId;
      const claimed = await setMyClaim({ itemId: added.itemId, claimed: true });
      if (!claimed.ok) throw new Error(claimed.error);
    }
  }
  auth.currentUserId = MINT;
  return billId;
}

const settlementsOf = (billId: string) =>
  getDb().settlement.findMany({
    where: { billId },
    orderBy: { fromUserId: "asc" },
    select: { fromUserId: true, toUserId: true, amountSatang: true, status: true },
  });

const statusOf = async (billId: string) =>
  (await getDb().bill.findUniqueOrThrow({ where: { id: billId } })).status;

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
  await getDb().group.deleteMany({ where: { id: { in: bills.map((b) => b.groupId) } } });
});

describe("startSettling", () => {
  it("locks the bill and records what each friend owes the payer", async () => {
    const billId = await billWithClaims({
      "Pad thai": ["180", [MINT, PLOY]],
      Singha: ["270", [MINT, BEAM]],
      "Som tam": ["120", [PLOY, BEAM]],
    });

    expect(await startSettling({ billId })).toEqual({ ok: true, status: "SETTLING" });

    expect(await statusOf(billId)).toBe("SETTLING");
    expect(await settlementsOf(billId)).toEqual([
      { fromUserId: BEAM, toUserId: MINT, amountSatang: 13500 + 6000, status: "PENDING" },
      { fromUserId: PLOY, toUserId: MINT, amountSatang: 9000 + 6000, status: "PENDING" },
    ]);
  });

  it("is safe to run twice — no duplicate settlements", async () => {
    const billId = await billWithClaims({ "Pad thai": ["180", [MINT, PLOY]] });

    await startSettling({ billId });
    expect(await startSettling({ billId })).toEqual({ ok: true, status: "SETTLING" });
    expect(await settlementsOf(billId)).toHaveLength(1);
  });

  it("goes straight to settled when nobody owes the payer anything", async () => {
    const billId = await billWithClaims({ Coffee: ["65", [MINT]] });

    expect(await startSettling({ billId })).toEqual({ ok: true, status: "SETTLED" });
    expect(await statusOf(billId)).toBe("SETTLED");
    expect(await settlementsOf(billId)).toEqual([]);
  });

  it("refuses while any item is unclaimed", async () => {
    const billId = await billWithClaims({
      "Pad thai": ["180", [MINT, PLOY]],
      "Extra rice": ["190", []],
    });

    expect(await startSettling({ billId })).toEqual({
      ok: false,
      error: "Extra rice isn't claimed yet — claim every item before settling up",
    });
    expect(await statusOf(billId)).toBe("OPEN");
    expect(await settlementsOf(billId)).toEqual([]);
  });

  it("refuses a bill with no items", async () => {
    const billId = await billWithClaims({});

    expect(await startSettling({ billId })).toEqual({
      ok: false,
      error: "Add items before settling up",
    });
    expect(await statusOf(billId)).toBe("OPEN");
  });

  it("only lets the payer settle up", async () => {
    const billId = await billWithClaims({ "Pad thai": ["180", [MINT, PLOY]] });

    auth.currentUserId = PLOY;
    expect(await startSettling({ billId })).toEqual({
      ok: false,
      error: "Only the person who paid can settle up",
    });
    expect(await statusOf(billId)).toBe("OPEN");
  });

  it("hides bills the user can't access", async () => {
    const billId = await billWithClaims({ "Pad thai": ["180", [MINT]] });
    await getDb().groupMember.deleteMany({
      where: { userId: BEAM, group: { bills: { some: { id: billId } } } },
    });

    auth.currentUserId = BEAM;
    expect(await startSettling({ billId })).toEqual({ ok: false, error: "Bill not found" });
    expect(await startSettling({ billId: "does-not-exist" })).toEqual({
      ok: false,
      error: "Bill not found",
    });
  });

  it("locks items afterwards", async () => {
    const billId = await billWithClaims({ "Pad thai": ["180", [MINT, PLOY]] });
    await startSettling({ billId });

    expect(await addItem({ billId, name: "Late snack", price: "40" })).toEqual({
      ok: false,
      error: "This bill is settling up — items are locked",
    });
  });
});

describe("getSettlement", () => {
  it("lists who owes the payer, biggest first, with names", async () => {
    const billId = await billWithClaims({
      "Pad thai": ["180", [MINT, PLOY]],
      Singha: ["270", [MINT, BEAM]],
    });
    await startSettling({ billId });

    auth.currentUserId = PLOY;
    const settlement = await getSettlement(billId);
    expect(settlement?.payer.id).toBe(MINT);
    expect(settlement?.status).toBe("SETTLING");
    expect(settlement?.settlements.map((s) => [s.fromUser.id, s.amountSatang, s.status])).toEqual([
      [BEAM, 13500, "PENDING"],
      [PLOY, 9000, "PENDING"],
    ]);
    expect(settlement?.totalSatang).toBe(22500);
    expect(settlement?.paidSatang).toBe(0);
  });

  it("is null for bills the user can't access", async () => {
    const billId = await billWithClaims({ "Pad thai": ["180", [MINT]] });
    await getDb().groupMember.deleteMany({
      where: { userId: BEAM, group: { bills: { some: { id: billId } } } },
    });

    auth.currentUserId = BEAM;
    expect(await getSettlement(billId)).toBeNull();
  });
});
