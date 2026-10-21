import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { PASSWORD, makeUser, prisma, resetDb, signIn, testApp } from "./helpers/setup";

describe("auth", () => {
  const app = testApp();

  beforeEach(async () => {
    await resetDb();
    await makeUser("ADMIN", "ADMINISTRATION", "layla.mansour");
  });

  it("signs in with an httpOnly, SameSite=Strict cookie and no token in the body", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "Layla.Mansour", password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ username: "layla.mansour", role: "ADMIN" });
    expect(res.body.user.passwordHash).toBeUndefined();
    const cookie = String(res.headers["set-cookie"]);
    expect(cookie).toMatch(/robustify_session=/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Strict/);
  });

  it("rejects a wrong password and an unknown user with the same message", async () => {
    const wrong = await request(app)
      .post("/api/auth/login")
      .send({ username: "layla.mansour", password: "nope" });
    const unknown = await request(app)
      .post("/api/auth/login")
      .send({ username: "nobody.here", password: "nope" });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.error.message).toBe(unknown.body.error.message);
  });

  it("returns the current user, then forgets them after logout", async () => {
    const agent = await signIn(app, "layla.mansour");
    expect((await agent.get("/api/auth/me")).body.user.username).toBe("layla.mansour");

    expect((await agent.post("/api/auth/logout")).status).toBe(204);
    expect((await agent.get("/api/auth/me")).status).toBe(401);
    expect(await prisma.session.count()).toBe(0);
  });

  it("ignores expired sessions", async () => {
    const agent = await signIn(app, "layla.mansour");
    await prisma.session.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    expect((await agent.get("/api/auth/me")).status).toBe(401);
  });

  it("rate-limits repeated sign-in attempts", async () => {
    const limited = testApp({ loginAttempts: 2 });
    const attempt = () =>
      request(limited).post("/api/auth/login").send({ username: "layla.mansour", password: "x" });
    await attempt();
    await attempt();
    const third = await attempt();
    expect(third.status).toBe(429);
    expect(third.body.error.code).toBe("rate_limited");
  });

  it("protects the API without a session", async () => {
    expect((await request(app).get("/api/orders")).status).toBe(401);
    expect((await request(app).get("/api/dashboard")).status).toBe(401);
  });
});
