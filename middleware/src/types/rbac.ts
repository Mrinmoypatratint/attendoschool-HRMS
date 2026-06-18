export type PermissionKey =
  // Users
  | "users.view"
  | "users.create"
  | "users.update"
  | "users.delete"
  // Roles
  | "roles.view"
  | "roles.create"
  | "roles.update"
  | "roles.delete"
  // Departments
  | "departments.view"
  | "departments.create"
  | "departments.update"
  | "departments.delete"
  // Teams
  | "teams.view"
  | "teams.create"
  | "teams.update"
  | "teams.delete"
  // Jobs
  | "jobs.view"
  | "jobs.create"
  | "jobs.update"
  | "jobs.delete"
  // Candidates
  | "candidates.view"
  | "candidates.create"
  | "candidates.update"
  | "candidates.delete"
  | "candidates.export"
  // Employees
  | "employees.view"
  | "employees.create"
  | "employees.update"
  | "employees.delete"
  // Leave
  | "leave.view"
  | "leave.create"
  | "leave.update"
  | "leave.delete"
  | "leave.approve"
  // Documents
  | "documents.view"
  | "documents.create"
  | "documents.update"
  | "documents.delete";

export type DataAccessLevel = "all" | "department" | "team" | "reports" | "self";

export interface Role {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  isSystemRole: boolean;
  permissions: PermissionKey[];
  dataAccessLevel: DataAccessLevel;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Permission {
  id: string;
  module: string;
  resource: string;
  action: string;
  key: PermissionKey;
}

export interface UserRole {
  id: string; // `${tenantId}_${userId}`
  userId: string;
  tenantId: string;
  roleIds: string[];
  updatedAt: number;
}

export type SystemRoleType = "super_admin" | "org_admin" | "hr_manager" | "recruiter" | "employee";

export interface SystemRoleConfig {
  name: string;
  description: string;
  permissions: PermissionKey[];
  dataAccessLevel: DataAccessLevel;
}

/**
 * Tenant-scoped override of a system role's permission matrix.
 *
 * System roles (e.g. `employee`) ship with a hardcoded default permission set
 * (see SYSTEM_ROLES). Org/Super admins may tailor a system role's permissions
 * for their organization; that customization is persisted as a SystemRoleOverride
 * document in the `roleOverrides` collection. When an override exists it replaces
 * the default `permissions` for that role within the tenant. The role's
 * `dataAccessLevel` is not overridable and always comes from SYSTEM_ROLES.
 */
export interface SystemRoleOverride {
  id: string; // `${tenantId}_${systemRoleType}`
  tenantId: string;
  systemRoleType: SystemRoleType;
  permissions: PermissionKey[];
  updatedAt: number;
}

/**
 * Deterministic document id for a tenant's system-role override.
 * Shared by the client (read/write) and mirrored by Firestore security rules.
 */
export function getSystemRoleOverrideId(
  tenantId: string,
  systemRoleType: SystemRoleType
): string {
  return `${tenantId}_${systemRoleType}`;
}

/**
 * System roles whose permission matrix tenant admins (Org/Super Admin) are
 * allowed to customize per tenant.
 *
 * The operational roles (HR Manager, Recruiter, Employee) are customizable.
 * The privileged roles `super_admin` and `org_admin` are intentionally EXCLUDED
 * and remain locked: stripping permissions from them could lock an entire
 * organization out of administration, so they are protected by design.
 */
export const EDITABLE_SYSTEM_ROLES: SystemRoleType[] = ["hr_manager", "recruiter", "employee"];

export const SYSTEM_ROLES: Record<SystemRoleType, SystemRoleConfig> = {
  super_admin: {
    name: "Super Admin",
    description: "Full control over the entire system. System configurations and global management.",
    permissions: [
      "users.view", "users.create", "users.update", "users.delete",
      "roles.view", "roles.create", "roles.update", "roles.delete",
      "departments.view", "departments.create", "departments.update", "departments.delete",
      "teams.view", "teams.create", "teams.update", "teams.delete",
      "jobs.view", "jobs.create", "jobs.update", "jobs.delete",
      "candidates.view", "candidates.create", "candidates.update", "candidates.delete", "candidates.export",
      "employees.view", "employees.create", "employees.update", "employees.delete",
      "leave.view", "leave.create", "leave.update", "leave.delete", "leave.approve",
      "documents.view", "documents.create", "documents.update", "documents.delete"
    ],
    dataAccessLevel: "all"
  },
  org_admin: {
    name: "Org Admin",
    description: "Administrator access for the specific tenant organization.",
    permissions: [
      "users.view", "users.create", "users.update", "users.delete",
      "roles.view", "roles.create", "roles.update", "roles.delete",
      "departments.view", "departments.create", "departments.update", "departments.delete",
      "teams.view", "teams.create", "teams.update", "teams.delete",
      "jobs.view", "jobs.create", "jobs.update", "jobs.delete",
      "candidates.view", "candidates.create", "candidates.update", "candidates.delete", "candidates.export",
      "employees.view", "employees.create", "employees.update", "employees.delete",
      "leave.view", "leave.create", "leave.update", "leave.delete", "leave.approve",
      "documents.view", "documents.create", "documents.update", "documents.delete"
    ],
    dataAccessLevel: "all"
  },
  hr_manager: {
    name: "HR Manager",
    description: "Manage employee profiles, leave requests, departments, and view candidates.",
    permissions: [
      "users.view", "users.create", "users.update",
      "departments.view", "departments.create", "departments.update", "departments.delete",
      "teams.view", "teams.create", "teams.update", "teams.delete",
      "jobs.view",
      "candidates.view",
      "employees.view", "employees.create", "employees.update", "employees.delete",
      "leave.view", "leave.create", "leave.update", "leave.delete", "leave.approve",
      "documents.view", "documents.create", "documents.update", "documents.delete"
    ],
    dataAccessLevel: "all"
  },
  recruiter: {
    name: "Recruiter",
    description: "Manage job postings and candidates.",
    permissions: [
      "users.view",
      "departments.view",
      "jobs.view", "jobs.create", "jobs.update", "jobs.delete",
      "candidates.view", "candidates.create", "candidates.update", "candidates.delete", "candidates.export",
      "employees.view"
    ],
    dataAccessLevel: "all"
  },
  employee: {
    name: "Employee",
    description: "Standard access for personal records, leave requests, and company directory.",
    permissions: [
      "users.view",
      "departments.view",
      "teams.view",
      "jobs.view",
      "employees.view",
      "leave.view", "leave.create",
      "documents.view"
    ],
    dataAccessLevel: "self"
  }
};

