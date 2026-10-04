// No "server-only": the seed and e2e scripts (plain Node via tsx) use this too.
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

/** A Prisma client for `connectionString`: Neon's driver adapter for Neon,
 *  plain node-postgres for anything else (the local test database). */
export function createPrismaClient(connectionString: string): PrismaClient {
  const { hostname } = new URL(connectionString);
  const adapter = hostname.endsWith(".neon.tech")
    ? new PrismaNeon({ connectionString })
    : new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}
