import { doc, writeBatch } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { logAuditTrail } from "./audit";

/**
 * Atomically updates a user's role in both their user profile and the userRoles collection,
 * and logs the audit trail entries for role assignment changes.
 */
export async function assignRoleToUser(
  tenantId: string,
  actorId: string,
  actorName: string,
  userId: string,
  userDisplayName: string,
  newRoleId: string,
  oldRoleId?: string,
  actorEmail?: string
) {
  const batch = writeBatch(db);
  const now = Date.now();

  // 1. Update user profile tenants map
  const userRef = doc(db, "users", userId);
  batch.update(userRef, {
    [`tenants.${tenantId}.role`]: newRoleId,
    updatedAt: now,
  });

  // 2. Set/update userRoles document in the root collection
  const userRolesRef = doc(db, "userRoles", `${tenantId}_${userId}`);
  batch.set(
    userRolesRef,
    {
      id: `${tenantId}_${userId}`,
      userId,
      tenantId,
      roleIds: [newRoleId],
      updatedAt: now,
    },
    { merge: true }
  );

  await batch.commit();

  // 3. Log audit trails for changes
  if (oldRoleId && oldRoleId !== newRoleId) {
    await logAuditTrail(
      tenantId,
      actorId,
      actorName,
      "user.role_remove",
      userId,
      `Removed role "${oldRoleId}" from user ${userDisplayName}`,
      actorEmail
    );
  }
  
  await logAuditTrail(
    tenantId,
    actorId,
    actorName,
    "user.role_assign",
    userId,
    `Assigned role "${newRoleId}" to user ${userDisplayName}`,
    actorEmail
  );
}

