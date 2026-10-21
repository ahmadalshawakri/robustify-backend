import { beforeEach, describe, expect, it } from "vitest";
import { makeOrder, makeUser, resetDb, signIn, testApp } from "./helpers/setup";

describe("complaints", () => {
  const app = testApp();

  beforeEach(async () => {
    await resetDb();
    await makeUser("ADMIN", "ADMINISTRATION", "layla.mansour");
  });

  it("logs a complaint on a shipped order and resolves it", async () => {
    const printer = await makeUser("EMPLOYEE", "PRINTING", "yousef.ali");
    const order = await makeOrder("COMPLETED");
    const admin = await signIn(app, "layla.mansour");

    const created = await admin.post("/api/complaints").send({
      orderId: order.id,
      defect: "Colour mismatch",
      responsibleId: printer.id,
      cost: 80,
      comment: "",
    });
    expect(created.status).toBe(201);
    expect(created.body.complaint).toMatchObject({
      status: "OPEN",
      cost: 80,
      comment: null,
      customer: { name: "Al Noor Bakery" },
      responsible: { username: "yousef.ali" },
    });

    const resolved = await admin
      .patch(`/api/complaints/${created.body.complaint.id}`)
      .send({ status: "RESOLVED", comment: "Reprinted" });
    expect(resolved.body.complaint).toMatchObject({ status: "RESOLVED", comment: "Reprinted" });
    expect(resolved.body.complaint.resolvedAt).not.toBeNull();

    const reopened = await admin
      .patch(`/api/complaints/${created.body.complaint.id}`)
      .send({ status: "OPEN" });
    expect(reopened.body.complaint.resolvedAt).toBeNull();
  });

  it("refuses complaints before an order ships, and non-employees as responsible", async () => {
    const admin = await signIn(app, "layla.mansour");
    const printing = await makeOrder("PRINTING");
    const done = await makeOrder("COMPLETED");

    const early = await admin.post("/api/complaints").send({ orderId: printing.id, defect: "x" });
    expect(early.status).toBe(409);

    const me = (await admin.get("/api/auth/me")).body.user;
    const adminResponsible = await admin
      .post("/api/complaints")
      .send({ orderId: done.id, defect: "x", responsibleId: me.id });
    expect(adminResponsible.status).toBe(400);
  });

  it("shows employees only the complaints they are responsible for", async () => {
    const printer = await makeUser("EMPLOYEE", "PRINTING", "yousef.ali");
    await makeUser("EMPLOYEE", "CUTTING", "hana.farouk");
    const order = await makeOrder("COMPLETED");
    const admin = await signIn(app, "layla.mansour");
    await admin
      .post("/api/complaints")
      .send({ orderId: order.id, defect: "Smudged", responsibleId: printer.id });
    await admin.post("/api/complaints").send({ orderId: order.id, defect: "No owner" });

    const mine = await (await signIn(app, "yousef.ali")).get("/api/complaints");
    expect(mine.body.complaints.map((c: { defect: string }) => c.defect)).toEqual(["Smudged"]);

    const cutter = await signIn(app, "hana.farouk");
    expect((await cutter.get("/api/complaints")).body.complaints).toEqual([]);
    expect(
      (await cutter.post("/api/complaints").send({ orderId: order.id, defect: "x" })).status,
    ).toBe(403);
  });
});
