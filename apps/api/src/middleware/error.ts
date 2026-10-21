import { Prisma } from "@prisma/client";
import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { HttpError } from "../http/errors";

export const notFound: RequestHandler = (_req, _res, next) => {
  next(HttpError.notFound("No such endpoint"));
};

/**
 * Every API error leaves as `{ error: { code, message, details? } }`.
 * Unexpected errors are logged in full and reported to the client generically.
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const httpError = toHttpError(err);
  if (!httpError) {
    req.log.error({ err }, "unhandled error");
  }
  const { status, code, message, details } =
    httpError ?? new HttpError(500, "Something went wrong on our side", "internal");
  res.status(status).json({ error: { code, message, ...(details ? { details } : {}) } });
};

function toHttpError(err: unknown): HttpError | null {
  if (err instanceof HttpError) return err;
  if (err instanceof ZodError) {
    return HttpError.badRequest(
      "Some fields are invalid",
      err.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    );
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        return HttpError.conflict(`That ${uniqueFields(err)} is already in use`);
      case "P2003":
        return HttpError.conflict("It is still referenced by other records");
      case "P2025":
        return HttpError.notFound();
    }
    return null;
  }
  if (isBodyParserError(err)) {
    return new HttpError(err.status, "The request body could not be read", "bad_request");
  }
  return null;
}

function uniqueFields(err: Prisma.PrismaClientKnownRequestError): string {
  const target = err.meta?.target;
  return Array.isArray(target) ? target.join(" and ") : "value";
}

function isBodyParserError(err: unknown): err is { status: number; type: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    "type" in err &&
    "status" in err &&
    typeof err.status === "number" &&
    err.status < 500
  );
}
