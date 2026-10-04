// Run a command against the local test database (docker-compose.yml):
//   node scripts/with-test-env.mjs vitest run --project db
// Loads .env.test first, then .env for anything it doesn't set (Clerk keys).
// dotenv never overrides a variable that's already set, so the command's own
// `dotenv/config` keeps these values instead of falling back to Neon.
import { spawnSync } from "node:child_process";
import dotenv from "dotenv";

dotenv.config({ path: ".env.test", quiet: true });
dotenv.config({ path: ".env", quiet: true });

const [command, ...args] = process.argv.slice(2);
if (!command) throw new Error("Usage: with-test-env.mjs <command> [...args]");
const { status } = spawnSync(command, args, { stdio: "inherit" });
process.exit(status ?? 1);
