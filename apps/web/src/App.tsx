import { Box, Chip, Container, Stack, Typography } from "@mui/material";
import { LABELS, ORDER_STATUSES } from "@robustify/shared";
import { useQuery } from "@tanstack/react-query";

interface Health {
  status: "ok" | "degraded";
  database: "ok" | "unreachable";
}

async function fetchHealth(): Promise<Health> {
  const res = await fetch("/api/health");
  return (await res.json()) as Health;
}

// Placeholder until the app shell lands in phase 3.
export function App() {
  const health = useQuery({ queryKey: ["health"], queryFn: fetchHealth });

  const apiLabel = health.isPending
    ? "Checking API…"
    : health.isError
      ? "API unreachable"
      : health.data.status === "ok"
        ? "API and database online"
        : "Database unreachable";
  const apiColor =
    health.data?.status === "ok" ? "success" : health.isPending ? "default" : "error";

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 6, sm: 10 } }}>
      <Stack spacing={3} alignItems="flex-start">
        <Box component="img" src="/logo.png" alt="" sx={{ width: 56, height: 56 }} />
        <Typography variant="h3" component="h1" fontWeight={700}>
          Robustify
        </Typography>
        <Typography color="text.secondary">
          An ERP for printing presses: orders move from design to delivery, materials are tracked
          from purchase to press, and managers see where the work is.
        </Typography>
        <Chip label={apiLabel} color={apiColor} variant="outlined" />
        <Stack direction="row" flexWrap="wrap" gap={1} aria-label="Order stages">
          {ORDER_STATUSES.map((status) => (
            <Chip key={status} size="small" label={LABELS.orderStatus[status]} />
          ))}
        </Stack>
      </Stack>
    </Container>
  );
}
