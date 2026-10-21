import type { PrismaClient } from "@prisma/client";

/** What request handlers need from the outside world. */
export interface Ctx {
  prisma: PrismaClient;
  sessionSecret: string;
  /** Mark cookies Secure (production, behind HTTPS). */
  secureCookies: boolean;
  /** Running as the public demo. */
  demo: boolean;
}
