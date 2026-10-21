import { ArrowForward, DeleteOutline } from "@mui/icons-material";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Link,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  DEFAULT_MARKUP,
  LABELS,
  STAGE_OWNER,
  TAX_RATE,
  invoiceTotals,
  nextStatus,
  suggestedPrice,
} from "@robustify/shared";
import { useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router";
import {
  useAdvanceOrder,
  useAssignOrder,
  useCreateInvoice,
  useDeleteOrder,
  useOrder,
  useUsers,
} from "../../api/hooks";
import type { OrderDetail } from "../../api/types";
import { useUser } from "../../auth/AuthProvider";
import { PageHeader } from "../../components/PageHeader";
import { QueryState } from "../../components/QueryState";
import { StageStepper } from "../../components/StageStepper";
import { ComplaintStatusChip, OrderStatusChip } from "../../components/StatusChip";
import {
  displayName,
  formatDate,
  formatDateTime,
  formatMoney,
  formatNumber,
  isOverdue,
} from "../../lib/format";
import { ComplaintDialog } from "../complaints/ComplaintDialog";

export function OrderDetailPage() {
  const id = Number(useParams().id);
  const order = useOrder(id);
  return <QueryState query={order}>{(data) => <OrderDetail order={data} />}</QueryState>;
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Grid size={{ xs: 6, sm: 4 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography sx={{ overflowWrap: "anywhere" }}>{children}</Typography>
    </Grid>
  );
}

function OrderDetail({ order }: { order: OrderDetail }) {
  const done = order.status === "COMPLETED";
  const overdue = isOverdue(order.deadline, done);
  return (
    <>
      <PageHeader
        title={
          <Stack direction="row" spacing={1.5} alignItems="center">
            <span>Order #{order.id}</span>
            <OrderStatusChip status={order.status} size="medium" />
          </Stack>
        }
        subtitle={`${order.customer.name} · created ${formatDate(order.createdAt)}`}
      />
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent sx={{ overflowX: "auto" }}>
          <StageStepper status={order.status} />
        </CardContent>
      </Card>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Stack spacing={2}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
                  Job
                </Typography>
                <Grid container spacing={2}>
                  <Fact label="Paper">{order.paperLabel}</Fact>
                  <Fact label="Quantity">{formatNumber(order.quantity)}</Fact>
                  <Fact label="Size">
                    {order.widthMm} × {order.heightMm} mm
                  </Fact>
                  <Fact label="Paper needed">{formatNumber(order.consumption)} m</Fact>
                  <Fact label="Material cost">{formatMoney(order.cost)}</Fact>
                  <Fact label="Deadline">
                    <Typography component="span" color={overdue ? "error" : undefined}>
                      {formatDate(order.deadline)}
                      {overdue && " (overdue)"}
                    </Typography>
                  </Fact>
                </Grid>
              </CardContent>
            </Card>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
                  Customer
                </Typography>
                <Grid container spacing={2}>
                  <Fact label="Name">{order.customer.name}</Fact>
                  <Fact label="Email">{order.customer.email}</Fact>
                  <Fact label="Phone">{order.customer.phone}</Fact>
                  <Fact label="Address">{order.customer.location}</Fact>
                </Grid>
              </CardContent>
            </Card>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" component="h2">
                  History
                </Typography>
                <List dense>
                  {[...order.events].reverse().map((event) => (
                    <ListItem key={event.id} disableGutters>
                      <ListItemText
                        primary={
                          event.fromStatus
                            ? `${LABELS.orderStatus[event.fromStatus]} → ${LABELS.orderStatus[event.toStatus]}`
                            : "Order created"
                        }
                        secondary={`${formatDateTime(event.createdAt)}${event.actor ? ` · ${displayName(event.actor.username)}` : ""}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
        {/* On phones the actions come first: that is what people open the page for. */}
        <Grid size={{ xs: 12, md: 5 }} sx={{ order: { xs: -1, md: 0 } }}>
          <Stack spacing={2}>
            <OrderActions order={order} />
            {(order.status === "IN_TRANSIT" || order.status === "COMPLETED") && (
              <AfterSales order={order} />
            )}
          </Stack>
        </Grid>
      </Grid>
    </>
  );
}

function OrderActions({ order }: { order: OrderDetail }) {
  const user = useUser();
  const navigate = useNavigate();
  const admin = user.role === "ADMIN";
  const next = nextStatus(order.status);
  const nextOwner = next ? STAGE_OWNER[next] : undefined;
  const currentOwner = STAGE_OWNER[order.status];
  const canAdvance = Boolean(next) && (admin || (currentOwner && currentOwner === user.department));

  const [nextAssignee, setNextAssignee] = useState("");
  const [error, setError] = useState<string | null>(null);
  const advance = useAdvanceOrder(order.id);
  const assign = useAssignOrder(order.id);
  const remove = useDeleteOrder(order.id);

  // Only admins can list users; they pick who takes the next stage.
  const nextCandidates = useUsers(
    { role: "EMPLOYEE", department: nextOwner },
    admin && Boolean(nextOwner),
  );
  const currentCandidates = useUsers(
    { role: "EMPLOYEE", department: currentOwner },
    admin && Boolean(currentOwner),
  );

  const run = async (action: () => Promise<unknown>) => {
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6" component="h2">
            Next step
          </Typography>
          {error && <Alert severity="error">{error}</Alert>}

          {currentOwner && (
            <Typography color="text.secondary">
              With {LABELS.department[currentOwner]}
              {order.assignee
                ? `, assigned to ${displayName(order.assignee.username)}`
                : ", not assigned yet"}
              .
            </Typography>
          )}

          {admin && currentOwner && (
            <TextField
              select
              label={`Assign ${LABELS.orderStatus[order.status].toLowerCase()} to`}
              value={order.assignee?.id ?? ""}
              onChange={(e) =>
                run(() => assign.mutateAsync(e.target.value ? Number(e.target.value) : null))
              }
              disabled={assign.isPending}
            >
              <MenuItem value="">Nobody</MenuItem>
              {(currentCandidates.data ?? []).map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {displayName(u.username)}
                </MenuItem>
              ))}
            </TextField>
          )}

          {next && canAdvance && (
            <>
              {admin && nextOwner && (
                <TextField
                  select
                  label={`Who takes ${LABELS.orderStatus[next].toLowerCase()}?`}
                  value={nextAssignee}
                  onChange={(e) => setNextAssignee(e.target.value)}
                  helperText="Optional. Their department can also pick it up."
                >
                  <MenuItem value="">Leave unassigned</MenuItem>
                  {(nextCandidates.data ?? []).map((u) => (
                    <MenuItem key={u.id} value={u.id}>
                      {displayName(u.username)}
                    </MenuItem>
                  ))}
                </TextField>
              )}
              <Button
                variant="contained"
                endIcon={<ArrowForward />}
                disabled={advance.isPending}
                onClick={() =>
                  run(async () => {
                    await advance.mutateAsync(nextAssignee ? Number(nextAssignee) : undefined);
                    setNextAssignee("");
                  })
                }
              >
                Move to {LABELS.orderStatus[next].toLowerCase()}
              </Button>
              {next === "PRINTING" && (
                <Typography variant="caption" color="text.secondary">
                  Starting printing takes {formatNumber(order.consumption)} m of {order.paperLabel}{" "}
                  out of stock.
                </Typography>
              )}
            </>
          )}

          {next && !canAdvance && (
            <Typography color="text.secondary">
              Only {currentOwner ? LABELS.department[currentOwner] : "an admin"} can move this order
              on.
            </Typography>
          )}

          {!next && <Alert severity="success">This order is completed.</Alert>}

          {admin && order.status === "NOT_STARTED" && (
            <Button
              color="error"
              startIcon={<DeleteOutline />}
              disabled={remove.isPending}
              onClick={() => {
                if (!window.confirm(`Delete order #${order.id}? This cannot be undone.`)) return;
                void run(async () => {
                  await remove.mutateAsync();
                  navigate("/orders", { replace: true });
                });
              }}
            >
              Delete order
            </Button>
          )}

          {!admin && (
            <Button component={RouterLink} to="/my-work">
              Back to my work
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

/** Invoice and complaints, once an order has shipped. */
function AfterSales({ order }: { order: OrderDetail }) {
  const admin = useUser().role === "ADMIN";
  const [dialog, setDialog] = useState<"invoice" | "complaint" | null>(null);

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6" component="h2">
            After delivery
          </Typography>
          {order.invoice ? (
            <Typography>
              Invoiced as{" "}
              {admin ? (
                <Link component={RouterLink} to={`/invoices/${order.invoice.id}`} fontWeight={600}>
                  {order.invoice.number}
                </Link>
              ) : (
                order.invoice.number
              )}{" "}
              for {formatMoney(order.invoice.total)} on {formatDate(order.invoice.issuedAt)}.
            </Typography>
          ) : order.status === "COMPLETED" ? (
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
              <Typography color="text.secondary">Not invoiced yet.</Typography>
              {admin && (
                <Button variant="outlined" onClick={() => setDialog("invoice")}>
                  Create invoice
                </Button>
              )}
            </Stack>
          ) : null}

          <Divider />
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography fontWeight={600}>Complaints</Typography>
            {admin && (
              <Button size="small" onClick={() => setDialog("complaint")}>
                Log complaint
              </Button>
            )}
          </Stack>
          {order.complaints.length === 0 ? (
            <Typography color="text.secondary">None.</Typography>
          ) : (
            <List dense disablePadding>
              {order.complaints.map((c) => (
                <ListItem
                  key={c.id}
                  disableGutters
                  secondaryAction={<ComplaintStatusChip status={c.status} />}
                >
                  <ListItemText primary={c.defect} secondary={formatDate(c.createdAt)} />
                </ListItem>
              ))}
            </List>
          )}
        </Stack>
      </CardContent>
      {dialog === "invoice" && <InvoiceDialog order={order} onClose={() => setDialog(null)} />}
      {dialog === "complaint" && (
        <ComplaintDialog orderId={order.id} onClose={() => setDialog(null)} />
      )}
    </Card>
  );
}

function InvoiceDialog({ order, onClose }: { order: OrderDetail; onClose: () => void }) {
  const create = useCreateInvoice();
  const [price, setPrice] = useState(String(suggestedPrice(order.cost)));
  const value = Number(price);
  const valid = price !== "" && value > 0;
  const totals = invoiceTotals(valid ? value : 0);

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Invoice order #{order.id}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {create.isError && <Alert severity="error">{create.error.message}</Alert>}
          <TextField
            autoFocus
            type="number"
            label="Price before tax"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            error={!valid}
            helperText={`Suggested from material cost ${formatMoney(order.cost)} × ${DEFAULT_MARKUP}`}
          />
          <Typography color="text.secondary">
            Tax {Math.round(TAX_RATE * 100)}%: {formatMoney(totals.tax)} · Total{" "}
            <strong>{formatMoney(totals.total)}</strong>
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!valid || create.isPending}
          onClick={() =>
            create.mutate({ orderId: order.id, subtotal: value }, { onSuccess: onClose })
          }
        >
          Issue invoice
        </Button>
      </DialogActions>
    </Dialog>
  );
}
