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
import type { PerformanceReview, TrainingProgram, StaffTrainingRecord } from "@hrms/middleware";
import { AuditLogService } from "../../settings/services/auditLogService";

export const PerformanceService = {
  /**
   * Fetches performance reviews for an institution, optionally by academic session.
   */
  async getReviews(tenantId: string, sessionId?: string): Promise<PerformanceReview[]> {
    let q = query(
      collection(db, "performanceReviews"),
      where("tenantId", "==", tenantId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    const list: PerformanceReview[] = [];
    snap.forEach((d) => {
      const rev = d.data() as PerformanceReview;
      if (!sessionId || rev.academicSessionId === sessionId) {
        list.push(rev);
      }
    });
    return list;
  },

  /**
   * Creates an appraisal review cycle for a faculty or staff member.
   */
  async createReview(
    tenantId: string,
    data: Omit<PerformanceReview, "id" | "tenantId" | "createdAt" | "updatedAt">,
    callerInfo?: { uid: string; email: string }
  ): Promise<PerformanceReview> {
    const id = `rev_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    const now = Date.now();
    const review: PerformanceReview = {
      ...data,
      id,
      tenantId,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(db, "performanceReviews", id), review);

    if (callerInfo) {
      await AuditLogService.createAuditLog(tenantId, {
        userId: callerInfo.uid,
        userEmail: callerInfo.email,
        action: "create",
        resource: "performance",
        resourceId: id,
        details: `Initiated performance appraisal for ${data.employeeName} (${data.reviewPeriod})`,
      });
    }

    return review;
  },

  /**
   * Submits or completes a review appraisal evaluation.
   */
  async updateReview(
    tenantId: string,
    id: string,
    patch: Partial<PerformanceReview>,
    callerInfo?: { uid: string; email: string }
  ): Promise<void> {
    const ref = doc(db, "performanceReviews", id);
    const now = Date.now();

    await updateDoc(ref, {
      ...patch,
      updatedAt: now,
    });

    if (callerInfo) {
      await AuditLogService.createAuditLog(tenantId, {
        userId: callerInfo.uid,
        userEmail: callerInfo.email,
        action: "update",
        resource: "performance",
        resourceId: id,
        details: `Updated appraisal evaluation ${id}`,
      });
    }
  },

  /* ---------------- Faculty Development & Training ---------------- */

  async getTrainingPrograms(tenantId: string): Promise<TrainingProgram[]> {
    const q = query(
      collection(db, "trainingPrograms"),
      where("tenantId", "==", tenantId),
      orderBy("startDate", "desc")
    );
    const snap = await getDocs(q);
    const list: TrainingProgram[] = [];
    snap.forEach((d) => list.push(d.data() as TrainingProgram));
    return list;
  },

  async createTrainingProgram(
    tenantId: string,
    data: Omit<TrainingProgram, "id" | "tenantId" | "createdAt" | "updatedAt">,
    callerInfo?: { uid: string; email: string }
  ): Promise<TrainingProgram> {
    const id = `train_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    const now = Date.now();
    const program: TrainingProgram = {
      ...data,
      id,
      tenantId,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(db, "trainingPrograms", id), program);

    if (callerInfo) {
      await AuditLogService.createAuditLog(tenantId, {
        userId: callerInfo.uid,
        userEmail: callerInfo.email,
        action: "create",
        resource: "training",
        resourceId: id,
        details: `Created Faculty Development Program: ${data.title} (${data.category})`,
      });
    }

    return program;
  },
};
