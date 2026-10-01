// Session constants shared by proxy.ts and the server. No "server-only" import:
// the proxy isn't a React Server Component environment.

/** Dev sign-in cookie: holds the signed-in user's id. Clerk replaces it in
 *  S14b (see ROADMAP). */
export const SESSION_COOKIE = "splitsy_session";

/** Tap-to-sign-in is a local-dev convenience and must never work in production. */
export const devSignInEnabled = process.env.NODE_ENV !== "production";

const LOCAL_ORIGIN = "http://splitsy.local";

/** Only allow same-origin relative paths as a post-sign-in destination.
 *  Resolves with the URL parser (as the browser will) instead of string
 *  checks, so tricks like "/\t/evil.com" or "/\\evil.com" can't escape. */
export function safeRedirectPath(path: string | undefined): string {
  if (!path?.startsWith("/")) return "/";
  try {
    const url = new URL(path, LOCAL_ORIGIN);
    if (url.origin !== LOCAL_ORIGIN) return "/";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/";
  }
}
