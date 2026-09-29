// Session constants shared by proxy.ts and the server. No "server-only" import:
// the proxy isn't a React Server Component environment.

/** Dev sign-in cookie: holds the signed-in user's id. Clerk replaces it
 *  before invite links (see ROADMAP). */
export const SESSION_COOKIE = "splitsy_session";

/** Tap-to-sign-in is a local-dev convenience and must never work in production. */
export const devSignInEnabled = process.env.NODE_ENV !== "production";

/** Only allow same-origin relative paths as a post-sign-in destination. */
export function safeRedirectPath(path: string | undefined): string {
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return "/";
  return path;
}
