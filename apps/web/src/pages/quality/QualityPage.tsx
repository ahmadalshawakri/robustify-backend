import { DeleteOutline } from "@mui/icons-material";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Grid,
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
  useTheme,
} from "@mui/material";
import {
  LABELS,
  QUALITY_COST_CATEGORIES,
  QUALITY_KIND,
  createQualityCostSchema,
} from "@robustify/shared";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ApiError } from "../../api/client";
import { useCreateQualityCost, useDeleteQualityCost, useQualityReport } from "../../api/hooks";
import { PageHeader } from "../../components/PageHeader";
import { QueryState } from "../../components/QueryState";
import { StatCard } from "../../components/StatCard";
import { formatMoney, formatMonth } from "../../lib/format";
import { useZodForm } from "../../lib/useZodForm";

const MONTHS = 6;
const percent = (ratio: number) => `${Math.round(ratio * 100)}%`;

export function QualityPage() {
  const theme = useTheme();
  const report = useQualityReport(MONTHS);
  const remove = useDeleteQualityCost();

  return (
    <>
      <PageHeader
        title="Cost of quality"
        subtitle="What preventing defects costs, against what defects cost. Complaint costs count as poor quality."
      />
      <QueryState query={report}>
        {(data) => (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <StatCard
                label="Poor quality share"
                value={percent(data.totals.poorRatio)}
                tone={data.totals.poorRatio > 0.5 ? "error" : undefined}
                hint={`of quality spending, last ${MONTHS} months`}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <StatCard
                label="Good quality"
                value={formatMoney(data.totals.good)}
                hint="prevention and inspection"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <StatCard
                label="Poor quality"
                value={formatMoney(data.totals.poor)}
                hint="defects, rework, complaints"
              />
            </Grid>
            <Grid size={{ xs: 12, lg: 7 }}>
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="h6" component="h2">
                    By month
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
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
                      <ChartTooltip
                        cursor={{ fill: theme.palette.action.hover }}
                        formatter={(value: number) => formatMoney(value)}
                      />
                      <Legend />
                      <Bar
                        dataKey="good"
                        name="Good quality"
                        fill={theme.palette.success.main}
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar
                        dataKey="poor"
                        name="Poor quality"
                        fill={theme.palette.error.main}
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, lg: 5 }}>
              <AddCostCard />
            </Grid>
            <Grid size={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
                    Entries
                  </Typography>
                  {data.entries.length === 0 ? (
                    <Typography color="text.secondary">Nothing recorded in this period.</Typography>
                  ) : (
                    <TableContainer>
                      <Table size="small" sx={{ minWidth: 560 }}>
                        <TableHead>
                          <TableRow>
                            <TableCell>Month</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell>Kind</TableCell>
                            <TableCell>Note</TableCell>
                            <TableCell align="right">Amount</TableCell>
                            <TableCell />
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {data.entries.map((e) => (
                            <TableRow key={e.id}>
                              <TableCell>{formatMonth(e.month)}</TableCell>
                              <TableCell>{LABELS.qualityCostCategory[e.category]}</TableCell>
                              <TableCell
                                sx={{ color: e.kind === "GOOD" ? "success.main" : "error.main" }}
                              >
                                {e.kind === "GOOD" ? "Good" : "Poor"}
                              </TableCell>
                              <TableCell>{e.note ?? "—"}</TableCell>
                              <TableCell align="right">{formatMoney(e.amount)}</TableCell>
                              <TableCell align="right">
                                <Tooltip title="Delete">
                                  <IconButton
                                    size="small"
                                    aria-label={`Delete ${LABELS.qualityCostCategory[e.category]} entry`}
                                    onClick={() => remove.mutate(e.id)}
                                  >
                                    <DeleteOutline fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </QueryState>
    </>
  );
}

function AddCostCard() {
  const create = useCreateQualityCost();
  const [error, setError] = useState<string | null>(null);
  const initial = {
    month: new Date().toISOString().slice(0, 7),
    category: "",
    amount: "",
    note: "",
  };
  const form = useZodForm(createQualityCostSchema, initial);

  const onSubmit = form.handleSubmit(async (input) => {
    setError(null);
    try {
      await create.mutateAsync(input);
      form.setValues((v) => ({ ...v, amount: "", note: "" }));
    } catch (err) {
      if (err instanceof ApiError) {
        form.applyServerErrors(err);
        setError(err.message);
      }
    }
  });

  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
          Record a cost
        </Typography>
        <Stack component="form" spacing={2} onSubmit={onSubmit} noValidate>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            type="month"
            label="Month"
            slotProps={{ inputLabel: { shrink: true } }}
            {...form.field("month")}
          />
          <TextField select label="Category" {...form.field("category")}>
            {QUALITY_COST_CATEGORIES.map((c) => (
              <MenuItem key={c} value={c}>
                {LABELS.qualityCostCategory[c]} ({QUALITY_KIND[c] === "GOOD" ? "good" : "poor"}{" "}
                quality)
              </MenuItem>
            ))}
          </TextField>
          <TextField type="number" label="Amount" {...form.field("amount")} />
          <TextField label="Note (optional)" {...form.field("note")} />
          <Button
            type="submit"
            variant="contained"
            disabled={create.isPending}
            sx={{ alignSelf: "flex-start" }}
          >
            Add
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
