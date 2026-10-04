import { execFileSync } from "node:child_process";

function run(...args: string[]) {
  execFileSync("pnpm", ["exec", "tsx", "e2e/db-task.mts", ...args], { stdio: "inherit" });
}

/** Set a bill's status, e.g. to lock it as if settling had started (S17). */
export const setBillStatus = (title: string, status: "OPEN" | "SETTLING" | "SETTLED") =>
  run("status", title, status);

/** Delete quick bills with this title (and their hidden groups). */
export const cleanupBill = (title: string) => run("cleanup", title);

/** Delete persistent groups with this name (cascades to their bills). */
export const cleanupGroup = (name: string) => run("cleanup-group", name);

/** Clear a seed user's display name, so they're "not onboarded" again. */
export const unnameUser = (userId: string) => run("unname", userId);

/** Put a seed user's payment details (bank account, QR) back to the seed's. */
export const resetPayment = (userId: string) => run("reset-payment", userId);
