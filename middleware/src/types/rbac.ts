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
  // Employees / Staff
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
  | "documents.delete"
  // Educational Extensions: Campuses
  | "campuses.view"
  | "campuses.create"
  | "campuses.update"
  | "campuses.delete"
  // Educational Extensions: Staff Attendance
  | "attendance.view"
  | "attendance.mark"
  | "attendance.approve"
  | "attendance.manage"
  // Educational Extensions: Academic Calendar
  | "academic_calendar.view"
  | "academic_calendar.manage"
  // Educational Extensions: Faculty Workload & Scheduling
  | "workload.view"
  | "workload.manage"
  // Educational Extensions: Substitute Assignments
  | "substitutes.view"
  | "substitutes.assign"
  | "substitutes.approve"
  // Educational Extensions: Payroll & Compensation
  | "payroll.view"
  | "payroll.process"
  | "payroll.approve"
  // Educational Extensions: Performance Appraisals
  | "performance.view"
  | "performance.manage"
  | "performance.review"
  // Educational Extensions: Training & Professional Development
  | "training.view"
  | "training.manage"
  // Educational Extensions: Reports & Analytics
  | "reports.view"
  | "reports.export";

export type DataAccessLevel = "all" | "campus" | "department" | "team" | "reports" | "self";

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

export type SystemRoleType =
  | "super_admin"
  | "org_admin"
  | "hr_manager"
  | "recruiter"
  | "employee"
  // Educational Roles
  | "principal"
  | "campus_admin"
  | "hod"
  | "teacher"
  | "non_teaching"
  | "payroll_officer";

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
 */
export const EDITABLE_SYSTEM_ROLES: SystemRoleType[] = [
  "hr_manager",
  "recruiter",
  "employee",
  "principal",
  "campus_admin",
  "hod",
  "teacher",
  "non_teaching",
  "payroll_officer"
];

const ALL_PERMISSIONS: PermissionKey[] = [
  "users.view", "users.create", "users.update", "users.delete",
  "roles.view", "roles.create", "roles.update", "roles.delete",
  "departments.view", "departments.create", "departments.update", "departments.delete",
  "teams.view", "teams.create", "teams.update", "teams.delete",
  "jobs.view", "jobs.create", "jobs.update", "jobs.delete",
  "candidates.view", "candidates.create", "candidates.update", "candidates.delete", "candidates.export",
  "employees.view", "employees.create", "employees.update", "employees.delete",
  "leave.view", "leave.create", "leave.update", "leave.delete", "leave.approve",
  "documents.view", "documents.create", "documents.update", "documents.delete",
  "campuses.view", "campuses.create", "campuses.update", "campuses.delete",
  "attendance.view", "attendance.mark", "attendance.approve", "attendance.manage",
  "academic_calendar.view", "academic_calendar.manage",
  "workload.view", "workload.manage",
  "substitutes.view", "substitutes.assign", "substitutes.approve",
  "payroll.view", "payroll.process", "payroll.approve",
  "performance.view", "performance.manage", "performance.review",
  "training.view", "training.manage",
  "reports.view", "reports.export"
];

