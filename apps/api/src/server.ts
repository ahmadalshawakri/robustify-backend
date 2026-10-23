import { createApp } from "./app";
import { prisma } from "./db";
import { resetDemoIfStale } from "./demo/reset";
import { loadEnv } from "./env";
import { logger } from "./logger";

const env = loadEnv();

if (env.DEMO_MODE && env.SEED_PASSWORD) {
  const password = env.SEED_PASSWORD;
  const reset = () =>
    resetDemoIfStale(prisma, password, logger).catch((err: unknown) =>
      logger.error({ err }, "demo reset failed"),
    );
  // A sleeping free-tier instance wakes on a request, so checking at start-up
  // and then hourly is enough to reset the demo once a day.
  await reset();
  setInterval(() => void reset(), 60 * 60 * 1000).unref();
}

const app = createApp({
  prisma,
  sessionSecret: env.SESSION_SECRET,
  secureCookies: env.NODE_ENV === "production",
  demo: env.DEMO_MODE,
  webDist: env.WEB_DIST,
});

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, "robustify api listening");
});

async function shutdown(signal: string) {
  logger.info({ signal }, "shutting down");
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
