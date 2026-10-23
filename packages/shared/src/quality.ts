import type { QualityCostCategory } from "./enums";

/**
 * Cost of quality splits spending into the cost of good quality (preventing
 * and catching defects) and the cost of poor quality (paying for them).
 */
export const QUALITY_KIND = {
  MAINTENANCE: "GOOD",
  TRAINING: "GOOD",
  EQUIPMENT: "GOOD",
  INSPECTION: "GOOD",
  DEFECT: "POOR",
  REWORK: "POOR",
  LOST_CUSTOMER: "POOR",
} as const satisfies Record<QualityCostCategory, "GOOD" | "POOR">;

export type QualityKind = (typeof QUALITY_KIND)[QualityCostCategory];

/** Share of quality spending that went on poor quality, 0 to 1. Lower is better. */
export function poorQualityRatio(good: number, poor: number): number {
  const total = good + poor;
  return total === 0 ? 0 : poor / total;
}
