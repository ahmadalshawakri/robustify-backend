import { $Enums } from "@prisma/client";
import {
  COMPLAINT_STATUSES,
  CONTACT_TYPES,
  DEPARTMENTS,
  MATERIAL_CATEGORIES,
  ORDER_STATUSES,
  PURCHASE_STATUSES,
  QUALITY_COST_CATEGORIES,
  ROLES,
} from "@robustify/shared";
import { describe, expect, it } from "vitest";

// The database enums and the shared constants must list the same values in the same order.
describe("Prisma enums match @robustify/shared", () => {
  it.each([
    ["Role", $Enums.Role, ROLES],
    ["Department", $Enums.Department, DEPARTMENTS],
    ["OrderStatus", $Enums.OrderStatus, ORDER_STATUSES],
    ["ContactType", $Enums.ContactType, CONTACT_TYPES],
    ["PurchaseStatus", $Enums.PurchaseStatus, PURCHASE_STATUSES],
    ["ComplaintStatus", $Enums.ComplaintStatus, COMPLAINT_STATUSES],
    ["MaterialCategory", $Enums.MaterialCategory, MATERIAL_CATEGORIES],
    ["QualityCostCategory", $Enums.QualityCostCategory, QUALITY_COST_CATEGORIES],
  ])("%s", (_name, prismaEnum, shared) => {
    expect(Object.values(prismaEnum)).toEqual([...shared]);
  });
});
