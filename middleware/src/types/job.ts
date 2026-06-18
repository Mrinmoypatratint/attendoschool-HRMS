/**
 * Job requisition type definitions.
 *
 * Models job postings/requisitions, their candidate pipeline, and the reusable
 * sequential approval workflow (also used by offers and leave requests).
 * Consumed via named imports and re-exported by the middleware barrel.
 */

/** Lifecycle state of a job requisition, from draft through to closed. */
export type JobStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "open"
  | "on_hold"
  | "closed";

/** Employment arrangement offered by the job. */
export type EmploymentType =
  | "full_time"
  | "part_time"
  | "contract"
  | "internship"
  | "temporary";

/** Where the work is performed. */
export type WorkMode = "remote" | "onsite" | "hybrid";

/** Decision state for an approval step or the overall workflow. */
export type ApprovalDecision = "pending" | "approved" | "rejected";

/** A single step in a sequential approval workflow. */
export interface ApprovalStep {
  approverId: string; // References UserProfile.id / Firebase Auth uid
  approverEmail: string;
  approverName?: string;
  order: number; // 0-based position in the sequence
  status: ApprovalDecision;
  comment?: string;
  decidedAt?: number;
}

/** Embedded approval workflow state, reused by Job requisitions and Offers. */
export interface ApprovalWorkflow {
  required: boolean;
  steps: ApprovalStep[];
  currentStep: number; // index of the step awaiting a decision
  status: ApprovalDecision; // overall workflow status
}

/** Default ordered pipeline stages applied to a new job. */
export const DEFAULT_PIPELINE_STAGES = [
  "Applied",
  "Screening",
  "Interview",
  "Offer",
  "Hired",
  "Rejected",
] as const;

/**
 * A job requisition / posting. Requisitions can require sequential approval
 * before they move to an `open` (publishable) state.
 */
export interface Job {
  id: string;
  tenantId: string;
  title: string;
  departmentId: string;
  location: string;
  workMode: WorkMode;
  employmentType: EmploymentType;
  description: string;
  responsibilities: string;
  requirements: string;
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  openings: number;
  status: JobStatus;
  /** When true (and status is open/approved), the job shows on the public careers page. */
  isPublished: boolean;
  /** Ordered list of pipeline stage names used by this job's candidates. */
  pipelineStages: string[];
  approval: ApprovalWorkflow;
  hiringManagerId?: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}
