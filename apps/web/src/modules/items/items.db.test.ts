// Integration tests: claiming items against the local test Postgres.
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

const { createBill } = await import("@/modules/bills/actions");
const { getBill } = await import("@/modules/bills/queries");
const { billSummary } = await import("@/modules/bills/service");
const { addItem, setMyClaim } = await import("./actions");

const MINT = "seed_user_mint";
const PLOY = "seed_user_ploy";
const BEAM = "seed_user_beam";
const createdBillIds: string[] = [];

/** A bill paid by Mint with one item, plus extra group members. */
async function billWithItem(price = "90", members: string[] = []) {
  auth.currentUserId = MINT;
  const created = await createBill({ title: "Claim test" });
  if (!created.ok) throw new Error(created.error);
  createdBillIds.push(created.billId);

  const added = await addItem({ billId: created.billId, name: "Pad thai", price });
  if (!added.ok) throw new Error(added.error);

  const { groupId } = await getDb().bill.findUniqueOrThrow({ where: { id: created.billId } });
  await getDb().groupMember.createMany({ data: members.map((userId) => ({ groupId, userId })) });
  return { billId: created.billId, itemId: added.itemId };
}

beforeEach(() => {
  auth.currentUserId = MINT;
});

afterAll(async () => {
  const bills = await getDb().bill.findMany({
    where: { id: { in: createdBillIds } },
    select: { groupId: true },
  });
  // Deleting the group cascades to membership, bills, items and splits.
  await getDb().group.deleteMany({ where: { id: { in: bills.map((b) => b.groupId) } } });
});

describe("setMyClaim", () => {
  it("claims an item for the current user and shows in the bill totals", async () => {
    const { billId, itemId } = await billWithItem("180");

    expect(await setMyClaim({ itemId, claimed: true })).toEqual({ ok: true });

    const bill = await getBill(billId);
    expect(bill?.items[0].splits).toEqual([expect.objectContaining({ userId: MINT, shares: 1 })]);
    expect(bill?.totals.perPersonSatang).toEqual({ [MINT]: 18000 });
    expect(bill?.totals.unassignedSatang).toBe(0);
  });

  it("is idempotent — claiming twice keeps one split", async () => {
    const { itemId } = await billWithItem();

    await setMyClaim({ itemId, claimed: true });
    expect(await setMyClaim({ itemId, claimed: true })).toEqual({ ok: true });
    expect(await getDb().itemSplit.count({ where: { itemId } })).toBe(1);
  });

  it("unclaims, and unclaiming again is a no-op", async () => {
    const { itemId } = await billWithItem();

    await setMyClaim({ itemId, claimed: true });
    expect(await setMyClaim({ itemId, claimed: false })).toEqual({ ok: true });
    expect(await setMyClaim({ itemId, claimed: false })).toEqual({ ok: true });
    expect(await getDb().itemSplit.count({ where: { itemId } })).toBe(0);
  });

  it("splits between claimers, leftover satang to the lowest user id", async () => {
    const { billId, itemId } = await billWithItem("100", [PLOY, BEAM]);

    for (const userId of [MINT, PLOY, BEAM]) {
      auth.currentUserId = userId;
      expect(await setMyClaim({ itemId, claimed: true })).toEqual({ ok: true });
    }

    const bill = await getBill(billId);
    // ฿100 / 3 = 3333.33 satang; the extra satang goes to seed_user_beam.
    expect(bill?.totals.perPersonSatang).toEqual({ [BEAM]: 3334, [MINT]: 3333, [PLOY]: 3333 });
  });

  it("refuses changes once the bill is no longer open", async () => {
    const { billId, itemId } = await billWithItem();
    await getDb().bill.update({ where: { id: billId }, data: { status: "SETTLING" } });

    expect(await setMyClaim({ itemId, claimed: true })).toEqual({
      ok: false,
      error: "This bill is settling up — items are locked",
    });
    expect(await getDb().itemSplit.count({ where: { itemId } })).toBe(0);
  });

  it("hides items on bills the user can't access", async () => {
    const { itemId } = await billWithItem();

    auth.currentUserId = BEAM;
    expect(await setMyClaim({ itemId, claimed: true })).toEqual({
      ok: false,
      error: "Item not found",
    });
    expect(await setMyClaim({ itemId: "does-not-exist", claimed: true })).toEqual({
      ok: false,
      error: "Item not found",
    });
    expect(await getDb().itemSplit.count({ where: { itemId } })).toBe(0);
  });
});

describe("getBill members", () => {
  it("lists everyone in the bill's group, including people with no claims", async () => {
    const { billId } = await billWithItem("90", [PLOY]);

    const bill = await getBill(billId);
    expect(bill?.members.map((m) => m.id).sort()).toEqual([MINT, PLOY]);
  });
});

describe("billSummary on a real bill", () => {
  it("shows what each member owes the payer from persisted claims", async () => {
    const { billId, itemId } = await billWithItem("100", [PLOY, BEAM]);
    await addItem({ billId, name: "Mango sticky rice", price: "150" });
    for (const userId of [MINT, PLOY]) {
      auth.currentUserId = userId;
      await setMyClaim({ itemId, claimed: true });
    }

    const bill = await getBill(billId);
    if (!bill) throw new Error("bill missing");
    const summary = billSummary(bill.items, bill.members, bill.payerId);

    expect(summary.people.map((p) => [p.userId, p.totalSatang, p.owesPayerSatang])).toEqual([
      [MINT, 5000, 0],
      [PLOY, 5000, 5000],
      [BEAM, 0, 0],
    ]);
    expect(summary.owedToPayerSatang).toBe(5000);
    expect(summary.unassignedItems.map((i) => i.name)).toEqual(["Mango sticky rice"]);
  });
});
