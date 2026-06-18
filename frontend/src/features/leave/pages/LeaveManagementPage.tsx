/**
 * LeaveManagementPage
 * -------------------
 * Top-level page for the Leave module. Renders a tabbed interface for leave
 * requests, approvals (an inbox of items awaiting the current user), leave
 * types, accrual policies, holiday calendars, and balances.
 *
 * Data is loaded per active tenant and scoped by the caller's permissions and
 * data-access level: approvers/managers see all tenant data, while regular
 * employees only see their own requests/balances. All mutations route through
 * the service layer (which also writes audit logs); balance settlement is
 * performed server-side by Cloud Functions.
 *
 * This file also contains several module-private presentational sub-components
 * (tables, tabs, modal, shared widgets) used only by this page.
 */
import { getFriendlyErrorMessage } from "../../../lib/errors";
import { useState, useEffect, useCallback, useMemo } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useAuth } from "../../auth/context/AuthContext";
import { useHasPermission } from "../../rbac/hooks/usePermissions";
import { EmployeeService } from "../../employees/services/employeeService";
import {
  LeaveTypeService,
  LeavePolicyService,
  HolidayService,
  LeaveBalanceService,
  LeaveRequestService,
  type LeaveRequestInput,
} from "../services/leaveService";
import {
  workingDaysBetween,
  isCurrentApprover,
  availableBalance,
} from "../utils/leave";
import { Skeleton } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/ErrorState";
import { EmptyState } from "../../../components/ui/EmptyState";
import type {
  LeaveType,
  LeavePolicy,
  LeaveRequest,
  LeaveBalance,
  HolidayCalendar,
  Holiday,
  Employee,
  UserProfile,
  AccrualMethod,
} from "@hrms/middleware";
import {
  CalendarDays, Plus, X, Check, Ban, Trash2, Inbox, ListChecks, Settings2, CalendarRange, Wallet, RefreshCw,
} from "lucide-react";

const TABS = ["requests", "approvals", "types", "policies", "holidays", "balances"] as const;
type Tab = (typeof TABS)[number];
const TAB_LABELS: Record<Tab, string> = {
  requests: "Requests", approvals: "Approvals", types: "Leave Types",
  policies: "Policies", holidays: "Holidays", balances: "Balances",
};
const TAB_ICONS: Record<Tab, React.ReactNode> = {
  requests: <ListChecks size={15} />, approvals: <Inbox size={15} />, types: <Settings2 size={15} />,
  policies: <Settings2 size={15} />, holidays: <CalendarRange size={15} />, balances: <Wallet size={15} />,
};
const ACCRUAL_METHODS: AccrualMethod[] = ["annual_lump", "monthly", "per_pay_period", "none"];
const input = "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const tc = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const today = () => new Date().toISOString().slice(0, 10);

/**
 * Main Leave Management page component. Manages all tab state, loads tenant
 * leave data (scoped by permissions/data-access), and wires approval/cancel
 * actions back through the service layer with a reload-on-success pattern.
 */
