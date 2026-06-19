import { getFriendlyErrorMessage } from "../../../lib/errors";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../../lib/firebase";
import { useAuth } from "../../auth/context/AuthContext";
import { useHasPermission } from "../../rbac/hooks/usePermissions";
import { EmployeeService } from "../services/employeeService";
import {
  ContractService,
  EmergencyContactService,
  EmploymentHistoryService,
  AssetService,
  LifecycleService,
} from "../services/employeeRecordsService";
import {
  deriveContractStatus,
  getActiveContract,
  getPrimaryContact,
  sortHistory,
  activeAssets,
  sortLifecycle,
  deriveCurrentStage,
} from "../utils/employeeRecords";
import { Skeleton } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/ErrorState";
import { EmptyState } from "../../../components/ui/EmptyState";
import type {
  Employee,
  Department,
  EmployeeContract,
  EmergencyContact,
  EmploymentHistoryEntry,
  EmployeeAsset,
  LifecycleEvent,
  ContractType,
  ContractStatus,
  ContactRelationship,
  EmploymentChangeType,
  AssetType,
  AssetStatus,
  LifecycleStage,
} from "@hrms/middleware";
import {
  ArrowLeft, Mail, Phone, MapPin, Calendar, Briefcase, FileText, Users, History,
  Package, Activity, Plus, Trash2, Upload, X, Star, KeyRound, Copy, Check,
} from "lucide-react";

const TABS = ["overview", "contracts", "contacts", "history", "assets", "lifecycle"] as const;
type Tab = (typeof TABS)[number];
const TAB_LABELS: Record<Tab, string> = {
  overview: "Overview",
  contracts: "Contracts",
  contacts: "Emergency Contacts",
  history: "Employment History",
  assets: "Assets",
  lifecycle: "Lifecycle",
};

const CONTRACT_TYPES: ContractType[] = ["full_time", "part_time", "contract", "internship", "temporary", "probation"];
const CONTRACT_STATUSES: ContractStatus[] = ["draft", "active", "expired", "terminated"];
const RELATIONSHIPS: ContactRelationship[] = ["spouse", "parent", "sibling", "child", "friend", "other"];
const CHANGE_TYPES: EmploymentChangeType[] = ["hired", "promotion", "transfer", "title_change", "compensation_change", "department_change", "manager_change", "offboarded"];
const ASSET_TYPES: AssetType[] = ["laptop", "desktop", "monitor", "phone", "tablet", "access_card", "vehicle", "other"];
const ASSET_STATUSES: AssetStatus[] = ["assigned", "returned", "lost", "damaged"];
const LIFECYCLE_STAGES: LifecycleStage[] = ["applicant", "onboarding", "active", "on_leave", "offboarding", "terminated"];

