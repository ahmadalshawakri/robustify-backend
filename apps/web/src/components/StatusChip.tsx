import { Chip, type ChipProps } from "@mui/material";
import { LABELS, type OrderStatus, type PurchaseStatus } from "@robustify/shared";

const ORDER_COLORS: Record<OrderStatus, ChipProps["color"]> = {
  NOT_STARTED: "default",
  DESIGN: "info",
  MONTAGE: "info",
  PRINTING: "primary",
  CUTTING: "primary",
  PACKAGING: "secondary",
  IN_TRANSIT: "warning",
  COMPLETED: "success",
};

const PURCHASE_COLORS: Record<PurchaseStatus, ChipProps["color"]> = {
  UPCOMING: "info",
  PARTIAL: "warning",
  BOOKED: "success",
  CANCELED: "default",
};

export function OrderStatusChip({
  status,
  size = "small",
}: {
  status: OrderStatus;
  size?: ChipProps["size"];
}) {
  return (
    <Chip
      size={size}
      color={ORDER_COLORS[status]}
      label={LABELS.orderStatus[status]}
      variant="outlined"
    />
  );
}

export function PurchaseStatusChip({ status }: { status: PurchaseStatus }) {
  return (
    <Chip
      size="small"
      color={PURCHASE_COLORS[status]}
      label={LABELS.purchaseStatus[status]}
      variant="outlined"
    />
  );
}
