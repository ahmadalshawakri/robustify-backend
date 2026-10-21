import type { SessionUser } from "./modules/users/service";

declare global {
  namespace Express {
    interface Request {
      /** Set by the authenticate middleware when the request carries a valid session. */
      user?: SessionUser;
    }
  }
}

export {};
