import { describe, expect, it } from "vitest";
import { billSummary, billTotals } from "./service";

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

describe("billSummary", () => {
  const members = [{ id: "mint" }, { id: "ploy" }, { id: "beam" }];
  const items = [
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
      id: "singha",
      name: "Singha ×3",
      priceSatang: 27000,
      splits: [
        { userId: "mint", shares: 1 },
        { userId: "beam", shares: 2 },
      ],
    },
    { id: "mango", name: "Mango sticky rice", priceSatang: 15000, splits: [] },
  ];

  it("groups each person's share of every item they claimed", () => {
    const summary = billSummary(items, members, "mint");

    expect(summary.people.map((p) => [p.userId, p.totalSatang])).toEqual([
      ["mint", 10667 + 9000],
      ["ploy", 10666],
      ["beam", 10667 + 18000],
    ]);
    expect(summary.people[2].lines).toEqual([
      {
        itemId: "tomyum",
        name: "Tom yum goong",
        priceSatang: 32000,
        shareSatang: 10667,
        sharedWith: 3,
      },
      {
        itemId: "singha",
        name: "Singha ×3",
        priceSatang: 27000,
        shareSatang: 18000,
        sharedWith: 2,
      },
    ]);
  });

  it("lists the payer first, and the payer owes nothing", () => {
    const summary = billSummary(items, members, "beam");

    expect(summary.people.map((p) => p.userId)).toEqual(["beam", "mint", "ploy"]);
    expect(summary.people.map((p) => p.owesPayerSatang)).toEqual([0, 10667 + 9000, 10666]);
    expect(summary.owedToPayerSatang).toBe(10667 + 9000 + 10666);
  });

  it("lists unclaimed items and keeps the books balanced", () => {
    const summary = billSummary(items, members, "mint");

    expect(summary.unassignedItems).toEqual([
      { itemId: "mango", name: "Mango sticky rice", priceSatang: 15000 },
    ]);
    expect(summary.unassignedSatang).toBe(15000);
    expect(summary.subtotalSatang).toBe(74000);
    const claimed = summary.people.reduce((sum, p) => sum + p.totalSatang, 0);
    expect(claimed + summary.unassignedSatang).toBe(summary.subtotalSatang);
  });

  it("includes members who claimed nothing at ฿0", () => {
    const summary = billSummary(items, [...members, { id: "newbie" }], "mint");

    expect(summary.people.at(-1)).toEqual({
      userId: "newbie",
      totalSatang: 0,
      owesPayerSatang: 0,
      lines: [],
    });
  });

  it("keeps sharers who are no longer members, so no money goes missing", () => {
    const summary = billSummary(items, [{ id: "mint" }, { id: "ploy" }], "mint");

    expect(summary.people.map((p) => p.userId)).toEqual(["mint", "ploy", "beam"]);
    expect(summary.people[2].owesPayerSatang).toBe(10667 + 18000);
  });

  it("handles an empty bill", () => {
    expect(billSummary([], [{ id: "mint" }], "mint")).toEqual({
      people: [{ userId: "mint", totalSatang: 0, owesPayerSatang: 0, lines: [] }],
      subtotalSatang: 0,
      unassignedSatang: 0,
      unassignedItems: [],
      owedToPayerSatang: 0,
    });
  });
});
