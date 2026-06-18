import { getFriendlyErrorMessage } from "../../../lib/errors";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../auth/context/AuthContext";
import { useHasPermission } from "../../rbac/hooks/usePermissions";
import { JobService } from "../services/jobService";
import { CandidateService } from "../services/candidateService";
import { Skeleton } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/ErrorState";
import { EmptyState } from "../../../components/ui/EmptyState";
import { CandidateDrawer } from "../components/CandidateDrawer";
import {
  groupCandidatesByStage,
  searchCandidates,
} from "../utils/recruitment";
import { candidateStatusClass, titleCase } from "../components/recruitmentUi";
import { downloadCsv } from "../../../lib/csv";
import { DEFAULT_PIPELINE_STAGES } from "@hrms/middleware";
import type { Job, Candidate, CandidateSource } from "@hrms/middleware";
import { KanbanSquare, Search, Plus, X, Upload, Download } from "lucide-react";

const SOURCES: CandidateSource[] = ["careers", "referral", "manual", "agency", "linkedin"];

export function PipelinePage() {
  const { profile, user } = useAuth();
  const tenantId = profile?.activeTenantId || "";
  const hasPerm = useHasPermission();
  const canCreate = hasPerm("candidates.create");
  const canEdit = hasPerm("candidates.update");
  const canExport = hasPerm("candidates.export");
  const caller = user ? { uid: user.uid, email: user.email || "" } : undefined;

  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [active, setActive] = useState<Candidate | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const [jobsData, cands] = await Promise.all([
        JobService.getJobs(tenantId),
        CandidateService.getCandidates(tenantId),
      ]);
      setJobs(jobsData);
      setCandidates(cands);
      setSelectedJobId((prev) => prev || jobsData[0]?.id || "");
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "Failed to load pipeline."));
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const selectedJob = useMemo(() => jobs.find((j) => j.id === selectedJobId), [jobs, selectedJobId]);
  const stages = selectedJob?.pipelineStages ?? [...DEFAULT_PIPELINE_STAGES];

  const jobCandidates = useMemo(() => {
    let list = candidates.filter((c) => c.jobId === selectedJobId);
    if (search) list = searchCandidates(list, search);
    return list;
  }, [candidates, selectedJobId, search]);

  const grouped = useMemo(() => groupCandidatesByStage(jobCandidates, stages), [jobCandidates, stages]);

  const handleDrop = async (stage: string) => {
    setDragOverStage(null);
    const id = dragId;
    setDragId(null);
    if (!id) return;
    const cand = candidates.find((c) => c.id === id);
    if (!cand || cand.stage === stage) return;

    // optimistic update
    setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, stage } : c)));
    try {
      await CandidateService.moveToStage(id, stage, caller);
      await fetchAll();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "Failed to move candidate."));
      await fetchAll();
    }
  };

  const handleExportCsv = () => {
    const rows = jobCandidates.map((c) => [
      `${c.firstName} ${c.lastName}`,
      c.email,
      c.phone ?? "",
      c.stage,
      c.status,
      c.source,
      new Date(c.appliedAt).toISOString().slice(0, 10),
      c.jobTitle,
    ]);
    downloadCsv(
      `candidates_${(selectedJob?.title || "job").replace(/[^a-z0-9]+/gi, "_")}_${new Date().toISOString().slice(0, 10)}`,
      ["Name", "Email", "Phone", "Stage", "Status", "Source", "Applied", "Job"],
      rows
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="flex gap-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-80 w-64" />)}
        </div>
      </div>
    );
  }
  if (error && candidates.length === 0 && jobs.length === 0) {
    return <ErrorState description={error} onRetry={fetchAll} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <KanbanSquare className="h-6 w-6 text-blue-600" /> Candidate Pipeline
          </h1>
          <p className="text-sm text-slate-500 mt-1">Drag candidates across stages to update their progress.</p>
        </div>
        {canCreate && selectedJob && (
          <button onClick={() => setAddOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer">
            <Plus size={18} /> Add Candidate
          </button>
        )}
        {canExport && selectedJob && jobCandidates.length > 0 && (
          <button onClick={handleExportCsv} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
            <Download size={18} /> Export CSV
          </button>
        )}
      </div>

      {jobs.length === 0 ? (
        <EmptyState title="No jobs yet" description="Create and publish a job requisition to start adding candidates." icon={<KanbanSquare className="h-6 w-6" />} />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <select value={selectedJobId} onChange={(e) => setSelectedJobId(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white min-w-[220px]">
              {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search candidates…" className="w-full rounded-xl border border-slate-200 pl-10 pr-3 py-2.5 text-sm" />
            </div>
          </div>

          {error && <div className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700">{error}</div>}

          {/* Kanban */}
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stages.map((stage) => {
              const items = grouped[stage] ?? [];
              return (
                <div
                  key={stage}
                  onDragOver={(e) => { if (canEdit) { e.preventDefault(); setDragOverStage(stage); } }}
                  onDragLeave={() => setDragOverStage((s) => (s === stage ? null : s))}
                  onDrop={() => canEdit && handleDrop(stage)}
                  className={`flex w-72 shrink-0 flex-col rounded-2xl border bg-slate-50/70 ${
                    dragOverStage === stage ? "border-blue-400 ring-2 ring-blue-200" : "border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                    <span className="text-sm font-semibold text-slate-700">{stage}</span>
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">{items.length}</span>
                  </div>
                  <div className="flex-1 space-y-2 p-3 min-h-[120px]">
                    {items.map((c) => (
                      <div
                        key={c.id}
                        draggable={canEdit}
                        onDragStart={() => setDragId(c.id)}
                        onDragEnd={() => setDragId(null)}
                        onClick={() => setActive(c)}
                        className={`cursor-pointer rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:shadow transition-shadow ${
                          dragId === c.id ? "opacity-50" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800 text-sm">{c.firstName} {c.lastName}</span>
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${candidateStatusClass(c.status)}`}>{titleCase(c.status)}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1 truncate">{c.email}</div>
                        <div className="text-[11px] text-slate-400 mt-1">{titleCase(c.source)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {active && (
        <CandidateDrawer
          candidate={candidates.find((c) => c.id === active.id) ?? active}
          stages={stages}
          onClose={() => setActive(null)}
          onChanged={fetchAll}
        />
      )}

      {addOpen && selectedJob && (
        <AddCandidateModal
          job={selectedJob}
          tenantId={tenantId}
          caller={caller}
          onClose={() => setAddOpen(false)}
          onAdded={async () => { setAddOpen(false); await fetchAll(); }}
        />
      )}
    </div>
  );
}

function AddCandidateModal({
  job,
  tenantId,
  caller,
  onClose,
  onAdded,
}: {
  job: Job;
  tenantId: string;
  caller: { uid: string; email: string } | undefined;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [source, setSource] = useState<CandidateSource>("manual");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setErr("First name, last name and email are required.");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      let resume: { resumeUrl: string; resumePath: string } | undefined;
      if (file) resume = await CandidateService.uploadResume(tenantId, file);
      await CandidateService.createCandidate(
        tenantId,
        {
          jobId: job.id,
          jobTitle: job.title,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          ...(phone ? { phone: phone.trim() } : {}),
          source,
          stage: job.pipelineStages[0] ?? "Applied",
          status: "active",
          ...(resume ? { resumeUrl: resume.resumeUrl, resumePath: resume.resumePath } : {}),
        },
        caller
      );
      onAdded();
    } catch (e) {
      setErr(getFriendlyErrorMessage(e, "Failed to add candidate."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900">Add Candidate · {job.title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 cursor-pointer"><X size={18} /></button>
        </div>
        {err && <div className="mb-3 rounded-xl bg-rose-50 border border-rose-100 px-3 py-2 text-sm text-rose-700">{err}</div>}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <select value={source} onChange={(e) => setSource(e.target.value as CandidateSource)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white">
            {SOURCES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
          </select>
          <label className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-2.5 text-sm text-slate-600 cursor-pointer hover:bg-slate-50">
            <Upload size={16} />
            {file ? file.name : "Upload résumé (PDF/DOC)"}
            <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer">Cancel</button>
          <button onClick={save} disabled={saving} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 cursor-pointer">{saving ? "Saving…" : "Add"}</button>
        </div>
      </div>
    </div>
  );
}
