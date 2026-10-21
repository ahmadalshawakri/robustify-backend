import { Router } from "express";
import type { Ctx } from "../../context";
import { requireAuth } from "../../middleware/auth";
import { listInventory } from "./service";

export function inventoryRouter(ctx: Ctx) {
  const router = Router();
  router.use(requireAuth);

  router.get("/", async (_req, res) => {
    res.json({ items: await listInventory(ctx.prisma) });
  });

  return router;
}