export const SYSTEM_ROLES: Record<SystemRoleType, SystemRoleConfig> = {
  super_admin: {
    name: "Super Admin",
    description: "Full control over the entire system. System configurations and global management.",
    permissions: ALL_PERMISSIONS,
    dataAccessLevel: "all"
  },
  org_admin: {
    name: "Institution Admin",
    description: "Administrator access for the specific educational institution.",
    permissions: ALL_PERMISSIONS,
    dataAccessLevel: "all"
  },
  principal: {
    name: "Principal / Director",
    description: "Operational leadership with institution-wide view, approvals, workload monitoring, and reports.",
    permissions: [
      "users.view",
      "departments.view",
      "teams.view",
      "employees.view",
      "campuses.view",
      "attendance.view", "attendance.approve",
      "academic_calendar.view", "academic_calendar.manage",
      "workload.view", "workload.manage",
      "substitutes.view", "substitutes.approve",
      "leave.view", "leave.approve",
      "documents.view",
      "payroll.view",
      "performance.view", "performance.manage",
      "training.view", "training.manage",
      "reports.view", "reports.export"
    ],
    dataAccessLevel: "all"
  },
  campus_admin: {
    name: "Campus Admin",
    description: "Campus-level administrator managing staff, attendance, and campus operations.",
    permissions: [
      "users.view",
      "departments.view",
      "teams.view",
      "employees.view", "employees.create", "employees.update",
      "campuses.view", "campuses.update",
      "attendance.view", "attendance.mark", "attendance.approve", "attendance.manage",
      "academic_calendar.view",
      "workload.view", "workload.manage",
      "substitutes.view", "substitutes.assign", "substitutes.approve",
      "leave.view", "leave.approve",
      "documents.view", "documents.create",
      "reports.view"
    ],
    dataAccessLevel: "campus"
  },
  hod: {
    name: "Head of Department (HOD)",
    description: "Manages departmental faculty, monitors workload, schedules substitutes, and reviews requests.",
    permissions: [
      "users.view",
      "departments.view",
      "teams.view",
      "employees.view",
      "campuses.view",
      "attendance.view", "attendance.approve",
      "academic_calendar.view",
      "workload.view", "workload.manage",
      "substitutes.view", "substitutes.assign",
      "leave.view", "leave.create", "leave.approve",
      "documents.view",
      "performance.view", "performance.review",
      "training.view",
      "reports.view"
    ],
    dataAccessLevel: "department"
  },
  hr_manager: {
    name: "HR Manager",
    description: "Manage staff records, recruitment, leave policies, payroll, training, and compliance.",
    permissions: [
      "users.view", "users.create", "users.update",
      "departments.view", "departments.create", "departments.update", "departments.delete",
      "teams.view", "teams.create", "teams.update", "teams.delete",
      "jobs.view", "jobs.create", "jobs.update",
      "candidates.view", "candidates.create", "candidates.update", "candidates.export",
      "employees.view", "employees.create", "employees.update", "employees.delete",
      "campuses.view", "campuses.create", "campuses.update",
      "attendance.view", "attendance.approve", "attendance.manage",
      "academic_calendar.view", "academic_calendar.manage",
      "workload.view",
      "substitutes.view",
      "leave.view", "leave.create", "leave.update", "leave.delete", "leave.approve",
      "documents.view", "documents.create", "documents.update", "documents.delete",
      "payroll.view", "payroll.process",
      "performance.view", "performance.manage",
      "training.view", "training.manage",
      "reports.view", "reports.export"
    ],
    dataAccessLevel: "all"
  },
  recruiter: {
    name: "Recruiter / Talent Acquisition",
    description: "Manage teaching and non-teaching job requisitions and candidate pipeline.",
    permissions: [
      "users.view",
      "departments.view",
      "campuses.view",
      "jobs.view", "jobs.create", "jobs.update", "jobs.delete",
      "candidates.view", "candidates.create", "candidates.update", "candidates.delete", "candidates.export",
      "employees.view"
    ],
    dataAccessLevel: "all"
  },
  teacher: {
    name: "Teacher / Faculty",
    description: "Faculty self-service: personal records, daily attendance, timetable, leave, and substitution alerts.",
    permissions: [
      "users.view",
      "departments.view",
      "campuses.view",
      "employees.view",
      "attendance.view", "attendance.mark",
      "academic_calendar.view",
      "workload.view",
      "substitutes.view",
      "leave.view", "leave.create",
      "documents.view",
      "performance.view",
      "training.view"
    ],
    dataAccessLevel: "self"
  },
  non_teaching: {
    name: "Non-Teaching Staff",
    description: "Staff self-service for administrative, lab, maintenance, and support personnel.",
    permissions: [
      "users.view",
      "departments.view",
      "campuses.view",
      "employees.view",
      "attendance.view", "attendance.mark",
      "academic_calendar.view",
      "leave.view", "leave.create",
      "documents.view",
      "training.view"
    ],
    dataAccessLevel: "self"
  },
  payroll_officer: {
    name: "Payroll Officer",
    description: "Manages payroll structures, monthly processing, and compensation records without unrelated access.",
    permissions: [
      "users.view",
      "departments.view",
      "campuses.view",
      "employees.view",
      "attendance.view",
      "leave.view",
      "payroll.view", "payroll.process", "payroll.approve",
      "reports.view", "reports.export"
    ],
    dataAccessLevel: "all"
  },
  employee: {
    name: "Employee (Legacy)",
    description: "Standard access for personal records, leave requests, and institutional directory.",
    permissions: [
      "users.view",
      "departments.view",
      "teams.view",
      "jobs.view",
      "employees.view",
      "attendance.view", "attendance.mark",
      "academic_calendar.view",
      "leave.view", "leave.create",
      "documents.view"
    ],
    dataAccessLevel: "self"
  }
};

