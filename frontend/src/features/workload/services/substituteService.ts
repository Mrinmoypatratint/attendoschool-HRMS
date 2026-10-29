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
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type { 
  SubstituteAssignment, 
  TeachingSchedule, 
  DayOfWeek,
  Employee 
} from "@hrms/middleware";
import { AuditLogService } from "../../settings/services/auditLogService";
import { EmployeeService } from "../../employees/services/employeeService";
import { WorkloadService } from "./workloadService";

export interface SubstituteCandidate {
  employee: Employee;
  isAvailable: boolean;
  conflictReason?: string | undefined;
  isSubjectMatch: boolean;
}

export const SubstituteService = {
  /**
   * Finds available substitute teachers for an absent teacher's slot.
   */
  async findAvailableSubstitutes(
    tenantId: string,
    campusId: string,
    sessionId: string,
    date: string,
    dayOfWeek: DayOfWeek,
    periodNumber: number,
    subjectCode: string,
    absentEmployeeId: string
  ): Promise<SubstituteCandidate[]> {
    // 1. Fetch teaching staff at the campus
    const allEmployees = await EmployeeService.getEmployees(tenantId);
    const faculty = allEmployees.filter((e) => {
      if (e.id === absentEmployeeId) return false;
      const isTeacher = e.teachingStatus === "teaching" || e.staffCategory === "teaching";
      if (!isTeacher) return false;
      if (campusId && e.campusId && e.campusId !== campusId) return false;
      return true;
    });

    // 2. Fetch all teaching schedules for this session, day, and period
    const qSched = query(
      collection(db, "teachingSchedules"),
      where("tenantId", "==", tenantId),
      where("academicSessionId", "==", sessionId),
      where("dayOfWeek", "==", dayOfWeek)
    );
    const schedSnap = await getDocs(qSched);
    const busyScheduleMap = new Set<string>();
    schedSnap.forEach((d) => {
      const s = d.data() as TeachingSchedule;
      if (s.periodNumber === periodNumber) {
        busyScheduleMap.add(s.employeeId);
      }
    });

    // 3. Fetch existing substitute assignments for this date & period
    const qSub = query(
      collection(db, "substituteAssignments"),
      where("tenantId", "==", tenantId),
      where("date", "==", date)
    );
    const subSnap = await getDocs(qSub);
    const busySubMap = new Set<string>();
    subSnap.forEach((d) => {
      const sub = d.data() as SubstituteAssignment;
      if (sub.periodNumber === periodNumber && sub.status !== "cancelled") {
        busySubMap.add(sub.substituteEmployeeId);
      }
    });

    // 4. Map candidates with availability and subject match
    const candidates: SubstituteCandidate[] = faculty.map((emp) => {
      let isAvailable = true;
      let conflictReason: string | undefined = undefined;

      if (busyScheduleMap.has(emp.id)) {
        isAvailable = false;
        conflictReason = `Scheduled for regular class during Period ${periodNumber}`;
      } else if (busySubMap.has(emp.id)) {
        isAvailable = false;
        conflictReason = `Already assigned as substitute during Period ${periodNumber}`;
      }

      // Check subject match
      const taught = (emp.subjectsTaught || []).map((s) => s.toLowerCase());
      const isSubjectMatch =
        taught.includes(subjectCode.toLowerCase()) ||
        (emp.specialization && emp.specialization.toLowerCase().includes(subjectCode.toLowerCase())) ||
        false;

      return {
        employee: emp,
        isAvailable,
        conflictReason,
        isSubjectMatch,
      };
    });

    // Sort: Available first, subject matches first
    return candidates.sort((a, b) => {
      if (a.isAvailable && !b.isAvailable) return -1;
      if (!a.isAvailable && b.isAvailable) return 1;
      if (a.isSubjectMatch && !b.isSubjectMatch) return -1;
      if (!a.isSubjectMatch && b.isSubjectMatch) return 1;
      return a.employee.firstName.localeCompare(b.employee.firstName);
    });
  },

  /**
   * Assigns a substitute teacher to a class slot.
   */
  async assignSubstitute(
    tenantId: string,
    data: Omit<SubstituteAssignment, "id" | "tenantId" | "createdAt" | "updatedAt">,
    callerInfo?: { uid: string; email: string }
  ): Promise<SubstituteAssignment> {
    const id = `sub_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    const now = Date.now();
    const assignment: SubstituteAssignment = {
      ...data,
      id,
      tenantId,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(db, "substituteAssignments", id), assignment);

    if (callerInfo) {
      await AuditLogService.createAuditLog(tenantId, {
        userId: callerInfo.uid,
        userEmail: callerInfo.email,
        action: "create",
        resource: "substitute",
        resourceId: id,
        details: `Assigned ${data.substituteEmployeeName} as substitute for ${data.absentEmployeeName} (${data.subjectName}, Period ${data.periodNumber}, ${data.date})`,
      });
    }

    return assignment;
  },

  /**
   * Fetches substitute assignments for a date or campus.
   */
  async getSubstituteAssignments(
    tenantId: string,
    campusId?: string,
    date?: string
  ): Promise<SubstituteAssignment[]> {
    let q = query(
      collection(db, "substituteAssignments"),
      where("tenantId", "==", tenantId),
      orderBy("date", "desc")
    );
    const snap = await getDocs(q);
    const list: SubstituteAssignment[] = [];
    snap.forEach((d) => {
      const item = d.data() as SubstituteAssignment;
      if (campusId && item.campusId !== campusId) return;
      if (date && item.date !== date) return;
      list.push(item);
    });
    return list;
  },

  /**
   * Updates status of a substitute assignment.
   */
  async updateSubstituteStatus(
    tenantId: string,
    id: string,
    status: SubstituteAssignment["status"],
    callerInfo?: { uid: string; email: string }
  ): Promise<void> {
    const ref = doc(db, "substituteAssignments", id);
    const now = Date.now();
    await updateDoc(ref, {
      status,
      updatedAt: now,
    });

    if (callerInfo) {
      await AuditLogService.createAuditLog(tenantId, {
        userId: callerInfo.uid,
        userEmail: callerInfo.email,
        action: "update",
        resource: "substitute",
        resourceId: id,
        details: `Updated substitute assignment ${id} status to ${status}`,
      });
    }
  },
};
