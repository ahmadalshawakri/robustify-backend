import type {
  CreateOrderInput,
  CreatePurchaseInput,
  CreateUserInput,
  Department,
  OrderStatus,
  PurchaseStatus,
  Role,
  UpdateUserInput,
} from "@robustify/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, query } from "./client";
import type {
  Dashboard,
  EmployeeUtilization,
  InventoryItem,
  OrderDetail,
  OrderSummary,
  Purchase,
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
