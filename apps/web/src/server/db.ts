import "server-only";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/generated/prisma/client";

// One client per server process, created on first use (not at import, so
// `next build` works without DATABASE_URL) and reused across dev hot reloads
// so we don't open a new connection pool on every edit.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getDb(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  globalForPrisma.prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });
  return globalForPrisma.prisma;
}
