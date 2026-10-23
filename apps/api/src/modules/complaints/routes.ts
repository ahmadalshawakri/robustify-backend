import {
  createComplaintSchema,
  idParamSchema,
  listComplaintsQuerySchema,
  updateComplaintSchema,
} from "@robustify/shared";
import { Router } from "express";
import type { Ctx } from "../../context";
import { parse } from "../../http/validate";
import { currentUser, requireAdmin, requireAuth } from "../../middleware/auth";
import { createComplaint, listComplaints, updateComplaint } from "./service";

export function complaintsRouter(ctx: Ctx) {
  const router = Router();
  router.use(requireAuth);

  router.get("/", async (req, res) => {
    const filter = parse(listComplaintsQuerySchema, req.query);
    res.json({ complaints: await listComplaints(ctx.prisma, currentUser(req), filter) });
  });

  router.post("/", requireAdmin, async (req, res) => {
    const complaint = await createComplaint(ctx.prisma, parse(createComplaintSchema, req.body));
    res.status(201).json({ complaint });
  });

  router.patch("/:id", requireAdmin, async (req, res) => {
    const { id } = parse(idParamSchema, req.params);
    const input = parse(updateComplaintSchema, req.body);
    res.json({ complaint: await updateComplaint(ctx.prisma, id, input) });
  });

  return router;
}
