import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { makeUser, prisma, resetDb, signIn, testApp } from "./helpers/setup";

describe("users", () => {
  const app = testApp();
  let adminId: number;

  beforeEach(async () => {
    await resetDb();
    adminId = (await makeUser("ADMIN", "ADMINISTRATION", "layla.mansour")).id;
    await makeUser("EMPLOYEE", "DESIGN", "omar.haddad");
  });

  it("lets an admin create, list, update and delete users", async () => {
    const admin = await signIn(app, "layla.mansour");

    const created = await admin.post("/api/users").send({
      username: "sara.nasser",
      email: "sara.nasser@robustify.test",
      password: "long-password",
      role: "EMPLOYEE",
      department: "PRINTING",
    });
    expect(created.status).toBe(201);
    const id = created.body.user.id;

    const designers = await admin.get("/api/users?department=DESIGN");
    expect(designers.body.users.map((u: { username: string }) => u.username)).toEqual([
      "omar.haddad",
    ]);

    const updated = await admin.patch(`/api/users/${id}`).send({ department: "CUTTING" });
    expect(updated.body.user.department).toBe("CUTTING");

    expect((await admin.delete(`/api/users/${id}`)).status).toBe(204);
    expect(await prisma.user.count({ where: { id } })).toBe(0);
  });

  it("reports a duplicate username as a conflict", async () => {
    const admin = await signIn(app, "layla.mansour");
    const res = await admin.post("/api/users").send({
      username: "omar.haddad",
      email: "other@robustify.test",
      password: "long-password",
      role: "EMPLOYEE",
      department: "DESIGN",
    });
    expect(res.status).toBe(409);
  });

  it("returns field errors for invalid input", async () => {
    const admin = await signIn(app, "layla.mansour");
    const res = await admin.post("/api/users").send({ username: "bad", role: "BOSS" });
    expect(res.status).toBe(400);
    const paths = res.body.error.details.map((d: { path: string }) => d.path);
    expect(paths).toEqual(expect.arrayContaining(["username", "email", "password", "role"]));
  });

  it("stops admins from deleting or demoting themselves", async () => {
    const admin = await signIn(app, "layla.mansour");
    expect((await admin.delete(`/api/users/${adminId}`)).status).toBe(409);
    expect((await admin.patch(`/api/users/${adminId}`).send({ role: "EMPLOYEE" })).status).toBe(
      409,
    );
  });

  it("signs a user out everywhere when their password changes", async () => {
    const employee = await signIn(app, "omar.haddad");
    const admin = await signIn(app, "layla.mansour");
    const omar = await prisma.user.findUniqueOrThrow({ where: { username: "omar.haddad" } });
    await admin.patch(`/api/users/${omar.id}`).send({ password: "brand-new-password" });
    expect((await employee.get("/api/auth/me")).status).toBe(401);
  });

  it("is admin-only", async () => {
    const employee = await signIn(app, "omar.haddad");
    expect((await employee.get("/api/users")).status).toBe(403);
    expect((await request(app).get("/api/users")).status).toBe(401);
  });
});
