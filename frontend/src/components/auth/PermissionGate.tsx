/**
 * PermissionGate
 * --------------
 * Conditionally renders UI based on the current user's granular RBAC
 * permissions. Use it to hide actions/sections a user is not allowed to see
 * without changing routing. Unlike `ProtectedRoute`, it never redirects — it
 * simply renders a fallback (or nothing) when permission is missing.
 */
import { ReactNode } from "react";
import { useHasPermission } from "../../features/rbac/hooks/usePermissions";
import type { PermissionKey } from "@hrms/middleware";

interface PermissionGateProps {
  /** The permission key the current user must hold to see `children`. */
  permission: PermissionKey;
  /** Content shown when the user has the required permission. */
  children: ReactNode;
  /** Optional content shown when the user lacks the permission (defaults to nothing). */
  fallback?: ReactNode;
}

/**
 * Enterprise Permission Gate to conditionally render children based on user permissions.
 *
 * @param permission - The granular permission required to render `children`.
 * @param children - Content rendered when the permission check passes.
 * @param fallback - Content rendered when the permission check fails (defaults to `null`).
 * @returns The children when permitted, otherwise the fallback.
 */
export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const hasPermission = useHasPermission();

  // Render the fallback when the active user lacks the required permission.
  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default PermissionGate;
