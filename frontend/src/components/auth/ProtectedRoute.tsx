/**
 * ProtectedRoute
 * --------------
 * Route-level guard that combines authentication and (optionally) a granular
 * permission check. Used to wrap route elements so unauthenticated users are
 * redirected to login and authenticated-but-unauthorized users are redirected
 * to the dashboard.
 */
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../features/auth/context/AuthContext";
import { useHasPermission } from "../../features/rbac/hooks/usePermissions";
import type { PermissionKey } from "@hrms/middleware";
import { LoadingScreen } from "../ui/LoadingScreen";

interface ProtectedRouteProps {
  /** The route content to render when access checks pass. */
  children: ReactNode;
  /** Optional permission required to access the route; when omitted, only auth is checked. */
  permission?: PermissionKey;
}

/**
 * Route protection guard that checks both authentication and granular permission requirements.
 *
 * @param children - The route content to render when access is granted.
 * @param permission - Optional permission key; if provided and missing, the user is redirected to `/dashboard`.
 * @returns A loading screen while auth resolves, a redirect to `/login` (unauthenticated)
 *          or `/dashboard` (unauthorized), or the children when access is granted.
 */
export function ProtectedRoute({ children, permission }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const hasPermission = useHasPermission();

  // Auth state not yet resolved — wait before deciding on redirects.
  if (loading) {
    return <LoadingScreen title="Verifying authorization..." />;
  }

  // Not signed in — send to login.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Signed in but lacking the required permission — bounce to the dashboard.
  if (permission && !hasPermission(permission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
