import {
  Alert,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  MATERIALS,
  MATERIAL_CATEGORIES,
  type MaterialCategory,
  createPurchaseSchema,
} from "@robustify/shared";
import { useState } from "react";
import { useNavigate } from "react-router";
import { ApiError } from "../../api/client";
import { useCreatePurchase } from "../../api/hooks";
import { ContactFields } from "../../components/ContactFields";
import { PageHeader } from "../../components/PageHeader";
import { formatNumber, todayInput } from "../../lib/format";
import { useZodForm } from "../../lib/useZodForm";

const initial = {
  "supplier.name": "",
  "supplier.email": "",
  "supplier.phone": "",
  "supplier.location": "",
  category: "",
  materialType: "",
  quantity: "",
  cost: "",
  purchaseDate: todayInput(),
  expectedArrival: "",
};

type Values = typeof initial;

const toInput = (v: Values) => ({
  supplier: {
    name: v["supplier.name"],
    email: v["supplier.email"],
    phone: v["supplier.phone"],
    location: v["supplier.location"],
  },
  category: v.category,
  materialType: v.materialType,
  quantity: v.quantity,
  cost: v.cost,
  purchaseDate: v.purchaseDate,
  expectedArrival: v.expectedArrival,
});

export function NewPurchasePage() {
  const navigate = useNavigate();
  const createPurchase = useCreatePurchase();
  const [error, setError] = useState<string | null>(null);
  const form = useZodForm(createPurchaseSchema, initial, toInput);
  const category = form.values.category as MaterialCategory | "";
  const material = category ? MATERIALS[category] : null;
  const packs = Number(form.values.quantity);

  const onSubmit = form.handleSubmit(async (input) => {
    setError(null);
    try {
      await createPurchase.mutateAsync(input);
      navigate("/purchases");
    } catch (err) {
      if (err instanceof ApiError) {
        form.applyServerErrors(err);
        setError(err.message);
      }
    }
  });

  return (
    <>
      <PageHeader title="New purchase" subtitle="Order materials from a supplier." />
      <Stack component="form" spacing={2} onSubmit={onSubmit} noValidate sx={{ maxWidth: 880 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
              Supplier
            </Typography>
            <ContactFields field={form.field} prefix="supplier" />
          </CardContent>
        </Card>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
              Material
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Material"
                  {...form.field("category")}
                  onChange={(e) =>
                    form.setValues((v) => ({ ...v, category: e.target.value, materialType: "" }))
                  }
                >
                  {MATERIAL_CATEGORIES.map((c) => (
                    <MenuItem key={c} value={c}>
                      {MATERIALS[c].label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Type"
                  disabled={!material}
                  {...form.field("materialType")}
                >
                  {material &&
                    Object.entries(material.types).map(([key, label]) => (
                      <MenuItem key={key} value={key}>
                        {label}
                      </MenuItem>
                    ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Packs"
                  {...form.field("quantity")}
                  helperText={
                    form.errors.quantity ??
                    (material && packs > 0
                      ? `${formatNumber(packs * material.packSize)} ${material.unit} in total`
                      : material
                        ? `${formatNumber(material.packSize)} ${material.unit} per pack`
                        : undefined)
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth type="number" label="Total cost" {...form.field("cost")} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Ordered on"
                  slotProps={{ inputLabel: { shrink: true } }}
                  {...form.field("purchaseDate")}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Expected arrival"
                  slotProps={{ inputLabel: { shrink: true } }}
                  {...form.field("expectedArrival")}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        <Stack direction="row" spacing={1}>
          <Button type="submit" variant="contained" disabled={createPurchase.isPending}>
            Place purchase
          </Button>
          <Button onClick={() => navigate(-1)}>Cancel</Button>
        </Stack>
      </Stack>
    </>
  );
}
