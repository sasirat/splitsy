// Setup for the "db" Vitest project: tests create and delete rows freely, so
// they must never run against Neon. `pnpm test:db` points them at the local
// test Postgres (docker-compose.yml) via .env.test.
import "dotenv/config";
import { isLocalDatabase } from "@/server/local-db";

const url = process.env.DATABASE_URL;
if (!url || !isLocalDatabase(url)) {
  throw new Error(
    "DB tests only run against the local test Postgres — use `pnpm test:db` " +
      "(start it first with `pnpm test:db:up`).",
  );
}
