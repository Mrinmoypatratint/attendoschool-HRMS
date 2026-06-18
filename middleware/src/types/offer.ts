/**
 * Offer type definitions.
 *
 * Models a formal employment offer extended to a candidate, including its
 * embedded approval workflow (reused from the job module). Consumed via named
 * imports and re-exported by the middleware barrel.
 */

import type { ApprovalWorkflow } from "./job";

/** Lifecycle state of an offer, from draft through to a final response. */
export type OfferStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "sent"
  | "accepted"
  | "declined"
  | "rescinded"
  | "expired";

/** A formal offer extended to a candidate for a specific job. */
export interface Offer {
  id: string;
  tenantId: string;
  candidateId: string;
  candidateName: string; // denormalised for display
  candidateEmail: string;
  jobId: string;
  jobTitle: string;
  salary: number;
  currency: string;
  /** ISO date (YYYY-MM-DD) the candidate is expected to start. */
  startDate: string;
  /** ISO date (YYYY-MM-DD) the offer expires. */
  expiryDate: string;
  status: OfferStatus;
  notes?: string;
  approval: ApprovalWorkflow;
  sentAt?: number;
  respondedAt?: number;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}
