import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { devSignInEnabled, SESSION_COOKIE } from "@/server/session";

/** Pages anyone can open. Everything else needs a session. */
const PUBLIC_PATHS = ["/login", "/sso-callback", "/playground"];
const isPublic = (pathname: string) =>
  PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

/** Optimistic auth gate: no Clerk session (and, in dev, no dev cookie) →
 *  /login?next=…. No DB call — this runs on every request, including
 *  prefetches; pages still verify the user with requireUser(). Clerk's
 *  middleware must run even on public pages so auth() works there. */
export default clerkMiddleware(async (auth, request) => {
  const { pathname, search } = request.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const { userId } = await auth();
  if (userId) return NextResponse.next();
  if (devSignInEnabled && request.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  const loginUrl = new URL("/login", request.url);
  if (pathname !== "/") loginUrl.searchParams.set("next", pathname + search);
  return NextResponse.redirect(loginUrl);
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files (Clerk's recommended matcher).
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    // Clerk's frontend API routes.
    "/__clerk/(.*)",
  ],
};
