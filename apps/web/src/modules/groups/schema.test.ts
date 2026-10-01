import { describe, expect, it } from "vitest";
import { createBillInput } from "@/modules/bills/schema";
import { createGroupInput } from "./schema";

describe("createGroupInput", () => {
  it("trims the name", () => {
    expect(createGroupInput.parse({ name: "  Flatmates " })).toEqual({ name: "Flatmates" });
  });

  it.each([
    [{ name: "" }, "Give the group a name"],
    [{ name: "   " }, "Give the group a name"],
    [{ name: "x".repeat(61) }, "Keep the name under 60 characters"],
  ])("rejects %j", (input, message) => {
    expect(createGroupInput.safeParse(input).error?.issues[0]?.message).toBe(message);
  });
});

describe("createBillInput groupId", () => {
  it("is optional", () => {
    expect(createBillInput.parse({ title: "Rent" })).toEqual({ title: "Rent" });
  });

  it("passes a group id through", () => {
    expect(createBillInput.parse({ title: "Rent", groupId: "g1" })).toEqual({
      title: "Rent",
      groupId: "g1",
    });
  });

  it("rejects an empty group id", () => {
    expect(createBillInput.safeParse({ title: "Rent", groupId: "" }).success).toBe(false);
  });
});
