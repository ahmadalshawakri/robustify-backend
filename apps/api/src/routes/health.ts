import { Router } from "express";

export function healthRouter(checkDatabase: () => Promise<void>) {
  const router = Router();

  router.get("/", async (req, res) => {
    try {
      await checkDatabase();
      res.json({ status: "ok", database: "ok" });
    } catch (err) {
      req.log.error({ err }, "health check failed");
      res.status(503).json({ status: "degraded", database: "unreachable" });
    }
  });

  return router;
}
