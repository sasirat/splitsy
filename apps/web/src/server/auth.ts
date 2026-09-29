import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getDb } from "./db";
import { devSignInEnabled, SESSION_COOKIE } from "./session";

/** The signed-in user, or null. Cached per request. This is the one place that
 *  knows how sessions work — swapping in Clerk only changes this file. */
export const getCurrentUser = cache(async () => {
  if (!devSignInEnabled) return null;
  const userId = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!userId) return null;
  return getDb().user.findUnique({ where: { id: userId } });
});

/** The signed-in user; redirects to /login when there isn't one. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** A signed-in user who has picked a display name; sends everyone else to
 *  onboarding first. Use on app pages (not on /onboarding itself). */
export async function requireOnboardedUser() {
  const user = await requireUser();
  if (!user.displayName) redirect("/onboarding");
  return { ...user, displayName: user.displayName };
}
