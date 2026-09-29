/** What every server action returns: data on success, or a message the UI can
 *  show — actions don't throw for expected failures (bad input, not found). */
export type ActionResult<T extends object = object> =
  ({ ok: true } & T) | { ok: false; error: string };

/** First validation message from a zod error, for showing next to a form. */
export function firstIssue(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? "Invalid input";
}
