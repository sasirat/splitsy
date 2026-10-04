import { defineConfig, devices } from "@playwright/test";
import { isLocalDatabase } from "./src/server/local-db";

// End-to-end tests against their own dev server on port 3100, wired to the
// local test Postgres (docker-compose.yml) — never Neon. Run with
// `pnpm test:e2e` (after `pnpm test:db:up`). Your `pnpm dev` on port 3000
// keeps running against Neon alongside it.
const PORT = 3100;

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl || !isLocalDatabase(databaseUrl)) {
  throw new Error("e2e tests only run against the local test Postgres — use `pnpm test:e2e`.");
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  // Generous: the dev server compiles each route on first visit.
  timeout: 120_000,
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...devices["Pixel 7"],
    trace: "retain-on-failure",
  },
  webServer: {
    command: `next dev -p ${PORT}`,
    url: `http://localhost:${PORT}/login`,
    // Its own build folder, so it doesn't fight `pnpm dev` over .next.
    env: { NEXT_DIST_DIR: ".next-e2e" },
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
