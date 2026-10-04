// Integration tests: settling up and paying back against the Neon dev branch.
// Run with `pnpm test:db`. Signs in as seeded users by mocking requireUser,
// deletes every group (and settlement) it creates, and restores Mint's
// payment details afterwards.
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
const {
  markPaid,
  removePaymentDetails,
  removePaymentQr,
  savePaymentDetails,
  startSettling,
  uploadPaymentQr,
} = await import("./actions");
const { getPaymentQr, getSettlement } = await import("./queries");

const MINT = "seed_user_mint";
const PLOY = "seed_user_ploy";
const BEAM = "seed_user_beam";
const NEWBIE = "seed_user_newbie";
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

// Tests change Mint's payment details; put back whatever the dev DB had.
const mintBefore = await getDb().user.findUniqueOrThrow({
  where: { id: MINT },
  select: {
    bankName: true,
    bankAccountNumber: true,
    bankAccountName: true,
    paymentQr: { select: { image: true, mimeType: true } },
  },
});

beforeEach(() => {
  auth.currentUserId = MINT;
});

afterAll(async () => {
  const { paymentQr, ...bank } = mintBefore;
  await getDb().user.update({ where: { id: MINT }, data: bank });
  await getDb().paymentQr.deleteMany({ where: { userId: MINT } });
  if (paymentQr) await getDb().paymentQr.create({ data: { userId: MINT, ...paymentQr } });

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

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4]);

function qrForm(bytes: Uint8Array<ArrayBuffer>, name = "qr.png", type = "image/png") {
  const form = new FormData();
  form.set("qr", new File([bytes], name, { type }));
  return form;
}

describe("payment details", () => {
  it("saves bank details for the current user, digits only", async () => {
    expect(
      await savePaymentDetails({
        bankName: "SCB",
        accountNumber: "123-4-56789-0",
        accountName: "Mint S.",
      }),
    ).toEqual({ ok: true });

    const mint = await getDb().user.findUniqueOrThrow({ where: { id: MINT } });
    expect([mint.bankName, mint.bankAccountNumber, mint.bankAccountName]).toEqual([
      "SCB",
      "1234567890",
      "Mint S.",
    ]);
  });

  it("rejects invalid details without saving", async () => {
    await savePaymentDetails({ bankName: "KBank", accountNumber: "1234567890", accountName: "M" });
    expect(
      await savePaymentDetails({ bankName: "KBank", accountNumber: "12", accountName: "M" }),
    ).toEqual({ ok: false, error: "Account numbers have 10–12 digits" });
    const mint = await getDb().user.findUniqueOrThrow({ where: { id: MINT } });
    expect(mint.bankAccountNumber).toBe("1234567890");
  });

  it("removes bank details", async () => {
    await savePaymentDetails({ bankName: "KBank", accountNumber: "1234567890", accountName: "M" });
    expect(await removePaymentDetails()).toEqual({ ok: true });
    const mint = await getDb().user.findUniqueOrThrow({ where: { id: MINT } });
    expect([mint.bankName, mint.bankAccountNumber, mint.bankAccountName]).toEqual([
      null,
      null,
      null,
    ]);
  });

  it("stores a QR image, typed by its bytes, and replaces it on re-upload", async () => {
    expect(await uploadPaymentQr(qrForm(PNG))).toEqual({ ok: true });
    // Declared as JPEG, but the bytes say PNG.
    expect(await uploadPaymentQr(qrForm(PNG, "qr.jpg", "image/jpeg"))).toEqual({ ok: true });

    const qr = await getDb().paymentQr.findUniqueOrThrow({ where: { userId: MINT } });
    expect(qr.mimeType).toBe("image/png");
    expect(new Uint8Array(qr.image)).toEqual(PNG);
  });

  it.each([
    ["not an image", qrForm(new TextEncoder().encode("<svg/>"), "qr.svg", "image/svg+xml")],
    ["missing", new FormData()],
  ])("rejects a QR that's %s", async (_, form) => {
    expect(await uploadPaymentQr(form)).toEqual({
      ok: false,
      error: "Upload a PNG, JPEG or WebP image",
    });
  });

  it("rejects a QR over 512 KB", async () => {
    const big = new Uint8Array(512 * 1024 + 1);
    big.set(PNG);
    expect(await uploadPaymentQr(qrForm(big))).toEqual({
      ok: false,
      error: "That image is too big — keep it under 512 KB",
    });
  });

  it("removes the QR", async () => {
    await uploadPaymentQr(qrForm(PNG));
    expect(await removePaymentQr()).toEqual({ ok: true });
    expect(await getDb().paymentQr.count({ where: { userId: MINT } })).toBe(0);
  });
});

