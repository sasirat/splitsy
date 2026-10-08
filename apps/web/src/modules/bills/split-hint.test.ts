import { describe, expect, it } from "vitest";
import { splitHint } from "./split-hint";

describe("splitHint", () => {
  it("shows one per-head amount for an even split", () => {
    expect(splitHint(18000, [{ initials: "M" }, { initials: "P" }])).toBe("฿90 EACH");
  });

  it("shows the larger part when an even split leaves a spare satang", () => {
    // ฿320 / 3 → 106.67 / 106.67 / 106.66
    expect(splitHint(32000, [{ initials: "M" }, { initials: "P" }, { initials: "B" }])).toBe(
      "฿106.67 EACH",
    );
  });

  it("lists each person's amount for a weighted split", () => {
    expect(
      splitHint(27000, [
        { initials: "M", shares: 1 },
        { initials: "B", shares: 2 },
      ]),
    ).toBe("M ฿90 · B ฿180");
  });

  it("is empty when one person has it all — the line already shows the price", () => {
    expect(splitHint(12000, [{ initials: "P" }])).toBe("");
    expect(splitHint(12000, [{ initials: "P", shares: 2 }])).toBe("");
  });

  it("is empty when nobody has claimed the item", () => {
    expect(splitHint(5000, [])).toBe("");
  });
});
