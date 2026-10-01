import { describe, expect, it } from "vitest";
import { createBillInput } from "@/modules/bills/schema";
import { addItemInput, setMyClaimInput } from "./schema";

describe("addItemInput", () => {
  it("trims the name and converts the price to satang", () => {
    expect(addItemInput.parse({ billId: "b1", name: "  Pad thai ", price: "180.50" })).toEqual({
      billId: "b1",
      name: "Pad thai",
      price: 18050,
    });
  });

  it.each([
    [{ billId: "b1", name: "", price: "10" }, "What was it called?"],
    [{ billId: "b1", name: "   ", price: "10" }, "What was it called?"],
    [{ billId: "b1", name: "x".repeat(81), price: "10" }, "Keep the name under 80 characters"],
    [{ billId: "b1", name: "Som tam", price: "abc" }, "Enter a price like 120 or 120.50"],
    [{ billId: "b1", name: "Som tam", price: "-5" }, "Enter a price like 120 or 120.50"],
  ])("rejects %j", (input, message) => {
    const result = addItemInput.safeParse(input);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(message);
  });
});

describe("createBillInput", () => {
  it("trims the title", () => {
    expect(createBillInput.parse({ title: "  Friday dinner " })).toEqual({
      title: "Friday dinner",
    });
  });

  it("rejects a blank title", () => {
    expect(createBillInput.safeParse({ title: "  " }).error?.issues[0]?.message).toBe(
      "Give the bill a name",
    );
  });
});

describe("setMyClaimInput", () => {
  it("accepts an item id and a claimed flag", () => {
    expect(setMyClaimInput.parse({ itemId: "i1", claimed: true })).toEqual({
      itemId: "i1",
      claimed: true,
    });
  });

  it.each([{ itemId: "", claimed: true }, { itemId: "i1", claimed: "yes" }, { itemId: "i1" }])(
    "rejects %j",
    (input) => {
      expect(setMyClaimInput.safeParse(input).success).toBe(false);
    },
  );
});
