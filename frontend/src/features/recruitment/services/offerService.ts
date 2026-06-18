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
import type { Offer, OfferStatus, ApprovalWorkflow } from "@hrms/middleware";
import { AuditLogService } from "../../settings/services/auditLogService";
import { applyApprovalDecision, buildApprovalWorkflow } from "../utils/recruitment";

type CallerInfo = { uid: string; email: string };

function newId() {
  return `offer_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
}

export type OfferCreateInput = Omit<
  Offer,
  "id" | "tenantId" | "createdAt" | "updatedAt" | "status" | "approval"
> & {
  status?: OfferStatus;
  approvers?: Array<{ approverId: string; approverEmail: string; approverName?: string }>;
};

export const OfferService = {
  async getByCandidate(tenantId: string, candidateId: string): Promise<Offer[]> {
    const q = query(
      collection(db, "offers"),
      where("tenantId", "==", tenantId),
      where("candidateId", "==", candidateId)
    );
    const snap = await getDocs(q);
    const list: Offer[] = [];
    snap.forEach((d) => list.push(d.data() as Offer));
    return list.sort((a, b) => b.createdAt - a.createdAt);
  },

  async getByTenant(tenantId: string): Promise<Offer[]> {
    const q = query(collection(db, "offers"), where("tenantId", "==", tenantId));
    const snap = await getDocs(q);
    const list: Offer[] = [];
    snap.forEach((d) => list.push(d.data() as Offer));
    return list.sort((a, b) => b.createdAt - a.createdAt);
  },

  async create(tenantId: string, input: OfferCreateInput, caller?: CallerInfo): Promise<Offer> {
    const id = newId();
    const now = Date.now();
    const approval: ApprovalWorkflow = buildApprovalWorkflow(input.approvers ?? []);
    const { approvers, ...rest } = input;
    void approvers;

    const offer: Offer = {
      ...rest,
      id,
      tenantId,
      status: input.status ?? (approval.required ? "pending_approval" : "draft"),
      approval,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db, "offers", id), offer);

    if (caller) {
      await AuditLogService.createAuditLog(tenantId, {
        userId: caller.uid,
        userEmail: caller.email,
        action: "create",
        resource: "offer",
        resourceId: id,
        details: `Created offer for ${offer.candidateName} (${offer.jobTitle})`,
      });
    }
    return offer;
  },

  async update(
    id: string,
    data: Partial<Omit<Offer, "id" | "tenantId" | "createdAt" | "updatedAt">>,
    caller?: CallerInfo
  ): Promise<void> {
    const ref2 = doc(db, "offers", id);
    const snap = await getDoc(ref2);
    if (!snap.exists()) return;
    const old = snap.data() as Offer;
    await updateDoc(ref2, { ...data, updatedAt: Date.now() });

    if (caller) {
      await AuditLogService.createAuditLog(old.tenantId, {
        userId: caller.uid,
        userEmail: caller.email,
        action: "update",
        resource: "offer",
        resourceId: id,
        details: `Updated offer for ${old.candidateName}`,
      });
    }
  },

  async decideApproval(
    id: string,
    decision: "approved" | "rejected",
    caller: CallerInfo,
    comment?: string
  ): Promise<void> {
    const ref2 = doc(db, "offers", id);
    const snap = await getDoc(ref2);
    if (!snap.exists()) return;
    const offer = snap.data() as Offer;
    const nextWorkflow = applyApprovalDecision(offer.approval, decision, caller.uid, comment);
    const status: OfferStatus =
      nextWorkflow.status === "approved"
        ? "approved"
        : nextWorkflow.status === "rejected"
          ? "rescinded"
          : "pending_approval";

    await updateDoc(ref2, { approval: nextWorkflow, status, updatedAt: Date.now() });

    await AuditLogService.createAuditLog(offer.tenantId, {
      userId: caller.uid,
      userEmail: caller.email,
      action: decision === "approved" ? "approve" : "reject",
      resource: "offer",
      resourceId: id,
      details: `${decision === "approved" ? "Approved" : "Rejected"} offer for ${offer.candidateName}`,
    });
  },

  /** Transition the offer to `sent` (a backend trigger emails the candidate). */
  async send(id: string, caller?: CallerInfo): Promise<void> {
    const ref2 = doc(db, "offers", id);
    const snap = await getDoc(ref2);
    if (!snap.exists()) return;
    const offer = snap.data() as Offer;
    await updateDoc(ref2, { status: "sent", sentAt: Date.now(), updatedAt: Date.now() });

    if (caller) {
      await AuditLogService.createAuditLog(offer.tenantId, {
        userId: caller.uid,
        userEmail: caller.email,
        action: "status_change",
        resource: "offer",
        resourceId: id,
        details: `Sent offer to ${offer.candidateName}`,
      });
    }
  },

  async setOutcome(id: string, status: "accepted" | "declined", caller?: CallerInfo): Promise<void> {
    const ref2 = doc(db, "offers", id);
    const snap = await getDoc(ref2);
    if (!snap.exists()) return;
    const offer = snap.data() as Offer;
    await updateDoc(ref2, { status, respondedAt: Date.now(), updatedAt: Date.now() });

    if (caller) {
      await AuditLogService.createAuditLog(offer.tenantId, {
        userId: caller.uid,
        userEmail: caller.email,
        action: "status_change",
        resource: "offer",
        resourceId: id,
        details: `Offer ${status} by ${offer.candidateName}`,
      });
    }
  },

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(db, "offers", id));
  },
};
