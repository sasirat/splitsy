import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "./session";

describe("safeRedirectPath", () => {
  it("keeps local paths, including query and hash", () => {
    expect(safeRedirectPath("/")).toBe("/");
    expect(safeRedirectPath("/bills/abc?tab=items#top")).toBe("/bills/abc?tab=items#top");
  });

  it("falls back to / when missing or not a rooted path", () => {
    expect(safeRedirectPath(undefined)).toBe("/");
    expect(safeRedirectPath("")).toBe("/");
    expect(safeRedirectPath("bills")).toBe("/");
    expect(safeRedirectPath("https://example.com")).toBe("/");
    expect(safeRedirectPath("javascript:alert(1)")).toBe("/");
  });

  it.each([
    "//example.com",
    "/\\example.com",
    "/\t/example.com", // browsers strip tabs → //example.com (reproduced)
    "/\n/example.com",
    "/\r/example.com",
    "\\/example.com",
  ])("rejects off-site path %j", (path) => {
    expect(safeRedirectPath(path)).toBe("/");
  });
});
