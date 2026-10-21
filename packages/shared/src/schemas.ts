import { z } from "zod";
import { MATERIAL_CATEGORIES, PAPER_TYPES, materialTypes } from "./catalog";
import { DEPARTMENTS, ORDER_STATUSES, PURCHASE_STATUSES, ROLES } from "./enums";

const id = z.coerce.number().int().positive();
const money = z.coerce.number().nonnegative();
const positiveInt = z.coerce.number().int().positive();

export const loginSchema = z.object({
  username: z.string().trim().toLowerCase().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const createUserSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z]+\.[a-z]+$/, "Use the format firstname.lastname"),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8, "At least 8 characters"),
  role: z.enum(ROLES),
  department: z.enum(DEPARTMENTS),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

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

export const createOrderSchema = z.object({
  customer: contactSchema,
  paperType: z.enum(PAPER_TYPES as [string, ...string[]]),
  quantity: positiveInt,
  widthMm: z.coerce.number().positive(),
  heightMm: z.coerce.number().positive(),
  deadline: z.coerce.date().optional(),
  consumption: positiveInt,
  cost: money,
  assigneeId: id.optional(),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateOrderSchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  assigneeId: id.nullable().optional(),
});
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;

export const createPurchaseSchema = z
  .object({
    supplier: contactSchema,
    category: z.enum(MATERIAL_CATEGORIES as [string, ...string[]]),
    materialType: z.string(),
    quantity: positiveInt,
    cost: money,
    purchaseDate: z.coerce.date(),
    expectedArrival: z.coerce.date(),
  })
  .refine(
    (p) =>
      materialTypes(p.category as (typeof MATERIAL_CATEGORIES)[number]).includes(p.materialType),
    { path: ["materialType"], message: "Not a type of this material" },
  )
  .refine((p) => p.expectedArrival >= p.purchaseDate, {
    path: ["expectedArrival"],
    message: "Arrival cannot be before the purchase date",
  });
export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;

export const updatePurchaseSchema = z.object({
  status: z.enum(PURCHASE_STATUSES),
  quantityReceived: positiveInt.optional(),
});
export type UpdatePurchaseInput = z.infer<typeof updatePurchaseSchema>;
