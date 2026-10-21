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
  let httpError: HttpError;
  if (err instanceof HttpError) {
    httpError = err;
  } else if (err instanceof ZodError) {
    httpError = HttpError.badRequest(
      "Some fields are invalid",
      err.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    );
  } else if (isBodyParserError(err)) {
    httpError = new HttpError(err.status, "The request body could not be read", "bad_request");
  } else {
    req.log.error({ err }, "unhandled error");
    httpError = new HttpError(500, "Something went wrong on our side", "internal");
  }

  const { status, code, message, details } = httpError;
  res.status(status).json({ error: { code, message, ...(details ? { details } : {}) } });
};

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
