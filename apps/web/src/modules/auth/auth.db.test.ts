// Integration tests against the local test Postgres (`pnpm test:db`).
import { afterAll, describe, expect, it, vi } from "vitest";
import { getDb } from "@/server/db";

const NEWBIE = "seed_user_newbie";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/server/auth", () => ({
  requireUser: vi.fn(async () => {
    const user = await getDb().user.findUnique({ where: { id: NEWBIE } });
    if (!user) throw new Error(`Seed user ${NEWBIE} missing — run pnpm test:db:up`);
    return user;
  }),
}));

const { updateDisplayName } = await import("./actions");

afterAll(async () => {
  // Leave the newbie un-onboarded, as the seed does.
  await getDb().user.update({ where: { id: NEWBIE }, data: { displayName: null } });
});

describe("updateDisplayName", () => {
  it("saves the trimmed name", async () => {
    expect(await updateDisplayName({ displayName: "  Nan  " })).toEqual({
      ok: true,
      displayName: "Nan",
    });
    const user = await getDb().user.findUniqueOrThrow({ where: { id: NEWBIE } });
    expect(user.displayName).toBe("Nan");
  });

  it.each([
    ["   ", "Tell us what to call you"],
    ["x".repeat(31), "Keep it under 30 characters"],
  ])("rejects %j without saving", async (displayName, error) => {
    const before = await getDb().user.findUniqueOrThrow({ where: { id: NEWBIE } });
    expect(await updateDisplayName({ displayName })).toEqual({ ok: false, error });
    const after = await getDb().user.findUniqueOrThrow({ where: { id: NEWBIE } });
    expect(after.displayName).toBe(before.displayName);
  });
});
