/**
 * Pure, Firebase-free helpers describing which vault documents a role may read.
 * Kept separate from documentService so it can be unit-tested without
 * initializing the Firebase SDK.
 *
 * These scopes mirror the `/documents` read rule in firestore.rules. They exist
 * because Firestore security rules are NOT filters: a query that could return a
 * single unreadable document fails entirely with permission-denied. The client
 * must therefore issue narrow queries that each match an allowed read condition.
 */

/** Identity needed to scope document reads to what firestore.rules permits. */
export type DocumentAccessContext = { role: string; uid: string };

/** Read scope a query can satisfy while remaining rule-compliant. */
export type DocumentReadScope = "all" | "shared" | "self" | "candidate";

/** Roles that may read every document in the tenant (full "all" scope). */
export const FULL_ACCESS_ROLES = ["super_admin", "org_admin", "hr_manager"];

/**
 * Returns the set of read scopes a role is permitted:
 *  - "all":       every document in the tenant
 *  - "shared":    documents with accessLevel == 'shared'
 *  - "self":      documents whose targetUserId == the caller's uid
 *  - "candidate": documents with type == 'candidate'
 */
export function getReadableScopes(role: string): DocumentReadScope[] {
  if (FULL_ACCESS_ROLES.includes(role)) return ["all"];
  if (role === "recruiter") return ["shared", "self", "candidate"];
  // employees and custom roles: only org-shared docs and docs targeted to them
  return ["shared", "self"];
}
