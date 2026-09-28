import "dotenv/config";
import { defineConfig } from "prisma/config";

// The CLI (migrate/studio) uses Neon's direct, unpooled URL; the app runtime
// uses the pooled DATABASE_URL via the Neon driver adapter (src/server/db.ts).
// Read with process.env (not env()) so `prisma generate` works without a DB,
// e.g. on postinstall in CI.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_URL,
  },
});
