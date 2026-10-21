import { Button, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router";

export function NotFoundPage() {
  return (
    <Stack spacing={2} alignItems="flex-start" sx={{ py: 8 }}>
      <Typography variant="h4" component="h1" fontWeight={700}>
        Page not found
      </Typography>
      <Typography color="text.secondary">
        That page doesn't exist or you don't have access to it.
      </Typography>
      <Button component={RouterLink} to="/" variant="contained">
        Go home
      </Button>
    </Stack>
  );
}
