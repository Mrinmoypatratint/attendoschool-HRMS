import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type { FacultyWorkload, TeachingSchedule, DayOfWeek } from "@hrms/middleware";
import { AuditLogService } from "../../settings/services/auditLogService";

export const WorkloadService = {
  /**
   * Fetches all faculty workloads for an academic session.
   */
  async getFacultyWorkloads(
    tenantId: string,
    sessionId: string,
    campusId?: string
  ): Promise<FacultyWorkload[]> {
    let q = query(
      collection(db, "facultyWorkloads"),
      where("tenantId", "==", tenantId),
      where("academicSessionId", "==", sessionId)
    );
    const snap = await getDocs(q);
    const list: FacultyWorkload[] = [];
    snap.forEach((d) => {
      const w = d.data() as FacultyWorkload;
      if (!campusId || w.campusId === campusId) {
        list.push(w);
      }
    });
    return list;
  },

  /**
   * Saves or updates a faculty member's workload allocation.
   */
  async saveFacultyWorkload(
    tenantId: string,
    data: Omit<FacultyWorkload, "id" | "tenantId" | "createdAt" | "updatedAt"> & { id?: string },
    callerInfo?: { uid: string; email: string }
  ): Promise<FacultyWorkload> {
    const id = data.id || `fw_${data.employeeId}_${data.academicSessionId}`;
    const ref = doc(db, "facultyWorkloads", id);
    const snap = await getDoc(ref);
    const now = Date.now();

    const workload: FacultyWorkload = {
      ...data,
      id,
      tenantId,
      createdAt: snap.exists() ? (snap.data() as FacultyWorkload).createdAt : now,
      updatedAt: now,
    };

    await setDoc(ref, workload);

    if (callerInfo) {
      await AuditLogService.createAuditLog(tenantId, {
        userId: callerInfo.uid,
        userEmail: callerInfo.email,
        action: snap.exists() ? "update" : "create",
        resource: "timetable",
        resourceId: id,
        details: `Saved faculty workload for ${data.employeeName}: ${data.assignedWeeklyPeriods}/${data.maxWeeklyPeriods} periods`,
      });
    }

    return workload;
  },

  /**
   * Fetches teaching schedule slots (Timetable).
   */
  async getTeachingSchedules(
    tenantId: string,
    sessionId: string,
    campusId?: string,
    employeeId?: string
  ): Promise<TeachingSchedule[]> {
    let q = query(
      collection(db, "teachingSchedules"),
      where("tenantId", "==", tenantId),
      where("academicSessionId", "==", sessionId)
    );

    const snap = await getDocs(q);
    const list: TeachingSchedule[] = [];
    snap.forEach((d) => {
      const s = d.data() as TeachingSchedule;
      if (campusId && s.campusId !== campusId) return;
      if (employeeId && s.employeeId !== employeeId) return;
      list.push(s);
    });
    return list;
  },

  /**
   * Creates a new teaching schedule entry with institutional conflict detection:
   * 1. Checks if teacher is already assigned a period on that day.
   * 2. Checks if room is already occupied during that period on that day.
   */
  async createTeachingSchedule(
    tenantId: string,
    data: Omit<TeachingSchedule, "id" | "tenantId" | "createdAt" | "updatedAt">,
    callerInfo?: { uid: string; email: string }
  ): Promise<TeachingSchedule> {
    // 1. Fetch current schedules for this session and day to detect conflicts
    const q = query(
      collection(db, "teachingSchedules"),
      where("tenantId", "==", tenantId),
      where("academicSessionId", "==", data.academicSessionId),
      where("dayOfWeek", "==", data.dayOfWeek)
    );
    const snap = await getDocs(q);

    snap.forEach((d) => {
      const existing = d.data() as TeachingSchedule;
      if (existing.periodNumber === data.periodNumber) {
        // Teacher double-booking check
        if (existing.employeeId === data.employeeId) {
          throw new Error(
            `Timetable conflict: ${data.employeeName} is already assigned to ${existing.subjectName} (${existing.classGrade}) during period ${data.periodNumber} on ${data.dayOfWeek}.`
          );
        }
        // Room conflict check (within same campus)
        if (existing.campusId === data.campusId && existing.room && existing.room.toLowerCase() === data.room.toLowerCase()) {
          throw new Error(
            `Room conflict: Room ${data.room} is already booked by ${existing.employeeName} for ${existing.classGrade} during period ${data.periodNumber}.`
          );
        }
      }
    });

    const id = `sched_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    const now = Date.now();
    const schedule: TeachingSchedule = {
      ...data,
      id,
      tenantId,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(db, "teachingSchedules", id), schedule);

    // Increment faculty workload assignedWeeklyPeriods
    const wlId = `fw_${data.employeeId}_${data.academicSessionId}`;
    const wlRef = doc(db, "facultyWorkloads", wlId);
    const wlSnap = await getDoc(wlRef);
    if (wlSnap.exists()) {
      const cur = wlSnap.data() as FacultyWorkload;
      await updateDoc(wlRef, {
        assignedWeeklyPeriods: (cur.assignedWeeklyPeriods || 0) + 1,
        updatedAt: now,
      });
    }

    if (callerInfo) {
      await AuditLogService.createAuditLog(tenantId, {
        userId: callerInfo.uid,
        userEmail: callerInfo.email,
        action: "create",
        resource: "timetable",
        resourceId: id,
        details: `Scheduled ${data.employeeName} for ${data.subjectName} (${data.classGrade}, Period ${data.periodNumber}, ${data.dayOfWeek})`,
      });
    }

    return schedule;
  },

  /**
   * Deletes a timetable schedule slot.
   */
  async deleteTeachingSchedule(
    tenantId: string,
    schedule: TeachingSchedule,
    callerInfo?: { uid: string; email: string }
  ): Promise<void> {
    await deleteDoc(doc(db, "teachingSchedules", schedule.id));

    // Decrement faculty workload
    const wlId = `fw_${schedule.employeeId}_${schedule.academicSessionId}`;
    const wlRef = doc(db, "facultyWorkloads", wlId);
    const wlSnap = await getDoc(wlRef);
    if (wlSnap.exists()) {
      const cur = wlSnap.data() as FacultyWorkload;
      const newAssigned = Math.max(0, (cur.assignedWeeklyPeriods || 1) - 1);
      await updateDoc(wlRef, {
        assignedWeeklyPeriods: newAssigned,
        updatedAt: Date.now(),
      });
    }

    if (callerInfo) {
      await AuditLogService.createAuditLog(tenantId, {
        userId: callerInfo.uid,
        userEmail: callerInfo.email,
        action: "delete",
        resource: "timetable",
        resourceId: schedule.id,
        details: `Deleted timetable slot for ${schedule.employeeName} (${schedule.subjectName}, Period ${schedule.periodNumber})`,
      });
    }
  },
};
