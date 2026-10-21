import { Card, CardContent, Typography } from "@mui/material";
import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "warning" | "error";
}) {
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography
          variant="h4"
          component="p"
          fontWeight={700}
          sx={{ mt: 0.5, color: tone ? `${tone}.main` : "text.primary" }}
        >
          {value}
        </Typography>
        {hint && (
          <Typography variant="caption" color="text.secondary">
            {hint}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
