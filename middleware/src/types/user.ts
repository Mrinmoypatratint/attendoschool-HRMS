/**
 * User type definitions.
 *
 * Models the cross-tenant user profile, each user's per-tenant membership
 * (role + status), and pending invitations. Consumed via named imports and
 * re-exported by the middleware barrel.
 */

import { SystemRoleType } from "./rbac";

/** Membership lifecycle state of a user within a single tenant. */
export type UserTenantStatus = "invited" | "active" | "disabled";

/** A user's role and membership status for one tenant. */
export interface UserTenantInfo {
  role: SystemRoleType | string; // maps to system role name or custom role ID
  status: UserTenantStatus;
  invitedAt?: number;
  joinedAt?: number;
}

/**
 * Top-level user profile (one document per Firebase Auth user). A single user
 * can belong to multiple tenants; `tenants` maps tenantId -> membership info and
 * `activeTenantId` records the currently selected tenant.
 */
export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  createdAt: number;
  updatedAt: number;
  activeTenantId: string | null;
  tenants: Record<string, UserTenantInfo>; // Map of tenantId -> Role and Status
}

/** A pending/accepted/expired invitation for a user to join a tenant. */
export interface UserInvitation {
  id: string; // generated ID or matching email
  email: string;
  tenantId: string;
  role: SystemRoleType | string;
  invitedBy: string; // User ID who invited
  createdAt: number;
  status: "pending" | "accepted" | "expired";
}
