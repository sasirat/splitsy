import { describe, expect, it } from "vitest";
import { billSummary } from "@/modules/bills/service";
import {
  billDebts,
  formatAccountNumber,
  imageType,
  netBalances,
  nudgeMessage,
  simplifyDebts,
  type Payment,
} from "./service";

describe("formatAccountNumber", () => {
  it("groups 10-digit accounts the way Thai banks print them", () => {
    expect(formatAccountNumber("1234567890")).toBe("123-4-56789-0");
  });

  it("groups 12-digit accounts in fours", () => {
    expect(formatAccountNumber("020123456789")).toBe("0201-2345-6789");
  });

  it("leaves anything else as it is", () => {
    expect(formatAccountNumber("12345678901")).toBe("12345678901");
  });
});

describe("imageType", () => {
  const bytes = (...values: number[]) => new Uint8Array([...values, 0, 0, 0, 0]);

  it("recognises PNG, JPEG and WebP from their first bytes", () => {
    expect(imageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe("image/png");
    expect(imageType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
    const webp = [0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50];
    expect(imageType(bytes(...webp))).toBe("image/webp");
  });

  it("rejects anything else, whatever its name or declared type", () => {
    expect(imageType(bytes(0x47, 0x49, 0x46, 0x38))).toBeNull(); // GIF
    expect(
      imageType(new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'/>")),
    ).toBeNull();
    expect(imageType(new Uint8Array([]))).toBeNull();
    // RIFF but not WebP (e.g. a WAV file).
    expect(imageType(bytes(0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x41, 0x56, 0x45))).toBeNull();
  });
});

// The seeded "Som Tam Nua" bill (prisma/seed.ts), paid by Mint.
const somTamNua = billSummary(
  [
    {
      id: "tomyum",
      name: "Tom yum goong",
      priceSatang: 32000,
      splits: [
        { userId: "mint", shares: 1 },
        { userId: "ploy", shares: 1 },
        { userId: "beam", shares: 1 },
      ],
    },
    {
      id: "padthai",
      name: "Pad thai",
      priceSatang: 18000,
      splits: [
        { userId: "mint", shares: 1 },
        { userId: "ploy", shares: 1 },
      ],
    },
    {
      id: "somtam",
      name: "Som tam",
      priceSatang: 12000,
      splits: [
        { userId: "ploy", shares: 1 },
        { userId: "beam", shares: 1 },
      ],
    },
    {
      id: "mango",
      name: "Mango sticky rice",
      priceSatang: 15000,
      splits: [
        { userId: "mint", shares: 1 },
        { userId: "ploy", shares: 1 },
        { userId: "beam", shares: 1 },
      ],
    },
    {
      id: "singha",
      name: "Singha ×3",
      priceSatang: 27000,
      splits: [
        { userId: "mint", shares: 1 },
        { userId: "beam", shares: 2 },
      ],
    },
  ],
  [{ id: "mint" }, { id: "ploy" }, { id: "beam" }],
  "mint",
);

describe("billDebts", () => {
  it("has everyone who isn't the payer pay the payer their total", () => {
    expect(billDebts(somTamNua, "mint")).toEqual([
      { fromId: "ploy", toId: "mint", amountSatang: 30666 },
      { fromId: "beam", toId: "mint", amountSatang: 39667 },
    ]);
  });

  it("skips people who owe nothing", () => {
    const summary = billSummary(
      [{ id: "i", name: "Coffee", priceSatang: 6000, splits: [{ userId: "ploy", shares: 1 }] }],
      [{ id: "mint" }, { id: "ploy" }, { id: "beam" }],
      "mint",
    );
    expect(billDebts(summary, "mint")).toEqual([
      { fromId: "ploy", toId: "mint", amountSatang: 6000 },
    ]);
  });

  it("is empty when the payer had everything", () => {
    const summary = billSummary(
      [{ id: "i", name: "Coffee", priceSatang: 6000, splits: [{ userId: "mint", shares: 1 }] }],
      [{ id: "mint" }, { id: "ploy" }],
      "mint",
    );
    expect(billDebts(summary, "mint")).toEqual([]);
  });
});

describe("netBalances", () => {
  it("credits the receiver and debits the sender", () => {
    expect(netBalances(billDebts(somTamNua, "mint"))).toEqual({
      mint: 30666 + 39667,
      ploy: -30666,
      beam: -39667,
    });
  });

  it("nets debts across bills, dropping anyone who ends up even", () => {
    // Mint paid dinner, Ploy paid the taxi — the same amount each way.
    const balances = netBalances([
      { fromId: "ploy", toId: "mint", amountSatang: 25000 },
      { fromId: "mint", toId: "ploy", amountSatang: 25000 },
    ]);
    expect(balances).toEqual({});
  });

  it("is empty with no payments", () => {
    expect(netBalances([])).toEqual({});
  });
});

describe("simplifyDebts", () => {
  it("returns the bill's payments for a single payer", () => {
    expect(simplifyDebts(netBalances(billDebts(somTamNua, "mint")))).toEqual([
      { fromId: "beam", toId: "mint", amountSatang: 39667 },
      { fromId: "ploy", toId: "mint", amountSatang: 30666 },
    ]);
  });

  it("needs no payments when two bills cancel out", () => {
    const balances = netBalances([
      { fromId: "ploy", toId: "mint", amountSatang: 25000 },
      { fromId: "mint", toId: "ploy", amountSatang: 25000 },
    ]);
    expect(simplifyDebts(balances)).toEqual([]);
  });

  it("collapses a chain: A→B and B→C becomes A→C", () => {
    const balances = netBalances([
      { fromId: "a", toId: "b", amountSatang: 10000 },
      { fromId: "b", toId: "c", amountSatang: 10000 },
    ]);
    expect(simplifyDebts(balances)).toEqual([{ fromId: "a", toId: "c", amountSatang: 10000 }]);
  });

  it("matches the biggest debtor with the biggest creditor first", () => {
    expect(simplifyDebts({ a: 500, b: 300, c: -600, d: -200 })).toEqual([
      { fromId: "c", toId: "a", amountSatang: 500 },
      { fromId: "d", toId: "b", amountSatang: 200 },
      { fromId: "c", toId: "b", amountSatang: 100 },
    ]);
  });

  it("breaks ties by userId", () => {
    expect(simplifyDebts({ z: 100, y: 100, b: -100, a: -100 })).toEqual([
      { fromId: "a", toId: "y", amountSatang: 100 },
      { fromId: "b", toId: "z", amountSatang: 100 },
    ]);
  });

  it("is empty when nobody owes anything", () => {
    expect(simplifyDebts({})).toEqual([]);
    expect(simplifyDebts({ mint: 0, ploy: 0 })).toEqual([]);
    expect(simplifyDebts({ mint: 0 })).toEqual([]);
  });

  it("keeps uneven-split leftovers with the right people", () => {
    // ฿100 split three ways: beam and mint get the extra satang (ids sorted).
    const summary = billSummary(
      [
        {
          id: "i",
          name: "Snacks",
          priceSatang: 10000,
          splits: [
            { userId: "mint", shares: 1 },
            { userId: "ploy", shares: 1 },
            { userId: "beam", shares: 1 },
          ],
        },
      ],
      [{ id: "mint" }, { id: "ploy" }, { id: "beam" }],
      "ploy",
    );
    expect(simplifyDebts(netBalances(billDebts(summary, "ploy")))).toEqual([
      { fromId: "beam", toId: "ploy", amountSatang: 3334 },
      { fromId: "mint", toId: "ploy", amountSatang: 3333 },
    ]);
  });

  it("rejects balances that don't sum to zero", () => {
    expect(() => simplifyDebts({ a: 100, b: -99 })).toThrow(RangeError);
  });

  it("rejects fractional satang", () => {
    expect(() => simplifyDebts({ a: 0.5, b: -0.5 })).toThrow(RangeError);
  });

  describe("properties (random balances)", () => {
    // Small seeded PRNG (mulberry32) so failures are reproducible.
    function rng(seed: number) {
      return () => {
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    function randomPayments(next: () => number): Payment[] {
      const people = Array.from({ length: 1 + Math.floor(next() * 8) }, (_, i) => `u${i}`);
      return Array.from({ length: Math.floor(next() * 12) }, () => ({
        fromId: people[Math.floor(next() * people.length)],
        toId: people[Math.floor(next() * people.length)],
        amountSatang: 1 + Math.floor(next() * 100_000),
      })).filter((p) => p.fromId !== p.toId);
    }

    function shuffled<T>(list: T[], next: () => number): T[] {
      const copy = [...list];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    }

    const cases = Array.from({ length: 500 }, (_, seed) => {
      const next = rng(seed + 1);
      const balances = netBalances(randomPayments(next));
      return { balances, payments: simplifyDebts(balances), next };
    });

    it("conserves money: each person's payments match their balance", () => {
      for (const { balances, payments } of cases) {
        expect(netBalances(payments)).toEqual(balances);
      }
    });

    it("only makes positive whole-satang payments", () => {
      for (const { payments } of cases) {
        for (const p of payments) {
          expect(Number.isInteger(p.amountSatang)).toBe(true);
          expect(p.amountSatang).toBeGreaterThan(0);
        }
      }
    });

    it("makes at most n−1 payments", () => {
      for (const { balances, payments } of cases) {
        const n = Object.keys(balances).length;
        expect(payments.length).toBeLessThanOrEqual(Math.max(0, n - 1));
      }
    });

    it("never has anyone both pay and receive", () => {
      for (const { payments } of cases) {
        const payers = new Set(payments.map((p) => p.fromId));
        for (const p of payments) expect(payers.has(p.toId)).toBe(false);
      }
    });

    it("gives the same answer however the input is ordered", () => {
      for (const { balances, payments, next } of cases) {
        const reordered = Object.fromEntries(shuffled(Object.entries(balances), next));
        expect(simplifyDebts(reordered)).toEqual(payments);
      }
    });
  });
});

describe("nudgeMessage", () => {
  it("names the friend, the bill, what they owe and where to pay", () => {
    expect(
      nudgeMessage({
        name: "Ploy",
        billTitle: "Som Tam Nua",
        amountSatang: 30666,
        url: "https://splitsy.app/bills/b1/settle",
      }),
    ).toBe(
      "Hi Ploy! Friendly reminder for Som Tam Nua 🧾 — you owe ฿306.66. " +
        "Pay here: https://splitsy.app/bills/b1/settle 🙏",
    );
  });

  it("shows whole baht without satang", () => {
    expect(
      nudgeMessage({ name: "Beam", billTitle: "Taxi", amountSatang: 12000, url: "u" }),
    ).toContain("you owe ฿120.");
  });

  it("keeps titles with emoji and long names as they are", () => {
    const message = nudgeMessage({
      name: "Ploypailin Srisawat",
      billTitle: "Mookata 🔥 night",
      amountSatang: 1,
      url: "u",
    });
    expect(message).toContain("Hi Ploypailin Srisawat!");
    expect(message).toContain("reminder for Mookata 🔥 night 🧾");
    expect(message).toContain("you owe ฿0.01.");
  });
});
