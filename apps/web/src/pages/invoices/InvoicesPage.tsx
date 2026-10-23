import {
  Card,
  CardContent,
  Grid,
  Link,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import { Link as RouterLink } from "react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useInvoices, useSalesReport } from "../../api/hooks";
import { PageHeader } from "../../components/PageHeader";
import { QueryState } from "../../components/QueryState";
import { StatCard } from "../../components/StatCard";
import { formatDate, formatMoney, formatMonth } from "../../lib/format";

export function InvoicesPage() {
  const theme = useTheme();
  const [months, setMonths] = useState(6);
  const report = useSalesReport(months);
  const invoices = useInvoices();

  return (
    <>
      <PageHeader
        title="Sales"
        subtitle="Invoices for completed orders. Create one from the order page."
        actions={
          <TextField
            select
            size="small"
            label="Period"
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            sx={{ minWidth: 160 }}
          >
            {[3, 6, 12].map((m) => (
              <MenuItem key={m} value={m}>
                Last {m} months
              </MenuItem>
            ))}
          </TextField>
        }
      />
      <QueryState query={report}>
        {(data) => (
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <StatCard
                label="Revenue"
                value={formatMoney(data.totalRevenue)}
                hint="including tax"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <StatCard label="Invoices" value={data.invoiceCount} hint={`in ${months} months`} />
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <StatCard
                label="To invoice"
                value={data.uninvoicedOrders}
                tone={data.uninvoicedOrders ? "warning" : undefined}
                hint="completed orders without an invoice"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="h6" component="h2">
                    Revenue by month
                  </Typography>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={data.months.map((m) => ({ ...m, label: formatMonth(m.month) }))}
                      margin={{ top: 16, right: 8, left: 8, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke={theme.palette.divider}
                      />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        cursor={{ fill: theme.palette.action.hover }}
                        formatter={(value: number) => [formatMoney(value), "Revenue"]}
                      />
                      <Bar
                        dataKey="total"
                        fill={theme.palette.primary.main}
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="h6" component="h2">
                    Top customers
                  </Typography>
                  {data.topCustomers.length === 0 ? (
                    <Typography color="text.secondary" sx={{ mt: 2 }}>
                      No invoices in this period.
                    </Typography>
                  ) : (
                    <List dense>
                      {data.topCustomers.map((c) => (
                        <ListItem
                          key={c.id}
                          disableGutters
                          secondaryAction={
                            <Typography fontWeight={600}>{formatMoney(c.total)}</Typography>
                          }
                        >
                          <ListItemText
                            primary={c.name}
                            secondary={`${c.invoices} invoice${c.invoices === 1 ? "" : "s"}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </QueryState>
      <Card variant="outlined">
        <QueryState query={invoices} empty="No invoices yet.">
          {(rows) => (
            <TableContainer>
              <Table size="small" sx={{ minWidth: 640 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice</TableCell>
                    <TableCell>Issued</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Order</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((invoice) => (
                    <TableRow key={invoice.id} hover>
                      <TableCell>
                        <Link
                          component={RouterLink}
                          to={`/invoices/${invoice.id}`}
                          fontWeight={600}
                        >
                          {invoice.number}
                        </Link>
                      </TableCell>
                      <TableCell>{formatDate(invoice.issuedAt)}</TableCell>
                      <TableCell>{invoice.order.customer.name}</TableCell>
                      <TableCell>
                        <Link component={RouterLink} to={`/orders/${invoice.order.id}`}>
                          #{invoice.order.id}
                        </Link>
                      </TableCell>
                      <TableCell align="right">{formatMoney(invoice.subtotal)}</TableCell>
                      <TableCell align="right">{formatMoney(invoice.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </QueryState>
      </Card>
    </>
  );
}
