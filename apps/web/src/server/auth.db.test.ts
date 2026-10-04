// Integration tests: resolving the signed-in user from a Clerk session or the
// dev cookie, against the local test Postgres. Run with `pnpm test:db`. Clerk and
// next/headers are mocked; Clerk users created here are deleted afterwards.
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { getDb } from "@/server/db";

const state = vi.hoisted(() => ({
  clerkId: null as string | null,
  clerkUser: null as null | {
    firstName: string | null;
    primaryEmailAddress: { emailAddress: string } | null;
    emailAddresses: { emailAddress: string }[];
  },
  cookie: undefined as string | undefined,
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(async () => ({ userId: state.clerkId })),
  currentUser: vi.fn(async () => state.clerkUser),
}));
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) =>
      name === "splitsy_session" && state.cookie ? { value: state.cookie } : undefined,
  })),
}));

const { getCurrentUser } = await import("./auth");

const CLERK_ID = `user_test_${Date.now()}`;

function signedInWithClerk(email = "mint.real@example.com", firstName: string | null = "Mint") {
  state.clerkId = CLERK_ID;
  state.clerkUser = {
    firstName,
    primaryEmailAddress: { emailAddress: email },
    emailAddresses: [{ emailAddress: email }],
  };
}

beforeEach(() => {
  state.clerkId = null;
  state.clerkUser = null;
  state.cookie = undefined;
});

afterAll(async () => {
  await getDb().user.deleteMany({ where: { clerkId: CLERK_ID } });
});

describe("getCurrentUser with Clerk", () => {
  it("creates the user on first sign-in, without a display name", async () => {
    signedInWithClerk();

    const user = await getCurrentUser();
    expect(user).toMatchObject({
      clerkId: CLERK_ID,
      email: "mint.real@example.com",
      displayName: null,
    });
  });

  it("reuses the same user on later requests", async () => {
    signedInWithClerk();
    const first = await getCurrentUser();
    const second = await getCurrentUser();

    expect(second?.id).toBe(first?.id);
    expect(await getDb().user.count({ where: { clerkId: CLERK_ID } })).toBe(1);
  });

  it("never duplicates a user when two requests sign in at once", async () => {
    await getDb().user.deleteMany({ where: { clerkId: CLERK_ID } });
    signedInWithClerk();

    const users = await Promise.all([getCurrentUser(), getCurrentUser(), getCurrentUser()]);
    expect(new Set(users.map((u) => u?.id)).size).toBe(1);
    expect(await getDb().user.count({ where: { clerkId: CLERK_ID } })).toBe(1);
  });

  it("wins over a dev cookie", async () => {
    signedInWithClerk();
    state.cookie = "seed_user_ploy";

    expect((await getCurrentUser())?.clerkId).toBe(CLERK_ID);
  });
});

describe("getCurrentUser without Clerk", () => {
  it("uses the dev cookie in development", async () => {
    state.cookie = "seed_user_ploy";
    expect((await getCurrentUser())?.id).toBe("seed_user_ploy");
  });

  it("is null with no session and no cookie", async () => {
    expect(await getCurrentUser()).toBeNull();
  });
});