export function LeaveManagementPage() {
  const { profile, user, dataAccessLevel } = useAuth();
  const tenantId = profile?.activeTenantId || "";
  const hasPerm = useHasPermission();
  const canApprove = hasPerm("leave.approve");
  const canManage = hasPerm("leave.update");
  const canCreate = hasPerm("leave.create");
  const caller = user ? { uid: user.uid, email: user.email || "" } : undefined;

  const [tab, setTab] = useState<Tab>("requests");
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [calendars, setCalendars] = useState<HolidayCalendar[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [callerEmployee, setCallerEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);

  const load = useCallback(async () => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let resolvedCallerEmp: Employee | null = null;
      if (user?.uid) {
        resolvedCallerEmp = await EmployeeService.getCallerEmployee(tenantId, user.uid);
      }
      setCallerEmployee(resolvedCallerEmp);

      const isAuditorOrAdmin = canApprove || canManage;

      const [t, p, c, r, b, emps, memSnap] = await Promise.all([
        LeaveTypeService.list(tenantId),
        LeavePolicyService.list(tenantId),
        HolidayService.list(tenantId),
        isAuditorOrAdmin
          ? LeaveRequestService.list(tenantId)
          : (resolvedCallerEmp ? LeaveRequestService.listForEmployee(tenantId, resolvedCallerEmp.id) : Promise.resolve([])),
        isAuditorOrAdmin
          ? LeaveBalanceService.list(tenantId)
          : (resolvedCallerEmp ? LeaveBalanceService.listForEmployee(tenantId, resolvedCallerEmp.id) : Promise.resolve([])),
        EmployeeService.getEmployees(tenantId, dataAccessLevel, resolvedCallerEmp),
        getDocs(query(collection(db, "users"), where(`tenants.${tenantId}.status`, "in", ["active", "invited"]))),
      ]);
      setTypes(t); setPolicies(p); setCalendars(c); setRequests(r); setBalances(b); setEmployees(emps);
      const mem: UserProfile[] = [];
      memSnap.forEach((d) => mem.push(d.data() as UserProfile));
      setMembers(mem);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "Failed to load leave data."));
    } finally {
      setLoading(false);
    }
  }, [tenantId, user, dataAccessLevel, canApprove, canManage]);

  useEffect(() => { load(); }, [load]);

  const allowedEmployeeIds = useMemo(() => new Set(employees.map((e) => e.id)), [employees]);

  const visibleRequests = useMemo(() => {
    return requests.filter((req) => allowedEmployeeIds.has(req.employeeId));
  }, [requests, allowedEmployeeIds]);

  const visibleBalances = useMemo(() => {
    return balances.filter((bal) => allowedEmployeeIds.has(bal.employeeId));
  }, [balances, allowedEmployeeIds]);

  const inbox = useMemo(
    () => visibleRequests.filter((r) => user && isCurrentApprover(r.approval, user.uid)),
    [visibleRequests, user]
  );

  const act = async (fn: () => Promise<void>) => {
    try { await fn(); await load(); }
    catch (err) { setError(getFriendlyErrorMessage(err, "Action failed.")); }
  };

  const runAccrual = async () => {
    const applied = await LeaveBalanceService.runAccrualForTenant(tenantId, policies, Date.now(), caller);
    setError(null);
    alert(`Accrual run complete. ${applied} balance(s) updated.`);
    await load();
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-64 w-full" /></div>;
  if (error && requests.length === 0 && types.length === 0) return <ErrorState description={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><CalendarDays className="h-6 w-6 text-blue-600" /> Leave Management</h1>
          <p className="text-sm text-slate-500 mt-1">Requests, approvals, policies, holidays and balances.</p>
        </div>
        {canCreate && (
          <button onClick={() => setRequestOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer">
            <Plus size={18} /> New Request
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-3.5 py-2.5 text-sm font-semibold border-b-2 -mb-px cursor-pointer inline-flex items-center gap-1.5 ${tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
            {TAB_ICONS[t]}{TAB_LABELS[t]}{t === "approvals" && inbox.length > 0 && <span className="ml-1 rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">{inbox.length}</span>}
          </button>
        ))}
      </div>

      {error && <div className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {(tab === "requests" || tab === "approvals") && (
        <RequestsTable
          requests={tab === "approvals" ? inbox : visibleRequests}
          types={types}
          user={user?.uid || ""}
          canApprove={canApprove}
          caller={caller}
          emptyApprovals={tab === "approvals"}
          onApprove={(id) => act(() => LeaveRequestService.decide(id, "approved", caller!))}
          onReject={(id) => act(() => LeaveRequestService.decide(id, "rejected", caller!))}
          onCancel={(id) => act(() => LeaveRequestService.cancel(id, caller))}
        />
      )}

      {tab === "types" && <TypesTab tenantId={tenantId} types={types} canManage={canManage} caller={caller} reload={load} setError={setError} />}
      {tab === "policies" && <PoliciesTab tenantId={tenantId} policies={policies} types={types} canManage={canManage} caller={caller} reload={load} setError={setError} />}
      {tab === "holidays" && <HolidaysTab tenantId={tenantId} calendars={calendars} canManage={canManage} caller={caller} reload={load} setError={setError} />}
      {tab === "balances" && <BalancesTab balances={visibleBalances} types={types} employees={employees} canManage={canManage} onRunAccrual={runAccrual} />}

      {requestOpen && (
        <RequestModal
          tenantId={tenantId} types={types} employees={employees} members={members} calendars={calendars} caller={caller}
          onClose={() => setRequestOpen(false)}
          onCreated={async () => { setRequestOpen(false); await load(); }}
          setError={setError}
        />
      )}
    </div>
  );
}

type Caller = { uid: string; email: string } | undefined;
type SetErr = (s: string | null) => void;

function StatusBadge({ status }: { status: string }) {
  const cls = status === "approved" ? "bg-emerald-100 text-emerald-700" : status === "rejected" ? "bg-rose-100 text-rose-700" : status === "cancelled" ? "bg-slate-200 text-slate-600" : "bg-amber-100 text-amber-700";
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>{tc(status)}</span>;
}

/* ------------------------------ Requests table ------------------------------ */

function RequestsTable({
  requests, user, canApprove, caller, emptyApprovals, onApprove, onReject, onCancel,
}: {
  requests: LeaveRequest[]; types: LeaveType[]; user: string; canApprove: boolean; caller: Caller;
  emptyApprovals: boolean; onApprove: (id: string) => void; onReject: (id: string) => void; onCancel: (id: string) => void;
}) {
  if (requests.length === 0) {
    return <EmptyState title={emptyApprovals ? "Nothing to approve" : "No leave requests"} description={emptyApprovals ? "Requests awaiting your approval will appear here." : "Submit a leave request to get started."} icon={<CalendarDays className="h-6 w-6" />} />;
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-slate-500">
            <th className="px-4 py-3">Employee</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Dates</th>
            <th className="px-4 py-3">Days</th><th className="px-4 py-3">Approvals</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => {
            const amApprover = canApprove && isCurrentApprover(r.approval, user);
            const step = r.approval.steps[r.approval.currentStep];
            return (
              <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                <td className="px-4 py-3 font-semibold text-slate-900">{r.employeeName}</td>
                <td className="px-4 py-3 text-slate-600">{r.leaveTypeName}</td>
                <td className="px-4 py-3 text-slate-600">{r.startDate} → {r.endDate}</td>
                <td className="px-4 py-3 text-slate-600">{r.days}{r.halfDay ? " (½)" : ""}</td>
                <td className="px-4 py-3 text-slate-500">
                  {r.approval.required ? (
                    <span>{r.approval.steps.filter((s) => s.status === "approved").length}/{r.approval.steps.length}{step && r.status === "pending" ? ` · awaiting ${step.approverName || step.approverEmail}` : ""}</span>
                  ) : <span className="text-slate-400">No approval</span>}
                </td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    {amApprover && (
                      <>
                        <button title="Approve" onClick={() => onApprove(r.id)} className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 cursor-pointer"><Check size={16} /></button>
                        <button title="Reject" onClick={() => onReject(r.id)} className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 cursor-pointer"><Ban size={16} /></button>
                      </>
                    )}
                    {(r.status === "pending" || r.status === "approved") && (r.createdBy === caller?.uid || canApprove) && (
                      <button title="Cancel" onClick={() => onCancel(r.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 cursor-pointer"><X size={16} /></button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------ Request modal ------------------------------ */

function RequestModal({
  tenantId, types, employees, members, calendars, caller, onClose, onCreated, setError,
}: {
  tenantId: string; types: LeaveType[]; employees: Employee[]; members: UserProfile[]; calendars: HolidayCalendar[];
  caller: Caller; onClose: () => void; onCreated: () => void; setError: SetErr;
}) {
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "");
  const [leaveTypeId, setLeaveTypeId] = useState(types[0]?.id ?? "");
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState(today());
  const [halfDay, setHalfDay] = useState(false);
  const [reason, setReason] = useState("");
  const [approverIds, setApproverIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const year = new Date(`${startDate}T00:00:00Z`).getUTCFullYear();
  const holidays = useMemo(() => calendars.filter((c) => c.year === year).flatMap((c) => c.holidays.map((h) => h.date)), [calendars, year]);
  const rawDays = workingDaysBetween(startDate, endDate, holidays);
  const days = halfDay ? Math.max(0.5, rawDays - 0.5) : rawDays;

  const save = async () => {
    const emp = employees.find((e) => e.id === employeeId);
    const type = types.find((t) => t.id === leaveTypeId);
    if (!emp || !type) { setError("Select an employee and leave type."); return; }
    if (days <= 0) { setError("Selected dates contain no working days."); return; }
    setSaving(true); setError(null);
    try {
      const approvers = type.requiresApproval
        ? approverIds.map((id) => members.find((m) => m.id === id)).filter((m): m is UserProfile => !!m)
            .map((m) => ({ approverId: m.id, approverEmail: m.email, approverName: m.displayName }))
        : [];
      const inputData: LeaveRequestInput = {
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        leaveTypeId: type.id,
        leaveTypeName: type.name,
        startDate, endDate, days, halfDay, reason,
        approvers,
      };
      await LeaveRequestService.submit(tenantId, inputData, caller);
      onCreated();
    } catch (e) { setError(getFriendlyErrorMessage(e, "Failed to submit request.")); }
    finally { setSaving(false); }
  };

  return (
    <Modal title="New Leave Request" onClose={onClose} onSave={save} saving={saving}>
      <label className="block text-xs font-semibold text-slate-600">Employee
        <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className={input}>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
        </select>
      </label>
      <label className="block text-xs font-semibold text-slate-600">Leave Type
        <select value={leaveTypeId} onChange={(e) => setLeaveTypeId(e.target.value)} className={input}>
          {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-xs font-semibold text-slate-600">Start<input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={input} /></label>
        <label className="block text-xs font-semibold text-slate-600">End<input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={input} /></label>
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={halfDay} onChange={(e) => setHalfDay(e.target.checked)} className="rounded" /> Half day</label>
      <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 text-sm text-slate-600">Working days requested: <strong>{days}</strong> (weekends &amp; holidays excluded)</div>
      <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" rows={2} className={input} />
      <div className="rounded-xl border border-slate-200 p-3">
        <p className="text-xs font-semibold text-slate-600 mb-2">Approvers (in order, for multi-level approval)</p>
        <div className="max-h-32 overflow-y-auto space-y-1.5">
          {members.map((m) => (
            <label key={m.id} className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={approverIds.includes(m.id)} onChange={(e) => setApproverIds((prev) => e.target.checked ? [...prev, m.id] : prev.filter((x) => x !== m.id))} className="rounded" />
              {m.displayName} <span className="text-slate-400">({m.email})</span>
            </label>
          ))}
        </div>
        <p className="mt-1 text-[11px] text-slate-400">Leave empty to auto-approve (if the leave type doesn't require approval).</p>
      </div>
    </Modal>
  );
}

/* ------------------------------ Types tab ------------------------------ */

function TypesTab({ tenantId, types, canManage, caller, reload, setError }: { tenantId: string; types: LeaveType[]; canManage: boolean; caller: Caller; reload: () => Promise<void>; setError: SetErr }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ name: "", code: "", colorHex: "#2563eb", paid: true, requiresApproval: true, defaultAllowanceDays: 20 });
  const save = async () => {
    if (!f.name.trim() || !f.code.trim()) { setError("Name and code are required."); return; }
    setSaving(true); setError(null);
    try {
      await LeaveTypeService.create(tenantId, { ...f, name: f.name.trim(), code: f.code.trim().toUpperCase(), isActive: true }, caller);
      setOpen(false); setF({ name: "", code: "", colorHex: "#2563eb", paid: true, requiresApproval: true, defaultAllowanceDays: 20 });
      await reload();
    } catch (e) { setError(getFriendlyErrorMessage(e, "Failed.")); } finally { setSaving(false); }
  };
  return (
    <div className="space-y-4">
      <Header title="Leave Types" count={types.length} onAdd={canManage ? () => setOpen(true) : undefined} addLabel="Add Type" />
      {types.length === 0 ? <EmptyState title="No leave types" description="Define the kinds of leave employees can take." icon={<Settings2 className="h-6 w-6" />} /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {types.map((t) => (
            <div key={t.id} className="rounded-xl border border-slate-200 bg-white p-4 flex items-start justify-between">
              <div>
                <div className="font-semibold text-slate-900 flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: t.colorHex }} />{t.name} <span className="text-xs text-slate-400">{t.code}</span></div>
                <div className="text-xs text-slate-500 mt-1">{t.paid ? "Paid" : "Unpaid"} · {t.defaultAllowanceDays} days/yr · {t.requiresApproval ? "Approval required" : "Auto-approve"}</div>
              </div>
              {canManage && <button onClick={async () => { await LeaveTypeService.remove(t.id, caller); await reload(); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"><Trash2 size={16} /></button>}
            </div>
          ))}
        </div>
      )}
      {open && (
        <Modal title="Add Leave Type" onClose={() => setOpen(false)} onSave={save} saving={saving}>
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Name (e.g. Annual Leave)" className={input} />
          <input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} placeholder="Code (e.g. AL)" className={input} />
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-semibold text-slate-600">Color<input type="color" value={f.colorHex} onChange={(e) => setF({ ...f, colorHex: e.target.value })} className="w-full h-9 rounded-lg border border-slate-200" /></label>
            <label className="text-xs font-semibold text-slate-600">Allowance (days/yr)<input type="number" value={f.defaultAllowanceDays} onChange={(e) => setF({ ...f, defaultAllowanceDays: Number(e.target.value) })} className={input} /></label>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={f.paid} onChange={(e) => setF({ ...f, paid: e.target.checked })} className="rounded" /> Paid leave</label>
          <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={f.requiresApproval} onChange={(e) => setF({ ...f, requiresApproval: e.target.checked })} className="rounded" /> Requires approval</label>
        </Modal>
      )}
    </div>
  );
}

/* ------------------------------ Policies tab ------------------------------ */

function PoliciesTab({ tenantId, policies, types, canManage, caller, reload, setError }: { tenantId: string; policies: LeavePolicy[]; types: LeaveType[]; canManage: boolean; caller: Caller; reload: () => Promise<void>; setError: SetErr }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ name: "", leaveTypeId: types[0]?.id ?? "", accrualMethod: "monthly" as AccrualMethod, accrualRateDays: 1.5, annualCapDays: 18, carryOverCapDays: 5, allowNegativeBalance: false, waitingPeriodDays: 0, effectiveFrom: today() });
  const typeName = (id: string) => types.find((t) => t.id === id)?.name ?? "—";
  const save = async () => {
    if (!f.name.trim() || !f.leaveTypeId) { setError("Name and leave type are required."); return; }
    setSaving(true); setError(null);
    try {
      await LeavePolicyService.create(tenantId, { ...f, name: f.name.trim(), isActive: true }, caller);
      setOpen(false);
      await reload();
    } catch (e) { setError(getFriendlyErrorMessage(e, "Failed.")); } finally { setSaving(false); }
  };
  return (
    <div className="space-y-4">
      <Header title="Leave Policies" count={policies.length} onAdd={canManage ? () => setOpen(true) : undefined} addLabel="Add Policy" />
      {policies.length === 0 ? <EmptyState title="No policies" description="Define accrual rules for leave types." icon={<Settings2 className="h-6 w-6" />} /> : (
        <div className="space-y-2">
          {policies.map((p) => (
            <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-4 flex items-start justify-between">
              <div>
                <div className="font-semibold text-slate-900">{p.name} <span className="text-xs text-slate-400">· {typeName(p.leaveTypeId)}</span></div>
                <div className="text-xs text-slate-500 mt-1">{tc(p.accrualMethod)} · {p.accrualRateDays} days/period · cap {p.annualCapDays || "∞"} · carryover {p.carryOverCapDays} · {p.allowNegativeBalance ? "negative ok" : "no negative"}</div>
              </div>
              {canManage && <button onClick={async () => { await LeavePolicyService.remove(p.id, caller); await reload(); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"><Trash2 size={16} /></button>}
            </div>
          ))}
        </div>
      )}
      {open && (
        <Modal title="Add Leave Policy" onClose={() => setOpen(false)} onSave={save} saving={saving}>
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Policy name" className={input} />
          <label className="block text-xs font-semibold text-slate-600">Leave Type<select value={f.leaveTypeId} onChange={(e) => setF({ ...f, leaveTypeId: e.target.value })} className={input}>{types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
          <label className="block text-xs font-semibold text-slate-600">Accrual Method<select value={f.accrualMethod} onChange={(e) => setF({ ...f, accrualMethod: e.target.value as AccrualMethod })} className={input}>{ACCRUAL_METHODS.map((m) => <option key={m} value={m}>{tc(m)}</option>)}</select></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-semibold text-slate-600">Rate (days/period)<input type="number" step="0.1" value={f.accrualRateDays} onChange={(e) => setF({ ...f, accrualRateDays: Number(e.target.value) })} className={input} /></label>
            <label className="text-xs font-semibold text-slate-600">Annual cap (0=∞)<input type="number" value={f.annualCapDays} onChange={(e) => setF({ ...f, annualCapDays: Number(e.target.value) })} className={input} /></label>
            <label className="text-xs font-semibold text-slate-600">Carryover cap<input type="number" value={f.carryOverCapDays} onChange={(e) => setF({ ...f, carryOverCapDays: Number(e.target.value) })} className={input} /></label>
            <label className="text-xs font-semibold text-slate-600">Waiting period (days)<input type="number" value={f.waitingPeriodDays} onChange={(e) => setF({ ...f, waitingPeriodDays: Number(e.target.value) })} className={input} /></label>
          </div>
          <label className="text-xs font-semibold text-slate-600">Effective from<input type="date" value={f.effectiveFrom} onChange={(e) => setF({ ...f, effectiveFrom: e.target.value })} className={input} /></label>
          <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={f.allowNegativeBalance} onChange={(e) => setF({ ...f, allowNegativeBalance: e.target.checked })} className="rounded" /> Allow negative balance</label>
        </Modal>
      )}
    </div>
  );
}

/* ------------------------------ Holidays tab ------------------------------ */

function HolidaysTab({ tenantId, calendars, canManage, caller, reload, setError }: { tenantId: string; calendars: HolidayCalendar[]; canManage: boolean; caller: Caller; reload: () => Promise<void>; setError: SetErr }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [rows, setRows] = useState<Holiday[]>([{ date: today(), name: "" }]);

  const save = async () => {
    if (!name.trim()) { setError("Calendar name is required."); return; }
    const holidays = rows.filter((r) => r.date && r.name.trim());
    setSaving(true); setError(null);
    try {
      await HolidayService.create(tenantId, { name: name.trim(), year, holidays, isDefault: calendars.length === 0 }, caller);
      setOpen(false); setName(""); setRows([{ date: today(), name: "" }]);
      await reload();
    } catch (e) { setError(getFriendlyErrorMessage(e, "Failed.")); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <Header title="Holiday Calendars" count={calendars.length} onAdd={canManage ? () => setOpen(true) : undefined} addLabel="Add Calendar" />
      {calendars.length === 0 ? <EmptyState title="No holiday calendars" description="Holidays are excluded from leave day counts." icon={<CalendarRange className="h-6 w-6" />} /> : (
        <div className="space-y-3">
          {calendars.map((c) => (
            <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-slate-900">{c.name} <span className="text-xs text-slate-400">· {c.year} · {c.holidays.length} holidays</span></div>
                {canManage && <button onClick={async () => { await HolidayService.remove(c.id, caller); await reload(); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"><Trash2 size={16} /></button>}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {c.holidays.map((h, i) => <span key={i} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{h.date} · {h.name}</span>)}
              </div>
            </div>
          ))}
        </div>
      )}
      {open && (
        <Modal title="Add Holiday Calendar" onClose={() => setOpen(false)} onSave={save} saving={saving}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Calendar name (e.g. India 2026)" className={input} />
          <label className="block text-xs font-semibold text-slate-600">Year<input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className={input} /></label>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-600">Holidays</p>
            {rows.map((r, i) => (
              <div key={i} className="flex gap-2">
                <input type="date" value={r.date} onChange={(e) => setRows((p) => p.map((x, j) => j === i ? { ...x, date: e.target.value } : x))} className={input} />
                <input value={r.name} onChange={(e) => setRows((p) => p.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="Name" className={input} />
                <button onClick={() => setRows((p) => p.filter((_, j) => j !== i))} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 cursor-pointer"><X size={16} /></button>
              </div>
            ))}
            <button onClick={() => setRows((p) => [...p, { date: today(), name: "" }])} className="text-sm font-medium text-blue-600 hover:underline cursor-pointer">+ Add holiday</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ------------------------------ Balances tab ------------------------------ */

function BalancesTab({ balances, types, employees, canManage, onRunAccrual }: { balances: LeaveBalance[]; types: LeaveType[]; employees: Employee[]; canManage: boolean; onRunAccrual: () => void }) {
  const typeName = (id: string) => types.find((t) => t.id === id)?.name ?? id;
  const empName = (id: string) => { const e = employees.find((x) => x.id === id); return e ? `${e.firstName} ${e.lastName}` : id; };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Leave Balances <span className="text-slate-400 font-normal">({balances.length})</span></h2>
        {canManage && <button onClick={onRunAccrual} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer"><RefreshCw size={16} /> Run Accrual</button>}
      </div>
      {balances.length === 0 ? <EmptyState title="No balances yet" description="Balances are created when leave is requested, or seeded by accrual." icon={<Wallet className="h-6 w-6" />} /> : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">Employee</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Year</th>
              <th className="px-4 py-3">Accrued</th><th className="px-4 py-3">Carried</th><th className="px-4 py-3">Used</th><th className="px-4 py-3">Pending</th><th className="px-4 py-3">Available</th>
            </tr></thead>
            <tbody>
              {balances.map((b) => (
                <tr key={b.id} className="border-b border-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-900">{empName(b.employeeId)}</td>
                  <td className="px-4 py-3 text-slate-600">{typeName(b.leaveTypeId)}</td>
                  <td className="px-4 py-3 text-slate-600">{b.year}</td>
                  <td className="px-4 py-3 text-slate-600">{b.accruedDays}</td>
                  <td className="px-4 py-3 text-slate-600">{b.carriedOverDays}</td>
                  <td className="px-4 py-3 text-slate-600">{b.usedDays}</td>
                  <td className="px-4 py-3 text-amber-600">{b.pendingDays}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">{availableBalance(b)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ shared ------------------------------ */

function Header({ title, count, onAdd, addLabel }: { title: string; count: number; onAdd: (() => void) | undefined; addLabel: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-bold text-slate-900">{title} <span className="text-slate-400 font-normal">({count})</span></h2>
      {onAdd && <button onClick={onAdd} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer"><Plus size={16} /> {addLabel}</button>}
    </div>
  );
}

function Modal({ title, onClose, onSave, saving, children }: { title: string; onClose: () => void; onSave: () => void; saving: boolean; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold text-slate-900">{title}</h2><button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 cursor-pointer"><X size={18} /></button></div>
        <div className="space-y-3">{children}</div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer">Cancel</button>
          <button onClick={onSave} disabled={saving} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 cursor-pointer">{saving ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}

// Default export mirrors the named LeaveManagementPage export (additive; the
// named export is preserved for existing import sites).
export default LeaveManagementPage;