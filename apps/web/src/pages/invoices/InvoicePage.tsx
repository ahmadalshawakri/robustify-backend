import { PrintOutlined } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { TAX_RATE, materialLabel } from "@robustify/shared";
import { useParams } from "react-router";
import { useInvoice } from "../../api/hooks";
import { QueryState } from "../../components/QueryState";
import { formatDate, formatMoney, formatNumber } from "../../lib/format";

/** A printable invoice. The app chrome is hidden when printing. */
export function InvoicePage() {
  const invoice = useInvoice(Number(useParams().id));

  return (
    <QueryState query={invoice}>
      {(inv) => {
        const { order } = inv;
        return (
          <Box sx={{ maxWidth: 820 }}>
            <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2, displayPrint: "none" }}>
              <Button
                variant="outlined"
                startIcon={<PrintOutlined />}
                onClick={() => window.print()}
              >
                Print
              </Button>
            </Stack>
            <Card variant="outlined" sx={{ "@media print": { border: "none" } }}>
              <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  spacing={2}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box component="img" src="/logo.png" alt="" sx={{ width: 40, height: 40 }} />
                    <Typography variant="h5" fontWeight={700}>
                      Robustify Press
                    </Typography>
                  </Stack>
                  <Box textAlign="right">
                    <Typography variant="h5" component="h1" fontWeight={700}>
                      Invoice
                    </Typography>
                    <Typography color="text.secondary">{inv.number}</Typography>
                  </Box>
                </Stack>
                <Grid container spacing={2} sx={{ mt: 4 }}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Billed to
                    </Typography>
                    <Typography fontWeight={600}>{order.customer.name}</Typography>
                    <Typography>{order.customer.location}</Typography>
                    <Typography>{order.customer.email}</Typography>
                    <Typography>{order.customer.phone}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }} sx={{ textAlign: { sm: "right" } }}>
                    <Typography variant="caption" color="text.secondary">
                      Issued
                    </Typography>
                    <Typography>{formatDate(inv.issuedAt)}</Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      component="div"
                      sx={{ mt: 1 }}
                    >
                      Order
                    </Typography>
                    <Typography>#{order.id}</Typography>
                  </Grid>
                </Grid>
                <Table sx={{ mt: 4 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        Labels, {materialLabel("PAPER", order.paperType)}, {order.widthMm} ×{" "}
                        {order.heightMm} mm
                      </TableCell>
                      <TableCell align="right">{formatNumber(order.quantity)}</TableCell>
                      <TableCell align="right">{formatMoney(inv.subtotal)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <Stack alignItems="flex-end" spacing={0.5} sx={{ mt: 3 }}>
                  <Row label="Subtotal" value={formatMoney(inv.subtotal)} />
                  <Row
                    label={`Tax (${Math.round(TAX_RATE * 100)}%)`}
                    value={formatMoney(inv.tax)}
                  />
                  <Divider flexItem sx={{ my: 1 }} />
                  <Row label="Total" value={formatMoney(inv.total)} strong />
                </Stack>
              </CardContent>
            </Card>
          </Box>
        );
      }}
    </QueryState>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <Stack direction="row" spacing={4} sx={{ minWidth: 240 }} justifyContent="space-between">
      <Typography
        color={strong ? "text.primary" : "text.secondary"}
        fontWeight={strong ? 700 : 400}
      >
        {label}
      </Typography>
      <Typography fontWeight={strong ? 700 : 400}>{value}</Typography>
    </Stack>
  );
}
