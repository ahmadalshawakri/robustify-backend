import type { Department, OrderStatus } from "./enums";

/**
 * An order moves through the press one stage at a time. Each active stage is
 * owned by the department that does that work.
 */
export const STAGE_OWNER: Partial<Record<OrderStatus, Department>> = {
  DESIGN: "DESIGN",
  MONTAGE: "MONTAGE",
  PRINTING: "PRINTING",
  CUTTING: "CUTTING",
  PACKAGING: "PACKAGING",
  IN_TRANSIT: "DELIVERY",
};

const FLOW: readonly OrderStatus[] = [
  "NOT_STARTED",
  "DESIGN",
  "MONTAGE",
  "PRINTING",
  "CUTTING",
  "PACKAGING",
  "IN_TRANSIT",
  "COMPLETED",
];

/** The stage after `status`, or null once the order is completed. */
export function nextStatus(status: OrderStatus): OrderStatus | null {
  const index = FLOW.indexOf(status);
  return FLOW.at(index + 1) ?? null;
}

/** True while the order is somewhere on the shop floor. */
export function isInProduction(status: OrderStatus): boolean {
  return status !== "NOT_STARTED" && status !== "COMPLETED";
}
