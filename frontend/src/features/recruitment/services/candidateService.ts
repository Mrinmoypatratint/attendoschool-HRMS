/**
 * CandidateService — Firestore data-access layer for candidates and their
 * notes (collections: `candidates`, `candidateNotes`).
 *
 * Responsibilities:
 *   - CRUD + stage/status transitions for candidates (with audit logging).
 *   - Résumé upload to Cloud Storage.
 *   - Candidate notes and tenant-scoped bulk operations.
 *
 * All reads/writes are tenant-scoped; mutations optionally accept a `caller`
 * so the action can be recorded via AuditLogService.
 */
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
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "../../../lib/firebase";
import type { Candidate, CandidateNote, CandidateStatus } from "@hrms/middleware";
import { AuditLogService } from "../../settings/services/auditLogService";
import { deriveStatusForStage } from "../utils/recruitment";

type CallerInfo = { uid: string; email: string };

/** Generate a collision-resistant client-side candidate document id. */
function newCandidateId() {
  return `cand_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
}
/** Generate a collision-resistant client-side note document id. */
function newNoteId() {
  return `note_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
}

/** Input for creating a candidate; server-managed fields are omitted, `appliedAt` is optional. */
export type CandidateCreateInput = Omit<
  Candidate,
  "id" | "tenantId" | "createdAt" | "updatedAt" | "appliedAt"
> & { appliedAt?: number };

