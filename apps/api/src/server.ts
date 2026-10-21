import { checkDatabase, prisma } from "./db";
import { createApp } from "./app";
import { loadEnv } from "./env";
import { logger } from "./logger";

const env = loadEnv();
const app = createApp({ checkDatabase, webDist: env.WEB_DIST });

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
