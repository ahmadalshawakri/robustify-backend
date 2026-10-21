import { listContactsQuerySchema } from "@robustify/shared";
import { Router } from "express";
import type { Ctx } from "../../context";
import { parse } from "../../http/validate";
import { requireAdmin } from "../../middleware/auth";
import { listContacts } from "./service";

export function contactsRouter(ctx: Ctx) {
  const router = Router();
  router.use(requireAdmin);

  router.get("/", async (req, res) => {
    res.json({
      contacts: await listContacts(ctx.prisma, parse(listContactsQuerySchema, req.query)),
    });
  });

  return router;
}
