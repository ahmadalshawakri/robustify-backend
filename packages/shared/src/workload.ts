import type { Department } from "./enums";

/** Minutes in one working day. Utilization is open work as a share of one day. */
export const WORKDAY_MINUTES = 480;

/**
 * Estimated minutes an order takes in each department. Design, montage and
 * delivery take a fixed time per order (from the original system); printing
 * and cutting scale with the paper the job consumes.
 */
const MINUTES: Partial<Record<Department, (consumptionM: number) => number>> = {
  DESIGN: () => 180,
  MONTAGE: () => 20,
  PRINTING: (m) => 15 + m / 50,
  CUTTING: (m) => 10 + m / 100,
  PACKAGING: () => 30,
  DELIVERY: () => 40,
};

export function estimatedMinutes(department: Department, consumptionM: number): number {
  return MINUTES[department]?.(consumptionM) ?? 0;
}

/** Percentage of a working day the given open orders represent. Above 100 means overloaded. */
export function utilization(department: Department, openOrderConsumptions: number[]): number {
  const minutes = openOrderConsumptions.reduce(
    (sum, m) => sum + estimatedMinutes(department, m),
    0,
  );
  return Math.round((minutes / WORKDAY_MINUTES) * 1000) / 10;
}
