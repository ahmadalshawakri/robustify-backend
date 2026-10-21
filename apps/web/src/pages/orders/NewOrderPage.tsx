import {
  Alert,
  Button,
  Card,
  CardContent,
  Grid,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { MATERIALS, PAPER_TYPES, createOrderSchema } from "@robustify/shared";
import { useState } from "react";
import { useNavigate } from "react-router";
import { ApiError } from "../../api/client";
import { useCreateOrder } from "../../api/hooks";
import { ContactFields } from "../../components/ContactFields";
import { PageHeader } from "../../components/PageHeader";
import { useZodForm } from "../../lib/useZodForm";

const initial = {
  "customer.name": "",
  "customer.email": "",
  "customer.phone": "",
  "customer.location": "",
  paperType: "",
  quantity: "",
  widthMm: "",
  heightMm: "",
  deadline: "",
  consumption: "",
  cost: "",
};

type Values = typeof initial;

const toInput = (v: Values) => ({
  customer: {
    name: v["customer.name"],
    email: v["customer.email"],
    phone: v["customer.phone"],
    location: v["customer.location"],
  },
  paperType: v.paperType,
  quantity: v.quantity,
  widthMm: v.widthMm,
  heightMm: v.heightMm,
  deadline: v.deadline || undefined,
  consumption: v.consumption,
  cost: v.cost,
});

export function NewOrderPage() {
  const navigate = useNavigate();
  const createOrder = useCreateOrder();
  const [error, setError] = useState<string | null>(null);
  const form = useZodForm(createOrderSchema, initial, toInput);

  const onSubmit = form.handleSubmit(async (input) => {
    setError(null);
    try {
      const { order } = await createOrder.mutateAsync(input);
      navigate(`/orders/${order.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        form.applyServerErrors(err);
        setError(err.message);
      }
    }
  });

  return (
    <>
      <PageHeader
        title="New order"
        subtitle="It starts as Not started; move it to design from the order page."
      />
      <Stack component="form" spacing={2} onSubmit={onSubmit} noValidate sx={{ maxWidth: 880 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
              Customer
            </Typography>
            <ContactFields field={form.field} prefix="customer" />
            <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1 }}>
              An existing customer is matched by email and their details updated.
            </Typography>
          </CardContent>
        </Card>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
              Job
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField select fullWidth label="Paper" {...form.field("paperType")}>
                  {PAPER_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {MATERIALS.PAPER.types[type]}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Quantity" type="number" {...form.field("quantity")} />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField
                  fullWidth
                  label="Width"
                  type="number"
                  slotProps={{
                    input: { endAdornment: <InputAdornment position="end">mm</InputAdornment> },
                  }}
                  {...form.field("widthMm")}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField
                  fullWidth
                  label="Height"
                  type="number"
                  slotProps={{
                    input: { endAdornment: <InputAdornment position="end">mm</InputAdornment> },
                  }}
                  {...form.field("heightMm")}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Deadline"
                  type="date"
                  slotProps={{ inputLabel: { shrink: true } }}
                  {...form.field("deadline")}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Paper needed"
                  type="number"
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">{MATERIALS.PAPER.unit}</InputAdornment>
                      ),
                    },
                  }}
                  {...form.field("consumption")}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Material cost" type="number" {...form.field("cost")} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        <Stack direction="row" spacing={1}>
          <Button type="submit" variant="contained" disabled={createOrder.isPending}>
            Create order
          </Button>
          <Button onClick={() => navigate(-1)}>Cancel</Button>
        </Stack>
      </Stack>
    </>
  );
}
