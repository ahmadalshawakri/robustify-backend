import {
  advanceOrderSchema,
  assignOrderSchema,
  createOrderSchema,
  idParamSchema,
  listOrdersQuerySchema,
} from "@robustify/shared";
import { Router } from "express";
import type { Ctx } from "../../context";
import { parse } from "../../http/validate";
import { currentUser, requireAdmin, requireAuth } from "../../middleware/auth";
import {
  advanceOrder,
  assignOrder,
  createOrder,
  deleteOrder,
  getOrder,
  listOrders,
} from "./service";

export function ordersRouter(ctx: Ctx) {
  const router = Router();
  router.use(requireAuth);

  router.get("/", async (req, res) => {
    const filter = parse(listOrdersQuerySchema, req.query);
    res.json({ orders: await listOrders(ctx.prisma, currentUser(req), filter) });
  });

  router.get("/:id", async (req, res) => {
    const { id } = parse(idParamSchema, req.params);
    res.json({ order: await getOrder(ctx.prisma, currentUser(req), id) });
  });

  router.post("/", requireAdmin, async (req, res) => {
    const input = parse(createOrderSchema, req.body);
    res.status(201).json({ order: await createOrder(ctx.prisma, currentUser(req), input) });
  });

  router.post("/:id/advance", async (req, res) => {
    const { id } = parse(idParamSchema, req.params);
    const input = parse(advanceOrderSchema, req.body ?? {});
    res.json({ order: await advanceOrder(ctx.prisma, currentUser(req), id, input) });
  });

  router.post("/:id/assign", requireAdmin, async (req, res) => {
    const { id } = parse(idParamSchema, req.params);
    const { assigneeId } = parse(assignOrderSchema, req.body);
    res.json({ order: await assignOrder(ctx.prisma, id, assigneeId) });
  });

  router.delete("/:id", requireAdmin, async (req, res) => {
    const { id } = parse(idParamSchema, req.params);
    await deleteOrder(ctx.prisma, id);
    res.status(204).end();
  });

  return router;
}
