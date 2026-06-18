/**
 * auditLogService
 * -----------------------------------------------------------------------------
 * Firestore-backed service for recording and retrieving tenant audit logs.
 * Audit entries are stored in the top-level `auditLogs` collection and are
 * scoped/queried by `tenantId`.
 */
import { collection, doc, setDoc, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type { AuditLog } from "@hrms/middleware";

/**
 * Singleton service object exposing audit-log creation and retrieval helpers.
 */
export const AuditLogService = {
  /**
   * Records a new audit log entry in Firestore.
   */
  async createAuditLog(
    tenantId: string,
    data: Omit<AuditLog, "id" | "tenantId" | "timestamp">
  ): Promise<AuditLog> {
    const id = `log_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    const log: AuditLog = {
      ...data,
      id,
      tenantId,
      timestamp: Date.now(),
    };
    await setDoc(doc(db, "auditLogs", id), log);
    return log;
  },

  /**
   * Fetches historical audit log entries for a tenant.
   */
  async getAuditLogs(tenantId: string, maxLimit: number = 100): Promise<AuditLog[]> {
    const q = query(
      collection(db, "auditLogs"),
      where("tenantId", "==", tenantId),
      orderBy("timestamp", "desc"),
      limit(maxLimit)
    );
    const snap = await getDocs(q);
    const logs: AuditLog[] = [];
    snap.forEach((docSnap) => {
      logs.push(docSnap.data() as AuditLog);
    });
    return logs;
  },
};
