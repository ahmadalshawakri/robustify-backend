import type {
  ComplaintStatus,
  CreateComplaintInput,
  CreateInvoiceInput,
  CreateOrderInput,
  CreateQualityCostInput,
  CreatePurchaseInput,
  CreateUserInput,
  Department,
  OrderStatus,
  PurchaseStatus,
  Role,
  UpdateComplaintInput,
  UpdateUserInput,
} from "@robustify/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, query } from "./client";
import type {
  Complaint,
  Dashboard,
  DemoInfo,
  EmployeeUtilization,
  InventoryItem,
  Invoice,
  InvoiceDetail,
  OrderDetail,
  OrderSummary,
  Purchase,
  QualityReport,
  SalesReport,
  User,
} from "./types";

// Inputs leave forms as parsed shared-schema output; dates serialise to ISO strings.

export const useDashboard = () =>
  useQuery({ queryKey: ["dashboard"], queryFn: () => api<Dashboard>("/dashboard") });

export const useOrders = (filter: { status?: OrderStatus; mine?: boolean } = {}) =>
  useQuery({
    queryKey: ["orders", filter],
    queryFn: () => api<{ orders: OrderSummary[] }>(`/orders${query(filter)}`),
    select: (data) => data.orders,
  });

export const useOrder = (id: number) =>
  useQuery({
    queryKey: ["order", id],
    queryFn: () => api<{ order: OrderDetail }>(`/orders/${id}`),
    select: (data) => data.order,
  });

/** After any order change, everything derived from orders is stale. */
function useOrderInvalidation() {
  const client = useQueryClient();
  return () =>
    Promise.all(
      ["orders", "order", "dashboard", "utilization", "inventory"].map((key) =>
        client.invalidateQueries({ queryKey: [key] }),
      ),
    );
}

export function useCreateOrder() {
  const invalidate = useOrderInvalidation();
  return useMutation({
    mutationFn: (input: CreateOrderInput) =>
      api<{ order: OrderSummary }>("/orders", { method: "POST", body: input }),
    onSuccess: invalidate,
  });
}

export function useAdvanceOrder(id: number) {
  const invalidate = useOrderInvalidation();
  return useMutation({
    mutationFn: (assigneeId?: number) =>
      api<{ order: OrderDetail }>(`/orders/${id}/advance`, {
        method: "POST",
        body: assigneeId ? { assigneeId } : {},
      }),
    onSuccess: invalidate,
  });
}

export function useAssignOrder(id: number) {
  const invalidate = useOrderInvalidation();
  return useMutation({
    mutationFn: (assigneeId: number | null) =>
      api<{ order: OrderDetail }>(`/orders/${id}/assign`, {
        method: "POST",
        body: { assigneeId },
      }),
    onSuccess: invalidate,
  });
}

