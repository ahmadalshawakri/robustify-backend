import pino from "pino";
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { demoIsStale, resetDemoIfStale } from "../src/demo/reset";
import { makeUser, prisma, resetDb, signIn, testApp } from "./helpers/setup";

const silent = pino({ level: "silent" });

describe("demo mode", () => {
  beforeEach(resetDb);

  it("is off by default: no accounts offered, no one-click sign-in", async () => {
    const app = testApp();
    await makeUser("ADMIN", "ADMINISTRATION", "layla.mansour");
    expect((await request(app).get("/api/auth/demo")).body).toEqual({
      enabled: false,
      accounts: [],
    });
    const res = await request(app).post("/api/auth/demo").send({ username: "layla.mansour" });
    expect(res.status).toBe(404);
  });

  it("signs in to the demo accounts only, without a password", async () => {
    const app = testApp({ demo: true });
    await makeUser("ADMIN", "ADMINISTRATION", "layla.mansour");
    await makeUser("EMPLOYEE", "PRINTING", "rami.issa");

    const offered = (await request(app).get("/api/auth/demo")).body;
    expect(offered.enabled).toBe(true);
    expect(offered.accounts.map((a: { username: string }) => a.username)).toContain(
      "layla.mansour",
    );

    const agent = request.agent(app);
    const ok = await agent.post("/api/auth/demo").send({ username: "layla.mansour" });
    expect(ok.status).toBe(200);
    expect((await agent.get("/api/auth/me")).body.user.username).toBe("layla.mansour");

    const notOffered = await request(app).post("/api/auth/demo").send({ username: "rami.issa" });
    expect(notOffered.status).toBe(400);
  });

  it("protects the demo accounts and passwords", async () => {
    const app = testApp({ demo: true });
    await makeUser("ADMIN", "ADMINISTRATION", "layla.mansour");
    const printer = await makeUser("EMPLOYEE", "PRINTING", "yousef.ali");
    const other = await makeUser("EMPLOYEE", "CUTTING", "hana.farouk");
    const admin = await signIn(app, "layla.mansour");

    expect(
      (await admin.patch(`/api/users/${other.id}`).send({ password: "newpassword" })).status,
    ).toBe(403);
    expect(
      (await admin.patch(`/api/users/${printer.id}`).send({ department: "CUTTING" })).status,
    ).toBe(403);
    expect((await admin.delete(`/api/users/${printer.id}`)).status).toBe(403);
    // Everyone else can still be managed.
    expect(
      (await admin.patch(`/api/users/${other.id}`).send({ department: "PACKAGING" })).status,
    ).toBe(200);
    expect((await admin.delete(`/api/users/${other.id}`)).status).toBe(204);
  });

  it("reseeds once a day", async () => {
    expect(await demoIsStale(prisma)).toBe(true);
    expect(await resetDemoIfStale(prisma, "demo-password", silent, { bcryptRounds: 4 })).toBe(true);
    expect(await prisma.order.count()).toBeGreaterThan(20);

    // Fresh today: nothing to do.
    expect(await resetDemoIfStale(prisma, "demo-password", silent, { bcryptRounds: 4 })).toBe(
      false,
    );

    // Seeded yesterday, and a visitor deleted everything: the next check restores it.
    await prisma.user.updateMany({
      data: { createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000) },
    });
    await prisma.order.deleteMany({ where: { status: "NOT_STARTED" } });
    expect(await resetDemoIfStale(prisma, "demo-password", silent, { bcryptRounds: 4 })).toBe(true);
    expect(await prisma.order.count({ where: { status: "NOT_STARTED" } })).toBeGreaterThan(0);
  });
});
