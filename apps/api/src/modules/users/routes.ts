import {
  DEMO_USERNAMES,
  createUserSchema,
  idParamSchema,
  listUsersQuerySchema,
  updateUserSchema,
} from "@robustify/shared";
import { Router } from "express";
import type { Ctx } from "../../context";
import { HttpError } from "../../http/errors";
import { parse } from "../../http/validate";
import { currentUser, requireAdmin } from "../../middleware/auth";
import { employeeUtilization } from "../dashboard/utilization";
import { createUser, deleteUser, listUsers, updateUser } from "./service";

const isDemoAccount = (username: string) =>
  (DEMO_USERNAMES as readonly string[]).includes(username);

export function usersRouter(ctx: Ctx) {
  const router = Router();
  router.use(requireAdmin);

  /** On the public demo, visitors cannot lock each other out of the demo accounts. */
  async function guardDemo(
    id: number,
    change: { password?: unknown; role?: unknown; department?: unknown } | null,
  ) {
    if (!ctx.demo) return;
    if (change?.password !== undefined) {
      throw HttpError.forbidden("Passwords cannot be changed in the demo");
    }
    const user = await ctx.prisma.user.findUnique({ where: { id } });
    if (
      user &&
      isDemoAccount(user.username) &&
      (change === null || change.role || change.department)
    ) {
      throw HttpError.forbidden("The demo accounts cannot be changed or removed");
    }
  }

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
    await guardDemo(id, input);
    res.json({ user: await updateUser(ctx.prisma, currentUser(req), id, input) });
  });

  router.delete("/:id", async (req, res) => {
    const { id } = parse(idParamSchema, req.params);
    await guardDemo(id, null);
    await deleteUser(ctx.prisma, currentUser(req), id);
    res.status(204).end();
  });

  return router;
}
