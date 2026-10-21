import type { Prisma } from "@prisma/client";

/** Prisma returns DECIMAL columns as Decimal objects; the API speaks plain numbers. */
export function toNumber(value: Prisma.Decimal): number {
  return value.toNumber();
}
