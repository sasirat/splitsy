import { describe, expect, it } from "vitest";
import { parseBahtToSatang, splitItem } from "./service";

const sum = (parts: Record<string, number>) => Object.values(parts).reduce((a, b) => a + b, 0);

describe("splitItem", () => {
  it("splits evenly when it divides cleanly", () => {
    const parts = splitItem(18000, [
      { userId: "mint", shares: 1 },
      { userId: "ploy", shares: 1 },
    ]);
    expect(parts).toEqual({ mint: 9000, ploy: 9000 });
  });

  it("gives leftover satang to sharers in a fixed order, summing exactly", () => {
    const parts = splitItem(10000, [
      { userId: "ploy", shares: 1 },
      { userId: "beam", shares: 1 },
      { userId: "mint", shares: 1 },
    ]);
    // ฿100 / 3 → 33.34 + 33.33 + 33.33; the extra satang goes to "beam" (first by id).
    expect(parts).toEqual({ beam: 3334, mint: 3333, ploy: 3333 });
    expect(sum(parts)).toBe(10000);
  });

  it("is independent of input order", () => {
    const a = splitItem(10001, [
      { userId: "x", shares: 1 },
      { userId: "y", shares: 1 },
      { userId: "z", shares: 1 },
    ]);
    const b = splitItem(10001, [
      { userId: "z", shares: 1 },
      { userId: "x", shares: 1 },
      { userId: "y", shares: 1 },
    ]);
    expect(a).toEqual(b);
    expect(sum(a)).toBe(10001);
  });

  it("weights by shares (Beam had 2 of 3 beers)", () => {
    const parts = splitItem(27000, [
      { userId: "mint", shares: 1 },
      { userId: "beam", shares: 2 },
    ]);
    expect(parts).toEqual({ mint: 9000, beam: 18000 });
  });

  it("hands weighted leftovers to the largest remainders first", () => {
    // 100 satang, shares 1:2 → exact 33.33… and 66.66… → 33 + 67
    const parts = splitItem(100, [
      { userId: "a", shares: 1 },
      { userId: "b", shares: 2 },
    ]);
    expect(parts).toEqual({ a: 33, b: 67 });
  });

  it("returns nothing for an unclaimed item", () => {
    expect(splitItem(5000, [])).toEqual({});
  });

  it("handles a free item", () => {
    expect(splitItem(0, [{ userId: "a", shares: 1 }])).toEqual({ a: 0 });
  });

  it.each([
    ["negative price", -1, [{ userId: "a", shares: 1 }]],
    ["fractional price", 10.5, [{ userId: "a", shares: 1 }]],
    ["zero shares", 100, [{ userId: "a", shares: 0 }]],
    ["fractional shares", 100, [{ userId: "a", shares: 1.5 }]],
    [
      "duplicate sharer",
      100,
      [
        { userId: "a", shares: 1 },
        { userId: "a", shares: 1 },
      ],
    ],
  ])("rejects %s", (_, price, splits) => {
    expect(() => splitItem(price, splits)).toThrow();
  });
});

describe("parseBahtToSatang", () => {
  it.each([
    ["120", 12000],
    ["120.5", 12050],
    ["120.50", 12050],
    ["0.99", 99],
    ["0", 0],
    [" 45 ", 4500],
    ["1,200.25", 120025],
    ["฿320", 32000],
  ])("parses %j → %i satang", (input, satang) => {
    expect(parseBahtToSatang(input)).toBe(satang);
  });

  it.each(["", "abc", "-5", "1.234", "1.", ".5", "1e3", "12 34", "10000001"])(
    "rejects %j",
    (input) => {
      expect(parseBahtToSatang(input)).toBeNull();
    },
  );
});
