import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router";
import type { OrderSummary } from "../../api/types";
import { OrderStatusChip } from "../../components/StatusChip";
import { displayName, formatDate, formatNumber, isOverdue } from "../../lib/format";

export function OrdersTable({ orders }: { orders: OrderSummary[] }) {
  const navigate = useNavigate();
  return (
    <TableContainer>
      <Table size="small" sx={{ minWidth: 720 }}>
        <TableHead>
          <TableRow>
            <TableCell>Order</TableCell>
            <TableCell>Customer</TableCell>
            <TableCell>Job</TableCell>
            <TableCell>Deadline</TableCell>
            <TableCell>Stage</TableCell>
            <TableCell>Assigned to</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map((order) => {
            const overdue = isOverdue(order.deadline, order.status === "COMPLETED");
            return (
              <TableRow
                key={order.id}
                hover
                onClick={() => navigate(`/orders/${order.id}`)}
                sx={{ cursor: "pointer" }}
              >
                <TableCell>
                  {/* A real link keeps rows reachable by keyboard and middle-click. */}
                  <Typography
                    component="a"
                    href={`/orders/${order.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/orders/${order.id}`);
                    }}
                    sx={{ fontWeight: 600, color: "primary.main", textDecoration: "none" }}
                  >
                    #{order.id}
                  </Typography>
                </TableCell>
                <TableCell>{order.customer.name}</TableCell>
                <TableCell>
                  {formatNumber(order.quantity)} × {order.paperLabel}
                  <Typography variant="caption" color="text.secondary" component="div">
                    {order.widthMm} × {order.heightMm} mm
                  </Typography>
                </TableCell>
                <TableCell sx={{ color: overdue ? "error.main" : undefined, whiteSpace: "nowrap" }}>
                  {formatDate(order.deadline)}
                  {overdue && " · overdue"}
                </TableCell>
                <TableCell>
                  <OrderStatusChip status={order.status} />
                </TableCell>
                <TableCell>{order.assignee ? displayName(order.assignee.username) : "—"}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
