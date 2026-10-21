import {
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemText,
  Typography,
  useTheme,
} from "@mui/material";
import { LABELS, ORDER_STATUSES, isInProduction } from "@robustify/shared";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useDashboard } from "../api/hooks";
import { PageHeader } from "../components/PageHeader";
import { QueryState } from "../components/QueryState";
import { StatCard } from "../components/StatCard";
import { formatNumber } from "../lib/format";
import { UtilizationTable } from "./team/UtilizationTable";

export function DashboardPage() {
  const dashboard = useDashboard();
  const theme = useTheme();

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Where the work is across the press today." />
      <QueryState query={dashboard}>
        {(data) => {
          const inProduction = ORDER_STATUSES.filter(isInProduction).reduce(
            (sum, status) => sum + data.ordersByStatus[status],
            0,
          );
          const queue = ORDER_STATUSES.map((status) => ({
            stage: LABELS.orderStatus[status],
            orders: data.ordersByStatus[status],
          }));
          return (
            <Grid container spacing={2}>
              <Grid size={{ xs: 6, lg: 3 }}>
                <StatCard
                  label="In production"
                  value={inProduction}
                  hint={`${data.ordersByStatus.NOT_STARTED} waiting to start`}
                />
              </Grid>
              <Grid size={{ xs: 6, lg: 3 }}>
                <StatCard
                  label="Overdue"
                  value={data.overdueOrders}
                  tone={data.overdueOrders ? "error" : undefined}
                  hint="past deadline, not completed"
                />
              </Grid>
              <Grid size={{ xs: 6, lg: 3 }}>
                <StatCard
                  label="Average utilization"
                  value={`${data.averageUtilization}%`}
                  hint="of a working day, per employee"
                />
              </Grid>
              <Grid size={{ xs: 6, lg: 3 }}>
                <StatCard
                  label="Open purchases"
                  value={data.openPurchases}
                  hint="still to arrive"
                />
              </Grid>

              <Grid size={{ xs: 12, lg: 8 }}>
                <Card variant="outlined" sx={{ height: "100%" }}>
                  <CardContent>
                    <Typography variant="h6" component="h2">
                      Order queue by stage
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={queue} margin={{ top: 16, right: 8, left: -16, bottom: 0 }}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke={theme.palette.divider}
                        />
                        <XAxis
                          dataKey="stage"
                          tick={{ fontSize: 12 }}
                          interval={0}
                          angle={-30}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip cursor={{ fill: theme.palette.action.hover }} />
                        <Bar
                          dataKey="orders"
                          fill={theme.palette.primary.main}
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, lg: 4 }}>
                <Card variant="outlined" sx={{ height: "100%" }}>
                  <CardContent>
                    <Typography variant="h6" component="h2">
                      Low stock
                    </Typography>
                    {data.lowStock.length === 0 ? (
                      <Typography color="text.secondary" sx={{ mt: 2 }}>
                        Everything is above two packs.
                      </Typography>
                    ) : (
                      <List dense>
                        {data.lowStock.map((item) => (
                          <ListItem key={item.label} disableGutters>
                            <ListItemText
                              primary={item.label}
                              secondary={`${formatNumber(item.quantity)} ${item.unit} left`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
                      Team utilization
                    </Typography>
                    <UtilizationTable />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          );
        }}
      </QueryState>
    </>
  );
}
