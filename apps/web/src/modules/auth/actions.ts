"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/server/db";
import { devSignInEnabled, safeRedirectPath, SESSION_COOKIE } from "@/server/session";
import { signInSchema } from "./schema";

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

export async function signOut() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
