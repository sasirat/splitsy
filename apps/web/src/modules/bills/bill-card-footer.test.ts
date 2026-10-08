import { describe, expect, it } from "vitest";
import { billCardFooter } from "./bill-card-footer";

describe("billCardFooter", () => {
  it("counts items while the bill is open", () => {
    expect(billCardFooter(1, null)).toBe("1 item");
    expect(billCardFooter(3, null)).toBe("3 items");
  });

  it("tells the payer how much is paid back", () => {
    expect(billCardFooter(3, { role: "payer", paidSatang: 5000, totalSatang: 19500 })).toBe(
      "฿50 of ฿195 paid back",
    );
    expect(billCardFooter(3, { role: "payer", paidSatang: 19500, totalSatang: 19500 })).toBe(
      "All paid back",
    );
  });

  it("doesn't claim anything was paid back when nobody owed the payer", () => {
    expect(billCardFooter(2, { role: "payer", paidSatang: 0, totalSatang: 0 })).toBe(
      "Nobody owes you",
    );
  });

  it("tells a friend their own part", () => {
    const part = (state: "owe" | "claimed" | "paid") =>
      billCardFooter(3, { role: "debtor", amountSatang: 19500, state });
    expect(part("owe")).toBe("You owe ฿195");
    expect(part("claimed")).toBe("You said you've paid ฿195");
    expect(part("paid")).toBe("You paid ฿195");
  });

  it("says there's nothing to pay for a member with no debt", () => {
    expect(billCardFooter(3, { role: "none" })).toBe("Nothing to pay");
  });
});
