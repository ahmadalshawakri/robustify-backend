import { Box, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      justifyContent="space-between"
      alignItems={{ xs: "flex-start", sm: "center" }}
      sx={{ mb: 3 }}
    >
      <Box>
        <Typography variant="h4" component="h1" fontWeight={700}>
          {title}
        </Typography>
        {subtitle && (
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && (
        <Stack direction="row" spacing={1}>
          {actions}
        </Stack>
      )}
    </Stack>
  );
}
