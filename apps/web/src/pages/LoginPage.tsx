import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from "@mui/material";
import { loginSchema } from "@robustify/shared";
import { useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthProvider";
import { useZodForm } from "../lib/useZodForm";

/** Only same-site paths are honoured, so a crafted link cannot bounce users elsewhere. */
function safeRedirect(from: string | null) {
  return from && from.startsWith("/") && !from.startsWith("//") ? from : "/";
}

export function LoginPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const form = useZodForm(loginSchema, { username: "", password: "" });

  if (user) return <Navigate to={safeRedirect(params.get("from"))} replace />;

  const onSubmit = form.handleSubmit(async (input) => {
    setError(null);
    setSubmitting(true);
    try {
      await signIn(input);
      navigate(safeRedirect(params.get("from")), { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sign-in failed");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", px: 2, py: 6 }}>
      <Stack spacing={3} sx={{ width: "100%", maxWidth: 400 }}>
        <Stack alignItems="center" spacing={1}>
          <Box component="img" src="/logo.png" alt="" sx={{ width: 56, height: 56 }} />
          <Typography variant="h4" component="h1" fontWeight={700}>
            Robustify
          </Typography>
          <Typography color="text.secondary" textAlign="center">
            Run your printing press from order to delivery.
          </Typography>
        </Stack>
        <Card variant="outlined">
          <CardContent sx={{ p: 3 }}>
            <Stack component="form" spacing={2} onSubmit={onSubmit} noValidate>
              <Typography variant="h6" component="h2">
                Sign in
              </Typography>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField
                label="Username"
                autoComplete="username"
                placeholder="firstname.lastname"
                autoFocus
                {...form.field("username")}
              />
              <TextField
                label="Password"
                type="password"
                autoComplete="current-password"
                {...form.field("password")}
              />
              <Button type="submit" variant="contained" size="large" disabled={submitting}>
                {submitting ? "Signing in…" : "Sign in"}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
