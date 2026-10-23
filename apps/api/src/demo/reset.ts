import type { PrismaClient } from "@prisma/client";
import { DEMO_ACCOUNTS } from "@robustify/shared";
import type { Logger } from "pino";
import { seedDemo } from "./seed";

// Any constant works; it only has to be the same in every instance.
const RESET_LOCK = 72_013;

/** The demo is stale once it was seeded before today (UTC), or never. */
export async function demoIsStale(prisma: PrismaClient, now = new Date()) {
  const admin = await prisma.user.findUnique({ where: { username: DEMO_ACCOUNTS[0].username } });
  const startOfDay = new Date(now.toISOString().slice(0, 10));
  return !admin || admin.createdAt < startOfDay;
}

/**
 * Reseeds the public demo once a day, so whatever visitors changed is undone.
 * An advisory lock keeps two instances from resetting at the same time.
 */
export async function resetDemoIfStale(
  prisma: PrismaClient,
  password: string,
  logger: Logger,
  opts: { bcryptRounds?: number } = {},
): Promise<boolean> {
  if (!(await demoIsStale(prisma))) return false;
  return prisma.$transaction(
    async (tx) => {
      const rows = await tx.$queryRaw<{ locked: boolean }[]>`
        SELECT pg_try_advisory_xact_lock(${RESET_LOCK}) AS locked`;
      // Another instance is resetting, or did so between our check and the lock.
      if (!rows[0]?.locked || !(await demoIsStale(prisma))) return false;
      const summary = await seedDemo(prisma, password, opts);
      logger.info(summary, "demo data reset");
      return true;
    },
    { timeout: 120_000 },
  );
}
