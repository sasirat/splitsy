"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { firstIssue, type ActionResult } from "@/lib/action-result";
import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { devSignInEnabled, safeRedirectPath, SESSION_COOKIE } from "@/server/session";
import { displayNameInput, signInSchema, type DisplayNameInput } from "./schema";

const THIRTY_DAYS = 60 * 60 * 24 * 30;

/** Dev-only: sign in as an existing user by tapping their button. */
export async function signInAs(formData: FormData) {
  if (!devSignInEnabled) throw new Error("Dev sign-in is disabled in production");

  const { userId, next } = signInSchema.parse({
    userId: formData.get("userId"),
    next: formData.get("next") || undefined,
  });
  const user = await getDb().user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) throw new Error("Unknown user");

  (await cookies()).set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: THIRTY_DAYS,
  });
  redirect(safeRedirectPath(next));
}

/** Clears the dev sign-in cookie. No redirect: the sign-out button navigates
 *  once, after Clerk has signed out too. */
export async function clearDevSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Set the name friends see on every item you pick (onboarding / edit name). */
export async function updateDisplayName(
  input: DisplayNameInput,
): Promise<ActionResult<{ displayName: string }>> {
  const user = await requireUser();
  const parsed = displayNameInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const { displayName } = parsed.data;
  await getDb().user.update({ where: { id: user.id }, data: { displayName } });

  revalidatePath("/", "layout");
  return { ok: true, displayName };
}
