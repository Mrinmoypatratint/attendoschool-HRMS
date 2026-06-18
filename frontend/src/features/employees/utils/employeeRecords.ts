import type {
  EmployeeContract,
  ContractStatus,
  EmergencyContact,
  EmploymentHistoryEntry,
  EmployeeAsset,
  LifecycleEvent,
  LifecycleStage,
} from "@hrms/middleware";

/* ------------------------------------------------------------------ */
/*  Date helpers                                                       */
/* ------------------------------------------------------------------ */

/**
 * Parses an ISO date string (YYYY-MM-DD) into epoch milliseconds.
 * Returns NaN if empty or invalid.
 */
export function isoToMs(iso?: string): number {
  if (!iso) return NaN;
  const ms = new Date(iso).getTime();
  return Number.isNaN(ms) ? NaN : ms;
}

/* ------------------------------------------------------------------ */
/*  Contracts                                                          */
/* ------------------------------------------------------------------ */

/**
 * Derives the contract status based on current date boundaries
 * unless explicitly set to a static state like draft or terminated.
 */
export function deriveContractStatus(
  contract: Pick<EmployeeContract, "status" | "startDate" | "endDate">,
  now: number = Date.now()
): ContractStatus {
  if (contract.status === "draft" || contract.status === "terminated") {
    return contract.status;
  }
  const start = isoToMs(contract.startDate);
  const end = isoToMs(contract.endDate);
  
  if (!Number.isNaN(end) && end < now) return "expired";
  if (!Number.isNaN(start) && start > now) return "draft"; // not yet started
  return "active";
}

/**
 * Checks if the given contract is currently active.
 */
export function isContractActive(
  contract: Pick<EmployeeContract, "status" | "startDate" | "endDate">,
  now: number = Date.now()
): boolean {
  return deriveContractStatus(contract, now) === "active";
}

/**
 * Returns the single active contract with the most recent start date, or null.
 */
export function getActiveContract(
  contracts: EmployeeContract[],
  now: number = Date.now()
): EmployeeContract | null {
  const active = contracts
    .filter((c) => isContractActive(c, now))
    .sort((a, b) => isoToMs(b.startDate) - isoToMs(a.startDate));
  return active[0] ?? null;
}

/* ------------------------------------------------------------------ */
/*  Emergency contacts                                                 */
/* ------------------------------------------------------------------ */

/**
 * Returns the primary contact if flagged, otherwise falls back to the first contact or null.
 */
export function getPrimaryContact(contacts: EmergencyContact[]): EmergencyContact | null {
  return contacts.find((c) => c.isPrimary) ?? contacts[0] ?? null;
}

/**
 * Sets a single contact as the primary contact, clearing the primary flag on all others.
 * Pure function returning a new array.
 */
export function applyPrimarySelection(
  contacts: EmergencyContact[],
  primaryId: string
): EmergencyContact[] {
  return contacts.map((c) => ({ ...c, isPrimary: c.id === primaryId }));
}

/* ------------------------------------------------------------------ */
/*  Employment history                                                 */
/* ------------------------------------------------------------------ */

/**
 * Sorts employment history entries newest-effective first.
 */
export function sortHistory(entries: EmploymentHistoryEntry[]): EmploymentHistoryEntry[] {
  return [...entries].sort((a, b) => isoToMs(b.effectiveDate) - isoToMs(a.effectiveDate));
}

/**
 * Returns the job title from the most recent employment history entry, or null.
 */
export function latestTitle(entries: EmploymentHistoryEntry[]): string | null {
  const sorted = sortHistory(entries);
  return sorted[0]?.title ?? null;
}

/* ------------------------------------------------------------------ */
/*  Assets                                                             */
/* ------------------------------------------------------------------ */

/**
 * Filters assets currently assigned to the employee.
 */
export function activeAssets(assets: EmployeeAsset[]): EmployeeAsset[] {
  return assets.filter((a) => a.status === "assigned");
}

/**
 * Counts assets flagged as lost or damaged.
 */
export function flaggedAssetCount(assets: EmployeeAsset[]): number {
  return assets.filter((a) => a.status === "lost" || a.status === "damaged").length;
}

/* ------------------------------------------------------------------ */
/*  Lifecycle                                                          */
/* ------------------------------------------------------------------ */

/**
 * Sorts employee lifecycle events newest-effective first (falls back to createdAt).
 */
export function sortLifecycle(events: LifecycleEvent[]): LifecycleEvent[] {
  return [...events].sort((a, b) => {
    const d = isoToMs(b.effectiveDate) - isoToMs(a.effectiveDate);
    if (d !== 0) return d;
    return b.createdAt - a.createdAt;
  });
}

/**
 * Derives the current lifecycle stage from the most recent lifecycle event.
 */
export function deriveCurrentStage(events: LifecycleEvent[]): LifecycleStage | null {
  return sortLifecycle(events)[0]?.stage ?? null;
}

/**
 * Canonical order of stages in an employee's lifecycle.
 */
export const LIFECYCLE_ORDER: LifecycleStage[] = [
  "applicant",
  "onboarding",
  "active",
  "on_leave",
  "offboarding",
  "terminated",
];

/**
 * Checks if a state transition is a forward (progressive) transition.
 * Allows active <-> on_leave in both directions.
 */
const isForwardTransition = (from: LifecycleStage, to: LifecycleStage): boolean => {
  if (from === to) return false;
  // on_leave <-> active is reversible
  if (
    (from === "active" && to === "on_leave") ||
    (from === "on_leave" && to === "active")
  ) {
    return true;
  }
  return LIFECYCLE_ORDER.indexOf(to) > LIFECYCLE_ORDER.indexOf(from);
};

export { isForwardTransition };
export default isForwardTransition;
