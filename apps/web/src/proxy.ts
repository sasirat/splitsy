import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/server/session";

/** Optimistic auth gate: no session cookie → /login. Only checks the cookie
 *  exists (no DB call — this runs on every request, including prefetches);
 *  pages still verify the user with requireUser(). */
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  const loginUrl = new URL("/login", request.url);
  const { pathname, search } = request.nextUrl;
  if (pathname !== "/") loginUrl.searchParams.set("next", pathname + search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Public: login, the design-system playground, Next internals and static files.
  matcher: [
    "/((?!login|playground|_next/static|_next/image|favicon\\.ico|art/|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)",
  ],
};
