import { describe, expect, it } from "vitest";
import { billTotals } from "./service";

describe("billTotals", () => {
  it("sums the subtotal and each person's share across items", () => {
    const totals = billTotals([
      {
        priceSatang: 32000,
        splits: [
          { userId: "mint", shares: 1 },
          { userId: "ploy", shares: 1 },
          { userId: "beam", shares: 1 },
        ],
      },
      {
        priceSatang: 27000,
        splits: [
          { userId: "mint", shares: 1 },
          { userId: "beam", shares: 2 },
        ],
      },
    ]);

    expect(totals.subtotalSatang).toBe(59000);
    // 32000 / 3 → beam 10667, mint 10667, ploy 10666 (ids sorted: beam, mint, ploy)
    expect(totals.perPersonSatang).toEqual({
      beam: 10667 + 18000,
      mint: 10667 + 9000,
      ploy: 10666,
    });
    expect(totals.unassignedSatang).toBe(0);
  });

  it("tracks items nobody has claimed yet", () => {
    const totals = billTotals([
      { priceSatang: 12000, splits: [] },
      { priceSatang: 5000, splits: [{ userId: "mint", shares: 1 }] },
    ]);
    expect(totals).toEqual({
      subtotalSatang: 17000,
      perPersonSatang: { mint: 5000 },
      unassignedSatang: 12000,
    });
  });

  it("always balances: people + unassigned = subtotal", () => {
    const totals = billTotals([
      {
        priceSatang: 10001,
        splits: [
          { userId: "a", shares: 1 },
          { userId: "b", shares: 3 },
          { userId: "c", shares: 2 },
        ],
      },
      { priceSatang: 777, splits: [] },
      { priceSatang: 1, splits: [{ userId: "c", shares: 1 }] },
    ]);
    const people = Object.values(totals.perPersonSatang).reduce((a, b) => a + b, 0);
    expect(people + totals.unassignedSatang).toBe(totals.subtotalSatang);
  });

  it("is empty for a bill with no items", () => {
    expect(billTotals([])).toEqual({ subtotalSatang: 0, perPersonSatang: {}, unassignedSatang: 0 });
  });
});
