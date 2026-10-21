import { Box, CircularProgress } from "@mui/material";

export function FullPageSpinner() {
  return (
    <Box sx={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
      <CircularProgress aria-label="Loading" />
    </Box>
  );
}
