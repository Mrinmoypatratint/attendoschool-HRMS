/* ------------------------------------------------------------------ */
/*  Contracts                                                          */
/* ------------------------------------------------------------------ */

export type ContractType =
  | "full_time"
  | "part_time"
  | "contract"
  | "internship"
  | "temporary"
  | "probation";

export type ContractStatus = "draft" | "active" | "expired" | "terminated";

export interface EmployeeContract {
  id: string;
  tenantId: string;
  employeeId: string;
  title: string;
  type: ContractType;
  startDate: string; // ISO date (YYYY-MM-DD)
  endDate?: string; // ISO date; empty/undefined => open-ended
  salary: number;
  currency: string;
  status: ContractStatus;
  /** Public download URL of an uploaded signed contract document. */
  documentUrl?: string;
  /** Storage path of the document (for deletion). */
  documentPath?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

/* ------------------------------------------------------------------ */
/*  Emergency contacts                                                 */
/* ------------------------------------------------------------------ */

export type ContactRelationship =
  | "spouse"
  | "parent"
  | "sibling"
  | "child"
  | "friend"
  | "other";

export interface EmergencyContact {
  id: string;
  tenantId: string;
  employeeId: string;
  name: string;
  relationship: ContactRelationship;
  phone: string;
  email?: string;
  address?: string;
  isPrimary: boolean;
  createdAt: number;
  updatedAt: number;
}

/* ------------------------------------------------------------------ */
/*  Employment history (internal role/comp changes)                    */
/* ------------------------------------------------------------------ */

export type EmploymentChangeType =
  | "hired"
  | "promotion"
  | "transfer"
  | "title_change"
  | "compensation_change"
  | "department_change"
  | "manager_change"
  | "offboarded";

export interface EmploymentHistoryEntry {
  id: string;
  tenantId: string;
  employeeId: string;
  changeType: EmploymentChangeType;
  title: string; // resulting job title
  departmentId?: string;
  managerId?: string;
  salary?: number;
  effectiveDate: string; // ISO date
  note?: string;
  createdAt: number;
  updatedAt: number;
}

/* ------------------------------------------------------------------ */
/*  Assets                                                             */
/* ------------------------------------------------------------------ */

export type AssetType =
  | "laptop"
  | "desktop"
  | "monitor"
  | "phone"
  | "tablet"
  | "access_card"
  | "vehicle"
  | "other";

export type AssetStatus = "assigned" | "returned" | "lost" | "damaged";

export interface EmployeeAsset {
  id: string;
  tenantId: string;
  employeeId: string;
  name: string;
  assetType: AssetType;
  serialNumber?: string;
  assignedDate: string; // ISO date
  returnedDate?: string; // ISO date
  status: AssetStatus;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

/* ------------------------------------------------------------------ */
/*  Lifecycle events                                                   */
/* ------------------------------------------------------------------ */

export type LifecycleStage =
  | "applicant"
  | "onboarding"
  | "active"
  | "on_leave"
  | "offboarding"
  | "terminated";

export interface LifecycleEvent {
  id: string;
  tenantId: string;
  employeeId: string;
  stage: LifecycleStage;
  effectiveDate: string; // ISO date
  note?: string;
  createdBy: string;
  createdAt: number;
}
