import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import type { OrderSummary } from "../../api/types";
import { OrderStatusChip } from "../../components/StatusChip";
import { displayName, formatDate, formatNumber, isOverdue } from "../../lib/format";

export function OrdersTable({
  orders,
  action,
}: {
  orders: OrderSummary[];
  /** Extra control at the end of each row, such as a quick "move on" button. */
  action?: (order: OrderSummary) => ReactNode;
}) {
  const navigate = useNavigate();
  const theme = useTheme();
  const phone = useMediaQuery(theme.breakpoints.down("sm"));
  if (phone) return <OrdersList orders={orders} action={action} />;
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
            {action && <TableCell />}
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
                {action && (
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    {action(order)}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

/** Phone layout: one stacked row per order, so the action stays on screen. */
function OrdersList({
  orders,
  action,
}: {
  orders: OrderSummary[];
  action?: (order: OrderSummary) => ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <Stack divider={<Box sx={{ borderTop: 1, borderColor: "divider" }} />}>
      {orders.map((order) => {
        const overdue = isOverdue(order.deadline, order.status === "COMPLETED");
        return (
          <Stack key={order.id} direction="row" spacing={1.5} alignItems="center" sx={{ py: 1.5 }}>
            <Box
              component="a"
              href={`/orders/${order.id}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(`/orders/${order.id}`);
              }}
              sx={{ flex: 1, minWidth: 0, color: "inherit", textDecoration: "none" }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography fontWeight={600} color="primary.main">
                  #{order.id}
                </Typography>
                <Typography noWrap>{order.customer.name}</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {formatNumber(order.quantity)} × {order.paperLabel}
              </Typography>
              <Typography variant="caption" color={overdue ? "error" : "text.secondary"}>
                Due {formatDate(order.deadline)}
                {overdue && " · overdue"}
              </Typography>
            </Box>
            {action ? action(order) : <OrderStatusChip status={order.status} />}
          </Stack>
        );
      })}
    </Stack>
  );
}
