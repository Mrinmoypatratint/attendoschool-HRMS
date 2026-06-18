import { useAuth } from "../../auth/context/AuthContext";
import type { PermissionKey } from "@hrms/middleware";

/**
 * Reusable hook to check if the current user has a specific granular permission key.
 */
export function useHasPermission() {
  const { permissions } = useAuth();
  
  return (permission: PermissionKey): boolean => {
    return permissions.includes(permission);
  };
}

/**
 * Reusable hook to check if the current user can view a specific resource.
 */
export function useCanView() {
  const hasPermission = useHasPermission();
  
  return (resource: string): boolean => {
    return hasPermission(`${resource}.view` as PermissionKey);
  };
}

/**
 * Reusable hook to check if the current user can update or modify a specific resource.
 */
export function useCanEdit() {
  const hasPermission = useHasPermission();
  
  return (resource: string): boolean => {
    return (
      hasPermission(`${resource}.update` as PermissionKey) ||
      hasPermission(`${resource}.create` as PermissionKey)
    );
  };
}

/**
 * Reusable hook to check if the current user can delete a specific resource.
 */
export function useCanDelete() {
  const hasPermission = useHasPermission();
  
  return (resource: string): boolean => {
    return hasPermission(`${resource}.delete` as PermissionKey);
  };
}