export function useDeleteOrder(id: number) {
  const invalidate = useOrderInvalidation();
  return useMutation({
    mutationFn: () => api<void>(`/orders/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}

export const usePurchases = (status?: PurchaseStatus) =>
  useQuery({
    queryKey: ["purchases", status ?? "all"],
    queryFn: () => api<{ purchases: Purchase[] }>(`/purchases${query({ status })}`),
    select: (data) => data.purchases,
  });

function usePurchaseInvalidation() {
  const client = useQueryClient();
  return () =>
    Promise.all(
      ["purchases", "inventory", "dashboard"].map((key) =>
        client.invalidateQueries({ queryKey: [key] }),
      ),
    );
}

export function useCreatePurchase() {
  const invalidate = usePurchaseInvalidation();
  return useMutation({
    mutationFn: (input: CreatePurchaseInput) =>
      api<{ purchase: Purchase }>("/purchases", { method: "POST", body: input }),
    onSuccess: invalidate,
  });
}

export function useReceivePurchase() {
  const invalidate = usePurchaseInvalidation();
  return useMutation({
    mutationFn: ({ id, quantity }: { id: number; quantity: number }) =>
      api<{ purchase: Purchase }>(`/purchases/${id}/receive`, {
        method: "POST",
        body: { quantity },
      }),
    onSuccess: invalidate,
  });
}

export function useCancelPurchase() {
  const invalidate = usePurchaseInvalidation();
  return useMutation({
    mutationFn: (id: number) =>
      api<{ purchase: Purchase }>(`/purchases/${id}/cancel`, { method: "POST" }),
    onSuccess: invalidate,
  });
}

export const useInventory = () =>
  useQuery({
    queryKey: ["inventory"],
    queryFn: () => api<{ items: InventoryItem[] }>("/inventory"),
    select: (data) => data.items,
  });

export const useUsers = (filter: { role?: Role; department?: Department } = {}, enabled = true) =>
  useQuery({
    queryKey: ["users", filter],
    queryFn: () => api<{ users: User[] }>(`/users${query(filter)}`),
    select: (data) => data.users,
    enabled,
  });

export const useUtilization = () =>
  useQuery({
    queryKey: ["utilization"],
    queryFn: () => api<{ employees: EmployeeUtilization[] }>("/users/utilization"),
    select: (data) => data.employees,
  });

function useUserInvalidation() {
  const client = useQueryClient();
  return () =>
    Promise.all(
      ["users", "utilization", "dashboard"].map((key) =>
        client.invalidateQueries({ queryKey: [key] }),
      ),
    );
}

export function useCreateUser() {
  const invalidate = useUserInvalidation();
  return useMutation({
    mutationFn: (input: CreateUserInput) =>
      api<{ user: User }>("/users", { method: "POST", body: input }),
    onSuccess: invalidate,
  });
}

export function useUpdateUser() {
  const invalidate = useUserInvalidation();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateUserInput & { id: number }) =>
      api<{ user: User }>(`/users/${id}`, { method: "PATCH", body: input }),
    onSuccess: invalidate,
  });
}

export function useDeleteUser() {
  const invalidate = useUserInvalidation();
  return useMutation({
    mutationFn: (id: number) => api<void>(`/users/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
  });
}

export const useComplaints = (status?: ComplaintStatus) =>
  useQuery({
    queryKey: ["complaints", status ?? "all"],
    queryFn: () => api<{ complaints: Complaint[] }>(`/complaints${query({ status })}`),
    select: (data) => data.complaints,
  });

function useComplaintInvalidation() {
  const client = useQueryClient();
  return () =>
    Promise.all(
      ["complaints", "order", "dashboard", "quality"].map((key) =>
        client.invalidateQueries({ queryKey: [key] }),
      ),
    );
}

export function useCreateComplaint() {
  const invalidate = useComplaintInvalidation();
  return useMutation({
    mutationFn: (input: CreateComplaintInput) =>
      api<{ complaint: Complaint }>("/complaints", { method: "POST", body: input }),
    onSuccess: invalidate,
  });
}

export function useUpdateComplaint() {
  const invalidate = useComplaintInvalidation();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateComplaintInput & { id: number }) =>
      api<{ complaint: Complaint }>(`/complaints/${id}`, { method: "PATCH", body: input }),
    onSuccess: invalidate,
  });
}

export const useInvoices = () =>
  useQuery({
    queryKey: ["invoices"],
    queryFn: () => api<{ invoices: Invoice[] }>("/invoices"),
    select: (data) => data.invoices,
  });

export const useInvoice = (id: number) =>
  useQuery({
    queryKey: ["invoice", id],
    queryFn: () => api<{ invoice: InvoiceDetail }>(`/invoices/${id}`),
    select: (data) => data.invoice,
  });

export const useSalesReport = (months: number) =>
  useQuery({
    queryKey: ["invoices", "sales", months],
    queryFn: () => api<SalesReport>(`/invoices/sales-report${query({ months })}`),
  });

export function useCreateInvoice() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInvoiceInput) =>
      api<{ invoice: Invoice }>("/invoices", { method: "POST", body: input }),
    onSuccess: () =>
      Promise.all(
        ["invoices", "order", "dashboard"].map((key) =>
          client.invalidateQueries({ queryKey: [key] }),
        ),
      ),
  });
}

export const useQualityReport = (months: number) =>
  useQuery({
    queryKey: ["quality", months],
    queryFn: () => api<QualityReport>(`/quality-costs${query({ months })}`),
  });

export function useCreateQualityCost() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateQualityCostInput) =>
      api<{ entry: unknown }>("/quality-costs", { method: "POST", body: input }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["quality"] }),
  });
}

export function useDeleteQualityCost() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api<void>(`/quality-costs/${id}`, { method: "DELETE" }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["quality"] }),
  });
}

export const useDemoInfo = () =>
  useQuery({
    queryKey: ["demo"],
    queryFn: () => api<DemoInfo>("/auth/demo"),
    staleTime: Infinity,
  });
