/**
 * leave (utils)
 * -------------
 * Pure, side-effect-free helpers for the Leave module, shared by the UI and the
 * service layer. Includes: ISO-date/working-day math (UTC based), the accrual
 * engine (periodsElapsed/computeAccrual), balance math
 * (availableBalance/canBook/computeCarryOver), and the generic multi-level
 * approval workflow progression. Keeping these pure makes them directly unit
 * testable.
 */
import type {
  LeavePolicy,
  LeaveBalance,
  ApprovalWorkflow,
  ApprovalStep,
} from "@hrms/middleware";

const DAY_MS = 86400000;

/* ------------------------------------------------------------------ */
/*  Date / working-day helpers                                         */
/* ------------------------------------------------------------------ */

/**
 * Parses an ISO date (YYYY-MM-DD) to its UTC-midnight epoch milliseconds.
 */
export function isoToMs(iso: string): number {
  return new Date(`${iso}T00:00:00Z`).getTime();
}

/**
 * Formats epoch milliseconds back to an ISO date string (YYYY-MM-DD, UTC).
 */
export function msToIso(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * Checks if a given date is a Saturday (6) or Sunday (0) in UTC.
 */
export function isWeekend(iso: string): boolean {
  const d = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return d === 0 || d === 6;
}

/**
 * Inclusive count of working days between two ISO dates, excluding weekends
 * and any dates present in `holidays`. Returns 0 if end < start.
 */
export function workingDaysBetween(startIso: string, endIso: string, holidays: string[] = []): number {
  const start = isoToMs(startIso);
  const end = isoToMs(endIso);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 0;
  
  const holidaySet = new Set(holidays);
  let count = 0;
  for (let t = start; t <= end; t += DAY_MS) {
    const iso = msToIso(t);
    if (!isWeekend(iso) && !holidaySet.has(iso)) {
      count++;
    }
  }
  return count;
}

/* ------------------------------------------------------------------ */
/*  Accrual engine                                                     */
/* ------------------------------------------------------------------ */

function utcYear(ms: number): number {
  return new Date(ms).getUTCFullYear();
}

function monthIndex(ms: number): number {
  const d = new Date(ms);
  return d.getUTCFullYear() * 12 + d.getUTCMonth();
}

/**
 * Calculates completed accrual periods between `fromMs` and `asOfMs` for a method.
 * Pure and deterministic (UTC based).
 */
export function periodsElapsed(method: LeavePolicy["accrualMethod"], fromMs: number, asOfMs: number): number {
  if (asOfMs <= fromMs) return 0;
  switch (method) {
    case "monthly":
      return Math.max(0, monthIndex(asOfMs) - monthIndex(fromMs));
    case "per_pay_period":
      return Math.floor((asOfMs - fromMs) / (14 * DAY_MS));
    case "annual_lump":
      return Math.max(0, utcYear(asOfMs) - utcYear(fromMs));
    case "none":
    default:
      return 0;
  }
}

export interface AccrualResult {
  periods: number;
  accruedDelta: number;
  newAccruedDays: number;
  newLastAccruedAt: number;
}

/**
 * Computes the accrual to apply to a balance as of `asOfMs`.
 * - Uses lastAccruedAt as the baseline (or the policy effectiveFrom on first run).
 * - For annual_lump with no prior accrual, grants one full period immediately.
 * - Caps total accrued at policy.annualCapDays (0 = uncapped).
 */
export function computeAccrual(
  policy: Pick<LeavePolicy, "accrualMethod" | "accrualRateDays" | "annualCapDays" | "effectiveFrom">,
  lastAccruedAtMs: number,
  currentAccruedDays: number,
  asOfMs: number
): AccrualResult {
  const noChange: AccrualResult = {
    periods: 0,
    accruedDelta: 0,
    newAccruedDays: currentAccruedDays,
    newLastAccruedAt: lastAccruedAtMs,
  };
  if (policy.accrualMethod === "none") return noChange;

  const effectiveFromMs = isoToMs(policy.effectiveFrom);
  const base = lastAccruedAtMs > 0 ? lastAccruedAtMs : effectiveFromMs;
  if (Number.isNaN(base) || asOfMs < base) return noChange;

  let periods = periodsElapsed(policy.accrualMethod, base, asOfMs);
  // First annual_lump run grants the current year's allotment immediately.
  if (policy.accrualMethod === "annual_lump" && lastAccruedAtMs === 0 && periods === 0) {
    periods = 1;
  }
  if (periods <= 0) return noChange;

  let newAccrued = currentAccruedDays + periods * policy.accrualRateDays;
  if (policy.annualCapDays > 0) {
    newAccrued = Math.min(newAccrued, policy.annualCapDays);
  }
  const accruedDelta = newAccrued - currentAccruedDays;
  return {
    periods,
    accruedDelta,
    newAccruedDays: newAccrued,
    newLastAccruedAt: asOfMs,
  };
}

/* ------------------------------------------------------------------ */
/*  Balance math                                                       */
/* ------------------------------------------------------------------ */

/**
 * Calculates days currently available to book: accrued + carried over − used − pending.
 */
export function availableBalance(
  b: Pick<LeaveBalance, "accruedDays" | "carriedOverDays" | "usedDays" | "pendingDays">
): number {
  return b.accruedDays + b.carriedOverDays - b.usedDays - b.pendingDays;
}

/**
 * Checks if a given number of days can be booked based on negative-balance rules.
 */
export function canBook(
  b: Pick<LeaveBalance, "accruedDays" | "carriedOverDays" | "usedDays" | "pendingDays">,
  days: number,
  allowNegative: boolean
): boolean {
  if (days <= 0) return false;
  if (allowNegative) return true;
  return availableBalance(b) >= days;
}

/**
 * Computes carry over days: min(remaining available, carryOverCap).
 */
export function computeCarryOver(
  b: Pick<LeaveBalance, "accruedDays" | "carriedOverDays" | "usedDays" | "pendingDays">,
  carryOverCapDays: number
): number {
  const remaining = Math.max(0, availableBalance(b));
  if (carryOverCapDays <= 0) return 0;
  return Math.min(remaining, carryOverCapDays);
}

/* ------------------------------------------------------------------ */
/*  Multi-level approval progression (generic, pure)                   */
/* ------------------------------------------------------------------ */

/**
 * Builds approval workflow states from assigned approver listings.
 */
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
 * Applies approval/rejection decisions to active steps.
 * Rejections reject the workflow immediately; approvals advance steps until final clearance.
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
  if (!step || step.approverId !== approverId) return workflow;

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

/**
 * Checks if a user is the active designated approver.
 */
export function isCurrentApprover(workflow: ApprovalWorkflow, userId: string): boolean {
  if (!workflow.required || workflow.status !== "pending") return false;
  const step = workflow.steps[workflow.currentStep];
  return !!step && step.approverId === userId && step.status === "pending";
}

/**
 * Maps leave workflow state back into status states.
 */
const requestStatusFromApproval = (
  approvalStatus: ApprovalWorkflow["status"]
): "pending" | "approved" | "rejected" => {
  if (approvalStatus === "approved") return "approved";
  if (approvalStatus === "rejected") return "rejected";
  return "pending";
};

export { requestStatusFromApproval };
export default requestStatusFromApproval;