describe("getSettlement payment details", () => {
  it("shows the payer's bank details and QR version to members", async () => {
    await savePaymentDetails({ bankName: "KBank", accountNumber: "1234567890", accountName: "M" });
    await uploadPaymentQr(qrForm(PNG));
    const billId = await billWithClaims({ "Pad thai": ["180", [MINT, PLOY]] });
    await startSettling({ billId });

    auth.currentUserId = PLOY;
    const settlement = await getSettlement(billId);
    expect(settlement?.payment).toEqual({
      bankName: "KBank",
      accountNumber: "1234567890",
      accountName: "M",
      qrVersion: expect.any(Number),
    });
  });

  it("is null when the payer hasn't added any", async () => {
    await removePaymentDetails();
    await removePaymentQr();
    const billId = await billWithClaims({ "Pad thai": ["180", [MINT, PLOY]] });
    await startSettling({ billId });

    expect((await getSettlement(billId))?.payment).toBeNull();
  });
});

describe("getPaymentQr", () => {
  it("lets you see your own QR", async () => {
    await uploadPaymentQr(qrForm(PNG));
    expect((await getPaymentQr(MINT))?.mimeType).toBe("image/png");
  });

  it("shows a payer's QR to members of a bill they're settling", async () => {
    await uploadPaymentQr(qrForm(PNG));
    const billId = await billWithClaims({ "Pad thai": ["180", [MINT, PLOY]] });
    // Newbie shares no other settling bill with Mint (Ploy may, on the dev DB).
    const { groupId } = await getDb().bill.findUniqueOrThrow({ where: { id: billId } });
    await getDb().groupMember.create({ data: { groupId, userId: NEWBIE } });

    auth.currentUserId = NEWBIE;
    // Still open: nothing to pay yet, so no QR.
    expect(await getPaymentQr(MINT)).toBeNull();

    auth.currentUserId = MINT;
    await startSettling({ billId });
    auth.currentUserId = NEWBIE;
    expect((await getPaymentQr(MINT))?.mimeType).toBe("image/png");
  });

  it("hides it from people who share no settling bill with the payer", async () => {
    await uploadPaymentQr(qrForm(PNG));
    // Settling bills from earlier tests in this file include Newbie; drop them.
    await getDb().groupMember.deleteMany({
      where: { userId: NEWBIE, group: { bills: { some: { id: { in: createdBillIds } } } } },
    });
    auth.currentUserId = NEWBIE;
    expect(await getPaymentQr(MINT)).toBeNull();
  });
});

describe("markPaid", () => {
  async function settlingBill() {
    const billId = await billWithClaims({
      "Pad thai": ["180", [MINT, PLOY]],
      Singha: ["270", [MINT, BEAM]],
    });
    await startSettling({ billId });
    const rows = await getDb().settlement.findMany({ where: { billId } });
    const of = (userId: string) => rows.find((r) => r.fromUserId === userId)!.id;
    return { billId, ploy: of(PLOY), beam: of(BEAM) };
  }

  it("marks a friend paid with a date, and settles the bill once everyone has", async () => {
    const { billId, ploy, beam } = await settlingBill();

    expect(await markPaid({ settlementId: ploy, paid: true })).toEqual({
      ok: true,
      billStatus: "SETTLING",
    });
    const row = await getDb().settlement.findUniqueOrThrow({ where: { id: ploy } });
    expect(row.status).toBe("PAID");
    expect(row.paidAt).toBeInstanceOf(Date);

    expect(await markPaid({ settlementId: beam, paid: true })).toEqual({
      ok: true,
      billStatus: "SETTLED",
    });
    expect(await statusOf(billId)).toBe("SETTLED");
  });

  it("undoes a payment, reopening a settled bill to settling", async () => {
    const { billId, ploy, beam } = await settlingBill();
    await markPaid({ settlementId: ploy, paid: true });
    await markPaid({ settlementId: beam, paid: true });

    expect(await markPaid({ settlementId: beam, paid: false })).toEqual({
      ok: true,
      billStatus: "SETTLING",
    });
    const row = await getDb().settlement.findUniqueOrThrow({ where: { id: beam } });
    expect([row.status, row.paidAt]).toEqual(["PENDING", null]);
    expect(await statusOf(billId)).toBe("SETTLING");
  });

  it("only lets the payer mark payments", async () => {
    const { ploy } = await settlingBill();

    auth.currentUserId = PLOY;
    expect(await markPaid({ settlementId: ploy, paid: true })).toEqual({
      ok: false,
      error: "Only the person who paid can mark payments",
    });
    const row = await getDb().settlement.findUniqueOrThrow({ where: { id: ploy } });
    expect(row.status).toBe("PENDING");
  });

  it("hides settlements on bills the user can't access", async () => {
    const { ploy } = await settlingBill();

    auth.currentUserId = NEWBIE;
    expect(await markPaid({ settlementId: ploy, paid: true })).toEqual({
      ok: false,
      error: "Payment not found",
    });
  });
});
