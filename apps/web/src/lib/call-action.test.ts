import { redirect } from "next/navigation";
import { describe, expect, it } from "vitest";
import { callAction, OFFLINE_ERROR } from "./call-action";

describe("callAction", () => {
  it("passes a successful result through", async () => {
    expect(await callAction(async () => ({ ok: true as const, id: "b1" }))).toEqual({
      ok: true,
      id: "b1",
    });
  });

  it("passes an expected failure through", async () => {
    expect(await callAction(async () => ({ ok: false as const, error: "Bill not found" }))).toEqual(
      { ok: false, error: "Bill not found" },
    );
  });

  it("turns a crash or network failure into a friendly failure", async () => {
    expect(
      await callAction(async () => {
        throw new TypeError("Failed to fetch");
      }),
    ).toEqual({ ok: false, error: OFFLINE_ERROR });
  });

  it("lets Next.js redirects through (e.g. signed out → /login)", async () => {
    await expect(
      callAction(async (): Promise<{ ok: false; error: string }> => {
        redirect("/login");
      }),
    ).rejects.toMatchObject({ digest: expect.stringContaining("NEXT_REDIRECT") });
  });
});
