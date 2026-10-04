import "dotenv/config";
import { createPrismaClient } from "../src/server/prisma-client";

// Dev seed: three friends (+ one not onboarded), one dinner bill with mixed splits. Idempotent and
// scoped — it only replaces its own fixed-id rows, never other data.

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const prisma = createPrismaClient(connectionString);

const baht = (amount: number) => amount * 100;

const users = {
  mint: {
    id: "seed_user_mint",
    displayName: "Mint",
    bankName: "KBank",
    bankAccountNumber: "1234567890",
    bankAccountName: "Mint S.",
  },
  ploy: { id: "seed_user_ploy", displayName: "Ploy" },
  beam: { id: "seed_user_beam", displayName: "Beam" },
  // No name yet (reset on every seed) — sign in as them to see onboarding.
  newbie: { id: "seed_user_newbie", displayName: null },
} satisfies Record<
  string,
  {
    id: string;
    displayName: string | null;
    bankName?: string;
    bankAccountNumber?: string;
    bankAccountName?: string;
  }
>;

type Friend = keyof typeof users;

// `split` maps each sharer to their shares of the item (Beam had 2 of 3 beers).
const items: { name: string; price: number; split: Partial<Record<Friend, number>> }[] = [
  { name: "Tom yum goong", price: 320, split: { mint: 1, ploy: 1, beam: 1 } },
  { name: "Pad thai", price: 180, split: { mint: 1, ploy: 1 } },
  { name: "Som tam", price: 120, split: { ploy: 1, beam: 1 } },
  { name: "Mango sticky rice", price: 150, split: { mint: 1, ploy: 1, beam: 1 } },
  { name: "Singha ×3", price: 270, split: { mint: 1, beam: 2 } },
];

const GROUP_ID = "seed_group_dinner";

async function main() {
  // Settlements restrict bill deletion, so clear them first; deleting the
  // group then cascades to members, bills, items and splits.
  await prisma.settlement.deleteMany({ where: { bill: { groupId: GROUP_ID } } });
  await prisma.group.deleteMany({ where: { id: GROUP_ID } });

  for (const [key, user] of Object.entries(users)) {
    const data = { ...user, clerkId: `seed_${key}`, email: `${key}@seed.splitsy.dev` };
    await prisma.user.upsert({ where: { id: user.id }, update: data, create: data });
  }

  const { mint, ploy, beam } = users;
  await prisma.group.create({
    data: {
      id: GROUP_ID,
      name: "Friday dinner",
      type: "PERSISTENT",
      createdById: mint.id,
      members: {
        create: [{ userId: mint.id, role: "OWNER" }, { userId: ploy.id }, { userId: beam.id }],
      },
      bills: {
        create: {
          id: "seed_bill_dinner",
          title: "Som Tam Nua",
          payerId: mint.id,
          createdById: mint.id,
          items: {
            create: items.map(({ name, price, split }, position) => ({
              name,
              priceSatang: baht(price),
              position,
              splits: {
                create: Object.entries(split).map(([friend, shares]) => ({
                  userId: users[friend as Friend].id,
                  shares,
                })),
              },
            })),
          },
        },
      },
    },
  });

  console.log(
    `Seeded ${Object.keys(users).length} users, 1 group, 1 bill with ${items.length} items.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
