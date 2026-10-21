/** An error whose message is safe to show to the client. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code = "error",
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }

  static badRequest(message: string, details?: unknown) {
    return new HttpError(400, message, "bad_request", details);
  }
  static unauthorized(message = "Please sign in") {
    return new HttpError(401, message, "unauthorized");
  }
  static forbidden(message = "You do not have access to this") {
    return new HttpError(403, message, "forbidden");
  }
  static notFound(message = "Not found") {
    return new HttpError(404, message, "not_found");
  }
  static conflict(message: string) {
    return new HttpError(409, message, "conflict");
  }
}
