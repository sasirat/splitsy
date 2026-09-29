import "server-only";
import { getDb } from "@/server/db";

/** Users offered on the dev sign-in screen. */
export function listDevUsers() {
  return getDb().user.findMany({
    select: { id: true, displayName: true, email: true },
    orderBy: [{ displayName: "asc" }, { email: "asc" }],
  });
}

export type DevUser = Awaited<ReturnType<typeof listDevUsers>>[number];
