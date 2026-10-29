import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type { 
  StaffAttendance, 
  StaffAttendanceStatus, 
  StaffDutyType,
  AttendanceRegularization 
} from "@hrms/middleware";
import { AuditLogService } from "../../settings/services/auditLogService";

export const AttendanceService = {
  /**
   * Fetches all attendance records for a specific date across the institution or by campus.
   */
  async getDailyAttendance(
    tenantId: string,
    date: string, // YYYY-MM-DD
    campusId?: string
  ): Promise<StaffAttendance[]> {
    let q = query(
      collection(db, "staffAttendance"),
      where("tenantId", "==", tenantId),
      where("date", "==", date)
    );

    const snap = await getDocs(q);
    const list: StaffAttendance[] = [];
    snap.forEach((d) => {
      const rec = d.data() as StaffAttendance;
      if (!campusId || rec.campusId === campusId) {
        list.push(rec);
      }
    });
    return list;
  },

  /**
   * Fetches an individual employee's attendance history.
   */
  async getStaffAttendanceHistory(
    tenantId: string,
    employeeId: string,
    maxLimit: number = 60
  ): Promise<StaffAttendance[]> {
    const q = query(
      collection(db, "staffAttendance"),
      where("tenantId", "==", tenantId),
      where("employeeId", "==", employeeId),
      orderBy("date", "desc"),
      limit(maxLimit)
    );
    const snap = await getDocs(q);
    const list: StaffAttendance[] = [];
    snap.forEach((d) => list.push(d.data() as StaffAttendance));
    return list;
  },

  /**
   * Records or updates a daily attendance punch.
   */
  async recordAttendance(
    tenantId: string,
    data: Omit<StaffAttendance, "id" | "tenantId" | "createdAt" | "updatedAt">,
    callerInfo?: { uid: string; email: string }
  ): Promise<StaffAttendance> {
    const docId = `${tenantId}_${data.employeeId}_${data.date}`;
    const ref = doc(db, "staffAttendance", docId);
    const snap = await getDoc(ref);
    const now = Date.now();

    const record: StaffAttendance = {
      ...data,
      id: docId,
      tenantId,
      createdAt: snap.exists() ? (snap.data() as StaffAttendance).createdAt : now,
      updatedAt: now,
    };

    await setDoc(ref, record);

    if (callerInfo) {
      await AuditLogService.createAuditLog(tenantId, {
        userId: callerInfo.uid,
        userEmail: callerInfo.email,
        action: snap.exists() ? "update" : "create",
        resource: "attendance",
        resourceId: docId,
        details: `Recorded attendance for ${data.employeeName} on ${data.date}: ${data.status} (${data.dutyType})`,
      });
    }

    return record;
  },

  /**
   * Fetches summary metrics for institutional daily attendance.
   */
  async getDailyMetrics(
    tenantId: string,
    date: string,
    campusId?: string
  ) {
    const records = await this.getDailyAttendance(tenantId, date, campusId);
    let present = 0;
    let late = 0;
    let onDuty = 0;
    let absent = 0;
    let onLeave = 0;

    records.forEach((r) => {
      if (r.status === "present") present++;
      else if (r.status === "late") late++;
      else if (r.status === "on_duty") onDuty++;
      else if (r.status === "absent") absent++;
      else if (r.status === "leave") onLeave++;
    });

    return {
      totalMarked: records.length,
      present,
      late,
      onDuty,
      absent,
      onLeave,
    };
  },

  /* ------------------- Regularization Requests ------------------- */

  /**
   * Lists regularization requests, optionally filtered by review status.
   */
  async getRegularizations(
    tenantId: string,
    statusFilter?: "pending" | "approved" | "rejected"
  ): Promise<AttendanceRegularization[]> {
    let q = query(
      collection(db, "attendanceRegularizations"),
      where("tenantId", "==", tenantId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    const list: AttendanceRegularization[] = [];
    snap.forEach((d) => {
      const rec = d.data() as AttendanceRegularization;
      if (!statusFilter || rec.status === statusFilter) {
        list.push(rec);
      }
    });
    return list;
  },

  /**
   * Creates a new regularization request for missed punches or attendance correction.
   */
  async submitRegularization(
    tenantId: string,
    data: Omit<AttendanceRegularization, "id" | "tenantId" | "status" | "createdAt" | "updatedAt">,
    callerInfo?: { uid: string; email: string }
  ): Promise<AttendanceRegularization> {
    const id = `reg_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    const now = Date.now();
    const req: AttendanceRegularization = {
      ...data,
      id,
      tenantId,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(db, "attendanceRegularizations", id), req);

    if (callerInfo) {
      await AuditLogService.createAuditLog(tenantId, {
        userId: callerInfo.uid,
        userEmail: callerInfo.email,
        action: "create",
        resource: "attendance",
        resourceId: id,
        details: `Submitted attendance regularization for ${data.date} (${data.employeeName})`,
      });
    }

    return req;
  },

  /**
   * Approves or rejects an attendance regularization request.
   */
  async reviewRegularization(
    id: string,
    status: "approved" | "rejected",
    approver: { uid: string; name: string; email: string },
    approverNote?: string
  ): Promise<void> {
    const ref = doc(db, "attendanceRegularizations", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error("Regularization request not found.");
    const old = snap.data() as AttendanceRegularization;

    const now = Date.now();
    await updateDoc(ref, {
      status,
      approverId: approver.uid,
      approverName: approver.name,
      ...(approverNote ? { approverNote } : {}),
      reviewedAt: now,
      updatedAt: now,
    });

    // If approved, update or create the underlying attendance record
    if (status === "approved") {
      const docId = old.attendanceId || `${old.tenantId}_${old.employeeId}_${old.date}`;
      const attRef = doc(db, "staffAttendance", docId);
      const attSnap = await getDoc(attRef);

      const updatedRecord: StaffAttendance = {
        id: docId,
        tenantId: old.tenantId,
        campusId: old.campusId || "",
        employeeId: old.employeeId,
        employeeName: old.employeeName,
        date: old.date,
        checkInTime: old.requestedCheckIn || "08:30:00",
        checkOutTime: old.requestedCheckOut || "16:30:00",
        status: "present",
        dutyType: "regular",
        verificationStatus: "verified",
        remarks: `Regularized: ${old.reason}`,
        createdAt: attSnap.exists() ? (attSnap.data() as StaffAttendance).createdAt : now,
        updatedAt: now,
      };

      await setDoc(attRef, updatedRecord);
    }

    await AuditLogService.createAuditLog(old.tenantId, {
      userId: approver.uid,
      userEmail: approver.email,
      action: status === "approved" ? "approve" : "reject",
      resource: "attendance",
      resourceId: id,
      details: `${status === "approved" ? "Approved" : "Rejected"} attendance regularization for ${old.employeeName} (${old.date})`,
    });
  },
};
