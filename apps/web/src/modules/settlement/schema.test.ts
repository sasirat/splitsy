import { describe, expect, it } from "vitest";
import { markPaidInput, paymentDetailsInput } from "./schema";

describe("paymentDetailsInput", () => {
  it("keeps only the digits of the account number and trims the name", () => {
    expect(
      paymentDetailsInput.parse({
        bankName: "KBank",
        accountNumber: " 123-4-56789-0 ",
        accountName: "  Mint S. ",
      }),
    ).toEqual({ bankName: "KBank", accountNumber: "1234567890", accountName: "Mint S." });
  });

  it("accepts 12-digit accounts (GSB)", () => {
    const parsed = paymentDetailsInput.parse({
      bankName: "GSB",
      accountNumber: "0201 2345 6789",
      accountName: "Ploy",
    });
    expect(parsed.accountNumber).toBe("020123456789");
  });

  it.each([
    [
      { bankName: "Piggy Bank", accountNumber: "1234567890", accountName: "Mint" },
      "Pick your bank",
    ],
    [
      { bankName: "KBank", accountNumber: "12345", accountName: "Mint" },
      "Account numbers have 10–12 digits",
    ],
    [
      { bankName: "KBank", accountNumber: "1234567890123", accountName: "Mint" },
      "Account numbers have 10–12 digits",
    ],
    [
      { bankName: "KBank", accountNumber: "12345abcde", accountName: "Mint" },
      "Account numbers have 10–12 digits",
    ],
    [
      { bankName: "KBank", accountNumber: "1234567890", accountName: "  " },
      "Whose name is on the account?",
    ],
    [
      { bankName: "KBank", accountNumber: "1234567890", accountName: "x".repeat(81) },
      "Keep the name under 80 characters",
    ],
  ])("rejects %j", (input, message) => {
    const result = paymentDetailsInput.safeParse(input);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(message);
  });
});

describe("markPaidInput", () => {
  it("takes a settlement id and whether it's paid", () => {
    expect(markPaidInput.parse({ settlementId: "s1", paid: true })).toEqual({
      settlementId: "s1",
      paid: true,
    });
    expect(markPaidInput.safeParse({ settlementId: "", paid: true }).success).toBe(false);
  });
});
