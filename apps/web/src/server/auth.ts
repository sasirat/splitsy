import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getDb } from "./db";
import { devSignInEnabled, SESSION_COOKIE } from "./session";

/** Our User row for a Clerk account, created on first sign-in from the Clerk
 *  profile. Upsert on the unique clerkId, so concurrent first requests can't
 *  create duplicates. The display name stays empty → onboarding asks for it. */
async function userForClerkId(clerkId: string) {
  const db = getDb();
  const existing = await db.user.findUnique({ where: { clerkId } });
  if (existing) return existing;

  const profile = await currentUser();
  const email =
    profile?.primaryEmailAddress?.emailAddress ?? profile?.emailAddresses[0]?.emailAddress ?? "";
  return db.user.upsert({
    where: { clerkId },
    create: { clerkId, email },
    update: {},
  });
}

/** The signed-in user, or null. Cached per request. This is the one place that
 *  knows how sessions work: a Clerk (Google) session wins; in development the
 *  dev sign-in cookie is the fallback so seeded users and e2e tests work. */
export const getCurrentUser = cache(async () => {
  const { userId: clerkId } = await auth();
  if (clerkId) return userForClerkId(clerkId);

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

/** A name to suggest during onboarding: the Google first name, if any. */
export async function suggestedDisplayName(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;
  return (await currentUser())?.firstName ?? null;
}
