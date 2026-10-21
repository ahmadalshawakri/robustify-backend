import { Alert, Box, Button, CircularProgress, Typography } from "@mui/material";
import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ApiError } from "../api/client";

/** Loading, error and empty states for a query, so pages only render the happy path. */
export function QueryState<T>({
  query,
  empty,
  isEmpty = (data) => Array.isArray(data) && data.length === 0,
  children,
}: {
  query: UseQueryResult<T>;
  empty?: ReactNode;
  isEmpty?: (data: T) => boolean;
  children: (data: T) => ReactNode;
}) {
  if (query.isPending) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 8 }}>
        <CircularProgress aria-label="Loading" />
      </Box>
    );
  }
  if (query.isError) {
    // Retrying only helps when the server or network failed, not for "not found" and friends.
    const retryable = !(query.error instanceof ApiError && query.error.status < 500);
    return (
      <Alert
        severity="error"
        action={
          retryable && (
            <Button color="inherit" size="small" onClick={() => query.refetch()}>
              Retry
            </Button>
          )
        }
      >
        {query.error.message}
      </Alert>
    );
  }
  if (empty && isEmpty(query.data)) {
    return (
      <Typography color="text.secondary" sx={{ py: 6, textAlign: "center" }}>
        {empty}
      </Typography>
    );
  }
  return <>{children(query.data)}</>;
}
