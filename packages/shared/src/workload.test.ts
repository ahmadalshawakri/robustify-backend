import { describe, expect, it } from "vitest";
import { utilization } from "./workload";

describe("utilization", () => {
  it("is zero with no open work", () => {
    expect(utilization("DESIGN", [])).toBe(0);
  });

  it("counts fixed-time departments per order", () => {
    // Two designs at 180 minutes each = 360 of 480 minutes.
    expect(utilization("DESIGN", [1000, 5000])).toBe(75);
  });

  it("scales printing with paper consumed", () => {
    // 15 + 2400/50 = 63 minutes.
    expect(utilization("PRINTING", [2400])).toBe(13.1);
  });

  it("can exceed 100 when someone is overloaded", () => {
    expect(utilization("DESIGN", [1, 1, 1])).toBe(112.5);
  });
});
