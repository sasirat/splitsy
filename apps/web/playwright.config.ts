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
