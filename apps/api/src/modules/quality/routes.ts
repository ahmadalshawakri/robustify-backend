import { createQualityCostSchema, idParamSchema, reportQuerySchema } from "@robustify/shared";
import { Router } from "express";
import type { Ctx } from "../../context";
import { parse } from "../../http/validate";
import { requireAdmin } from "../../middleware/auth";
import { createQualityCost, deleteQualityCost, qualityReport } from "./service";

export function qualityRouter(ctx: Ctx) {
  const router = Router();
  router.use(requireAdmin);

  router.get("/", async (req, res) => {
    const { months } = parse(reportQuerySchema, req.query);
    res.json(await qualityReport(ctx.prisma, months));
  });

  router.post("/", async (req, res) => {
    const entry = await createQualityCost(ctx.prisma, parse(createQualityCostSchema, req.body));
    res.status(201).json({ entry });
  });

  router.delete("/:id", async (req, res) => {
    const { id } = parse(idParamSchema, req.params);
    await deleteQualityCost(ctx.prisma, id);
    res.status(204).end();
  });

  return router;
}
