/**
 * Interview type definitions.
 *
 * Models scheduled interviews for candidates, including mode, status, and
 * outcome. Consumed via named imports and re-exported by the middleware barrel.
 */

/** Scheduling state of an interview. */
export type InterviewStatus = "scheduled" | "completed" | "cancelled" | "no_show";

/** Interviewer's recommendation after the interview. */
export type InterviewOutcome =
  | "pending"
  | "strong_yes"
  | "yes"
  | "no"
  | "strong_no";

/** How the interview is conducted. */
export type InterviewMode = "onsite" | "phone" | "video";

/** A scheduled interview for a candidate, tied to a pipeline stage. */
export interface Interview {
  id: string;
  tenantId: string;
  candidateId: string;
  candidateName: string; // denormalised for display
  jobId: string;
  /** The pipeline stage this interview belongs to (e.g. "Interview"). */
  stage: string;
  title: string;
  mode: InterviewMode;
  /** Physical location or meeting link. */
  location: string;
  scheduledAt: number;
  durationMins: number;
  interviewerIds: string[];
  interviewerEmails: string[];
  status: InterviewStatus;
  outcome: InterviewOutcome;
  feedback?: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}
