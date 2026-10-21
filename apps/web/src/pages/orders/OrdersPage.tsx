import { Add } from "@mui/icons-material";
import { Button, Card, Chip, Stack } from "@mui/material";
import { LABELS, ORDER_STATUSES, type OrderStatus } from "@robustify/shared";
import { Link as RouterLink, useSearchParams } from "react-router";
import { useOrders } from "../../api/hooks";
import { PageHeader } from "../../components/PageHeader";
import { QueryState } from "../../components/QueryState";
import { OrdersTable } from "./OrdersTable";

export function OrdersPage() {
  const [params, setParams] = useSearchParams();
  const raw = params.get("status");
  const status = ORDER_STATUSES.includes(raw as OrderStatus) ? (raw as OrderStatus) : undefined;
  const orders = useOrders({ status });

  const select = (next?: OrderStatus) => setParams(next ? { status: next } : {}, { replace: true });

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle="Every job, earliest deadline first."
        actions={
          <Button component={RouterLink} to="/orders/new" variant="contained" startIcon={<Add />}>
            New order
          </Button>
        }
      />
      <Stack
        direction="row"
        useFlexGap
        flexWrap="wrap"
        gap={1}
        sx={{ mb: 2 }}
        role="group"
        aria-label="Filter by stage"
      >
        <Chip label="All" color={status ? "default" : "primary"} onClick={() => select()} />
        {ORDER_STATUSES.map((s) => (
          <Chip
            key={s}
            label={LABELS.orderStatus[s]}
            color={status === s ? "primary" : "default"}
            onClick={() => select(s)}
          />
        ))}
      </Stack>
      <Card variant="outlined">
        <QueryState query={orders} empty="No orders in this stage.">
          {(rows) => <OrdersTable orders={rows} />}
        </QueryState>
      </Card>
    </>
  );
}
