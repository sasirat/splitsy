import { describe, expect, it } from "vitest";
import { INVITE_TTL_DAYS, inviteState, newInviteExpiry, newInviteToken } from "./service";

const now = new Date("2026-10-01T12:00:00Z");

describe("inviteState", () => {
  it("is missing when there's no invite", () => {
    expect(inviteState(null, now)).toBe("missing");
  });

  it("is valid before it expires", () => {
    expect(inviteState({ expiresAt: new Date("2026-10-08T12:00:00Z"), revokedAt: null }, now)).toBe(
      "valid",
    );
  });

  it("is expired from the exact expiry moment", () => {
    expect(inviteState({ expiresAt: now, revokedAt: null }, now)).toBe("expired");
    expect(inviteState({ expiresAt: new Date("2026-10-01T11:59:59Z"), revokedAt: null }, now)).toBe(
      "expired",
    );
  });

  it("is revoked once revoked, even if not yet expired", () => {
    expect(
      inviteState(
        {
          expiresAt: new Date("2026-10-08T12:00:00Z"),
          revokedAt: new Date("2026-10-01T00:00:00Z"),
        },
        now,
      ),
    ).toBe("revoked");
  });
});

describe("newInviteExpiry", () => {
  it(`is ${INVITE_TTL_DAYS} days from now`, () => {
    expect(newInviteExpiry(now)).toEqual(new Date("2026-10-08T12:00:00Z"));
  });
});

describe("newInviteToken", () => {
  it("is a 43-char URL-safe string (32 random bytes)", () => {
    const token = newInviteToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("is different every time", () => {
    const tokens = new Set(Array.from({ length: 50 }, newInviteToken));
    expect(tokens.size).toBe(50);
  });
});
