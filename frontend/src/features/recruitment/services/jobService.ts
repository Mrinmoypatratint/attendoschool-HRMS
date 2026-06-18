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
  writeBatch,
  limit,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type { Job, JobStatus, ApprovalWorkflow } from "@hrms/middleware";
import { DEFAULT_PIPELINE_STAGES } from "@hrms/middleware";
import { AuditLogService } from "../../settings/services/auditLogService";
import {
  applyApprovalDecision,
  jobStatusAfterApproval,
  buildApprovalWorkflow,
} from "../utils/recruitment";

type CallerInfo = { uid: string; email: string };

function newId() {
  return `job_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
}

export type JobCreateInput = Omit<
  Job,
  "id" | "tenantId" | "createdAt" | "updatedAt" | "approval" | "pipelineStages" | "status"
> & {
  status?: JobStatus;
  pipelineStages?: string[];
  approvers?: Array<{ approverId: string; approverEmail: string; approverName?: string }>;
};

export const JobService = {
  async getJobs(tenantId: string): Promise<Job[]> {
    const q = query(collection(db, "jobs"), where("tenantId", "==", tenantId), limit(2000));
    const snap = await getDocs(q);
    const list: Job[] = [];
    snap.forEach((d) => list.push(d.data() as Job));
    return list.sort((a, b) => b.createdAt - a.createdAt);
  },

  async getJobById(jobId: string): Promise<Job | null> {
    const snap = await getDoc(doc(db, "jobs", jobId));
    return snap.exists() ? (snap.data() as Job) : null;
  },

  async createJob(tenantId: string, input: JobCreateInput, caller?: CallerInfo): Promise<Job> {
    const id = newId();
    const now = Date.now();
    const approval: ApprovalWorkflow = buildApprovalWorkflow(input.approvers ?? []);
    const { approvers, ...rest } = input;
    void approvers;

    const job: Job = {
      ...rest,
      id,
      tenantId,
      status: input.status ?? (approval.required ? "pending_approval" : "draft"),
      pipelineStages: input.pipelineStages ?? [...DEFAULT_PIPELINE_STAGES],
      approval,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db, "jobs", id), job);

    if (caller) {
      await AuditLogService.createAuditLog(tenantId, {
        userId: caller.uid,
        userEmail: caller.email,
        action: "create",
        resource: "job",
        resourceId: id,
        details: `Created job requisition "${job.title}"`,
      });
    }
    return job;
  },

  async updateJob(
    jobId: string,
    data: Partial<Omit<Job, "id" | "tenantId" | "createdAt" | "updatedAt">>,
    caller?: CallerInfo
  ): Promise<void> {
    const ref = doc(db, "jobs", jobId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const old = snap.data() as Job;

    await updateDoc(ref, { ...data, updatedAt: Date.now() });

    if (caller) {
      await AuditLogService.createAuditLog(old.tenantId, {
        userId: caller.uid,
        userEmail: caller.email,
        action: "update",
        resource: "job",
        resourceId: jobId,
        details: `Updated job "${old.title}"`,
      });
    }
  },

  /** Submit a draft requisition into the approval workflow (or straight to approved if none). */
  async submitForApproval(jobId: string, caller?: CallerInfo): Promise<void> {
    const ref = doc(db, "jobs", jobId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const job = snap.data() as Job;

    const required = job.approval?.required && job.approval.steps.length > 0;
    const status: JobStatus = required ? "pending_approval" : "approved";
    await updateDoc(ref, { status, updatedAt: Date.now() });

    if (caller) {
      await AuditLogService.createAuditLog(job.tenantId, {
        userId: caller.uid,
        userEmail: caller.email,
        action: "status_change",
        resource: "job",
        resourceId: jobId,
        details: `Submitted "${job.title}" for approval`,
      });
    }
  },

  /** Record an approve/reject decision for the current approval step. */
  async decideApproval(
    jobId: string,
    decision: "approved" | "rejected",
    caller: CallerInfo,
    comment?: string
  ): Promise<void> {
    const ref = doc(db, "jobs", jobId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const job = snap.data() as Job;

    const nextWorkflow = applyApprovalDecision(job.approval, decision, caller.uid, comment);
    const nextStatus = jobStatusAfterApproval(nextWorkflow.status);

    await updateDoc(ref, {
      approval: nextWorkflow,
      status: nextStatus,
      updatedAt: Date.now(),
    });

    await AuditLogService.createAuditLog(job.tenantId, {
      userId: caller.uid,
      userEmail: caller.email,
      action: decision === "approved" ? "approve" : "reject",
      resource: "job",
      resourceId: jobId,
      details: `${decision === "approved" ? "Approved" : "Rejected"} job "${job.title}"${comment ? `: ${comment}` : ""}`,
    });
  },

  /** Open + publish an approved requisition to the careers page. */
  async setPublished(jobId: string, isPublished: boolean, caller?: CallerInfo): Promise<void> {
    const ref = doc(db, "jobs", jobId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const job = snap.data() as Job;

    const status: JobStatus = isPublished ? "open" : job.status === "open" ? "approved" : job.status;
    await updateDoc(ref, { isPublished, status, updatedAt: Date.now() });

    if (caller) {
      await AuditLogService.createAuditLog(job.tenantId, {
        userId: caller.uid,
        userEmail: caller.email,
        action: "status_change",
        resource: "job",
        resourceId: jobId,
        details: `${isPublished ? "Published" : "Unpublished"} job "${job.title}"`,
      });
    }
  },

  async deleteJob(jobId: string, caller?: CallerInfo): Promise<void> {
    const snap = await getDoc(doc(db, "jobs", jobId));
    if (snap.exists() && caller) {
      const job = snap.data() as Job;
      await AuditLogService.createAuditLog(job.tenantId, {
        userId: caller.uid,
        userEmail: caller.email,
        action: "delete",
        resource: "job",
        resourceId: jobId,
        details: `Deleted job "${job.title}"`,
      });
    }
    await deleteDoc(doc(db, "jobs", jobId));
  },

  /* ----------------------------- Bulk actions ----------------------------- */

  async bulkUpdateStatus(jobIds: string[], status: JobStatus, caller?: CallerInfo): Promise<void> {
    if (jobIds.length === 0) return;
    const batch = writeBatch(db);
    const now = Date.now();
    for (const id of jobIds) {
      batch.update(doc(db, "jobs", id), { status, updatedAt: now });
    }
    await batch.commit();

    if (caller && jobIds[0]) {
      const first = await getDoc(doc(db, "jobs", jobIds[0]));
      const tenantId = first.exists() ? (first.data() as Job).tenantId : undefined;
      if (tenantId) {
        await AuditLogService.createAuditLog(tenantId, {
          userId: caller.uid,
          userEmail: caller.email,
          action: "status_change",
          resource: "job",
          resourceId: jobIds.join(","),
          details: `Bulk set status "${status}" on ${jobIds.length} job(s)`,
        });
      }
    }
  },

  async bulkDelete(jobIds: string[], caller?: CallerInfo): Promise<void> {
    if (jobIds.length === 0) return;
    let tenantId: string | undefined;
    if (jobIds[0]) {
      const first = await getDoc(doc(db, "jobs", jobIds[0]));
      tenantId = first.exists() ? (first.data() as Job).tenantId : undefined;
    }
    const batch = writeBatch(db);
    for (const id of jobIds) batch.delete(doc(db, "jobs", id));
    await batch.commit();

    if (caller && tenantId) {
      await AuditLogService.createAuditLog(tenantId, {
        userId: caller.uid,
        userEmail: caller.email,
        action: "delete",
        resource: "job",
        resourceId: jobIds.join(","),
        details: `Bulk deleted ${jobIds.length} job(s)`,
      });
    }
  },
};
