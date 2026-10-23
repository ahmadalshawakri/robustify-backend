import { beforeEach, describe, expect, it } from "vitest";
import { makeOrder, makeUser, prisma, resetDb, signIn, testApp } from "./helpers/setup";

describe("invoices", () => {
  const app = testApp();

  beforeEach(async () => {
    await resetDb();
    await makeUser("ADMIN", "ADMINISTRATION", "layla.mansour");
  });

  it("invoices a completed order once, numbering by year and adding tax", async () => {
    const first = await makeOrder("COMPLETED");
    const second = await makeOrder("COMPLETED");
    const admin = await signIn(app, "layla.mansour");
    const year = new Date().getUTCFullYear();

    const a = await admin.post("/api/invoices").send({ orderId: first.id, subtotal: 100 });
    expect(a.status).toBe(201);
    expect(a.body.invoice).toMatchObject({
      number: `INV-${year}-0001`,
      subtotal: 100,
      tax: 16,
      total: 116,
    });
    const b = await admin.post("/api/invoices").send({ orderId: second.id, subtotal: 50.5 });
    expect(b.body.invoice.number).toBe(`INV-${year}-0002`);

    const again = await admin.post("/api/invoices").send({ orderId: first.id, subtotal: 100 });
    expect(again.status).toBe(409);
    expect(again.body.error.message).toContain(`INV-${year}-0001`);

    const detail = await admin.get(`/api/invoices/${a.body.invoice.id}`);
    expect(detail.body.invoice.order.customer).toMatchObject({ name: "Al Noor Bakery" });
    expect((await admin.get("/api/invoices")).body.invoices).toHaveLength(2);
  });

  it("refuses unfinished orders and employees", async () => {
    await makeUser("EMPLOYEE", "PRINTING", "yousef.ali");
    const order = await makeOrder("PACKAGING");
    const admin = await signIn(app, "layla.mansour");
    expect(
      (await admin.post("/api/invoices").send({ orderId: order.id, subtotal: 10 })).status,
    ).toBe(409);
    expect((await (await signIn(app, "yousef.ali")).get("/api/invoices")).status).toBe(403);
  });

  it("reports monthly revenue, top customers and what is left to invoice", async () => {
    const admin = await signIn(app, "layla.mansour");
    const invoiced = await makeOrder("COMPLETED");
    await makeOrder("COMPLETED");
    await admin.post("/api/invoices").send({ orderId: invoiced.id, subtotal: 200 });
    // An invoice from long ago falls outside the report.
    const old = await makeOrder("COMPLETED");
    await prisma.invoice.create({
      data: {
        orderId: old.id,
        number: "INV-2001-0001",
        subtotal: 1,
        tax: 0,
        total: 1,
        issuedAt: new Date("2001-05-01"),
      },
    });

    const report = (await admin.get("/api/invoices/sales-report?months=3")).body;
    expect(report.months).toHaveLength(3);
    expect(report.months.at(-1)).toMatchObject({ invoices: 1, subtotal: 200, total: 232 });
    expect(report.totalRevenue).toBe(232);
    expect(report.topCustomers).toEqual([
      expect.objectContaining({ name: "Al Noor Bakery", invoices: 1, total: 232 }),
    ]);
    expect(report.uninvoicedOrders).toBe(1);

    const dashboard = (await admin.get("/api/dashboard")).body;
    expect(dashboard).toMatchObject({
      revenueThisMonth: 232,
      uninvoicedOrders: 1,
      openComplaints: 0,
    });
  });
});
