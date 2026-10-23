import { monthKey } from "@robustify/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { makeOrder, makeUser, resetDb, signIn, testApp } from "./helpers/setup";

describe("cost of quality", () => {
  const app = testApp();
  const thisMonth = monthKey(new Date());

  beforeEach(async () => {
    await resetDb();
    await makeUser("ADMIN", "ADMINISTRATION", "layla.mansour");
  });

  it("stores costs per month and counts complaint costs as poor quality", async () => {
    const admin = await signIn(app, "layla.mansour");
    const training = await admin
      .post("/api/quality-costs")
      .send({ month: thisMonth, category: "TRAINING", amount: 300, note: "Colour management" });
    expect(training.status).toBe(201);
    expect(training.body.entry).toMatchObject({ month: thisMonth, kind: "GOOD", amount: 300 });
    await admin
      .post("/api/quality-costs")
      .send({ month: thisMonth, category: "REWORK", amount: 50 });

    const order = await makeOrder("COMPLETED");
    await admin.post("/api/complaints").send({ orderId: order.id, defect: "Smudged", cost: 50 });

    const report = (await admin.get("/api/quality-costs?months=2")).body;
    expect(report.months).toHaveLength(2);
    expect(report.months.at(-1)).toEqual({
      month: thisMonth,
      good: 300,
      poor: 100,
      complaints: 50,
      poorRatio: 0.25,
    });
    expect(report.totals).toEqual({ good: 300, poor: 100, poorRatio: 0.25 });
    expect(report.entries).toHaveLength(2);

    expect((await admin.delete(`/api/quality-costs/${training.body.entry.id}`)).status).toBe(204);
    expect((await admin.delete(`/api/quality-costs/${training.body.entry.id}`)).status).toBe(404);
  });

  it("validates the month and category", async () => {
    const admin = await signIn(app, "layla.mansour");
    const res = await admin
      .post("/api/quality-costs")
      .send({ month: "2026-13", category: "LUCK", amount: 0 });
    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d: { path: string }) => d.path).sort()).toEqual([
      "amount",
      "category",
      "month",
    ]);
  });
});