function tc(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function today() {
  return new Date().toISOString().slice(0, 10);
}

export function EmployeeProfilePage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const tenantId = profile?.activeTenantId || "";
  const hasPerm = useHasPermission();
  const canEdit = hasPerm("employees.update");
  const caller = user ? { uid: user.uid, email: user.email || "" } : undefined;

  const [tab, setTab] = useState<Tab>("overview");
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [manager, setManager] = useState<Employee | null>(null);
  const [contracts, setContracts] = useState<EmployeeContract[]>([]);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [history, setHistory] = useState<EmploymentHistoryEntry[]>([]);
  const [assets, setAssets] = useState<EmployeeAsset[]>([]);
  const [lifecycle, setLifecycle] = useState<LifecycleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Login provisioning UI state
  const [provisionInfo, setProvisionInfo] = useState<{ email: string; url: string } | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [sendingLogin, setSendingLogin] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Provision (or re-send) a login for this employee and email a set-password link.
  const handleSendLoginEmail = async () => {
    if (!employee || !tenantId) return;
    if (!employee.email) {
      setToast("This employee has no email address to send a login to.");
      setTimeout(() => setToast(null), 3000);
      return;
    }
    setSendingLogin(true);
    try {
      const provisionFn = httpsCallable(functions, "provisionEmployeeAccount");
      const res = await provisionFn({
        email: employee.email,
        displayName: `${employee.firstName} ${employee.lastName}`.trim(),
        tenantId,
      });
      const d = (res.data || {}) as { uid?: string; oobCode?: string; setPasswordUrl?: string };
      if (d.uid && !employee.userId) {
        await EmployeeService.updateEmployee(employee.id, { userId: d.uid }, caller);
      }
      const localUrl = d.oobCode
        ? `${window.location.origin}/reset-password?oobCode=${encodeURIComponent(d.oobCode)}`
        : d.setPasswordUrl || "";
      await load();
      setLinkCopied(false);
      setProvisionInfo({ email: employee.email, url: localUrl });
    } catch (err: any) {
      console.error(err);
      setToast(
        getFriendlyErrorMessage(
          err,
          "Could not send the login email. Make sure Firebase Functions are running, then try again."
        )
      );
      setTimeout(() => setToast(null), 4000);
    } finally {
      setSendingLogin(false);
    }
  };

  const loadRecords = useCallback(async () => {
    const [c, ec, h, a, l] = await Promise.all([
      ContractService.list(tenantId, id),
      EmergencyContactService.list(tenantId, id),
      EmploymentHistoryService.list(tenantId, id),
      AssetService.list(tenantId, id),
      LifecycleService.list(tenantId, id),
    ]);
    setContracts(c);
    setContacts(ec);
    setHistory(h);
    setAssets(a);
    setLifecycle(l);
  }, [id, tenantId]);

  const load = useCallback(async () => {
    if (!tenantId || !id) return;
    setLoading(true);
    setError(null);
    try {
      const emp = await EmployeeService.getEmployeeById(id);
      if (!emp) {
        setError("Employee not found.");
        return;
      }
      setEmployee(emp);
      const [depts] = await Promise.all([EmployeeService.getDepartments(tenantId), loadRecords()]);
      setDepartments(depts);
      if (emp.managerId) setManager(await EmployeeService.getEmployeeById(emp.managerId));
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "Failed to load employee profile."));
    } finally {
      setLoading(false);
    }
  }, [tenantId, id, loadRecords]);

  useEffect(() => {
    load();
  }, [load]);

  const deptName = useMemo(
    () => departments.find((d) => d.id === employee?.departmentId)?.name ?? "Unassigned",
    [departments, employee]
  );
  const currentStage = useMemo(() => deriveCurrentStage(lifecycle), [lifecycle]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (error || !employee) {
    return <ErrorState title="Profile unavailable" description={error ?? "Not found"} onRetry={load} />;
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate("/employees")} className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800 cursor-pointer">
        <ArrowLeft size={16} /> Back to directory
      </button>

      {/* Header card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 text-xl font-extrabold">
            {employee.firstName[0]}{employee.lastName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-slate-900">{employee.firstName} {employee.lastName}</h1>
            <p className="text-slate-500 flex items-center gap-1.5 mt-0.5"><Briefcase size={14} /> {employee.jobTitle} · {deptName}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">Status: {tc(employee.status)}</span>
              {currentStage && <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">Lifecycle: {tc(currentStage)}</span>}
              {employee.userId ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700"><KeyRound size={11} /> Login active</span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">No login</span>
              )}
            </div>
          </div>

          {/* Keep UI consistent for all users with employees.view:
              Always render the button area; disable when no permission or missing email. */}
          <button
            onClick={handleSendLoginEmail}
            disabled={!canEdit || !employee.email || sendingLogin}
            className={`inline-flex items-center gap-1.5 self-start rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer ${
              !canEdit || !employee.email ? "cursor-not-allowed" : ""
            }`}
            title={
              !canEdit
                ? "No permission to send login email"
                : !employee.email
                ? "Employee has no email"
                : employee.userId
                ? "Resend set-password email"
                : "Create a login and email a set-password link"
            }
          >
            <KeyRound size={15} className="text-blue-600" />
            <span>
              {sendingLogin
                ? "Sending..."
                : employee.userId
                ? "Resend login email"
                : "Send login email"}
            </span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px cursor-pointer ${
              tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {error && <div className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {tab === "overview" && (
        <OverviewTab employee={employee} deptName={deptName} manager={manager} contracts={contracts} contacts={contacts} assets={assets} />
      )}
      {tab === "contracts" && (
        <ContractsTab tenantId={tenantId} employeeId={id} canEdit={canEdit} caller={caller} contracts={contracts} reload={loadRecords} setError={setError} />
      )}
      {tab === "contacts" && (
        <ContactsTab tenantId={tenantId} employeeId={id} canEdit={canEdit} caller={caller} contacts={contacts} reload={loadRecords} setError={setError} />
      )}
      {tab === "history" && (
        <HistoryTab tenantId={tenantId} employeeId={id} canEdit={canEdit} caller={caller} entries={history} departments={departments} reload={loadRecords} setError={setError} />
      )}
      {tab === "assets" && (
        <AssetsTab tenantId={tenantId} employeeId={id} canEdit={canEdit} caller={caller} assets={assets} reload={loadRecords} setError={setError} />
      )}
      {tab === "lifecycle" && (
        <LifecycleTab tenantId={tenantId} employeeId={id} canEdit={canEdit} caller={caller} events={lifecycle} reload={loadRecords} setError={setError} />
      )}

      {/* Set-password email sent modal */}
      {provisionInfo && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-md relative space-y-4">
            <button onClick={() => setProvisionInfo(null)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer">
              <X size={18} />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <Mail size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Set-password email sent</h3>
                <p className="text-xs text-slate-500">The employee can now set their password and sign in.</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              We emailed <span className="font-bold text-slate-800">{provisionInfo.email}</span> a link to set their
              password. After setting it, they can sign in with their email address.
            </p>
            {provisionInfo.url && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  <KeyRound size={12} />
                  <span>Set-password link</span>
                </div>
                <div className="break-all rounded-lg bg-white border border-slate-200 px-2.5 py-2 text-[11px] font-medium text-slate-700">
                  {provisionInfo.url}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(provisionInfo.url);
                        setLinkCopied(true);
                        setTimeout(() => setLinkCopied(false), 2000);
                      } catch { /* clipboard unavailable */ }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    {linkCopied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                    <span>{linkCopied ? "Copied" : "Copy link"}</span>
                  </button>
                  <a href={provisionInfo.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 cursor-pointer">
                    Open reset page
                  </a>
                </div>
                <p className="text-[10px] font-medium text-slate-400 leading-normal">
                  Shown here for convenience (useful when email delivery isn't configured locally). The same link was emailed to the employee.
                </p>
              </div>
            )}
            <div className="flex justify-end border-t border-slate-100 pt-3">
              <button type="button" onClick={() => setProvisionInfo(null)} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-5 right-5 z-50">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-semibold max-w-sm">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared bits                                                        */
/* ------------------------------------------------------------------ */

type Caller = { uid: string; email: string } | undefined;
type SetErr = (s: string | null) => void;

function SectionHeader({ title, count, onAdd, addLabel }: { title: string; count: number; onAdd: (() => void) | undefined; addLabel: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-bold text-slate-900">{title} <span className="text-slate-400 font-normal">({count})</span></h2>
      {onAdd && (
        <button onClick={onAdd} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer">
          <Plus size={16} /> {addLabel}
        </button>
      )}
    </div>
  );
}

function Field({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-slate-800">{icon}{value}</div>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

/* ------------------------------ Overview ------------------------------ */

function OverviewTab({
  employee, deptName, manager, contracts, contacts, assets,
}: {
  employee: Employee; deptName: string; manager: Employee | null;
  contracts: EmployeeContract[]; contacts: EmergencyContact[]; assets: EmployeeAsset[];
}) {
  const active = getActiveContract(contracts);
  const primary = getPrimaryContact(contacts);
  const held = activeAssets(assets);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <h3 className="font-bold text-slate-900">Personal & Job</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email" value={employee.email} icon={<Mail size={14} className="text-slate-400" />} />
          <Field label="Phone" value={employee.phone || "—"} icon={<Phone size={14} className="text-slate-400" />} />
          <Field label="Department" value={deptName} />
          <Field label="Manager" value={manager ? `${manager.firstName} ${manager.lastName}` : "—"} />
          <Field label="Work Location" value={employee.workLocation} icon={<MapPin size={14} className="text-slate-400" />} />
          <Field label="Start Date" value={employee.startDate} icon={<Calendar size={14} className="text-slate-400" />} />
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <h3 className="font-bold text-slate-900">Summary</h3>
        <Field label="Active Contract" value={active ? `${active.title} (${tc(active.type)})` : "None on file"} icon={<FileText size={14} className="text-slate-400" />} />
        <Field label="Primary Emergency Contact" value={primary ? `${primary.name} · ${primary.phone}` : "None on file"} icon={<Users size={14} className="text-slate-400" />} />
        <Field label="Assets Held" value={`${held.length} assigned`} icon={<Package size={14} className="text-slate-400" />} />
      </div>
    </div>
  );
}

/* ------------------------------ Contracts ------------------------------ */

function ContractsTab({
  tenantId, employeeId, canEdit, caller, contracts, reload, setError,
}: {
  tenantId: string; employeeId: string; canEdit: boolean; caller: Caller;
  contracts: EmployeeContract[]; reload: () => Promise<void>; setError: SetErr;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ title: "", type: "full_time" as ContractType, startDate: today(), endDate: "", salary: "", currency: "USD", status: "active" as ContractStatus, notes: "" });
  const [file, setFile] = useState<File | null>(null);

  const save = async () => {
    if (!f.title.trim()) { setError("Contract title is required."); return; }
    setSaving(true); setError(null);
    try {
      let docFields: { documentUrl?: string; documentPath?: string } = {};
      if (file) docFields = await ContractService.uploadDocument(tenantId, file);
      await ContractService.create(tenantId, {
        employeeId,
        title: f.title.trim(),
        type: f.type,
        startDate: f.startDate,
        ...(f.endDate ? { endDate: f.endDate } : {}),
        salary: Number(f.salary) || 0,
        currency: f.currency,
        status: f.status,
        ...(f.notes ? { notes: f.notes } : {}),
        ...docFields,
      }, caller);
      setOpen(false); setFile(null);
      setF({ title: "", type: "full_time", startDate: today(), endDate: "", salary: "", currency: "USD", status: "active", notes: "" });
      await reload();
    } catch (e) { setError(getFriendlyErrorMessage(e, "Failed to save contract.")); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <SectionHeader title="Contracts" count={contracts.length} addLabel="Add Contract" onAdd={canEdit ? () => setOpen(true) : undefined} />
      {contracts.length === 0 ? (
        <EmptyState title="No contracts" description="No contracts have been added for this employee." icon={<FileText className="h-6 w-6" />} />
      ) : (
        <div className="space-y-2">
          {contracts.map((c) => {
            const status = deriveContractStatus(c);
            return (
              <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-4 flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-900">{c.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{tc(c.type)} · {c.currency} {c.salary.toLocaleString()} · {c.startDate}{c.endDate ? ` → ${c.endDate}` : ""}</div>
                  <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${status === "active" ? "bg-emerald-100 text-emerald-700" : status === "expired" ? "bg-amber-100 text-amber-700" : status === "terminated" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"}`}>{tc(status)}</span>
                  {c.documentUrl && <a href={c.documentUrl} target="_blank" rel="noreferrer" className="ml-2 text-xs font-medium text-blue-600 hover:underline">Document</a>}
                </div>
                {canEdit && (
                  <button onClick={async () => { await ContractService.remove(c.id, caller); await reload(); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"><Trash2 size={16} /></button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {open && (
        <Modal title="Add Contract" onClose={() => setOpen(false)} onSave={save} saving={saving}>
          <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Contract title *" className={inputCls} />
          <div className="grid grid-cols-2 gap-3">
            <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as ContractType })} className={inputCls}>{CONTRACT_TYPES.map((t) => <option key={t} value={t}>{tc(t)}</option>)}</select>
            <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as ContractStatus })} className={inputCls}>{CONTRACT_STATUSES.map((s) => <option key={s} value={s}>{tc(s)}</option>)}</select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-semibold text-slate-600">Start<input type="date" value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} className={inputCls} /></label>
            <label className="text-xs font-semibold text-slate-600">End<input type="date" value={f.endDate} onChange={(e) => setF({ ...f, endDate: e.target.value })} className={inputCls} /></label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" value={f.salary} onChange={(e) => setF({ ...f, salary: e.target.value })} placeholder="Salary" className={inputCls} />
            <input value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value })} placeholder="Currency" className={inputCls} />
          </div>
          <textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="Notes" rows={2} className={inputCls} />
          <label className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-2.5 text-sm text-slate-600 cursor-pointer hover:bg-slate-50">
            <Upload size={16} />{file ? file.name : "Attach signed document (optional)"}
            <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
        </Modal>
      )}
    </div>
  );
}

/* --------------------------- Emergency contacts --------------------------- */

function ContactsTab({
  tenantId, employeeId, canEdit, caller, contacts, reload, setError,
}: {
  tenantId: string; employeeId: string; canEdit: boolean; caller: Caller;
  contacts: EmergencyContact[]; reload: () => Promise<void>; setError: SetErr;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ name: "", relationship: "spouse" as ContactRelationship, phone: "", email: "", address: "", isPrimary: false });

  const save = async () => {
    if (!f.name.trim() || !f.phone.trim()) { setError("Name and phone are required."); return; }
    setSaving(true); setError(null);
    try {
      await EmergencyContactService.create(tenantId, {
        employeeId, name: f.name.trim(), relationship: f.relationship, phone: f.phone.trim(),
        ...(f.email ? { email: f.email.trim() } : {}),
        ...(f.address ? { address: f.address.trim() } : {}),
        isPrimary: f.isPrimary || contacts.length === 0,
      }, caller);
      setOpen(false);
      setF({ name: "", relationship: "spouse", phone: "", email: "", address: "", isPrimary: false });
      await reload();
    } catch (e) { setError(getFriendlyErrorMessage(e, "Failed to save contact.")); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <SectionHeader title="Emergency Contacts" count={contacts.length} addLabel="Add Contact" onAdd={canEdit ? () => setOpen(true) : undefined} />
      {contacts.length === 0 ? (
        <EmptyState title="No emergency contacts" description="Add a contact in case of emergency." icon={<Users className="h-6 w-6" />} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {contacts.map((c) => (
            <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-4 flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-slate-900 flex items-center gap-1.5">{c.name}{c.isPrimary && <Star size={13} className="text-amber-500 fill-amber-400" />}</div>
                <div className="text-xs text-slate-500 mt-0.5">{tc(c.relationship)}</div>
                <div className="text-sm text-slate-700 mt-1 flex items-center gap-1.5"><Phone size={13} className="text-slate-400" />{c.phone}</div>
                {c.email && <div className="text-sm text-slate-600 flex items-center gap-1.5"><Mail size={13} className="text-slate-400" />{c.email}</div>}
              </div>
              {canEdit && (
                <button onClick={async () => { await EmergencyContactService.remove(c.id, caller); await reload(); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"><Trash2 size={16} /></button>
              )}
            </div>
          ))}
        </div>
      )}
      {open && (
        <Modal title="Add Emergency Contact" onClose={() => setOpen(false)} onSave={save} saving={saving}>
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Full name *" className={inputCls} />
          <select value={f.relationship} onChange={(e) => setF({ ...f, relationship: e.target.value as ContactRelationship })} className={inputCls}>{RELATIONSHIPS.map((r) => <option key={r} value={r}>{tc(r)}</option>)}</select>
          <input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="Phone *" className={inputCls} />
          <input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="Email" className={inputCls} />
          <input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} placeholder="Address" className={inputCls} />
          <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={f.isPrimary} onChange={(e) => setF({ ...f, isPrimary: e.target.checked })} className="rounded" /> Mark as primary contact</label>
        </Modal>
      )}
    </div>
  );
}

/* --------------------------- Employment history --------------------------- */

function HistoryTab({
  tenantId, employeeId, canEdit, caller, entries, departments, reload, setError,
}: {
  tenantId: string; employeeId: string; canEdit: boolean; caller: Caller;
  entries: EmploymentHistoryEntry[]; departments: Department[]; reload: () => Promise<void>; setError: SetErr;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ changeType: "promotion" as EmploymentChangeType, title: "", departmentId: "", salary: "", effectiveDate: today(), note: "" });
  const sorted = sortHistory(entries);

  const save = async () => {
    if (!f.title.trim()) { setError("Title is required."); return; }
    setSaving(true); setError(null);
    try {
      await EmploymentHistoryService.create(tenantId, {
        employeeId, changeType: f.changeType, title: f.title.trim(), effectiveDate: f.effectiveDate,
        ...(f.departmentId ? { departmentId: f.departmentId } : {}),
        ...(f.salary ? { salary: Number(f.salary) } : {}),
        ...(f.note ? { note: f.note.trim() } : {}),
      }, caller);
      setOpen(false);
      setF({ changeType: "promotion", title: "", departmentId: "", salary: "", effectiveDate: today(), note: "" });
      await reload();
    } catch (e) { setError(getFriendlyErrorMessage(e, "Failed to save history entry.")); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <SectionHeader title="Employment History" count={entries.length} addLabel="Add Entry" onAdd={canEdit ? () => setOpen(true) : undefined} />
      {entries.length === 0 ? (
        <EmptyState title="No history" description="Record promotions, transfers and compensation changes." icon={<History className="h-6 w-6" />} />
      ) : (
        <div className="relative border-l-2 border-slate-100 ml-2 space-y-4">
          {sorted.map((e) => (
            <div key={e.id} className="relative pl-6">
              <div className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-blue-600" />
              <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-900">{tc(e.changeType)} — {e.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{e.effectiveDate}{e.departmentId ? ` · ${departments.find((d) => d.id === e.departmentId)?.name ?? ""}` : ""}{e.salary ? ` · ${e.salary.toLocaleString()}` : ""}</div>
                  {e.note && <div className="text-sm text-slate-600 mt-1">{e.note}</div>}
                </div>
                {canEdit && (
                  <button onClick={async () => { await EmploymentHistoryService.remove(e.id, caller); await reload(); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"><Trash2 size={16} /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {open && (
        <Modal title="Add History Entry" onClose={() => setOpen(false)} onSave={save} saving={saving}>
          <select value={f.changeType} onChange={(e) => setF({ ...f, changeType: e.target.value as EmploymentChangeType })} className={inputCls}>{CHANGE_TYPES.map((t) => <option key={t} value={t}>{tc(t)}</option>)}</select>
          <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Resulting job title *" className={inputCls} />
          <select value={f.departmentId} onChange={(e) => setF({ ...f, departmentId: e.target.value })} className={inputCls}><option value="">Department (optional)</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" value={f.salary} onChange={(e) => setF({ ...f, salary: e.target.value })} placeholder="New salary" className={inputCls} />
            <label className="text-xs font-semibold text-slate-600">Effective<input type="date" value={f.effectiveDate} onChange={(e) => setF({ ...f, effectiveDate: e.target.value })} className={inputCls} /></label>
          </div>
          <textarea value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="Note" rows={2} className={inputCls} />
        </Modal>
      )}
    </div>
  );
}

/* ------------------------------- Assets ------------------------------- */

function AssetsTab({
  tenantId, employeeId, canEdit, caller, assets, reload, setError,
}: {
  tenantId: string; employeeId: string; canEdit: boolean; caller: Caller;
  assets: EmployeeAsset[]; reload: () => Promise<void>; setError: SetErr;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ name: "", assetType: "laptop" as AssetType, serialNumber: "", assignedDate: today(), status: "assigned" as AssetStatus, notes: "" });

  const save = async () => {
    if (!f.name.trim()) { setError("Asset name is required."); return; }
    setSaving(true); setError(null);
    try {
      await AssetService.create(tenantId, {
        employeeId, name: f.name.trim(), assetType: f.assetType, assignedDate: f.assignedDate, status: f.status,
        ...(f.serialNumber ? { serialNumber: f.serialNumber.trim() } : {}),
        ...(f.notes ? { notes: f.notes.trim() } : {}),
      }, caller);
      setOpen(false);
      setF({ name: "", assetType: "laptop", serialNumber: "", assignedDate: today(), status: "assigned", notes: "" });
      await reload();
    } catch (e) { setError(getFriendlyErrorMessage(e, "Failed to save asset.")); }
    finally { setSaving(false); }
  };

  const markReturned = async (a: EmployeeAsset) => {
    await AssetService.update(a.id, { status: "returned", returnedDate: today() }, caller);
    await reload();
  };

  return (
    <div className="space-y-4">
      <SectionHeader title="Assets" count={assets.length} addLabel="Assign Asset" onAdd={canEdit ? () => setOpen(true) : undefined} />
      {assets.length === 0 ? (
        <EmptyState title="No assets" description="Assign company equipment to this employee." icon={<Package className="h-6 w-6" />} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {assets.map((a) => (
            <div key={a.id} className="rounded-xl border border-slate-200 bg-white p-4 flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-slate-900">{a.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{tc(a.assetType)}{a.serialNumber ? ` · SN ${a.serialNumber}` : ""}</div>
                <div className="text-xs text-slate-500">Assigned {a.assignedDate}{a.returnedDate ? ` · Returned ${a.returnedDate}` : ""}</div>
                <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${a.status === "assigned" ? "bg-emerald-100 text-emerald-700" : a.status === "returned" ? "bg-slate-100 text-slate-600" : "bg-rose-100 text-rose-700"}`}>{tc(a.status)}</span>
              </div>
              {canEdit && (
                <div className="flex flex-col items-end gap-1">
                  {a.status === "assigned" && <button onClick={() => markReturned(a)} className="text-xs font-medium text-blue-600 hover:underline cursor-pointer">Mark returned</button>}
                  <button onClick={async () => { await AssetService.remove(a.id, caller); await reload(); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"><Trash2 size={16} /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {open && (
        <Modal title="Assign Asset" onClose={() => setOpen(false)} onSave={save} saving={saving}>
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Asset name *" className={inputCls} />
          <div className="grid grid-cols-2 gap-3">
            <select value={f.assetType} onChange={(e) => setF({ ...f, assetType: e.target.value as AssetType })} className={inputCls}>{ASSET_TYPES.map((t) => <option key={t} value={t}>{tc(t)}</option>)}</select>
            <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as AssetStatus })} className={inputCls}>{ASSET_STATUSES.map((s) => <option key={s} value={s}>{tc(s)}</option>)}</select>
          </div>
          <input value={f.serialNumber} onChange={(e) => setF({ ...f, serialNumber: e.target.value })} placeholder="Serial number" className={inputCls} />
          <label className="text-xs font-semibold text-slate-600">Assigned date<input type="date" value={f.assignedDate} onChange={(e) => setF({ ...f, assignedDate: e.target.value })} className={inputCls} /></label>
          <textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="Notes" rows={2} className={inputCls} />
        </Modal>
      )}
    </div>
  );
}

/* ------------------------------ Lifecycle ------------------------------ */

function LifecycleTab({
  tenantId, employeeId, canEdit, caller, events, reload, setError,
}: {
  tenantId: string; employeeId: string; canEdit: boolean; caller: Caller;
  events: LifecycleEvent[]; reload: () => Promise<void>; setError: SetErr;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ stage: "onboarding" as LifecycleStage, effectiveDate: today(), note: "" });
  const sorted = sortLifecycle(events);

  const save = async () => {
    if (!caller) return;
    setSaving(true); setError(null);
    try {
      await LifecycleService.add(tenantId, {
        employeeId, stage: f.stage, effectiveDate: f.effectiveDate, createdBy: caller.uid,
        ...(f.note ? { note: f.note.trim() } : {}),
      }, caller);
      setOpen(false);
      setF({ stage: "onboarding", effectiveDate: today(), note: "" });
      await reload();
    } catch (e) { setError(getFriendlyErrorMessage(e, "Failed to record event.")); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <SectionHeader title="Lifecycle" count={events.length} addLabel="Record Event" onAdd={canEdit ? () => setOpen(true) : undefined} />
      {events.length === 0 ? (
        <EmptyState title="No lifecycle events" description="Track onboarding, leave, offboarding and termination." icon={<Activity className="h-6 w-6" />} />
      ) : (
        <div className="relative border-l-2 border-slate-100 ml-2 space-y-4">
          {sorted.map((e, i) => (
            <div key={e.id} className="relative pl-6">
              <div className={`absolute -left-[7px] top-1.5 h-3 w-3 rounded-full ${i === 0 ? "bg-blue-600 ring-4 ring-blue-100" : "bg-slate-300"}`} />
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="font-semibold text-slate-900">{tc(e.stage)}{i === 0 && <span className="ml-2 text-xs font-medium text-blue-600">Current</span>}</div>
                <div className="text-xs text-slate-500 mt-0.5">Effective {e.effectiveDate}</div>
                {e.note && <div className="text-sm text-slate-600 mt-1">{e.note}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
      {open && (
        <Modal title="Record Lifecycle Event" onClose={() => setOpen(false)} onSave={save} saving={saving}>
          <select value={f.stage} onChange={(e) => setF({ ...f, stage: e.target.value as LifecycleStage })} className={inputCls}>{LIFECYCLE_STAGES.map((s) => <option key={s} value={s}>{tc(s)}</option>)}</select>
          <label className="text-xs font-semibold text-slate-600">Effective date<input type="date" value={f.effectiveDate} onChange={(e) => setF({ ...f, effectiveDate: e.target.value })} className={inputCls} /></label>
          <textarea value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="Note" rows={2} className={inputCls} />
        </Modal>
      )}
    </div>
  );
}

/* ------------------------------- Modal shell ------------------------------- */

function Modal({ title, onClose, onSave, saving, children }: { title: string; onClose: () => void; onSave: () => void; saving: boolean; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 cursor-pointer"><X size={18} /></button>
        </div>
        <div className="space-y-3">{children}</div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer">Cancel</button>
          <button onClick={onSave} disabled={saving} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 cursor-pointer">{saving ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}
