import { getFriendlyErrorMessage } from "../../../lib/errors";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../auth/context/AuthContext";
import { useHasPermission } from "../../rbac/hooks/usePermissions";
import { JobService, type JobCreateInput } from "../services/jobService";
import { EmployeeService } from "../../employees/services/employeeService";
import { Skeleton } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/ErrorState";
import { EmptyState } from "../../../components/ui/EmptyState";
import { filterJobs, isCurrentApprover, getCurrentApprover, type JobFilters } from "../utils/recruitment";
import { fetchTenantMembers, jobStatusClass, titleCase, formatDate } from "../components/recruitmentUi";
import { CampusService } from "../../campuses/services/campusService";
import type {
  Job,
  JobStatus,
  Department,
  UserProfile,
  EmploymentType,
  WorkMode,
  Campus,
} from "@hrms/middleware";
import { DEFAULT_PIPELINE_STAGES, DEFAULT_FACULTY_PIPELINE_STAGES } from "@hrms/middleware";
import {
  Briefcase,
  Plus,
  Trash2,
  Edit2,
  X,
  Search,
  Send,
  Check,
  Ban,
  Globe,
  EyeOff,
} from "lucide-react";

const EMPLOYMENT_TYPES: EmploymentType[] = ["full_time", "part_time", "contract", "internship", "temporary"];
const WORK_MODES: WorkMode[] = ["remote", "onsite", "hybrid"];
const JOB_STATUSES: JobStatus[] = ["draft", "pending_approval", "approved", "rejected", "open", "on_hold", "closed"];

