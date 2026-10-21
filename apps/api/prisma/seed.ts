/** `pnpm db:seed`: replaces everything in the database with the demo press. */
import { PrismaClient } from "@prisma/client";
import { seedDemo } from "../src/demo/seed";

function seedPassword(): string {
  const password = process.env.SEED_PASSWORD;
  if (password) return password;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SEED_PASSWORD must be set to seed a production database");
  }
  return "demo1234";
}

const prisma = new PrismaClient();

seedDemo(prisma, seedPassword())
  .then((s) =>
    console.log(
      `Seeded ${s.users} users, ${s.contacts} contacts, ${s.orders} orders, ` +
        `${s.invoices} invoices, ${s.purchases} purchases.`,
    ),
  )
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
