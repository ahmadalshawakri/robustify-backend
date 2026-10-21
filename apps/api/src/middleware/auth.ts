import type { RequestHandler } from "express";
import type { Ctx } from "../context";
import { HttpError } from "../http/errors";
import { SESSION_COOKIE, findSessionUser } from "../modules/auth/sessions";

/** Attaches `req.user` when the session cookie is valid. Never rejects on its own. */
export function authenticate(ctx: Ctx): RequestHandler {
  return async (req, _res, next) => {
    const token: unknown = req.cookies?.[SESSION_COOKIE];
    if (typeof token === "string" && token) {
      req.user = (await findSessionUser(ctx, token)) ?? undefined;
    }
    next();
  };
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  next(req.user ? undefined : HttpError.unauthorized());
};

export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (!req.user) return next(HttpError.unauthorized());
  next(req.user.role === "ADMIN" ? undefined : HttpError.forbidden());
};

/** The signed-in user. Only call behind requireAuth or requireAdmin. */
export function currentUser(req: Express.Request) {
  if (!req.user) throw HttpError.unauthorized();
  return req.user;
}
