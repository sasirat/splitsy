// Pure invite logic — no Prisma, no Next.
import { randomBytes } from "node:crypto";

export const INVITE_TTL_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

export type InviteState = "valid" | "expired" | "revoked" | "missing";

/** Whether an invite can still be used at `now`. Revoked wins over expired;
 *  an invite is dead from the exact moment it expires. */
export function inviteState(
  invite: { expiresAt: Date; revokedAt: Date | null } | null,
  now: Date,
): InviteState {
  if (!invite) return "missing";
  if (invite.revokedAt) return "revoked";
  if (invite.expiresAt.getTime() <= now.getTime()) return "expired";
  return "valid";
}

export function newInviteExpiry(now: Date): Date {
  return new Date(now.getTime() + INVITE_TTL_DAYS * DAY_MS);
}

/** 32 random bytes, URL-safe — unguessable, and fine in a path segment. */
export function newInviteToken(): string {
  return randomBytes(32).toString("base64url");
}
