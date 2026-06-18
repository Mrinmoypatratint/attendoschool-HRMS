/**
 * Audit log type definitions.
 *
 * Describes the immutable audit-trail record written whenever a user performs a
 * tracked action (create/update/delete, approvals, role/branding changes, etc.)
 * against a tenant resource. Consumed via named imports and re-exported by the
 * middleware barrel.
 */

/**
 * A single audit-trail entry recording who did what, to which resource, and when.
 * Stored per tenant; the `action`/`resource` unions enumerate every tracked
 * operation and entity so the audit feed can be filtered and labelled.
 */
export interface AuditLog {
  id: string;
  tenantId: string;
  /** Firebase Auth uid of the actor who performed the action. */
  userId: string;
  /** Actor's email, denormalised for display in the audit feed. */
  userEmail: string;
  /** The kind of operation performed. */
  action:
    | "create"
    | "update"
    | "delete"
    | "invite"
    | "role_change"
    | "branding_change"
    | "status_change"
    | "stage_change"
    | "approve"
    | "reject";
  /** The entity type the action was performed against. */
  resource:
    | "employee"
    | "department"
    | "team"
    | "role"
    | "tenant"
    | "job"
    | "candidate"
    | "candidateNote"
    | "interview"
    | "offer"
    | "leave_type"
    | "leave_policy"
    | "leave_request"
    | "leave_balance"
    | "holiday_calendar";
  /** Identifier of the affected resource document. */
  resourceId: string;
  /** Human-readable description of the change. */
  details: string;
  /** Epoch milliseconds when the action occurred. */
  timestamp: number;
}
