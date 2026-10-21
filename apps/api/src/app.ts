import { existsSync } from "node:fs";
import path from "node:path";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import type { Ctx } from "./context";
import { logger } from "./logger";
import { authenticate } from "./middleware/auth";
import { errorHandler, notFound } from "./middleware/error";
import { authRouter } from "./modules/auth/routes";
import { contactsRouter } from "./modules/contacts/routes";
import { dashboardRouter } from "./modules/dashboard/routes";
import { healthRouter } from "./modules/health";
import { inventoryRouter } from "./modules/inventory/routes";
import { ordersRouter } from "./modules/orders/routes";
import { purchasesRouter } from "./modules/purchases/routes";
import { usersRouter } from "./modules/users/routes";

export interface AppDeps extends Ctx {
  /** Override the database probe used by /api/health. */
  checkDatabase?: () => Promise<void>;
  /** Built web app to serve alongside the API. */
  webDist?: string;
  /** Sign-in attempts allowed per IP every 15 minutes. */
  loginAttempts?: number;
}

export function createApp({ checkDatabase, webDist, loginAttempts = 10, ...ctx }: AppDeps) {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === "/api/health" } }));
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  const probe = checkDatabase ?? (async () => void (await ctx.prisma.$queryRaw`SELECT 1`));

  const api = express.Router();
  api.use("/health", healthRouter(probe));
  api.use(authenticate(ctx));
  api.use("/auth", authRouter(ctx, { loginAttempts }));
  api.use("/users", usersRouter(ctx));
  api.use("/contacts", contactsRouter(ctx));
  api.use("/orders", ordersRouter(ctx));
  api.use("/purchases", purchasesRouter(ctx));
  api.use("/inventory", inventoryRouter(ctx));
  api.use("/dashboard", dashboardRouter(ctx));
  api.use(notFound);
  app.use("/api", api);

  if (webDist && existsSync(webDist)) {
    const root = path.resolve(webDist);
    const index = path.join(root, "index.html");
    app.use(express.static(root, { index: false, maxAge: "1h" }));
    // Client-side routes all render the single-page app.
    app.use((req, res, next) => {
      if (req.method !== "GET" || !req.accepts("html")) return next();
      res.sendFile(index);
    });
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
