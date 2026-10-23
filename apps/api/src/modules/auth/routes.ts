import { DEMO_ACCOUNTS, demoLoginSchema, loginSchema } from "@robustify/shared";
import bcrypt from "bcryptjs";
import { type CookieOptions, Router } from "express";
import { rateLimit } from "express-rate-limit";
import type { Ctx } from "../../context";
import { HttpError } from "../../http/errors";
import { parse } from "../../http/validate";
import { currentUser, requireAuth } from "../../middleware/auth";
import { BCRYPT_ROUNDS, toSessionUser } from "../users/service";
import { SESSION_COOKIE, SESSION_TTL_MS, createSession, deleteSession } from "./sessions";

// Compared against when the username does not exist, so both paths take as long.
const DUMMY_HASH = bcrypt.hashSync("no-such-user", BCRYPT_ROUNDS);

export function authRouter(ctx: Ctx, opts: { loginAttempts: number }) {
  const router = Router();
  const cookie: CookieOptions = {
    httpOnly: true,
    secure: ctx.secureCookies,
    sameSite: "strict",
    path: "/",
  };

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: opts.loginAttempts,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (_req, _res, next) =>
      next(
        new HttpError(429, "Too many sign-in attempts. Try again in 15 minutes.", "rate_limited"),
      ),
  });

  router.post("/login", loginLimiter, async (req, res) => {
    const { username, password } = parse(loginSchema, req.body);
    const user = await ctx.prisma.user.findUnique({ where: { username } });
    const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !valid) throw HttpError.unauthorized("Wrong username or password");

    const token = await createSession(ctx, user.id);
    res.cookie(SESSION_COOKIE, token, { ...cookie, maxAge: SESSION_TTL_MS });
    res.json({ user: toSessionUser(user) });
  });

  // One-click sign-in for the public demo. Off everywhere else.
  router.get("/demo", (_req, res) => {
    res.json({ enabled: ctx.demo, accounts: ctx.demo ? DEMO_ACCOUNTS : [] });
  });

  // Generous: demo sign-ins need no password, so there is nothing to guess.
  const demoLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: opts.loginAttempts * 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (_req, _res, next) =>
      next(new HttpError(429, "Too many sign-ins. Try again in a few minutes.", "rate_limited")),
  });

  router.post("/demo", demoLimiter, async (req, res) => {
    if (!ctx.demo) throw HttpError.notFound("No such endpoint");
    const { username } = parse(demoLoginSchema, req.body);
    const user = await ctx.prisma.user.findUnique({ where: { username } });
    if (!user) throw HttpError.notFound("The demo is being reset. Try again in a minute.");

    const token = await createSession(ctx, user.id);
    res.cookie(SESSION_COOKIE, token, { ...cookie, maxAge: SESSION_TTL_MS });
    res.json({ user: toSessionUser(user) });
  });

  router.post("/logout", async (req, res) => {
    const token: unknown = req.cookies?.[SESSION_COOKIE];
    if (typeof token === "string" && token) await deleteSession(ctx, token);
    res.clearCookie(SESSION_COOKIE, cookie);
    res.status(204).end();
  });

  router.get("/me", requireAuth, (req, res) => {
    res.json({ user: currentUser(req) });
  });

  return router;
}
