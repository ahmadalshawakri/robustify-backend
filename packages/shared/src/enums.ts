// Every list here is mirrored by an enum in apps/api/prisma/schema.prisma.
// apps/api/test/enums.test.ts fails if the two drift apart.

export const ROLES = ["ADMIN", "EMPLOYEE"] as const;
export type Role = (typeof ROLES)[number];

export const DEPARTMENTS = [
  "ADMINISTRATION",
  "DESIGN",
  "MONTAGE",
  "PRINTING",
  "CUTTING",
  "PACKAGING",
  "DELIVERY",
] as const;
export type Department = (typeof DEPARTMENTS)[number];

export const ORDER_STATUSES = [
  "NOT_STARTED",
  "DESIGN",
  "MONTAGE",
  "PRINTING",
  "CUTTING",
  "PACKAGING",
  "IN_TRANSIT",
  "COMPLETED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const CONTACT_TYPES = ["CUSTOMER", "SUPPLIER"] as const;
export type ContactType = (typeof CONTACT_TYPES)[number];

export const PURCHASE_STATUSES = ["UPCOMING", "BOOKED", "PARTIAL", "CANCELED"] as const;
export type PurchaseStatus = (typeof PURCHASE_STATUSES)[number];

export const COMPLAINT_STATUSES = ["OPEN", "RESOLVED"] as const;
export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number];

/** What money was spent on: preventing defects (good) or paying for them (poor). */
export const QUALITY_COST_CATEGORIES = [
  "MAINTENANCE",
  "TRAINING",
  "EQUIPMENT",
  "INSPECTION",
  "DEFECT",
  "REWORK",
  "LOST_CUSTOMER",
] as const;
export type QualityCostCategory = (typeof QUALITY_COST_CATEGORIES)[number];

export const LABELS = {
  role: { ADMIN: "Admin", EMPLOYEE: "Employee" },
  department: {
    ADMINISTRATION: "Administration",
    DESIGN: "Design",
    MONTAGE: "Montage",
    PRINTING: "Printing",
    CUTTING: "Cutting",
    PACKAGING: "Packaging",
    DELIVERY: "Delivery",
  },
  orderStatus: {
    NOT_STARTED: "Not started",
    DESIGN: "Design",
    MONTAGE: "Montage",
    PRINTING: "Printing",
    CUTTING: "Cutting",
    PACKAGING: "Packaging",
    IN_TRANSIT: "In transit",
    COMPLETED: "Completed",
  },
  contactType: { CUSTOMER: "Customer", SUPPLIER: "Supplier" },
  purchaseStatus: {
    UPCOMING: "Upcoming",
    BOOKED: "Booked",
    PARTIAL: "Partially booked",
    CANCELED: "Canceled",
  },
  complaintStatus: { OPEN: "Open", RESOLVED: "Resolved" },
  qualityCostCategory: {
    MAINTENANCE: "Maintenance",
    TRAINING: "Training",
    EQUIPMENT: "New equipment",
    INSPECTION: "Inspection",
    DEFECT: "Defects and scrap",
    REWORK: "Rework",
    LOST_CUSTOMER: "Lost customer",
  },
} as const satisfies {
  role: Record<Role, string>;
  department: Record<Department, string>;
  orderStatus: Record<OrderStatus, string>;
  contactType: Record<ContactType, string>;
  purchaseStatus: Record<PurchaseStatus, string>;
  complaintStatus: Record<ComplaintStatus, string>;
  qualityCostCategory: Record<QualityCostCategory, string>;
};
