import {
  Button,
  Card,
  Link,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from "@mui/material";
import type { ComplaintStatus } from "@robustify/shared";
import { useState } from "react";
import { Link as RouterLink } from "react-router";
import { useComplaints, useUpdateComplaint } from "../../api/hooks";
import type { Complaint } from "../../api/types";
import { useUser } from "../../auth/AuthProvider";
import { PageHeader } from "../../components/PageHeader";
import { QueryState } from "../../components/QueryState";
import { ComplaintStatusChip } from "../../components/StatusChip";
import { displayName, formatDate, formatMoney } from "../../lib/format";
import { ComplaintDialog } from "./ComplaintDialog";

export function ComplaintsPage() {
  const user = useUser();
  const admin = user.role === "ADMIN";
  const [status, setStatus] = useState<ComplaintStatus | undefined>("OPEN");
  const complaints = useComplaints(status);
  const update = useUpdateComplaint();
  const [editing, setEditing] = useState<Complaint | null>(null);

  return (
    <>
      <PageHeader
        title="Complaints"
        subtitle={
          admin
            ? "Customer complaints on delivered orders. Log them from the order page."
            : "Complaints on work you were responsible for."
        }
      />
      <Tabs
        value={status ?? "ALL"}
        onChange={(_e, v: ComplaintStatus | "ALL") => setStatus(v === "ALL" ? undefined : v)}
        sx={{ mb: 2 }}
      >
        <Tab value="OPEN" label="Open" />
        <Tab value="RESOLVED" label="Resolved" />
        <Tab value="ALL" label="All" />
      </Tabs>
      <Card variant="outlined">
        <QueryState query={complaints} empty="No complaints here.">
          {(rows) => (
            <TableContainer>
              <Table size="small" sx={{ minWidth: 760 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Logged</TableCell>
                    <TableCell>Order</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Problem</TableCell>
                    <TableCell>Responsible</TableCell>
                    <TableCell align="right">Cost</TableCell>
                    <TableCell>Status</TableCell>
                    {admin && <TableCell />}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(c.createdAt)}</TableCell>
                      <TableCell>
                        <Link component={RouterLink} to={`/orders/${c.order.id}`} fontWeight={600}>
                          #{c.order.id}
                        </Link>
                      </TableCell>
                      <TableCell>{c.customer.name}</TableCell>
                      <TableCell>
                        {c.defect}
                        {c.comment && (
                          <Typography variant="caption" color="text.secondary" component="div">
                            {c.comment}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {c.responsible ? displayName(c.responsible.username) : "—"}
                      </TableCell>
                      <TableCell align="right">
                        {c.cost != null ? formatMoney(c.cost) : "—"}
                      </TableCell>
                      <TableCell>
                        <ComplaintStatusChip status={c.status} />
                      </TableCell>
                      {admin && (
                        <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                          <Button size="small" onClick={() => setEditing(c)}>
                            Edit
                          </Button>
                          <Button
                            size="small"
                            disabled={update.isPending}
                            onClick={() =>
                              update.mutate({
                                id: c.id,
                                status: c.status === "OPEN" ? "RESOLVED" : "OPEN",
                              })
                            }
                          >
                            {c.status === "OPEN" ? "Resolve" : "Reopen"}
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </QueryState>
      </Card>
      {editing && <ComplaintDialog complaint={editing} onClose={() => setEditing(null)} />}
    </>
  );
}