export function JobsListPage() {
  const { profile, user } = useAuth();
  const tenantId = profile?.activeTenantId || "";
  const hasPerm = useHasPermission();
  const canCreate = hasPerm("jobs.create");
  const canEdit = hasPerm("jobs.update");
  const canDelete = hasPerm("jobs.delete");
  const caller = user ? { uid: user.uid, email: user.email || "" } : undefined;

  const [jobs, setJobs] = useState<Job[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<JobFilters>({ search: "", status: "all", departmentId: "all" });
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);
  const [saving, setSaving] = useState(false);

  // form fields
  const [form, setForm] = useState({
    title: "",
    departmentId: "",
    campusId: "",
    staffCategory: "teaching" as "teaching" | "non_teaching",
    subjectSpecialization: "",
    minimumQualification: "",
    location: "",
    workMode: "remote" as WorkMode,
    employmentType: "full_time" as EmploymentType,
    openings: 1,
    salaryMin: "",
    salaryMax: "",
    currency: "USD",
    description: "",
    responsibilities: "",
    requirements: "",
    requireApproval: false,
    approverIds: [] as string[],
    stages: [...DEFAULT_PIPELINE_STAGES] as string[],
  });

  const fetchData = useCallback(async () => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Core job + member data. `users` reads are open to any authed member and
      // jobs require jobs.view (which any role reaching this page has).
      const [jobsData, mem] = await Promise.all([
        JobService.getJobs(tenantId),
        fetchTenantMembers(tenantId),
      ]);

      // Departments & Campuses auxiliary metadata
      let depts: Department[] = [];
      let camps: Campus[] = [];
      try {
        [depts, camps] = await Promise.all([
          EmployeeService.getDepartments(tenantId),
          CampusService.getCampuses(tenantId),
        ]);
      } catch (auxErr) {
        console.warn("[JobsListPage] departments/campuses auxiliary read error", auxErr);
      }

      setJobs(jobsData);
      setDepartments(depts);
      setCampuses(camps);
      setMembers(mem);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "Failed to load jobs."));
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => filterJobs(jobs, filters), [jobs, filters]);
  const deptName = (id: string) => departments.find((d) => d.id === id)?.name ?? "—";
  const campName = (id?: string) => (id ? campuses.find((c) => c.id === id)?.name ?? "—" : "All Campuses");

  const resetForm = () => {
    setForm({
      title: "",
      departmentId: departments[0]?.id || "",
      campusId: campuses[0]?.id || "",
      staffCategory: "teaching",
      subjectSpecialization: "",
      minimumQualification: "",
      location: "",
      workMode: "remote",
      employmentType: "full_time",
      openings: 1,
      salaryMin: "",
      salaryMax: "",
      currency: "USD",
      description: "",
      responsibilities: "",
      requirements: "",
      requireApproval: false,
      approverIds: [],
      stages: [...DEFAULT_PIPELINE_STAGES],
    });
  };

  const openCreate = () => {
    setEditing(null);
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (job: Job) => {
    setEditing(job);
    setForm({
      title: job.title,
      departmentId: job.departmentId,
      campusId: job.campusId || "",
      staffCategory: job.staffCategory || "teaching",
      subjectSpecialization: job.subjectSpecialization || "",
      minimumQualification: job.minimumQualification || "",
      location: job.location,
      workMode: job.workMode,
      employmentType: job.employmentType,
      openings: job.openings,
      salaryMin: job.salaryMin?.toString() ?? "",
      salaryMax: job.salaryMax?.toString() ?? "",
      currency: job.currency,
      description: job.description,
      responsibilities: job.responsibilities,
      requirements: job.requirements,
      requireApproval: job.approval?.required ?? false,
      approverIds: job.approval?.steps.map((s) => s.approverId) ?? [],
      stages: job.pipelineStages?.length ? [...job.pipelineStages] : [...DEFAULT_PIPELINE_STAGES],
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!tenantId || !form.title.trim()) {
      setError("Job title is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const base = {
        title: form.title.trim(),
        departmentId: form.departmentId,
        campusId: form.campusId || undefined,
        staffCategory: form.staffCategory,
        subjectSpecialization: form.subjectSpecialization || undefined,
        minimumQualification: form.minimumQualification || undefined,
        location: form.location.trim(),
        workMode: form.workMode,
        employmentType: form.employmentType,
        openings: Number(form.openings) || 1,
        currency: form.currency,
        description: form.description,
        responsibilities: form.responsibilities,
        requirements: form.requirements,
      };
      const salaryMin = form.salaryMin ? Number(form.salaryMin) : undefined;
      const salaryMax = form.salaryMax ? Number(form.salaryMax) : undefined;

      const cleanedStages = form.stages.map((s) => s.trim()).filter(Boolean);
      if (editing) {
        const patch: Partial<Job> = { ...base };
        if (salaryMin !== undefined) patch.salaryMin = salaryMin;
        if (salaryMax !== undefined) patch.salaryMax = salaryMax;
        if (cleanedStages.length) patch.pipelineStages = cleanedStages;
        await JobService.updateJob(editing.id, patch, caller);
      } else {
        const approvers = form.requireApproval
          ? form.approverIds
              .map((id) => members.find((m) => m.id === id))
              .filter((m): m is UserProfile => !!m)
              .map((m) => ({ approverId: m.id, approverEmail: m.email, approverName: m.displayName }))
          : [];
        const input: JobCreateInput = {
          ...base,
          isPublished: false,
          createdBy: user?.uid || "",
          approvers,
        };
        if (user?.uid) input.hiringManagerId = user.uid;
        if (salaryMin !== undefined) input.salaryMin = salaryMin;
        if (salaryMax !== undefined) input.salaryMax = salaryMax;
        if (cleanedStages.length) input.pipelineStages = cleanedStages;
        await JobService.createJob(tenantId, input, caller);
      }
      setModalOpen(false);
      await fetchData();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "Failed to save job."));
    } finally {
      setSaving(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    setSelected((prev) =>
      prev.size === filtered.length ? new Set() : new Set(filtered.map((j) => j.id))
    );
  };

  const bulkStatus = async (status: JobStatus) => {
    await JobService.bulkUpdateStatus([...selected], status, caller);
    setSelected(new Set());
    await fetchData();
  };
  const bulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} job(s)? This cannot be undone.`)) return;
    await JobService.bulkDelete([...selected], caller);
    setSelected(new Set());
    await fetchData();
  };

  const act = async (fn: () => Promise<void>) => {
    try {
      await fn();
      await fetchData();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "Action failed."));
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (error && jobs.length === 0) {
    return <ErrorState description={error} onRetry={fetchData} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-blue-600" /> Job Requisitions
          </h1>
          <p className="text-sm text-slate-500 mt-1">Create, approve and publish job openings.</p>
        </div>
        {canCreate && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer"
          >
            <Plus size={18} /> New Requisition
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            placeholder="Search jobs by title, location…"
            className="w-full rounded-xl border border-slate-200 pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as JobStatus | "all" }))}
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white"
        >
          <option value="all">All statuses</option>
          {JOB_STATUSES.map((s) => (
            <option key={s} value={s}>{titleCase(s)}</option>
          ))}
        </select>
        <select
          value={filters.departmentId}
          onChange={(e) => setFilters((f) => ({ ...f, departmentId: e.target.value }))}
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white"
        >
          <option value="all">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
          <span className="text-sm font-semibold text-blue-900">{selected.size} selected</span>
          {canEdit && (
            <>
              <button onClick={() => bulkStatus("open")} className="text-sm font-medium text-emerald-700 hover:underline cursor-pointer">Set Open</button>
              <button onClick={() => bulkStatus("closed")} className="text-sm font-medium text-slate-700 hover:underline cursor-pointer">Set Closed</button>
              <button onClick={() => bulkStatus("on_hold")} className="text-sm font-medium text-orange-700 hover:underline cursor-pointer">Hold</button>
            </>
          )}
          {canDelete && (
            <button onClick={bulkDelete} className="text-sm font-medium text-rose-700 hover:underline cursor-pointer">Delete</button>
          )}
        </div>
      )}

      {error && <div className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No job requisitions"
          description="Create your first requisition to start hiring."
          icon={<Briefcase className="h-6 w-6" />}
          {...(canCreate ? { actionLabel: "New Requisition", onAction: openCreate } : {})}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} className="rounded" />
                </th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Openings</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((job) => {
                const amApprover = !!user && isCurrentApprover(job.approval, user.uid);
                return (
                  <tr key={job.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(job.id)} onChange={() => toggleSelect(job.id)} className="rounded" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{job.title}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                          job.staffCategory === "teaching"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}>
                          {job.staffCategory === "teaching" ? "Faculty" : "Staff"}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {campName(job.campusId)} · {job.location} · {titleCase(job.workMode)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>{deptName(job.departmentId)}</div>
                      {job.subjectSpecialization && (
                        <div className="text-xs text-purple-600 font-medium">{job.subjectSpecialization}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{titleCase(job.employmentType)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${jobStatusClass(job.status)}`}>
                        {titleCase(job.status)}
                      </span>
                      {job.isPublished && <span className="ml-1 inline-flex items-center gap-1 text-xs text-emerald-600"><Globe size={12} /></span>}
                      {job.status === "pending_approval" && (() => {
                        const approver = getCurrentApprover(job.approval);
                        if (!approver) return null;
                        const who = approver.approverName || approver.approverEmail;
                        const total = job.approval.steps.length;
                        return (
                          <div className="mt-1 text-xs text-slate-500">
                            Awaiting: <span className="font-medium text-slate-700">{who}</span>
                            {total > 1 && (
                              <span className="text-slate-400"> · step {job.approval.currentStep + 1} of {total}</span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{job.openings}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(job.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {amApprover && (
                          <>
                            <button title="Approve" onClick={() => act(() => JobService.decideApproval(job.id, "approved", caller!))} className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 cursor-pointer"><Check size={16} /></button>
                            <button title="Reject" onClick={() => act(() => JobService.decideApproval(job.id, "rejected", caller!))} className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 cursor-pointer"><Ban size={16} /></button>
                          </>
                        )}
                        {canEdit && job.status === "draft" && (
                          <button title="Submit for approval" onClick={() => act(() => JobService.submitForApproval(job.id, caller))} className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-50 cursor-pointer"><Send size={16} /></button>
                        )}
                        {canEdit && (job.status === "approved" || job.status === "open") && (
                          <button
                            title={job.isPublished ? "Unpublish" : "Publish to careers"}
                            onClick={() => act(() => JobService.setPublished(job.id, !job.isPublished, caller))}
                            className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 cursor-pointer"
                          >
                            {job.isPublished ? <EyeOff size={16} /> : <Globe size={16} />}
                          </button>
                        )}
                        {canEdit && (
                          <button title="Edit" onClick={() => openEdit(job)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 cursor-pointer"><Edit2 size={16} /></button>
                        )}
                        {canDelete && (
                          <button title="Delete" onClick={() => act(() => JobService.deleteJob(job.id, caller))} className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 cursor-pointer"><Trash2 size={16} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">{editing ? "Edit Requisition" : "New Requisition"}</h2>
              <button onClick={() => setModalOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 cursor-pointer"><X size={18} /></button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Job Title *</label>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Staff Category</label>
                <select
                  value={form.staffCategory}
                  onChange={(e) => setForm((f) => ({ ...f, staffCategory: e.target.value as "teaching" | "non_teaching" }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
                >
                  <option value="teaching">Teaching Faculty</option>
                  <option value="non_teaching">Non-Teaching Staff</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Campus / Branch</label>
                <select
                  value={form.campusId}
                  onChange={(e) => setForm((f) => ({ ...f, campusId: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white"
                >
                  <option value="">All Campuses / Main</option>
                  {campuses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Department / Faculty</label>
                <select value={form.departmentId} onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white">
                  <option value="">—</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Subject Specialization</label>
                <input
                  placeholder="e.g. Pure Mathematics, AI / ML, Literature"
                  value={form.subjectSpecialization}
                  onChange={(e) => setForm((f) => ({ ...f, subjectSpecialization: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Minimum Degree Required</label>
                <input
                  placeholder="e.g. Ph.D., Master's, B.Ed."
                  value={form.minimumQualification}
                  onChange={(e) => setForm((f) => ({ ...f, minimumQualification: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Location</label>
                <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Work Mode</label>
                <select value={form.workMode} onChange={(e) => setForm((f) => ({ ...f, workMode: e.target.value as WorkMode }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white">
                  {WORK_MODES.map((m) => <option key={m} value={m}>{titleCase(m)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Employment Type</label>
                <select value={form.employmentType} onChange={(e) => setForm((f) => ({ ...f, employmentType: e.target.value as EmploymentType }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white">
                  {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Openings</label>
                <input type="number" min={1} value={form.openings} onChange={(e) => setForm((f) => ({ ...f, openings: Number(e.target.value) }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Currency</label>
                <input value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Salary Min</label>
                <input type="number" value={form.salaryMin} onChange={(e) => setForm((f) => ({ ...f, salaryMin: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Salary Max</label>
                <input type="number" value={form.salaryMax} onChange={(e) => setForm((f) => ({ ...f, salaryMax: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Responsibilities</label>
                <textarea value={form.responsibilities} onChange={(e) => setForm((f) => ({ ...f, responsibilities: e.target.value }))} rows={2} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Requirements</label>
                <textarea value={form.requirements} onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))} rows={2} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>

              <div className="sm:col-span-2 rounded-xl border border-slate-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <label className="text-sm font-semibold text-slate-700">Pipeline Stages</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, stages: [...DEFAULT_FACULTY_PIPELINE_STAGES] }))}
                      className="text-xs font-semibold text-purple-600 hover:underline cursor-pointer"
                    >
                      Use Academic / Faculty Stages
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, stages: [...f.stages, ""] }))}
                      className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                    >
                      + Add stage
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {form.stages.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 w-5 text-right">{i + 1}</span>
                      <input
                        value={s}
                        onChange={(e) =>
                          setForm((f) => {
                            const stages = [...f.stages];
                            stages[i] = e.target.value;
                            return { ...f, stages };
                          })
                        }
                        placeholder={`Stage ${i + 1}`}
                        className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, stages: f.stages.filter((_, j) => j !== i) }))}
                        disabled={form.stages.length <= 1}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40 cursor-pointer"
                        title="Remove stage"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  These stages define the Kanban columns for this job's candidates.
                </p>
              </div>

              {!editing && (
                <div className="sm:col-span-2 rounded-xl border border-slate-200 p-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input type="checkbox" checked={form.requireApproval} onChange={(e) => setForm((f) => ({ ...f, requireApproval: e.target.checked }))} className="rounded" />
                    Require approval before publishing
                  </label>
                  {form.requireApproval && (
                    <div className="mt-3 max-h-40 overflow-y-auto space-y-1.5">
                      <p className="text-xs text-slate-500 mb-1">Select approvers (in order):</p>
                      {members.map((m) => (
                        <label key={m.id} className="flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={form.approverIds.includes(m.id)}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                approverIds: e.target.checked
                                  ? [...f.approverIds, m.id]
                                  : f.approverIds.filter((x) => x !== m.id),
                              }))
                            }
                            className="rounded"
                          />
                          {m.displayName} <span className="text-slate-400">({m.email})</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 cursor-pointer">
                {saving ? "Saving…" : editing ? "Save Changes" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
