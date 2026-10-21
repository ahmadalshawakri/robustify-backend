import type {
  ComplaintStatus,
  Department,
  MaterialCategory,
  OrderStatus,
  PurchaseStatus,
  QualityCostCategory,
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
  openComplaints: number;
  uninvoicedOrders: number;
  revenueThisMonth: number;
}

export interface Complaint {
  id: number;
  defect: string;
  comment: string | null;
  cost: number | null;
  status: ComplaintStatus;
  createdAt: string;
  resolvedAt: string | null;
  order: { id: number; status: OrderStatus; paperType: string; quantity: number };
  customer: { id: number; name: string };
  responsible: { id: number; username: string; department: Department } | null;
}

export interface Invoice {
  id: number;
  number: string;
  subtotal: number;
  tax: number;
  total: number;
  issuedAt: string;
  order: { id: number; customer: { id: number; name: string } };
}

export interface InvoiceDetail extends Omit<Invoice, "order"> {
  order: Omit<OrderSummary, "customer" | "assignee" | "paperLabel" | "stageOwner"> & {
    customer: Contact;
  };
}

export interface SalesReport {
  months: { month: string; invoices: number; subtotal: number; total: number }[];
  totalRevenue: number;
  invoiceCount: number;
  topCustomers: { id: number; name: string; invoices: number; total: number }[];
  uninvoicedOrders: number;
}

export interface QualityEntry {
  id: number;
  month: string;
  category: QualityCostCategory;
  kind: "GOOD" | "POOR";
  amount: number;
  note: string | null;
}

export interface QualityReport {
  months: { month: string; good: number; poor: number; complaints: number; poorRatio: number }[];
  totals: { good: number; poor: number; poorRatio: number };
  entries: QualityEntry[];
}
