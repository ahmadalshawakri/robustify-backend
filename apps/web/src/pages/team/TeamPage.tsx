import {
  Alert,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Add, DeleteOutline, EditOutlined } from "@mui/icons-material";
import { DEPARTMENTS, LABELS, ROLES, createUserSchema, updateUserSchema } from "@robustify/shared";
import { useState } from "react";
import { ApiError } from "../../api/client";
import { useCreateUser, useDeleteUser, useUpdateUser, useUsers } from "../../api/hooks";
import type { User } from "../../api/types";
import { useUser } from "../../auth/AuthProvider";
import { PageHeader } from "../../components/PageHeader";
import { QueryState } from "../../components/QueryState";
import { displayName } from "../../lib/format";
import { useZodForm } from "../../lib/useZodForm";
import { UtilizationTable } from "./UtilizationTable";

export function TeamPage() {
  const me = useUser();
  const users = useUsers();
  const remove = useDeleteUser();
  const [dialog, setDialog] = useState<{ mode: "create" } | { mode: "edit"; user: User } | null>(
    null,
  );

  return (
    <>
      <PageHeader
        title="Team"
        subtitle="Who works where, and how loaded they are."
        actions={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setDialog({ mode: "create" })}
          >
            Add person
          </Button>
        }
      />
      <Stack spacing={2}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
              Utilization
            </Typography>
            <UtilizationTable />
          </CardContent>
        </Card>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
              People
            </Typography>
            {remove.isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {remove.error.message}
              </Alert>
            )}
            <QueryState query={users}>
              {(rows) => (
                <TableContainer>
                  <Table size="small" sx={{ minWidth: 600 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Username</TableCell>
                        <TableCell>Department</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell>{displayName(u.username)}</TableCell>
                          <TableCell>{u.username}</TableCell>
                          <TableCell>{LABELS.department[u.department]}</TableCell>
                          <TableCell>{LABELS.role[u.role]}</TableCell>
                          <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                aria-label={`Edit ${u.username}`}
                                onClick={() => setDialog({ mode: "edit", user: u })}
                              >
                                <EditOutlined fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {u.id !== me.id && (
                              <Tooltip title="Remove">
                                <IconButton
                                  size="small"
                                  aria-label={`Remove ${u.username}`}
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        `Remove ${displayName(u.username)}? Their orders become unassigned.`,
                                      )
                                    ) {
                                      remove.mutate(u.id);
                                    }
                                  }}
                                >
                                  <DeleteOutline fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </QueryState>
          </CardContent>
        </Card>
      </Stack>
      {dialog?.mode === "create" && <CreateUserDialog onClose={() => setDialog(null)} />}
      {dialog?.mode === "edit" && (
        <EditUserDialog user={dialog.user} onClose={() => setDialog(null)} />
      )}
    </>
  );
}

type FieldProps = ReturnType<ReturnType<typeof useZodForm>["field"]>;

function RoleAndDepartment({ field }: { field: (name: string) => FieldProps }) {
  return (
    <>
      <TextField select fullWidth label="Department" {...field("department")}>
        {DEPARTMENTS.map((d) => (
          <MenuItem key={d} value={d}>
            {LABELS.department[d]}
          </MenuItem>
        ))}
      </TextField>
      <TextField select fullWidth label="Role" {...field("role")}>
        {ROLES.map((r) => (
          <MenuItem key={r} value={r}>
            {LABELS.role[r]}
          </MenuItem>
        ))}
      </TextField>
    </>
  );
}

function CreateUserDialog({ onClose }: { onClose: () => void }) {
  const create = useCreateUser();
  const [error, setError] = useState<string | null>(null);
  const form = useZodForm(createUserSchema, {
    username: "",
    email: "",
    password: "",
    department: "",
    role: "EMPLOYEE",
  });

  const onSubmit = form.handleSubmit(async (input) => {
    try {
      await create.mutateAsync(input);
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        form.applyServerErrors(err);
        setError(err.message);
      }
    }
  });

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <form onSubmit={onSubmit} noValidate>
        <DialogTitle>Add person</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Username"
              placeholder="firstname.lastname"
              autoFocus
              {...form.field("username")}
            />
            <TextField label="Email" type="email" {...form.field("email")} />
            <TextField
              label="Password"
              type="password"
              autoComplete="new-password"
              {...form.field("password")}
            />
            <RoleAndDepartment field={form.field} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={create.isPending}>
            Add
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

function EditUserDialog({ user, onClose }: { user: User; onClose: () => void }) {
  const update = useUpdateUser();
  const [error, setError] = useState<string | null>(null);
  const form = useZodForm(
    updateUserSchema,
    { email: user.email, password: "", department: user.department, role: user.role },
    ({ password, ...rest }) => (password ? { ...rest, password } : rest),
  );

  const onSubmit = form.handleSubmit(async (input) => {
    try {
      await update.mutateAsync({ id: user.id, ...input });
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        form.applyServerErrors(err);
        setError(err.message);
      }
    }
  });

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <form onSubmit={onSubmit} noValidate>
        <DialogTitle>Edit {displayName(user.username)}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="Email" type="email" {...form.field("email")} />
            <TextField
              label="New password"
              type="password"
              autoComplete="new-password"
              {...form.field("password")}
              helperText={
                form.errors.password ?? "Leave empty to keep it. Changing it signs them out."
              }
            />
            <RoleAndDepartment field={form.field} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={update.isPending}>
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
