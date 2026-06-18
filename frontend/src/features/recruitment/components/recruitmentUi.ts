/**
 * Recruitment UI helpers: shared presentational utilities used across the
 * jobs, careers, pipeline and candidate-drawer views.
 *
 * Provides:
 *   - `fetchTenantMembers`: the one Firestore read in this module (approver /
 *     interviewer pickers).
 *   - Tailwind status → badge-class maps for jobs, candidates and offers.
 *   - `titleCase` / `formatDate` display formatters.
 */
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type { UserProfile, JobStatus, CandidateStatus, OfferStatus } from "@hrms/middleware";

/** Fetch the tenant's members (used for approver / interviewer pickers). */
export async function fetchTenantMembers(tenantId: string): Promise<UserProfile[]> {
  const q = query(
    collection(db, "users"),
    where(`tenants.${tenantId}.status`, "in", ["active", "invited", "disabled"])
  );
  const snap = await getDocs(q);
  const list: UserProfile[] = [];
  snap.forEach((d) => list.push(d.data() as UserProfile));
  return list;
}

/** Convert a snake_case / lower-case token into Title Case (e.g. "full_time" → "Full Time"). */
export function titleCase(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const JOB_STATUS_STYLES: Record<JobStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  pending_approval: "bg-amber-100 text-amber-700",
  approved: "bg-sky-100 text-sky-700",
  rejected: "bg-rose-100 text-rose-700",
  open: "bg-emerald-100 text-emerald-700",
  on_hold: "bg-orange-100 text-orange-700",
  closed: "bg-slate-200 text-slate-600",
};

/** Tailwind badge classes for a job status (falls back to neutral slate). */
export function jobStatusClass(status: JobStatus): string {
  return JOB_STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600";
}

const CANDIDATE_STATUS_STYLES: Record<CandidateStatus, string> = {
  active: "bg-blue-100 text-blue-700",
  hired: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
  withdrawn: "bg-slate-200 text-slate-600",
};

/** Tailwind badge classes for a candidate status (falls back to neutral slate). */
export function candidateStatusClass(status: CandidateStatus): string {
  return CANDIDATE_STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600";
}

const OFFER_STATUS_STYLES: Record<OfferStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  pending_approval: "bg-amber-100 text-amber-700",
  approved: "bg-sky-100 text-sky-700",
  sent: "bg-indigo-100 text-indigo-700",
  accepted: "bg-emerald-100 text-emerald-700",
  declined: "bg-rose-100 text-rose-700",
  rescinded: "bg-rose-100 text-rose-700",
  expired: "bg-slate-200 text-slate-600",
};

/** Tailwind badge classes for an offer status (falls back to neutral slate). */
export function offerStatusClass(status: OfferStatus): string {
  return OFFER_STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600";
}

/** Format an epoch-millis timestamp as a short US date (e.g. "Jun 18, 2026"); returns "—" if invalid. */
export function formatDate(ms: number): string {
  try {
    return new Date(ms).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}
