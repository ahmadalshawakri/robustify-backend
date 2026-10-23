import { describe, expect, it } from "vitest";
import { invoiceTotals, monthKey, recentMonths, suggestedPrice } from "./billing";
import { poorQualityRatio } from "./quality";

describe("billing", () => {
  it("adds tax and rounds to cents", () => {
    expect(invoiceTotals(100)).toEqual({ subtotal: 100, tax: 16, total: 116 });
    expect(invoiceTotals(10.555)).toEqual({ subtotal: 10.56, tax: 1.69, total: 12.25 });
    expect(suggestedPrice(100)).toBe(145);
  });

  it("lists recent months oldest first, across a year boundary", () => {
    expect(recentMonths(3, new Date("2026-01-20T12:00:00Z"))).toEqual([
      "2025-11",
      "2025-12",
      "2026-01",
    ]);
    expect(monthKey(new Date("2026-10-31T23:00:00Z"))).toBe("2026-10");
  });
});

describe("cost of quality", () => {
  it("is the share spent on poor quality", () => {
    expect(poorQualityRatio(300, 100)).toBe(0.25);
    expect(poorQualityRatio(0, 0)).toBe(0);
  });
});
