import { existsSync } from "node:fs";
import path from "node:path";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { logger } from "./logger";
import { errorHandler, notFound } from "./middleware/error";
import { healthRouter } from "./routes/health";

export interface AppDeps {
  checkDatabase: () => Promise<void>;
  /** Built web app to serve alongside the API. */
  webDist?: string;
}

export function createApp({ checkDatabase, webDist }: AppDeps) {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === "/api/health" } }));
  app.use(express.json({ limit: "100kb" }));

  const api = express.Router();
  api.use("/health", healthRouter(checkDatabase));
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
