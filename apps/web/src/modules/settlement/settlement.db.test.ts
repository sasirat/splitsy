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

const { addItem, setMyClaim } = await import("@/modules/items/actions");
const { startSettling } = await import("./actions");
const { getSettlement } = await import("./queries");

const MINT = "seed_user_mint";
const PLOY = "seed_user_ploy";
const BEAM = "seed_user_beam";
const createdBillIds: string[] = [];

/** A bill paid by Mint, with Ploy and Beam in its group, and items claimed as
 *  given: { "Pad thai": ["180", [MINT, PLOY]] }. An empty list leaves it
 *  unclaimed. Built in one nested write — only the code under test goes
 *  through the actions, which keeps round trips to the remote DB down. */
async function billWithClaims(items: Record<string, [string, string[]]>) {
  auth.currentUserId = MINT;
  const bill = await getDb().bill.create({
    data: {
      title: "Settle test",
      payer: { connect: { id: MINT } },
      createdBy: { connect: { id: MINT } },
      group: {
        create: {
          name: "Settle test",
          type: "AD_HOC",
          createdBy: { connect: { id: MINT } },
          members: {
            create: [{ userId: MINT, role: "OWNER" }, { userId: PLOY }, { userId: BEAM }],
          },
        },
      },
      items: {
        create: Object.entries(items).map(([name, [price, claimers]], position) => ({
          name,
          priceSatang: Number(price) * 100,
          position,
          splits: { create: claimers.map((userId) => ({ userId, shares: 1 })) },
        })),
      },
    },
    select: { id: true },
  });
  createdBillIds.push(bill.id);
  return bill.id;
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

  // Five rounds of real races against the remote DB (~8s each on Neon).
  it("never snapshots claims that change while it's settling", { timeout: 120_000 }, async () => {
    // Race an unclaim (and a new item) against settling: whichever wins, the
    // saved settlements must match the bill's claims afterwards.
    for (let round = 0; round < 5; round++) {
      const billId = await billWithClaims({ "Pad thai": ["180", [MINT, PLOY]] });
      const { id: itemId } = await getDb().item.findFirstOrThrow({ where: { billId } });

      await Promise.all([
        startSettling({ billId }),
        (async () => {
          auth.currentUserId = PLOY;
          await setMyClaim({ itemId, claimed: false });
        })(),
        addItem({ billId, name: "Late snack", price: "40" }),
      ]);

      const status = await statusOf(billId);
      if (status === "OPEN") continue;
      const items = await getDb().item.findMany({ where: { billId }, include: { splits: true } });
      const unclaimed = items.filter((item) => item.splits.length === 0);
      expect(unclaimed).toEqual([]);
      const owed = await settlementsOf(billId);
      expect(owed).toEqual([
        { fromUserId: PLOY, toUserId: MINT, amountSatang: 9000, status: "PENDING" },
      ]);
    }
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
