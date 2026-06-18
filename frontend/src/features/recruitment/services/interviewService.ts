import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type { Interview, InterviewStatus, InterviewOutcome } from "@hrms/middleware";
import { AuditLogService } from "../../settings/services/auditLogService";

type CallerInfo = { uid: string; email: string };

function newId() {
  return `intv_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
}

export type InterviewCreateInput = Omit<
  Interview,
  "id" | "tenantId" | "createdAt" | "updatedAt" | "status" | "outcome"
> & { status?: InterviewStatus; outcome?: InterviewOutcome };

export const InterviewService = {
  async getByCandidate(tenantId: string, candidateId: string): Promise<Interview[]> {
    const q = query(
      collection(db, "interviews"),
      where("tenantId", "==", tenantId),
      where("candidateId", "==", candidateId)
    );
    const snap = await getDocs(q);
    const list: Interview[] = [];
    snap.forEach((d) => list.push(d.data() as Interview));
    return list.sort((a, b) => a.scheduledAt - b.scheduledAt);
  },

  async getByTenant(tenantId: string): Promise<Interview[]> {
    const q = query(collection(db, "interviews"), where("tenantId", "==", tenantId));
    const snap = await getDocs(q);
    const list: Interview[] = [];
    snap.forEach((d) => list.push(d.data() as Interview));
    return list.sort((a, b) => a.scheduledAt - b.scheduledAt);
  },

  async schedule(
    tenantId: string,
    input: InterviewCreateInput,
    caller?: CallerInfo
  ): Promise<Interview> {
    const id = newId();
    const now = Date.now();
    const interview: Interview = {
      ...input,
      id,
      tenantId,
      status: input.status ?? "scheduled",
      outcome: input.outcome ?? "pending",
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db, "interviews", id), interview);

    if (caller) {
      await AuditLogService.createAuditLog(tenantId, {
        userId: caller.uid,
        userEmail: caller.email,
        action: "create",
        resource: "interview",
        resourceId: id,
        details: `Scheduled "${interview.title}" for ${interview.candidateName}`,
      });
    }
    return interview;
  },

  async update(
    id: string,
    data: Partial<Omit<Interview, "id" | "tenantId" | "createdAt" | "updatedAt">>,
    caller?: CallerInfo
  ): Promise<void> {
    const ref2 = doc(db, "interviews", id);
    const snap = await getDoc(ref2);
    if (!snap.exists()) return;
    const old = snap.data() as Interview;
    await updateDoc(ref2, { ...data, updatedAt: Date.now() });

    if (caller) {
      await AuditLogService.createAuditLog(old.tenantId, {
        userId: caller.uid,
        userEmail: caller.email,
        action: "update",
        resource: "interview",
        resourceId: id,
        details: `Updated interview "${old.title}" for ${old.candidateName}`,
      });
    }
  },

  async submitFeedback(
    id: string,
    outcome: InterviewOutcome,
    feedback: string,
    caller?: CallerInfo
  ): Promise<void> {
    await this.update(id, { outcome, feedback, status: "completed" }, caller);
  },

  async cancel(id: string, caller?: CallerInfo): Promise<void> {
    await this.update(id, { status: "cancelled" }, caller);
  },

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(db, "interviews", id));
  },
};
