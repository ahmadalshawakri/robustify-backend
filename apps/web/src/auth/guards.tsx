import type { Role } from "@robustify/shared";
import { Navigate, Outlet, useLocation } from "react-router";
import { FullPageSpinner } from "../components/FullPageSpinner";
import { useAuth } from "./AuthProvider";

/** Renders child routes for signed-in users, otherwise sends them to sign in. */
export function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageSpinner />;
  if (!user) {
    const from = location.pathname + location.search;
    return (
      <Navigate to={`/login${from === "/" ? "" : `?from=${encodeURIComponent(from)}`}`} replace />
    );
  }
  return <Outlet />;
}

export function RequireRole({ role }: { role: Role }) {
  const { user } = useAuth();
  return user?.role === role ? <Outlet /> : <Navigate to="/" replace />;
}

/** Each role lands on its own home page. */
export function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user?.role === "ADMIN" ? "/dashboard" : "/my-work"} replace />;
}
