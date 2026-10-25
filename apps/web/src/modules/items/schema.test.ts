import { describe, expect, it } from "vitest";
import { createBillInput } from "@/modules/bills/schema";
import { addItemInput, deleteItemInput, setClaimInput, updateItemInput } from "./schema";

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

describe("setClaimInput", () => {
  it("accepts an item id, who had it, and a claimed flag", () => {
    expect(setClaimInput.parse({ itemId: "i1", userId: "u1", claimed: true })).toEqual({
      itemId: "i1",
      userId: "u1",
      claimed: true,
    });
  });

  it.each([
    { itemId: "", userId: "u1", claimed: true },
    { itemId: "i1", userId: "", claimed: true },
    { itemId: "i1", claimed: true },
    { itemId: "i1", userId: "u1", claimed: "yes" },
    { itemId: "i1", userId: "u1" },
  ])("rejects %j", (input) => {
    expect(setClaimInput.safeParse(input).success).toBe(false);
  });
});

describe("updateItemInput", () => {
  it("trims the name and parses the price like addItemInput", () => {
    expect(updateItemInput.parse({ itemId: "i1", name: " Pad thai ", price: "1,200.50" })).toEqual({
      itemId: "i1",
      name: "Pad thai",
      price: 120050,
    });
  });

  it.each([
    { itemId: "", name: "Pad thai", price: "90" },
    { itemId: "i1", name: " ", price: "90" },
    { itemId: "i1", name: "Pad thai", price: "abc" },
  ])("rejects %j", (input) => {
    expect(updateItemInput.safeParse(input).success).toBe(false);
  });
});

describe("deleteItemInput", () => {
  it("needs an item id", () => {
    expect(deleteItemInput.parse({ itemId: "i1" })).toEqual({ itemId: "i1" });
    expect(deleteItemInput.safeParse({ itemId: "" }).success).toBe(false);
  });
});
