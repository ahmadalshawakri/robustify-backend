import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { LABELS, createComplaintSchema, updateComplaintSchema } from "@robustify/shared";
import { useState } from "react";
import { ApiError } from "../../api/client";
import { useCreateComplaint, useUpdateComplaint, useUsers } from "../../api/hooks";
import type { Complaint } from "../../api/types";
import { displayName } from "../../lib/format";
import { useZodForm } from "../../lib/useZodForm";

const blankToNull = (v: string) => (v === "" ? null : v);

/** Logs a complaint against an order, or edits an existing one. */
export function ComplaintDialog({
  orderId,
  complaint,
  onClose,
}: {
  orderId?: number;
  complaint?: Complaint;
  onClose: () => void;
}) {
  const employees = useUsers({ role: "EMPLOYEE" });
  const create = useCreateComplaint();
  const update = useUpdateComplaint();
  const [error, setError] = useState<string | null>(null);
  const initial = {
    defect: complaint?.defect ?? "",
    responsibleId: complaint?.responsible ? String(complaint.responsible.id) : "",
    cost: complaint?.cost != null ? String(complaint.cost) : "",
    comment: complaint?.comment ?? "",
  };
  const toInput = (v: typeof initial) => ({
    ...v,
    orderId: complaint?.order.id ?? orderId,
    responsibleId: blankToNull(v.responsibleId),
    cost: blankToNull(v.cost),
  });
  const form = useZodForm(
    complaint ? updateComplaintSchema : createComplaintSchema,
    initial,
    toInput,
  );

  const onSubmit = form.handleSubmit(async (input) => {
    setError(null);
    try {
      if (complaint) await update.mutateAsync({ id: complaint.id, ...input });
      else await create.mutateAsync(createComplaintSchema.parse(input));
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        form.applyServerErrors(err);
        setError(err.message);
      }
    }
  });

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={onSubmit} noValidate>
        <DialogTitle>
          {complaint
            ? `Complaint on order #${complaint.order.id}`
            : `Log a complaint on order #${orderId}`}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="What went wrong" autoFocus={!complaint} {...form.field("defect")} />
            <TextField select label="Responsible" {...form.field("responsibleId")}>
              <MenuItem value="">
                <em>Not assigned</em>
              </MenuItem>
              {(employees.data ?? []).map((u) => (
                <MenuItem key={u.id} value={String(u.id)}>
                  {displayName(u.username)} · {LABELS.department[u.department]}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Cost to put right"
              type="number"
              {...form.field("cost")}
              helperText={
                form.errors.cost ?? "Reprint or refund. Counts toward the cost of poor quality."
              }
            />
            <TextField label="Notes" multiline minRows={2} {...form.field("comment")} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={create.isPending || update.isPending}>
            {complaint ? "Save" : "Log complaint"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
