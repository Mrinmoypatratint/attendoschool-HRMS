import { collection, doc, setDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type { AuditLog as SharedAuditLog } from "@hrms/middleware";

export interface AuditLog {
  id: string;
  tenantId: string;
  action: string;
  actorId: string;
  actorName: string;
  targetId: string;
  details: string;
  createdAt: number;
  // Shared type compatibility
  userId: string;
  userEmail: string;
  resource: "role";
  resourceId: string;
  timestamp: number;
}

/**
 * Creates an audit log entry in the auditLogs collection.
 */
export async function logAuditTrail(
  tenantId: string,
  actorId: string,
  actorName: string,
  action: string,
  targetId: string,
  details: string,
  actorEmail?: string
) {
  try {
    const logId = `log_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
    const logRef = doc(collection(db, "auditLogs"), logId);
    
    let mappedAction: SharedAuditLog["action"] = "update";
    if (action === "role.create") mappedAction = "create";
    else if (action === "role.delete") mappedAction = "delete";
    else if (action === "user.role_assign" || action === "user.role_remove") mappedAction = "role_change";

    const auditLog: AuditLog = {
      id: logId,
      tenantId,
      action: action,
      actorId,
      actorName,
      targetId,
      details,
      createdAt: Date.now(),
      
      // Shared schema fields
      userId: actorId,
      userEmail: actorEmail || actorName || "system",
      resource: "role",
      resourceId: targetId,
      timestamp: Date.now(),
    };

    // Set action to the mapped version for the global type compatibility (cast if typescript objects)
    const dbLog = {
      ...auditLog,
      action: action, // We store the specific action string in DB for legacy compatibility
    };

    await setDoc(logRef, dbLog);
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}

