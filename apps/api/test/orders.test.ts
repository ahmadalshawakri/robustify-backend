import { beforeEach, describe, expect, it } from "vitest";
import { makeUser, newOrder, prisma, resetDb, signIn, testApp } from "./helpers/setup";

describe("orders", () => {
  const app = testApp();
  const staff: Record<string, number> = {};

  beforeEach(async () => {
    await resetDb();
    await makeUser("ADMIN", "ADMINISTRATION", "layla.mansour");
    for (const [username, department] of [
      ["omar.haddad", "DESIGN"],
      ["khaled.saleh", "MONTAGE"],
      ["yousef.ali", "PRINTING"],
      ["hana.farouk", "CUTTING"],
    ] as const) {
      staff[username] = (await makeUser("EMPLOYEE", department, username)).id;
    }
    await prisma.inventoryItem.create({
      data: { category: "PAPER", materialType: "PPW_WHITE", quantity: 2200 },
    });
  });

  async function createOrder(overrides = {}) {
    const admin = await signIn(app, "layla.mansour");
    const res = await admin.post("/api/orders").send({ ...newOrder, ...overrides });
    expect(res.status).toBe(201);
    return { admin, id: res.body.order.id as number };
  }

  it("creates an order, reusing the customer by email", async () => {
    const { admin } = await createOrder();
    const second = await admin.post("/api/orders").send({
      ...newOrder,
      customer: { ...newOrder.customer, phone: "+962 6 555 0199" },
    });

    expect(second.body.order).toMatchObject({
      status: "NOT_STARTED",
      cost: 240.5,
      paperLabel: "PPW White",
    });
    const customers = await prisma.contact.findMany({ where: { type: "CUSTOMER" } });
    expect(customers).toHaveLength(1);
    expect(customers[0]?.phone).toBe("+962 6 555 0199");
  });

  it("walks an order through every stage, records history and consumes paper at printing", async () => {
    const { admin, id } = await createOrder();
    const advance = (agent: typeof admin, assigneeId?: number) =>
      agent.post(`/api/orders/${id}/advance`).send(assigneeId ? { assigneeId } : {});

    // Admin starts the job and hands it to design.
    let res = await advance(admin, staff["omar.haddad"]);
    expect(res.body.order).toMatchObject({ status: "DESIGN", stageOwner: "DESIGN" });

    // Each department moves it on.
    const designer = await signIn(app, "omar.haddad");
    res = await advance(designer, staff["khaled.saleh"]);
    expect(res.body.order.status).toBe("MONTAGE");

    const montage = await signIn(app, "khaled.saleh");
    res = await advance(montage, staff["yousef.ali"]);
    expect(res.body.order.status).toBe("PRINTING");
    const paper = await prisma.inventoryItem.findFirstOrThrow({ where: { category: "PAPER" } });
    expect(paper.quantity).toBe(2200 - 500);

    for (const expected of ["CUTTING", "PACKAGING", "IN_TRANSIT", "COMPLETED"]) {
      res = await advance(admin);
      expect(res.status).toBe(200);
      expect(res.body.order.status).toBe(expected);
    }

    expect(res.body.order.events.map((e: { toStatus: string }) => e.toStatus)).toEqual([
      "NOT_STARTED",
      "DESIGN",
      "MONTAGE",
      "PRINTING",
      "CUTTING",
      "PACKAGING",
      "IN_TRANSIT",
      "COMPLETED",
    ]);
    expect((await advance(admin)).status).toBe(409);
  });

  it("refuses to print without enough paper and leaves the order where it was", async () => {
    const { admin, id } = await createOrder({ consumption: 5000 });
    await admin.post(`/api/orders/${id}/advance`).send({});
    await admin.post(`/api/orders/${id}/advance`).send({});

    const res = await admin.post(`/api/orders/${id}/advance`).send({});
    expect(res.status).toBe(409);
    expect(res.body.error.message).toMatch(/Not enough PPW White/);
    const order = await prisma.order.findUniqueOrThrow({ where: { id } });
    expect(order.status).toBe("MONTAGE");
  });

  it("only assigns a stage to someone in the department that owns it", async () => {
    const { admin, id } = await createOrder();
    const wrong = await admin
      .post(`/api/orders/${id}/advance`)
      .send({ assigneeId: staff["yousef.ali"] });
    expect(wrong.status).toBe(400);

    await admin.post(`/api/orders/${id}/advance`).send({});
    const ok = await admin
      .post(`/api/orders/${id}/assign`)
      .send({ assigneeId: staff["omar.haddad"] });
    expect(ok.body.order.assignee.username).toBe("omar.haddad");
  });

  it("shows employees their own work and their department's queue, nothing else", async () => {
    const { admin, id: designOrder } = await createOrder();
    await admin.post(`/api/orders/${designOrder}/advance`).send({});
    const { id: waiting } = await createOrder();

    const designer = await signIn(app, "omar.haddad");
    const list = await designer.get("/api/orders");
    expect(list.body.orders.map((o: { id: number }) => o.id)).toEqual([designOrder]);
    expect((await designer.get(`/api/orders/${waiting}`)).status).toBe(404);

    const cutter = await signIn(app, "hana.farouk");
    expect((await cutter.post(`/api/orders/${designOrder}/advance`).send({})).status).toBe(404);
    expect((await cutter.post("/api/orders").send(newOrder)).status).toBe(403);
  });

  it("deletes only orders that have not started", async () => {
    const { admin, id } = await createOrder();
    const { id: started } = await createOrder();
    await admin.post(`/api/orders/${started}/advance`).send({});

    expect((await admin.delete(`/api/orders/${started}`)).status).toBe(409);
    expect((await admin.delete(`/api/orders/${id}`)).status).toBe(204);
    expect((await admin.delete(`/api/orders/${id}`)).status).toBe(404);
  });
});
