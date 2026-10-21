import { describe, expect, it } from "vitest";
import { createPurchaseSchema, createUserSchema } from "./schemas";

const supplier = {
  name: "Gulf Paper Co.",
  email: "sales@gulfpaper.example",
  phone: "+971 4 555 0100",
  location: "Dubai",
};

describe("createUserSchema", () => {
  it("normalises username and email", () => {
    const user = createUserSchema.parse({
      username: " Sara.Haddad ",
      email: "Sara.Haddad@Example.com",
      password: "long-enough",
      role: "EMPLOYEE",
      department: "DESIGN",
    });
    expect(user.username).toBe("sara.haddad");
    expect(user.email).toBe("sara.haddad@example.com");
  });

  it("rejects usernames outside firstname.lastname", () => {
    const result = createUserSchema.safeParse({
      username: "sara",
      email: "sara@example.com",
      password: "long-enough",
      role: "EMPLOYEE",
      department: "DESIGN",
    });
    expect(result.success).toBe(false);
  });
});

describe("createPurchaseSchema", () => {
  const base = {
    supplier,
    category: "INK",
    materialType: "CYAN",
    quantity: "10",
    cost: "250.50",
    purchaseDate: "2026-10-01",
    expectedArrival: "2026-10-08",
  };

  it("accepts a valid purchase and coerces form strings", () => {
    const purchase = createPurchaseSchema.parse(base);
    expect(purchase.quantity).toBe(10);
    expect(purchase.cost).toBe(250.5);
  });

  it("rejects a material type from another category", () => {
    const result = createPurchaseSchema.safeParse({ ...base, materialType: "PPW_WHITE" });
    expect(result.success).toBe(false);
  });

  it("rejects an arrival before the purchase date", () => {
    const result = createPurchaseSchema.safeParse({ ...base, expectedArrival: "2026-09-01" });
    expect(result.success).toBe(false);
  });
});
