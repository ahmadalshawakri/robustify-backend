import { beforeEach, describe, expect, it } from "vitest";
import { makeUser, prisma, resetDb, signIn, supplier, testApp } from "./helpers/setup";

const purchase = {
  supplier,
  category: "INK",
  materialType: "CYAN",
  quantity: 4,
  cost: 960,
  purchaseDate: "2026-10-01",
  expectedArrival: "2026-10-10",
};

describe("purchases and inventory", () => {
  const app = testApp();

  beforeEach(async () => {
    await resetDb();
    await makeUser("ADMIN", "ADMINISTRATION", "layla.mansour");
    await makeUser("EMPLOYEE", "PRINTING", "yousef.ali");
  });

  it("books arriving packs into stock, partially then fully", async () => {
    const admin = await signIn(app, "layla.mansour");
    const created = await admin.post("/api/purchases").send(purchase);
    expect(created.status).toBe(201);
    expect(created.body.purchase).toMatchObject({ status: "UPCOMING", materialLabel: "Cyan Ink" });
    const id = created.body.purchase.id;

    let inventory = await admin.get("/api/inventory");
    const cyan = () =>
      inventory.body.items.find((i: { materialType: string }) => i.materialType === "CYAN");
    expect(cyan()).toMatchObject({ quantity: 0, incomingPacks: 4, low: true });

    const partial = await admin.post(`/api/purchases/${id}/receive`).send({ quantity: 1 });
    expect(partial.body.purchase).toMatchObject({ status: "PARTIAL", quantityReceived: 1 });

    expect((await admin.post(`/api/purchases/${id}/receive`).send({ quantity: 9 })).status).toBe(
      400,
    );

    const full = await admin.post(`/api/purchases/${id}/receive`).send({ quantity: 3 });
    expect(full.body.purchase.status).toBe("BOOKED");

    inventory = await admin.get("/api/inventory");
    expect(cyan()).toMatchObject({ quantity: 4 * 1200, packs: 4, incomingPacks: 0, low: false });
  });

  it("cancels only purchases with nothing received", async () => {
    const admin = await signIn(app, "layla.mansour");
    const a = (await admin.post("/api/purchases").send(purchase)).body.purchase.id;
    const b = (await admin.post("/api/purchases").send(purchase)).body.purchase.id;
    await admin.post(`/api/purchases/${b}/receive`).send({ quantity: 1 });

    expect((await admin.post(`/api/purchases/${a}/cancel`)).body.purchase.status).toBe("CANCELED");
    expect((await admin.post(`/api/purchases/${b}/cancel`)).status).toBe(409);
    expect((await admin.post(`/api/purchases/${a}/receive`).send({ quantity: 1 })).status).toBe(
      409,
    );
    expect(await prisma.contact.count({ where: { type: "SUPPLIER" } })).toBe(1);
  });

  it("validates the material against its category", async () => {
    const admin = await signIn(app, "layla.mansour");
    const res = await admin.post("/api/purchases").send({ ...purchase, materialType: "PPW_WHITE" });
    expect(res.status).toBe(400);
  });

  it("lets employees see stock but not purchasing", async () => {
    const printer = await signIn(app, "yousef.ali");
    expect((await printer.get("/api/inventory")).status).toBe(200);
    expect((await printer.get("/api/purchases")).status).toBe(403);
  });
});
