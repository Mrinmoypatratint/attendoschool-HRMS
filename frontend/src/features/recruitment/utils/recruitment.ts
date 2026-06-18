/**
 * Recruitment domain logic — pure, side-effect-free helpers shared by the
 * jobs, careers and pipeline UIs and their services.
 *
 * Contains three groups of functions:
 *   1. Search & filter helpers for jobs and candidates.
 *   2. Pipeline stage transition logic (next/prev/validity + status derivation).
 *   3. Multi-step approval workflow construction and decision application.
 *
 * Every function here is deterministic and free of I/O so it can be unit tested
 * in isolation (see recruitment.test.ts).
 */
import type {
  Job,
  JobStatus,
  Candidate,
  CandidateStatus,
  ApprovalWorkflow,
  ApprovalStep,
} from "@hrms/middleware";

/* ------------------------------------------------------------------ */
/*  Search & filter helpers (pure)                                     */
/* ------------------------------------------------------------------ */

/** Optional facets used to narrow a list of jobs ("all" / undefined = no filter). */
export interface JobFilters {
  search?: string;
  status?: JobStatus | "all";
  departmentId?: string | "all";
  employmentType?: string | "all";
  workMode?: string | "all";
}

/** Case-insensitive search of a job's title, location and description. */
export function searchJobs(jobs: Job[], term: string): Job[] {
  const q = term.trim().toLowerCase();
  if (!q) return jobs;
  return jobs.filter((j) =>
    [j.title, j.location, j.description, j.requirements]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(q))
  );
}

/** Apply the full set of job filters (search + facets). */
export function filterJobs(jobs: Job[], filters: JobFilters): Job[] {
  let result = jobs;
  if (filters.search) result = searchJobs(result, filters.search);
  if (filters.status && filters.status !== "all") {
    result = result.filter((j) => j.status === filters.status);
  }
  if (filters.departmentId && filters.departmentId !== "all") {
    result = result.filter((j) => j.departmentId === filters.departmentId);
  }
  if (filters.employmentType && filters.employmentType !== "all") {
    result = result.filter((j) => j.employmentType === filters.employmentType);
  }
  if (filters.workMode && filters.workMode !== "all") {
    result = result.filter((j) => j.workMode === filters.workMode);
  }
  return result;
}

/** Optional facets used to narrow a list of candidates ("all" / undefined = no filter). */
export interface CandidateFilters {
  search?: string;
  status?: CandidateStatus | "all";
  stage?: string | "all";
  jobId?: string | "all";
  source?: string | "all";
  minRating?: number;
}

/** Case-insensitive search across a candidate's name and email. */
export function searchCandidates(candidates: Candidate[], term: string): Candidate[] {
  const q = term.trim().toLowerCase();
  if (!q) return candidates;
  return candidates.filter((c) =>
    [`${c.firstName} ${c.lastName}`, c.email, c.jobTitle]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(q))
  );
}

/** Apply the full set of candidate filters (search + facets). */
export function filterCandidates(candidates: Candidate[], filters: CandidateFilters): Candidate[] {
  let result = candidates;
  if (filters.search) result = searchCandidates(result, filters.search);
  if (filters.status && filters.status !== "all") {
    result = result.filter((c) => c.status === filters.status);
  }
  if (filters.stage && filters.stage !== "all") {
    result = result.filter((c) => c.stage === filters.stage);
  }
  if (filters.jobId && filters.jobId !== "all") {
    result = result.filter((c) => c.jobId === filters.jobId);
  }
  if (filters.source && filters.source !== "all") {
    result = result.filter((c) => c.source === filters.source);
  }
  if (typeof filters.minRating === "number") {
    result = result.filter((c) => (c.rating ?? 0) >= filters.minRating!);
  }
  return result;
}

/** Group candidates by their current pipeline stage. */
export function groupCandidatesByStage(
  candidates: Candidate[],
  stages: string[]
): Record<string, Candidate[]> {
  const grouped: Record<string, Candidate[]> = {};
  for (const stage of stages) grouped[stage] = [];
  for (const c of candidates) {
    if (!grouped[c.stage]) grouped[c.stage] = [];
    grouped[c.stage]!.push(c);
  }
  return grouped;
}

