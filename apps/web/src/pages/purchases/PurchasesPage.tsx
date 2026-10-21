import { Add } from "@mui/icons-material";
import {
  Alert,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { LABELS, PURCHASE_STATUSES, type PurchaseStatus } from "@robustify/shared";
import { useState } from "react";
import { Link as RouterLink } from "react-router";
import { useCancelPurchase, usePurchases, useReceivePurchase } from "../../api/hooks";
import type { Purchase } from "../../api/types";
import { PageHeader } from "../../components/PageHeader";
import { QueryState } from "../../components/QueryState";
import { PurchaseStatusChip } from "../../components/StatusChip";
import { formatDate, formatMoney } from "../../lib/format";

export function PurchasesPage() {
  const [status, setStatus] = useState<PurchaseStatus | "ALL">("ALL");
  const purchases = usePurchases(status === "ALL" ? undefined : status);
  const [receiving, setReceiving] = useState<Purchase | null>(null);
  const cancel = useCancelPurchase();

  return (
    <>
      <PageHeader
        title="Purchases"
        subtitle="Materials on order. Receive packs as they arrive to add them to stock."
        actions={
          <Button
            component={RouterLink}
            to="/purchases/new"
            variant="contained"
            startIcon={<Add />}
          >
            New purchase
          </Button>
        }
      />
      <Tabs
        value={status}
        onChange={(_e, value: PurchaseStatus | "ALL") => setStatus(value)}
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{ mb: 2 }}
      >
        <Tab value="ALL" label="All" />
        {PURCHASE_STATUSES.map((s) => (
          <Tab key={s} value={s} label={LABELS.purchaseStatus[s]} />
        ))}
      </Tabs>
      {cancel.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {cancel.error.message}
        </Alert>
      )}
      <Card variant="outlined">
        <QueryState query={purchases} empty="No purchases here.">
          {(rows) => (
            <TableContainer>
              <Table size="small" sx={{ minWidth: 820 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Ordered</TableCell>
                    <TableCell>Material</TableCell>
                    <TableCell>Supplier</TableCell>
                    <TableCell align="right">Packs received</TableCell>
                    <TableCell>Expected</TableCell>
                    <TableCell align="right">Cost</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((p) => {
                    const open = p.status === "UPCOMING" || p.status === "PARTIAL";
                    return (
                      <TableRow key={p.id}>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {formatDate(p.purchaseDate)}
                        </TableCell>
                        <TableCell>{p.materialLabel}</TableCell>
                        <TableCell>{p.supplier.name}</TableCell>
                        <TableCell align="right">
                          {p.quantityReceived} / {p.quantity}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {formatDate(p.expectedArrival)}
                        </TableCell>
                        <TableCell align="right">{formatMoney(p.cost)}</TableCell>
                        <TableCell>
                          <PurchaseStatusChip status={p.status} />
                        </TableCell>
                        <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                          {open && (
                            <Button size="small" onClick={() => setReceiving(p)}>
                              Receive
                            </Button>
                          )}
                          {p.status === "UPCOMING" && (
                            <Button
                              size="small"
                              color="error"
                              disabled={cancel.isPending}
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Cancel the ${p.materialLabel} purchase from ${p.supplier.name}?`,
                                  )
                                ) {
                                  cancel.mutate(p.id);
                                }
                              }}
                            >
                              Cancel
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </QueryState>
      </Card>
      {receiving && <ReceiveDialog purchase={receiving} onClose={() => setReceiving(null)} />}
    </>
  );
}

function ReceiveDialog({ purchase, onClose }: { purchase: Purchase; onClose: () => void }) {
  const outstanding = purchase.quantity - purchase.quantityReceived;
  const [packs, setPacks] = useState(String(outstanding));
  const receive = useReceivePurchase();
  const value = Number(packs);
  const valid = Number.isInteger(value) && value >= 1 && value <= outstanding;

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Receive {purchase.materialLabel}</DialogTitle>
      <DialogContent>
        {receive.isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {receive.error.message}
          </Alert>
        )}
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {outstanding} of {purchase.quantity} packs still expected from {purchase.supplier.name}.
        </Typography>
        <TextField
          autoFocus
          fullWidth
          type="number"
          label="Packs arrived"
          value={packs}
          onChange={(e) => setPacks(e.target.value)}
          error={!valid}
          helperText={
            valid
              ? `Adds ${value * purchase.packSize} ${purchase.unit} to stock`
              : `Enter 1 to ${outstanding}`
          }
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!valid || receive.isPending}
          onClick={() =>
            receive.mutate({ id: purchase.id, quantity: value }, { onSuccess: onClose })
          }
        >
          Book into stock
        </Button>
      </DialogActions>
    </Dialog>
  );
}
