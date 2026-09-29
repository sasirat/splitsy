import { unstable_rethrow } from "next/navigation";
import type { ActionResult } from "./action-result";

export const OFFLINE_ERROR = "Couldn't reach Splitsy — check your connection and try again.";

/** Call a server action from the client. Expected failures already come back
 *  as { ok: false }; this also turns a thrown request (offline, server crash)
 *  into one, instead of taking the whole page down via the error boundary.
 *  Next.js redirects/not-found still propagate. */
export async function callAction<T extends object>(
  action: () => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  try {
    return await action();
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: OFFLINE_ERROR };
  }
}
