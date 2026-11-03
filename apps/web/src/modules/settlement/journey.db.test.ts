// The case-study dinner, end to end through the real actions on the local test
// Postgres (`pnpm test:db`): four friends, one bill that A pays, shares that
// change through the night, paying back, then a taxi only A and C share.
// Signs in as seeded users by mocking requireUser; deletes the group it creates.
import { afterAll, describe, expect, it, vi } from "vitest";
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
const { addItem, setClaim } = await import("@/modules/items/actions");
const { claimPaid, markPaid, startSettling } = await import("./actions");

const A = "seed_user_mint"; // pays the dinner
const B = "seed_user_ploy"; // leaves early
const C = "seed_user_beam"; // allergic to shrimp; pays the taxi
const D = "seed_user_newbie"; // drives home

let groupId = "";

const as = (userId: string) => {
  auth.currentUserId = userId;
};

/** Must succeed — returns the action's data so a failure shows its error. */
function ok<T extends { ok: boolean }>(result: T): Extract<T, { ok: true }> {
  expect(result).toMatchObject({ ok: true });
  return result as Extract<T, { ok: true }>;
}

async function add(billId: string, name: string, price: string) {
  return ok(await addItem({ billId, name, price })).itemId;
}

async function tick(itemId: string, ...userIds: string[]) {
  for (const userId of userIds) ok(await setClaim({ itemId, userId, claimed: true }));
}

/** What each friend owes on a bill, by who they owe, in satang. */
async function debts(billId: string) {
  const rows = await getDb().settlement.findMany({
    where: { billId },
    select: { fromUserId: true, toUserId: true, amountSatang: true },
  });
  return Object.fromEntries(rows.map((r) => [`${r.fromUserId}→${r.toUserId}`, r.amountSatang]));
}

afterAll(async () => {
  if (!groupId) return;
  // Settlements restrict bill deletion; the group then cascades to the rest.
  await getDb().settlement.deleteMany({ where: { bill: { groupId } } });
  await getDb().group.delete({ where: { id: groupId } });
});

describe("the dinner journey", () => {
  let dinnerId = "";

  it("splits the dinner by who had what, and A is owed ฿698.33", async () => {
    const group = await getDb().group.create({
      data: {
        name: "Journey dinner",
        type: "PERSISTENT",
        createdById: A,
        members: {
          create: [{ userId: A, role: "OWNER" }, { userId: B }, { userId: C }, { userId: D }],
        },
      },
    });
    groupId = group.id;

    as(A);
    dinnerId = ok(await createBill({ title: "Friday dinner", groupId })).billId;
    const tomyum = await add(dinnerId, "Tom yum goong", "320");
    const padthai = await add(dinnerId, "Pad thai", "180");
    const somtam = await add(dinnerId, "Som tam", "120");
    const beer = await add(dinnerId, "Beer", "200");
    const soda = await add(dinnerId, "Soft drinks", "60");

    // Everyone ticks their own dishes. C skips the shrimp; only A and B drink.
    as(A);
    await tick(tomyum, A);
    await tick(padthai, A);
    await tick(somtam, A);
    await tick(beer, A);
    as(B);
    await tick(tomyum, B);
    await tick(padthai, B);
    await tick(somtam, B);
    await tick(beer, B);
    as(C);
    await tick(padthai, C);
    await tick(somtam, C);
    as(D);
    await tick(tomyum, D);
    await tick(padthai, D);
    await tick(somtam, D);
    // D ticks the soft drinks for both of them — anyone can tick anyone.
    await tick(soda, C, D);

    // B goes home; the rest order once more, and A ticks it for the table.
    as(A);
    const pork = await add(dinnerId, "Grilled pork neck", "150");
    await tick(pork, A, C, D);

    expect(ok(await startSettling({ billId: dinnerId })).status).toBe("SETTLING");
    expect(await debts(dinnerId)).toEqual({
      [`${B}→${A}`]: 28166, // ฿281.66 — no pork
      [`${C}→${A}`]: 15500, // ฿155.00 — no shrimp, no beer
      [`${D}→${A}`]: 26167, // ฿261.67
    });
  });

  it("settles once everyone has paid A back, B included from home", async () => {
    const settlements = await getDb().settlement.findMany({
      where: { billId: dinnerId },
      select: { id: true, fromUserId: true },
    });
    const of = (userId: string) => settlements.find((s) => s.fromUserId === userId)!.id;

    // B left before the bill came, and says they've paid later on.
    as(B);
    ok(await claimPaid({ settlementId: of(B), claimed: true }));

    as(A);
    expect(ok(await markPaid({ settlementId: of(B), paid: true })).billStatus).toBe("SETTLING");
    expect(ok(await markPaid({ settlementId: of(C), paid: true })).billStatus).toBe("SETTLING");
    expect(ok(await markPaid({ settlementId: of(D), paid: true })).billStatus).toBe("SETTLED");
  });

  it("keeps the taxi separate: C paid, so A owes C ฿50 and B and D owe nothing", async () => {
    as(C);
    const taxiId = ok(await createBill({ title: "Taxi home", groupId })).billId;
    const fare = await add(taxiId, "Taxi", "100");
    await tick(fare, A, C);

    expect(ok(await startSettling({ billId: taxiId })).status).toBe("SETTLING");
    expect(await debts(taxiId)).toEqual({ [`${A}→${C}`]: 5000 });
  });
});
