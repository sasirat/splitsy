import { execFileSync } from "node:child_process";

function run(...args: string[]) {
  execFileSync("pnpm", ["exec", "tsx", "e2e/db-task.mts", ...args], { stdio: "inherit" });
}

/** Add a user to a bill's group (stand-in for invites until S15). */
export const joinBill = (title: string, userId: string) => run("join", title, userId);

/** Set a bill's status, e.g. to lock it as if settling had started (S17). */
export const setBillStatus = (title: string, status: "OPEN" | "SETTLING" | "SETTLED") =>
  run("status", title, status);

/** Delete every group holding a bill with this title. */
export const cleanupBill = (title: string) => run("cleanup", title);