/** Tenant-scoped data-access object for candidates and candidate notes. */
export const CandidateService = {
  /** List all candidates for a tenant, newest application first (bounded to 2000 docs). */
  async getCandidates(tenantId: string): Promise<Candidate[]> {
    // Scale guardrail: bound worst-case reads. For very large tenants, prefer
    // per-job loading (getCandidatesByJob) / server-side pagination.
    const q = query(collection(db, "candidates"), where("tenantId", "==", tenantId), limit(2000));
    const snap = await getDocs(q);
    const list: Candidate[] = [];
    snap.forEach((d) => list.push(d.data() as Candidate));
    return list.sort((a, b) => b.appliedAt - a.appliedAt);
  },

  /** Fetch candidates for a single job within a tenant, newest application first. */
  async getCandidatesByJob(tenantId: string, jobId: string): Promise<Candidate[]> {
    const q = query(
      collection(db, "candidates"),
      where("tenantId", "==", tenantId),
      where("jobId", "==", jobId)
    );
    const snap = await getDocs(q);
    const list: Candidate[] = [];
    snap.forEach((d) => list.push(d.data() as Candidate));
    return list.sort((a, b) => b.appliedAt - a.appliedAt);
  },

  async getCandidateById(id: string): Promise<Candidate | null> {
    const snap = await getDoc(doc(db, "candidates", id));
    return snap.exists() ? (snap.data() as Candidate) : null;
  },

  /** Upload a resume file to storage; returns the public URL + storage path. */
  async uploadResume(
    tenantId: string,
    file: File
  ): Promise<{ resumeUrl: string; resumePath: string }> {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const resumePath = `tenants/${tenantId}/resumes/${Date.now()}_${safeName}`;
    const storageRef = ref(storage, resumePath);
    await uploadBytes(storageRef, file, { contentType: file.type });
    const resumeUrl = await getDownloadURL(storageRef);
    return { resumeUrl, resumePath };
  },

  async createCandidate(
    tenantId: string,
    input: CandidateCreateInput,
    caller?: CallerInfo
  ): Promise<Candidate> {
    // Duplicate detection: one candidate per email per job within a tenant.
    const email = (input.email || "").trim().toLowerCase();
    if (email && input.jobId) {
      const dup = await getDocs(
        query(
          collection(db, "candidates"),
          where("tenantId", "==", tenantId),
          where("jobId", "==", input.jobId),
          where("email", "==", email)
        )
      );
      if (!dup.empty) {
        throw new Error("A candidate with this email already exists for this job.");
      }
    }

    const id = newCandidateId();
    const now = Date.now();
    const candidate: Candidate = {
      ...input,
      email,
      id,
      tenantId,
      appliedAt: input.appliedAt ?? now,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db, "candidates", id), candidate);

    if (caller) {
      await AuditLogService.createAuditLog(tenantId, {
        userId: caller.uid,
        userEmail: caller.email,
        action: "create",
        resource: "candidate",
        resourceId: id,
        details: `Added candidate "${candidate.firstName} ${candidate.lastName}" for "${candidate.jobTitle}"`,
      });
    }
    return candidate;
  },

  async updateCandidate(
    id: string,
    data: Partial<Omit<Candidate, "id" | "tenantId" | "createdAt" | "updatedAt">>,
    caller?: CallerInfo
  ): Promise<void> {
    const ref2 = doc(db, "candidates", id);
    const snap = await getDoc(ref2);
    if (!snap.exists()) return;
    const old = snap.data() as Candidate;
    await updateDoc(ref2, { ...data, updatedAt: Date.now() });

    if (caller) {
      await AuditLogService.createAuditLog(old.tenantId, {
        userId: caller.uid,
        userEmail: caller.email,
        action: "update",
        resource: "candidate",
        resourceId: id,
        details: `Updated candidate "${old.firstName} ${old.lastName}"`,
      });
    }
  },

  /** Move a candidate to a new pipeline stage; derives status for terminal stages. */
  async moveToStage(id: string, stage: string, caller?: CallerInfo): Promise<void> {
    const ref2 = doc(db, "candidates", id);
    const snap = await getDoc(ref2);
    if (!snap.exists()) return;
    const old = snap.data() as Candidate;
    const status: CandidateStatus = deriveStatusForStage(stage);

    await updateDoc(ref2, { stage, status, updatedAt: Date.now() });

    if (caller) {
      await AuditLogService.createAuditLog(old.tenantId, {
        userId: caller.uid,
        userEmail: caller.email,
        action: "stage_change",
        resource: "candidate",
        resourceId: id,
        details: `Moved "${old.firstName} ${old.lastName}" from "${old.stage}" to "${stage}"`,
      });
    }
  },

  async setStatus(id: string, status: CandidateStatus, caller?: CallerInfo): Promise<void> {
    const ref2 = doc(db, "candidates", id);
    const snap = await getDoc(ref2);
    if (!snap.exists()) return;
    const old = snap.data() as Candidate;
    await updateDoc(ref2, { status, updatedAt: Date.now() });

    if (caller) {
      await AuditLogService.createAuditLog(old.tenantId, {
        userId: caller.uid,
        userEmail: caller.email,
        action: "status_change",
        resource: "candidate",
        resourceId: id,
        details: `Set status "${status}" for "${old.firstName} ${old.lastName}"`,
      });
    }
  },

  async deleteCandidate(id: string, caller?: CallerInfo): Promise<void> {
    const snap = await getDoc(doc(db, "candidates", id));
    if (snap.exists()) {
      const c = snap.data() as Candidate;
      if (c.resumePath) {
        try {
          await deleteObject(ref(storage, c.resumePath));
        } catch {
          /* resume may already be gone; ignore */
        }
      }
      if (caller) {
        await AuditLogService.createAuditLog(c.tenantId, {
          userId: caller.uid,
          userEmail: caller.email,
          action: "delete",
          resource: "candidate",
          resourceId: id,
          details: `Deleted candidate "${c.firstName} ${c.lastName}"`,
        });
      }
    }
    await deleteDoc(doc(db, "candidates", id));
  },

  /* ------------------------------- Notes ------------------------------- */

  async getNotes(tenantId: string, candidateId: string): Promise<CandidateNote[]> {
    // tenantId + candidateId equality filters (no composite index needed); the
    // tenantId filter lets the read rule authorise the query. Sorted client-side.
    const q = query(
      collection(db, "candidateNotes"),
      where("tenantId", "==", tenantId),
      where("candidateId", "==", candidateId)
    );
    const snap = await getDocs(q);
    const list: CandidateNote[] = [];
    snap.forEach((d) => list.push(d.data() as CandidateNote));
    return list.sort((a, b) => b.createdAt - a.createdAt);
  },

  async addNote(
    tenantId: string,
    candidateId: string,
    body: string,
    author: { uid: string; name: string }
  ): Promise<CandidateNote> {
    const id = newNoteId();
    const note: CandidateNote = {
      id,
      tenantId,
      candidateId,
      authorId: author.uid,
      authorName: author.name,
      body,
      createdAt: Date.now(),
    };
    await setDoc(doc(db, "candidateNotes", id), note);
    return note;
  },

  async deleteNote(noteId: string): Promise<void> {
    await deleteDoc(doc(db, "candidateNotes", noteId));
  },

  /* ----------------------------- Bulk actions ----------------------------- */

  async bulkMoveToStage(ids: string[], stage: string): Promise<void> {
    if (ids.length === 0) return;
    const status = deriveStatusForStage(stage);
    const batch = writeBatch(db);
    const now = Date.now();
    for (const id of ids) {
      batch.update(doc(db, "candidates", id), { stage, status, updatedAt: now });
    }
    await batch.commit();
  },

  async bulkSetStatus(ids: string[], status: CandidateStatus): Promise<void> {
    if (ids.length === 0) return;
    const batch = writeBatch(db);
    const now = Date.now();
    for (const id of ids) {
      batch.update(doc(db, "candidates", id), { status, updatedAt: now });
    }
    await batch.commit();
  },

  async bulkDelete(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const batch = writeBatch(db);
    for (const id of ids) batch.delete(doc(db, "candidates", id));
    await batch.commit();
  },
};
