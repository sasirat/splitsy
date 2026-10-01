import { describe, expect, it } from "vitest";
import {
  formatBaht,
  formatBillDate,
  formatBillNumber,
  formatBillTime,
  formatShortDate,
  initialsOf,
} from "./format";

describe("formatBaht (satang in)", () => {
  it.each([
    [0, "฿0"],
    [32000, "฿320"],
    [18050, "฿180.50"],
    [99, "฿0.99"],
    [104000, "฿1,040"],
    [123456789, "฿1,234,567.89"],
  ])("%i satang → %s", (satang, text) => {
    expect(formatBaht(satang)).toBe(text);
  });
});

describe("formatBillNumber", () => {
  it.each([
    [1, "NO.0001"],
    [42, "NO.0042"],
    [12345, "NO.12345"],
  ])("%i → %s", (n, text) => {
    expect(formatBillNumber(n)).toBe(text);
  });
});

describe("bill date/time (Thai calendar, Bangkok time)", () => {
  // 14:06 UTC = 21:06 in Bangkok (UTC+7), same day
  const date = new Date("2026-09-16T14:06:00Z");

  it("formats the date as DD/MM/BE-year", () => {
    expect(formatBillDate(date)).toBe("16/09/2569");
  });

  it("formats the time as 24h Bangkok time", () => {
    expect(formatBillTime(date)).toBe("21:06");
  });

  it("uses Bangkok's date even when UTC is still the previous day", () => {
    expect(formatBillDate(new Date("2026-09-16T20:00:00Z"))).toBe("17/09/2569");
  });
});

describe("initialsOf", () => {
  it.each([
    ["Mint", "M"],
    ["ploy sae", "PS"],
    ["  Beam  Tan  Lee ", "BT"],
  ])("%j → %s", (name, initials) => {
    expect(initialsOf(name)).toBe(initials);
  });
});

describe("formatShortDate", () => {
  it("shows day + short month in Bangkok time", () => {
    expect(formatShortDate(new Date("2026-10-08T12:00:00Z"))).toBe("8 Oct");
    // 20:00 UTC on 7 Oct is already 8 Oct in Bangkok (UTC+7).
    expect(formatShortDate(new Date("2026-10-07T20:00:00Z"))).toBe("8 Oct");
  });
});
