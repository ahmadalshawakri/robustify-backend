import {
  createUserSchema,
  idParamSchema,
  listUsersQuerySchema,
  updateUserSchema,
} from "@robustify/shared";
import { Router } from "express";
import type { Ctx } from "../../context";
import { parse } from "../../http/validate";
import { currentUser, requireAdmin } from "../../middleware/auth";
import { employeeUtilization } from "../dashboard/utilization";
import { createUser, deleteUser, listUsers, updateUser } from "./service";

export function usersRouter(ctx: Ctx) {
  const router = Router();
  router.use(requireAdmin);

  router.get("/", async (req, res) => {
    res.json({ users: await listUsers(ctx.prisma, parse(listUsersQuerySchema, req.query)) });
  });

  router.get("/utilization", async (_req, res) => {
    res.json({ employees: await employeeUtilization(ctx.prisma) });
  });

  router.post("/", async (req, res) => {
    const user = await createUser(ctx.prisma, parse(createUserSchema, req.body));
    res.status(201).json({ user });
  });

  router.patch("/:id", async (req, res) => {
    const { id } = parse(idParamSchema, req.params);
    const input = parse(updateUserSchema, req.body);
    res.json({ user: await updateUser(ctx.prisma, currentUser(req), id, input) });
  });

  router.delete("/:id", async (req, res) => {
    const { id } = parse(idParamSchema, req.params);
    await deleteUser(ctx.prisma, currentUser(req), id);
    res.status(204).end();
  });

  return router;
}
