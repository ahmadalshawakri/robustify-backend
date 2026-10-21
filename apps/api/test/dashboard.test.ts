import { beforeEach, describe, expect, it } from "vitest";
import { makeUser, newOrder, prisma, resetDb, signIn, testApp } from "./helpers/setup";

describe("dashboard and utilization", () => {
  const app = testApp();

  beforeEach(async () => {
    await resetDb();
    await makeUser("ADMIN", "ADMINISTRATION", "layla.mansour");
  });

  it("counts orders by status and averages utilization over all employees", async () => {
    const designer = await makeUser("EMPLOYEE", "DESIGN", "omar.haddad");
    await makeUser("EMPLOYEE", "DESIGN", "sara.nasser");
    const admin = await signIn(app, "layla.mansour");

    for (let i = 0; i < 3; i++) {
      const { id } = (await admin.post("/api/orders").send(newOrder)).body.order;
      if (i < 2) await admin.post(`/api/orders/${id}/advance`).send({ assigneeId: designer.id });
    }
    await prisma.order.updateMany({
      where: { status: "NOT_STARTED" },
      data: { deadline: new Date("2020-01-01") },
    });

    const utilization = await admin.get("/api/users/utilization");
    expect(utilization.body.employees).toEqual([
      expect.objectContaining({ username: "omar.haddad", openOrders: 2, utilization: 75 }),
      expect.objectContaining({ username: "sara.nasser", openOrders: 0, utilization: 0 }),
    ]);

    const dashboard = await admin.get("/api/dashboard");
    expect(dashboard.status).toBe(200);
    expect(dashboard.body.ordersByStatus).toMatchObject({
      NOT_STARTED: 1,
      DESIGN: 2,
      COMPLETED: 0,
    });
    expect(dashboard.body.overdueOrders).toBe(1);
    expect(dashboard.body.averageUtilization).toBe(37.5);
    expect(dashboard.body.lowStock.length).toBeGreaterThan(0);
  });

  it("does not count work an employee left behind in another stage", async () => {
    const designer = await makeUser("EMPLOYEE", "DESIGN", "omar.haddad");
    const admin = await signIn(app, "layla.mansour");
    const { id } = (await admin.post("/api/orders").send(newOrder)).body.order;
    await admin.post(`/api/orders/${id}/advance`).send({ assigneeId: designer.id });
    // Moved on to montage with nobody assigned: the designer is free again.
    await admin.post(`/api/orders/${id}/advance`).send({});

    const utilization = await admin.get("/api/users/utilization");
    expect(utilization.body.employees[0]).toMatchObject({ openOrders: 0, utilization: 0 });
  });
});
