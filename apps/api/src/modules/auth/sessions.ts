import { createHmac, randomBytes } from "node:crypto";
import type { Ctx } from "../../context";
import { type SessionUser, toSessionUser } from "../users/service";

export const SESSION_COOKIE = "robustify_session";
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

const hashToken = (secret: string, token: string) =>
  createHmac("sha256", secret).update(token).digest("hex");

/** Creates a session and returns the raw token for the cookie. */
export async function createSession(ctx: Ctx, userId: number): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await ctx.prisma.session.create({
    data: {
      tokenHash: hashToken(ctx.sessionSecret, token),
      userId,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });
  return token;
}

export async function findSessionUser(ctx: Ctx, token: string): Promise<SessionUser | null> {
  const session = await ctx.prisma.session.findUnique({
    where: { tokenHash: hashToken(ctx.sessionSecret, token) },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt <= new Date()) {
    await ctx.prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  return toSessionUser(session.user);
}

export async function deleteSession(ctx: Ctx, token: string): Promise<void> {
  await ctx.prisma.session.deleteMany({
    where: { tokenHash: hashToken(ctx.sessionSecret, token) },
  });
}