/* ------------------------------------------------------------------ */
/*  Pipeline stage transition logic (pure)                             */
/* ------------------------------------------------------------------ */

/** Returns the stage after `current`, or null if `current` is last/unknown. */
export function getNextStage(stages: string[], current: string): string | null {
  const idx = stages.indexOf(current);
  if (idx === -1 || idx >= stages.length - 1) return null;
  return stages[idx + 1] ?? null;
}

/** Returns the stage before `current`, or null if `current` is first/unknown. */
export function getPrevStage(stages: string[], current: string): string | null {
  const idx = stages.indexOf(current);
  if (idx <= 0) return null;
  return stages[idx - 1] ?? null;
}

/** A move is valid only when the target stage exists in the pipeline and differs from the current one. */
export function canMoveToStage(stages: string[], current: string, target: string): boolean {
  if (current === target) return false;
  return stages.includes(target);
}

/**
 * Derive the candidate status implied by moving to a given stage.
 * "Hired"/"Rejected" terminal stages flip the candidate status accordingly.
 */
export function deriveStatusForStage(stage: string): CandidateStatus {
  const normalized = stage.toLowerCase();
  if (normalized === "hired") return "hired";
  if (normalized === "rejected") return "rejected";
  return "active";
}

/* ------------------------------------------------------------------ */
/*  Approval workflow logic (pure)                                     */
/* ------------------------------------------------------------------ */

/** Build a fresh approval workflow from an ordered list of approvers. */
export function buildApprovalWorkflow(
  approvers: Array<{ approverId: string; approverEmail: string; approverName?: string }>
): ApprovalWorkflow {
  const steps: ApprovalStep[] = approvers.map((a, i) => {
    const step: ApprovalStep = {
      approverId: a.approverId,
      approverEmail: a.approverEmail,
      order: i,
      status: "pending",
    };
    if (a.approverName !== undefined) step.approverName = a.approverName;
    return step;
  });
  return {
    required: steps.length > 0,
    steps,
    currentStep: 0,
    status: steps.length > 0 ? "pending" : "approved",
  };
}

/**
 * Apply a decision to the current step of a workflow, returning a NEW workflow
 * (does not mutate the input).
 * - An approval advances to the next step; approving the last step approves the workflow.
 * - A rejection immediately rejects the whole workflow.
 */
export function applyApprovalDecision(
  workflow: ApprovalWorkflow,
  decision: "approved" | "rejected",
  approverId: string,
  comment?: string,
  now: number = Date.now()
): ApprovalWorkflow {
  if (!workflow.required || workflow.status !== "pending") return workflow;

  const steps = workflow.steps.map((s) => ({ ...s }));
  const step = steps[workflow.currentStep];
  if (!step) return workflow;

  // Only the designated approver for the current step may decide it.
  if (step.approverId !== approverId) return workflow;

  step.status = decision;
  if (comment !== undefined) step.comment = comment;
  step.decidedAt = now;

  if (decision === "rejected") {
    return { ...workflow, steps, status: "rejected" };
  }

  const isLast = workflow.currentStep >= steps.length - 1;
  return {
    ...workflow,
    steps,
    currentStep: isLast ? workflow.currentStep : workflow.currentStep + 1,
    status: isLast ? "approved" : "pending",
  };
}

/** Is the given user the approver responsible for the current pending step? */
export function isCurrentApprover(workflow: ApprovalWorkflow, userId: string): boolean {
  if (!workflow.required || workflow.status !== "pending") return false;
  const step = workflow.steps[workflow.currentStep];
  return !!step && step.approverId === userId && step.status === "pending";
}

/**
 * The approval step currently awaiting a decision (i.e. whose approver the
 * requisition is "pending approval from"), or null when nothing is pending.
 */
export function getCurrentApprover(workflow?: ApprovalWorkflow): ApprovalStep | null {
  if (!workflow || !workflow.required || workflow.status !== "pending") return null;
  const step = workflow.steps[workflow.currentStep];
  return step && step.status === "pending" ? step : null;
}

/** The job status that should follow an approval workflow result. */
export function jobStatusAfterApproval(result: ApprovalWorkflow["status"]): JobStatus {
  if (result === "approved") return "approved";
  if (result === "rejected") return "rejected";
  return "pending_approval";
}
