import type {
  ComplaintStatus,
  Department,
  MaterialCategory,
  OrderStatus,
  PurchaseStatus,
  Role,
} from "@robustify/shared";

// Shapes returned by the API. Dates arrive as ISO strings.

export interface User {
  id: number;
  username: string;
  email: string;
  role: Role;
  department: Department;
}

export interface Contact {
  id: number;
  name: string;
  email: string;
  phone: string;
  location: string;
}

export interface OrderSummary {
  id: number;
  status: OrderStatus;
  paperType: string;
  paperLabel: string;
  quantity: number;
  widthMm: number;
  heightMm: number;
  deadline: string | null;
  consumption: number;
  cost: number;
  createdAt: string;
  stageOwner: Department | null;
  customer: { id: number; name: string };
  assignee: { id: number; username: string; department: Department } | null;
}

export interface OrderEvent {
  id: number;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  createdAt: string;
  actor: { id: number; username: string } | null;
}

export interface OrderDetail extends Omit<OrderSummary, "customer"> {
  customer: Contact;
  events: OrderEvent[];
  invoice: { id: number; number: string; total: number; issuedAt: string } | null;
  complaints: { id: number; defect: string; status: ComplaintStatus; createdAt: string }[];
}

export interface Purchase {
  id: number;
  category: MaterialCategory;
  materialType: string;
  materialLabel: string;
  unit: string;
  packSize: number;
  quantity: number;
  quantityReceived: number;
  cost: number;
  purchaseDate: string;
  expectedArrival: string;
  bookedAt: string | null;
  status: PurchaseStatus;
  supplier: { id: number; name: string; email: string; phone: string };
}

export interface InventoryItem {
  category: MaterialCategory;
  materialType: string;
  label: string;
  unit: string;
  packSize: number;
  quantity: number;
  packs: number;
  incomingPacks: number;
  location: string | null;
  low: boolean;
}

export interface EmployeeUtilization {
  id: number;
  username: string;
  department: Department;
  openOrders: number;
  utilization: number;
}

export interface Dashboard {
  ordersByStatus: Record<OrderStatus, number>;
  overdueOrders: number;
  averageUtilization: number;
  lowStock: { label: string; quantity: number; unit: string }[];
  openPurchases: number;
}
