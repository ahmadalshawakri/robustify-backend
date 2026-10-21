import {
  createPurchaseSchema,
  idParamSchema,
  listPurchasesQuerySchema,
  receivePurchaseSchema,
} from "@robustify/shared";
import { Router } from "express";
import type { Ctx } from "../../context";
import { parse } from "../../http/validate";
import { requireAdmin } from "../../middleware/auth";
import {
  cancelPurchase,
  createPurchase,
  getPurchase,
  listPurchases,
  receivePurchase,
} from "./service";

export function purchasesRouter(ctx: Ctx) {
  const router = Router();
  router.use(requireAdmin);

  router.get("/", async (req, res) => {
    const filter = parse(listPurchasesQuerySchema, req.query);
    res.json({ purchases: await listPurchases(ctx.prisma, filter) });
  });

  router.get("/:id", async (req, res) => {
    const { id } = parse(idParamSchema, req.params);
    res.json({ purchase: await getPurchase(ctx.prisma, id) });
  });

  router.post("/", async (req, res) => {
    const purchase = await createPurchase(ctx.prisma, parse(createPurchaseSchema, req.body));
    res.status(201).json({ purchase });
  });

  router.post("/:id/receive", async (req, res) => {
    const { id } = parse(idParamSchema, req.params);
    const { quantity } = parse(receivePurchaseSchema, req.body);
    res.json({ purchase: await receivePurchase(ctx.prisma, id, quantity) });
  });

  router.post("/:id/cancel", async (req, res) => {
    const { id } = parse(idParamSchema, req.params);
    res.json({ purchase: await cancelPurchase(ctx.prisma, id) });
  });

  return router;
}
