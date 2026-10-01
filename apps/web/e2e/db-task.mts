// DB setup/cleanup for e2e tests, run via tsx (the generated Prisma client is
// ESM, which Playwright's CommonJS loader can't import directly).
//   tsx e2e/db-task.mts status <billTitle> <OPEN|SETTLING|SETTLED>
//   tsx e2e/db-task.mts cleanup <billTitle>
//   tsx e2e/db-task.mts cleanup-group <groupName>
//   tsx e2e/db-task.mts unname <userId>
import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");
const db = new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });

const [task, title, arg] = process.argv.slice(2);
if (!title) throw new Error("Missing argument");

if (task === "status") {
  if (arg !== "OPEN" && arg !== "SETTLING" && arg !== "SETTLED") {
    throw new Error(`Bad status: ${arg}`);
  }
  await db.bill.updateMany({ where: { title }, data: { status: arg } });
} else if (task === "cleanup") {
  // Deleting the group cascades to membership, bills, items and splits.
  await db.group.deleteMany({ where: { bills: { some: { title } } } });
} else if (task === "unname") {
  // Put a seed user back into the "not onboarded" state.
  await db.user.update({ where: { id: title }, data: { displayName: null } });
} else if (task === "cleanup-group") {
  await db.group.deleteMany({ where: { name: title, type: "PERSISTENT" } });
} else {
  throw new Error(`Unknown task: ${task}`);
}
await db.$disconnect();
