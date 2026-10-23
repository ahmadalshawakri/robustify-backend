import { createInvoiceSchema, idParamSchema, reportQuerySchema } from "@robustify/shared";
import { Router } from "express";
import type { Ctx } from "../../context";
import { parse } from "../../http/validate";
import { requireAdmin } from "../../middleware/auth";
import { createInvoice, getInvoice, listInvoices, salesReport } from "./service";

export function invoicesRouter(ctx: Ctx) {
  const router = Router();
  router.use(requireAdmin);

  router.get("/", async (_req, res) => {
    res.json({ invoices: await listInvoices(ctx.prisma) });
  });

  router.get("/sales-report", async (req, res) => {
    const { months } = parse(reportQuerySchema, req.query);
    res.json(await salesReport(ctx.prisma, months));
  });

  router.get("/:id", async (req, res) => {
    const { id } = parse(idParamSchema, req.params);
    res.json({ invoice: await getInvoice(ctx.prisma, id) });
  });

  router.post("/", async (req, res) => {
    const invoice = await createInvoice(ctx.prisma, parse(createInvoiceSchema, req.body));
    res.status(201).json({ invoice });
  });

  return router;
}
