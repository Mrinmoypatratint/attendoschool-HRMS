/**
 * In-app notification type definitions.
 *
 * Models the notification documents created server-side on approval-workflow
 * events and read live by the Notification Center. Consumed via named imports
 * and re-exported by the middleware barrel.
 */

/**
 * In-app notification delivered to a specific user within a tenant. Created
 * server-side (Cloud Functions, Admin SDK) on approval-workflow events and read
 * live by the Notification Center bell.
 */
export type NotificationType =
  | "approval.requested"
  | "job.approved"
  | "job.rejected"
  | "job.published"
  | "leave.approved"
  | "leave.rejected"
  | "generic";

/** A single in-app notification record. */
export interface AppNotification {
  id: string;
  tenantId: string;
  /** Firebase Auth uid of the recipient. */
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  /** Optional in-app route to open when the notification is clicked. */
  link?: string;
  read: boolean;
  createdAt: number;
}
