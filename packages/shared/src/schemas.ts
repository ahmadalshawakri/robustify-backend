import { z } from "zod";
import { MATERIAL_CATEGORIES, PAPER_TYPES, materialTypes } from "./catalog";
import { CONTACT_TYPES, DEPARTMENTS, ORDER_STATUSES, PURCHASE_STATUSES, ROLES } from "./enums";

const id = z.coerce.number().int().positive();
const money = z.coerce.number().nonnegative();
const positiveInt = z.coerce.number().int().positive();
const booleanFlag = z.enum(["true", "false"]).transform((v) => v === "true");

export const idParamSchema = z.object({ id });

export const loginSchema = z.object({
  username: z.string().trim().toLowerCase().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

const username = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z]+\.[a-z]+$/, "Use the format firstname.lastname");
const password = z.string().min(8, "At least 8 characters");

export const createUserSchema = z.object({
  username,
  email: z.email().trim().toLowerCase(),
  password,
  role: z.enum(ROLES),
  department: z.enum(DEPARTMENTS),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z
  .object({
    email: z.email().trim().toLowerCase(),
    password,
    role: z.enum(ROLES),
    department: z.enum(DEPARTMENTS),
  })
  .partial();
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const listUsersQuerySchema = z.object({
  role: z.enum(ROLES).optional(),
  department: z.enum(DEPARTMENTS).optional(),
});

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.email().trim().toLowerCase(),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{6,20}$/, "Enter a valid phone number"),
  location: z.string().trim().min(1, "Address is required"),
});
export type ContactInput = z.infer<typeof contactSchema>;

export const listContactsQuerySchema = z.object({
  type: z.enum(CONTACT_TYPES).optional(),
  q: z.string().trim().min(1).optional(),
});

export const createOrderSchema = z.object({
  customer: contactSchema,
  paperType: z.enum(PAPER_TYPES),
  quantity: positiveInt,
  widthMm: z.coerce.number().positive(),
  heightMm: z.coerce.number().positive(),
  deadline: z.coerce.date().optional(),
  /** Metres of paper the job uses. */
  consumption: positiveInt,
  cost: money,
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const listOrdersQuerySchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  assigneeId: id.optional(),
  /** Employees: only orders assigned to me. */
  mine: booleanFlag.optional(),
});

/** Move an order to its next stage, optionally handing it to someone in that stage's department. */
export const advanceOrderSchema = z.object({
  assigneeId: id.optional(),
});
export type AdvanceOrderInput = z.infer<typeof advanceOrderSchema>;

export const assignOrderSchema = z.object({
  assigneeId: id.nullable(),
});
export type AssignOrderInput = z.infer<typeof assignOrderSchema>;

export const createPurchaseSchema = z
  .object({
    supplier: contactSchema,
    category: z.enum(MATERIAL_CATEGORIES),
    materialType: z.string(),
    /** Number of packs ordered. */
    quantity: positiveInt,
    cost: money,
    purchaseDate: z.coerce.date(),
    expectedArrival: z.coerce.date(),
  })
  .refine((p) => materialTypes(p.category).includes(p.materialType), {
    path: ["materialType"],
    message: "Not a type of this material",
  })
  .refine((p) => p.expectedArrival >= p.purchaseDate, {
    path: ["expectedArrival"],
    message: "Arrival cannot be before the purchase date",
  });
export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;

export const listPurchasesQuerySchema = z.object({
  status: z.enum(PURCHASE_STATUSES).optional(),
});

/** Book packs into stock as they arrive. */
export const receivePurchaseSchema = z.object({
  quantity: positiveInt,
});
export type ReceivePurchaseInput = z.infer<typeof receivePurchaseSchema>;
