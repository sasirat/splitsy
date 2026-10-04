import { defineConfig, devices } from "@playwright/test";

// End-to-end tests against the dev server + Neon dev branch (apps/web/.env).
// Run with `pnpm test:e2e`; reuses a dev server that's already running.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  // Generous: the dev server compiles each route on first visit.
  timeout: 120_000,
  // Locked item writes cost several ~250ms round trips to Neon (us-east-2), so
  // a save + refresh can take ~5s. Drop back to the default once tests run
  // against a local Postgres.
  expect: { timeout: 15_000 },
  use: {
    baseURL: "http://localhost:3000",
    ...devices["Pixel 7"],
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000/login",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
