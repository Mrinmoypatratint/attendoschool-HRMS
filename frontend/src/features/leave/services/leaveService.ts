/**
 * leaveService
 * ------------
 * Firestore data-access layer for the Leave module. Exposes service objects for
 * leave types, policies, holiday calendars, balances, and requests. Each
 * mutating operation also writes an audit-log entry (when a caller is supplied)
 * and, where relevant, defers balance settlement to server-side Cloud Functions.
 *
 * Collections used: `leaveTypes`, `leavePolicies`, `holidayCalendars`,
 * `leaveBalances`, `leaveRequests`. All reads are tenant-scoped via a
 * `tenantId == <id>` query filter.
 */
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type {
  LeaveType,
  LeavePolicy,
  LeaveRequest,
  LeaveBalance,
  HolidayCalendar,
  LeaveRequestStatus,
} from "@hrms/middleware";
import { AuditLogService } from "../../settings/services/auditLogService";
import {
  buildApprovalWorkflow,
  applyApprovalDecision,
  requestStatusFromApproval,
  computeAccrual,
} from "../utils/leave";

type CallerInfo = { uid: string; email: string };

/** Generate a collision-resistant document id with a human-readable prefix. */
function rid(p: string) {
  return `${p}_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
}

/** Fetch all documents in `name` belonging to a tenant (`tenantId` filter). */
async function listByTenant<T>(name: string, tenantId: string): Promise<T[]> {
  const snap = await getDocs(query(collection(db, name), where("tenantId", "==", tenantId)));
  const list: T[] = [];
  snap.forEach((d) => list.push(d.data() as T));
  return list;
}

/* ------------------------------------------------------------------ */
/*  Leave types                                                        */
/* ------------------------------------------------------------------ */

/** CRUD service for leave types (e.g. Annual, Sick), with audit logging. */
export const LeaveTypeService = {
  list: (tenantId: string) => listByTenant<LeaveType>("leaveTypes", tenantId),

  async create(tenantId: string, data: Omit<LeaveType, "id" | "tenantId" | "createdAt" | "updatedAt">, caller?: CallerInfo) {
    const id = rid("ltype");
    const now = Date.now();
    const lt: LeaveType = { ...data, id, tenantId, createdAt: now, updatedAt: now };
    await setDoc(doc(db, "leaveTypes", id), lt);
    if (caller) await AuditLogService.createAuditLog(tenantId, { userId: caller.uid, userEmail: caller.email, action: "create", resource: "leave_type", resourceId: id, details: `Created leave type "${lt.name}"` });
    return lt;
  },

  async update(id: string, data: Partial<LeaveType>, caller?: CallerInfo) {
    const snap = await getDoc(doc(db, "leaveTypes", id));
    if (!snap.exists()) return;
    const old = snap.data() as LeaveType;
    await updateDoc(doc(db, "leaveTypes", id), { ...data, updatedAt: Date.now() });
    if (caller) await AuditLogService.createAuditLog(old.tenantId, { userId: caller.uid, userEmail: caller.email, action: "update", resource: "leave_type", resourceId: id, details: `Updated leave type "${old.name}"` });
  },

  async remove(id: string, caller?: CallerInfo) {
    const snap = await getDoc(doc(db, "leaveTypes", id));
    if (snap.exists() && caller) {
      const lt = snap.data() as LeaveType;
      await AuditLogService.createAuditLog(lt.tenantId, { userId: caller.uid, userEmail: caller.email, action: "delete", resource: "leave_type", resourceId: id, details: `Deleted leave type "${lt.name}"` });
    }
    await deleteDoc(doc(db, "leaveTypes", id));
  },
};

/* ------------------------------------------------------------------ */
/*  Leave policies                                                     */
/* ------------------------------------------------------------------ */

/** CRUD service for leave accrual policies, with audit logging. */
export const LeavePolicyService = {
  list: (tenantId: string) => listByTenant<LeavePolicy>("leavePolicies", tenantId),

  async create(tenantId: string, data: Omit<LeavePolicy, "id" | "tenantId" | "createdAt" | "updatedAt">, caller?: CallerInfo) {
    const id = rid("lpol");
    const now = Date.now();
    const p: LeavePolicy = { ...data, id, tenantId, createdAt: now, updatedAt: now };
    await setDoc(doc(db, "leavePolicies", id), p);
    if (caller) await AuditLogService.createAuditLog(tenantId, { userId: caller.uid, userEmail: caller.email, action: "create", resource: "leave_policy", resourceId: id, details: `Created leave policy "${p.name}"` });
    return p;
  },

  async update(id: string, data: Partial<LeavePolicy>, caller?: CallerInfo) {
    const snap = await getDoc(doc(db, "leavePolicies", id));
    if (!snap.exists()) return;
    const old = snap.data() as LeavePolicy;
    await updateDoc(doc(db, "leavePolicies", id), { ...data, updatedAt: Date.now() });
    if (caller) await AuditLogService.createAuditLog(old.tenantId, { userId: caller.uid, userEmail: caller.email, action: "update", resource: "leave_policy", resourceId: id, details: `Updated leave policy "${old.name}"` });
  },

  async remove(id: string, caller?: CallerInfo) {
    const snap = await getDoc(doc(db, "leavePolicies", id));
    if (snap.exists() && caller) {
      const p = snap.data() as LeavePolicy;
      await AuditLogService.createAuditLog(p.tenantId, { userId: caller.uid, userEmail: caller.email, action: "delete", resource: "leave_policy", resourceId: id, details: `Deleted leave policy "${p.name}"` });
    }
    await deleteDoc(doc(db, "leavePolicies", id));
  },
};

/* ------------------------------------------------------------------ */
/*  Holiday calendars                                                  */
/* ------------------------------------------------------------------ */

/** CRUD service for holiday calendars, plus a helper to flatten holiday dates. */
export const HolidayService = {
  list: (tenantId: string) => listByTenant<HolidayCalendar>("holidayCalendars", tenantId),

  async create(tenantId: string, data: Omit<HolidayCalendar, "id" | "tenantId" | "createdAt" | "updatedAt">, caller?: CallerInfo) {
    const id = rid("hcal");
    const now = Date.now();
    const c: HolidayCalendar = { ...data, id, tenantId, createdAt: now, updatedAt: now };
    await setDoc(doc(db, "holidayCalendars", id), c);
    if (caller) await AuditLogService.createAuditLog(tenantId, { userId: caller.uid, userEmail: caller.email, action: "create", resource: "holiday_calendar", resourceId: id, details: `Created holiday calendar "${c.name}" (${c.year})` });
    return c;
  },

  async update(id: string, data: Partial<HolidayCalendar>, caller?: CallerInfo) {
    const snap = await getDoc(doc(db, "holidayCalendars", id));
    if (!snap.exists()) return;
    const old = snap.data() as HolidayCalendar;
    await updateDoc(doc(db, "holidayCalendars", id), { ...data, updatedAt: Date.now() });
    if (caller) await AuditLogService.createAuditLog(old.tenantId, { userId: caller.uid, userEmail: caller.email, action: "update", resource: "holiday_calendar", resourceId: id, details: `Updated holiday calendar "${old.name}"` });
  },

  async remove(id: string, caller?: CallerInfo) {
    const snap = await getDoc(doc(db, "holidayCalendars", id));
    if (snap.exists() && caller) {
      const c = snap.data() as HolidayCalendar;
      await AuditLogService.createAuditLog(c.tenantId, { userId: caller.uid, userEmail: caller.email, action: "delete", resource: "holiday_calendar", resourceId: id, details: `Deleted holiday calendar "${c.name}"` });
    }
    await deleteDoc(doc(db, "holidayCalendars", id));
  },

  /** Flatten holiday dates for a year from the tenant's calendars. */
  async holidayDatesForYear(tenantId: string, year: number): Promise<string[]> {
    const calendars = await this.list(tenantId);
    return calendars
      .filter((c) => c.year === year)
      .flatMap((c) => c.holidays.map((h) => h.date));
  },
};

/* ------------------------------------------------------------------ */
/*  Leave balances                                                     */
/* ------------------------------------------------------------------ */

/** Deterministic balance document id (one balance per employee/type/year). */
function balanceId(tenantId: string, employeeId: string, leaveTypeId: string, year: number) {
  return `${tenantId}_${employeeId}_${leaveTypeId}_${year}`;
}

/** Service for reading, seeding, and accruing per-employee leave balances. */
export const LeaveBalanceService = {
  list: (tenantId: string) => listByTenant<LeaveBalance>("leaveBalances", tenantId),

  async listForEmployee(tenantId: string, employeeId: string): Promise<LeaveBalance[]> {
    const snap = await getDocs(
      query(collection(db, "leaveBalances"), where("tenantId", "==", tenantId), where("employeeId", "==", employeeId))
    );
    const list: LeaveBalance[] = [];
    snap.forEach((d) => list.push(d.data() as LeaveBalance));
    return list;
  },

  async ensure(tenantId: string, employeeId: string, leaveTypeId: string, year: number, seedDays = 0): Promise<LeaveBalance> {
    const id = balanceId(tenantId, employeeId, leaveTypeId, year);
    const ref = doc(db, "leaveBalances", id);
    const snap = await getDoc(ref);
    if (snap.exists()) return snap.data() as LeaveBalance;
    const now = Date.now();
    const bal: LeaveBalance = {
      id, tenantId, employeeId, leaveTypeId, year,
      accruedDays: seedDays, usedDays: 0, pendingDays: 0, carriedOverDays: 0,
      lastAccruedAt: 0, createdAt: now, updatedAt: now,
    };
    await setDoc(ref, bal);
    return bal;
  },

  async save(bal: LeaveBalance): Promise<void> {
    await setDoc(doc(db, "leaveBalances", bal.id), { ...bal, updatedAt: Date.now() });
  },

  /** Run accrual for a single balance against its policy, as of `asOfMs`. */
  async runAccrual(bal: LeaveBalance, policy: LeavePolicy, asOfMs: number, caller?: CallerInfo): Promise<LeaveBalance> {
    const result = computeAccrual(policy, bal.lastAccruedAt, bal.accruedDays, asOfMs);
    if (result.periods <= 0) return bal;
    const updated: LeaveBalance = {
      ...bal,
      accruedDays: result.newAccruedDays,
      lastAccruedAt: result.newLastAccruedAt,
      updatedAt: Date.now(),
    };
    await this.save(updated);
    if (caller) {
      await AuditLogService.createAuditLog(bal.tenantId, {
        userId: caller.uid, userEmail: caller.email, action: "update", resource: "leave_balance",
        resourceId: bal.id, details: `Accrued ${result.accruedDelta} day(s) for employee ${bal.employeeId}`,
      });
    }
    return updated;
  },

  /** Run accrual across all balances of a tenant for the given leave types' policies. */
  async runAccrualForTenant(tenantId: string, policies: LeavePolicy[], asOfMs: number, caller?: CallerInfo): Promise<number> {
    const balances = await this.list(tenantId);
    const policyByType = new Map(policies.filter((p) => p.isActive).map((p) => [p.leaveTypeId, p]));
    let applied = 0;
    for (const bal of balances) {
      const policy = policyByType.get(bal.leaveTypeId);
      if (!policy) continue;
      const before = bal.accruedDays;
      const updated = await this.runAccrual(bal, policy, asOfMs, caller);
      if (updated.accruedDays !== before) applied++;
    }
    return applied;
  },
};

/* ------------------------------------------------------------------ */
/*  Leave requests (multi-level approval + balance reservation)        */
/* ------------------------------------------------------------------ */

/** Input payload for creating a leave request (pre-workflow construction). */
export interface LeaveRequestInput {
  employeeId: string;
  employeeName: string;
  leaveTypeId: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  days: number;
  halfDay: boolean;
  reason: string;
  approvers: Array<{ approverId: string; approverEmail: string; approverName?: string }>;
}

/**
 * Service for the leave-request lifecycle: list/submit/decide/cancel. Builds the
 * multi-level approval workflow on submit; balance reservation/settlement is
 * handled server-side by the onLeaveRequestUpdated Cloud Function.
 */
export const LeaveRequestService = {
  list: (tenantId: string) => listByTenant<LeaveRequest>("leaveRequests", tenantId),

  async listForEmployee(tenantId: string, employeeId: string): Promise<LeaveRequest[]> {
    const snap = await getDocs(
      query(collection(db, "leaveRequests"), where("tenantId", "==", tenantId), where("employeeId", "==", employeeId))
    );
    const list: LeaveRequest[] = [];
    snap.forEach((d) => list.push(d.data() as LeaveRequest));
    return list.sort((a, b) => b.createdAt - a.createdAt);
  },

  /** Submit a request: creates the multi-level workflow and reserves pending balance. */
  async submit(tenantId: string, input: LeaveRequestInput, caller?: CallerInfo): Promise<LeaveRequest> {
    const id = rid("leave");
    const now = Date.now();
    const approval = buildApprovalWorkflow(input.approvers);
    const { approvers, ...rest } = input;
    void approvers;
    const req: LeaveRequest = {
      ...rest,
      id,
      tenantId,
      status: approval.required ? "pending" : "approved",
      approval,
      createdBy: caller?.uid || "",
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db, "leaveRequests", id), req);

    // Balance reservation/settlement is handled server-side by the
    // onLeaveRequestUpdated Cloud Function (Admin SDK), so the requester does
    // not need elevated leaveBalances write permission.

    if (caller) {
      await AuditLogService.createAuditLog(tenantId, {
        userId: caller.uid, userEmail: caller.email, action: "create", resource: "leave_request",
        resourceId: id, details: `Requested ${input.days} day(s) ${input.leaveTypeName} (${input.startDate}→${input.endDate})`,
      });
    }
    return req;
  },

  /** Approve/reject the current step of a request's multi-level workflow. */
  async decide(id: string, decision: "approved" | "rejected", caller: CallerInfo, comment?: string): Promise<void> {
    const ref = doc(db, "leaveRequests", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const req = snap.data() as LeaveRequest;

    const nextApproval = applyApprovalDecision(req.approval, decision, caller.uid, comment);
    const nextStatus: LeaveRequestStatus = requestStatusFromApproval(nextApproval.status);
    await updateDoc(ref, { approval: nextApproval, status: nextStatus, updatedAt: Date.now() });

    // Balance is settled server-side by onLeaveRequestUpdated (Admin SDK).

    await AuditLogService.createAuditLog(req.tenantId, {
      userId: caller.uid, userEmail: caller.email,
      action: decision === "approved" ? "approve" : "reject",
      resource: "leave_request", resourceId: id,
      details: `${decision === "approved" ? "Approved" : "Rejected"} leave for ${req.employeeName}${comment ? `: ${comment}` : ""}`,
    });
  },

  /** Cancel a request and release any reserved/used balance. */
  async cancel(id: string, caller?: CallerInfo): Promise<void> {
    const ref = doc(db, "leaveRequests", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const req = snap.data() as LeaveRequest;
    if (req.status === "cancelled") return;

    // Balance release is handled server-side by onLeaveRequestUpdated (Admin SDK).
    await updateDoc(ref, { status: "cancelled", updatedAt: Date.now() });

    if (caller) {
      await AuditLogService.createAuditLog(req.tenantId, {
        userId: caller.uid, userEmail: caller.email, action: "status_change", resource: "leave_request",
        resourceId: id, details: `Cancelled leave for ${req.employeeName}`,
      });
    }
  },
};
