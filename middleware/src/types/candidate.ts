/**
 * Candidate (applicant) type definitions.
 *
 * Models applicants tracked through a job's pipeline and the notes left on them.
 * Consumed via named imports and re-exported by the middleware barrel.
 */

/** Overall lifecycle state of a candidate. */
export type CandidateStatus = "active" | "hired" | "rejected" | "withdrawn";

/** Where the candidate originated from. */
export type CandidateSource = "careers" | "referral" | "manual" | "agency" | "linkedin";

/**
 * A candidate / applicant associated with a specific job requisition.
 * The `stage` field tracks the candidate's position in the job's pipeline.
 */
export interface Candidate {
  id: string;
  tenantId: string;
  jobId: string;
  jobTitle: string; // denormalised for list/kanban display
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  /** Public download URL of the uploaded resume (if any). */
  resumeUrl?: string;
  /** Storage path of the resume, used for deletion/regeneration. */
  resumePath?: string;
  linkedinUrl?: string;
  coverLetter?: string;
  source: CandidateSource;
  /** Current pipeline stage name (must be one of the job's pipelineStages). */
  stage: string;
  status: CandidateStatus;
  /** 0–5 star rating. */
  rating?: number;
  appliedAt: number;
  createdAt: number;
  updatedAt: number;
}

/** A timestamped note left by a team member on a candidate. */
export interface CandidateNote {
  id: string;
  tenantId: string;
  candidateId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: number;
}
