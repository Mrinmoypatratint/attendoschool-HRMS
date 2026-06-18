import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../auth/context/AuthContext";
import { useHasPermission } from "../../rbac/hooks/usePermissions";
import { CandidateService } from "../services/candidateService";
import { InterviewService } from "../services/interviewService";
import { OfferService } from "../services/offerService";
import { candidateStatusClass, offerStatusClass, titleCase, formatDate } from "./recruitmentUi";
import type {
  Candidate,
  CandidateNote,
  CandidateStatus,
  Interview,
  Offer,
  InterviewMode,
} from "@hrms/middleware";
import {
  X,
  FileText,
  MessageSquare,
  CalendarClock,
  BadgeDollarSign,
  Trash2,
  Mail,
  Phone,
  Linkedin,
} from "lucide-react";

interface Props {
  candidate: Candidate;
  stages: string[];
  onClose: () => void;
  onChanged: () => void;
}

const STATUSES: CandidateStatus[] = ["active", "hired", "rejected", "withdrawn"];

export function CandidateDrawer({ candidate, stages, onClose, onChanged }: Props) {
  const { user, profile } = useAuth();
  const tenantId = profile?.activeTenantId || "";
  const hasPerm = useHasPermission();
  const canEdit = hasPerm("candidates.update");
  const caller = user ? { uid: user.uid, email: user.email || "" } : undefined;

  const [tab, setTab] = useState<"profile" | "notes" | "interviews" | "offer">("profile");
  const [notes, setNotes] = useState<CandidateNote[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [noteBody, setNoteBody] = useState("");

  const loadRelated = useCallback(async () => {
    const [n, iv, of] = await Promise.all([
      CandidateService.getNotes(tenantId, candidate.id),
      InterviewService.getByCandidate(tenantId, candidate.id),
      OfferService.getByCandidate(tenantId, candidate.id),
    ]);
    setNotes(n);
    setInterviews(iv);
    setOffers(of);
  }, [candidate.id, tenantId]);

  useEffect(() => {
    loadRelated();
  }, [loadRelated]);

  const changeStage = async (stage: string) => {
    await CandidateService.moveToStage(candidate.id, stage, caller);
    onChanged();
  };
  const changeStatus = async (status: CandidateStatus) => {
    await CandidateService.setStatus(candidate.id, status, caller);
    onChanged();
  };

  const addNote = async () => {
    if (!noteBody.trim() || !user) return;
    await CandidateService.addNote(tenantId, candidate.id, noteBody.trim(), {
      uid: user.uid,
      name: profile?.displayName || user.email || "User",
    });
    setNoteBody("");
    await loadRelated();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40">
      <div className="h-full w-full max-w-md overflow-y-auto bg-white shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white p-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {candidate.firstName} {candidate.lastName}
            </h2>
            <p className="text-sm text-slate-500">{candidate.jobTitle}</p>
            <span className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${candidateStatusClass(candidate.status)}`}>
              {titleCase(candidate.status)}
            </span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 cursor-pointer"><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-5">
          {([
            ["profile", "Profile"],
            ["notes", "Notes"],
            ["interviews", "Interviews"],
            ["offer", "Offer"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-3 py-2.5 text-sm font-semibold border-b-2 -mb-px cursor-pointer ${
                tab === key ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-5">
          {tab === "profile" && (
            <>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600"><Mail size={15} /> {candidate.email}</div>
                {candidate.phone && <div className="flex items-center gap-2 text-slate-600"><Phone size={15} /> {candidate.phone}</div>}
                {candidate.linkedinUrl && (
                  <a href={candidate.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline"><Linkedin size={15} /> LinkedIn</a>
                )}
                <div className="text-slate-500">Source: {titleCase(candidate.source)} · Applied {formatDate(candidate.appliedAt)}</div>
              </div>

              {candidate.resumeUrl ? (
                <a href={candidate.resumeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  <FileText size={16} /> View Résumé
                </a>
              ) : (
                <div className="text-sm text-slate-400 flex items-center gap-2"><FileText size={16} /> No résumé uploaded</div>
              )}

              {candidate.coverLetter && (
                <div>
                  <h4 className="text-xs font-semibold uppercase text-slate-500 mb-1">Cover Letter</h4>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{candidate.coverLetter}</p>
                </div>
              )}

              {canEdit && (
                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Pipeline Stage</label>
                    <select value={candidate.stage} onChange={(e) => changeStage(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white">
                      {stages.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                    <select value={candidate.status} onChange={(e) => changeStatus(e.target.value as CandidateStatus)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white">
                      {STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </>
          )}

          {tab === "notes" && (
            <div className="space-y-4">
              {canEdit && (
                <div className="flex gap-2">
                  <input value={noteBody} onChange={(e) => setNoteBody(e.target.value)} placeholder="Add a note…" className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm" onKeyDown={(e) => e.key === "Enter" && addNote()} />
                  <button onClick={addNote} className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer">Add</button>
                </div>
              )}
              {notes.length === 0 ? (
                <p className="text-sm text-slate-400 flex items-center gap-2"><MessageSquare size={16} /> No notes yet.</p>
              ) : (
                notes.map((n) => (
                  <div key={n.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">{n.authorName}</span>
                      <span className="text-xs text-slate-400">{formatDate(n.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">{n.body}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "interviews" && (
            <InterviewsTab
              candidate={candidate}
              interviews={interviews}
              canEdit={canEdit}
              tenantId={tenantId}
              caller={caller}
              onChanged={loadRelated}
            />
          )}

          {tab === "offer" && (
            <OfferTab
              candidate={candidate}
              offers={offers}
              canEdit={canEdit}
              tenantId={tenantId}
              caller={caller}
              onChanged={loadRelated}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Interviews tab ----------------------------- */

const MODES: InterviewMode[] = ["video", "phone", "onsite"];

function InterviewsTab({
  candidate,
  interviews,
  canEdit,
  tenantId,
  caller,
  onChanged,
}: {
  candidate: Candidate;
  interviews: Interview[];
  canEdit: boolean;
  tenantId: string;
  caller: { uid: string; email: string } | undefined;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState("");
  const [mode, setMode] = useState<InterviewMode>("video");
  const [location, setLocation] = useState("");
  const [duration, setDuration] = useState(60);

  const schedule = async () => {
    if (!title.trim() || !when) return;
    await InterviewService.schedule(
      tenantId,
      {
        candidateId: candidate.id,
        candidateName: `${candidate.firstName} ${candidate.lastName}`,
        jobId: candidate.jobId,
        stage: candidate.stage,
        title: title.trim(),
        mode,
        location: location.trim(),
        scheduledAt: new Date(when).getTime(),
        durationMins: Number(duration) || 60,
        interviewerIds: caller ? [caller.uid] : [],
        interviewerEmails: caller ? [caller.email] : [],
        createdBy: caller?.uid || "",
      },
      caller
    );
    setOpen(false);
    setTitle("");
    setWhen("");
    setLocation("");
    onChanged();
  };

  return (
    <div className="space-y-4">
      {canEdit && !open && (
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer">
          <CalendarClock size={16} /> Schedule Interview
        </button>
      )}
      {open && (
        <div className="rounded-xl border border-slate-200 p-3 space-y-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Interview title" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <select value={mode} onChange={(e) => setMode(e.target.value as InterviewMode)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white">
              {MODES.map((m) => <option key={m} value={m}>{titleCase(m)}</option>)}
            </select>
            <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location or meeting link" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <div className="flex justify-end gap-2">
            <button onClick={() => setOpen(false)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm cursor-pointer">Cancel</button>
            <button onClick={schedule} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white cursor-pointer">Schedule</button>
          </div>
        </div>
      )}
      {interviews.length === 0 ? (
        <p className="text-sm text-slate-400">No interviews scheduled.</p>
      ) : (
        interviews.map((iv) => (
          <div key={iv.id} className="rounded-xl border border-slate-100 p-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-sm">{iv.title}</span>
              <span className="text-xs text-slate-500">{titleCase(iv.status)}</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">{new Date(iv.scheduledAt).toLocaleString()} · {iv.durationMins}m · {titleCase(iv.mode)}</div>
            {iv.location && <div className="text-xs text-slate-500">{iv.location}</div>}
            {canEdit && iv.status === "scheduled" && (
              <button onClick={async () => { await InterviewService.cancel(iv.id, caller); onChanged(); }} className="mt-2 text-xs text-rose-600 hover:underline cursor-pointer">Cancel</button>
            )}
          </div>
        ))
      )}
    </div>
  );
}

/* ------------------------------- Offer tab ------------------------------- */

function OfferTab({
  candidate,
  offers,
  canEdit,
  tenantId,
  caller,
  onChanged,
}: {
  candidate: Candidate;
  offers: Offer[];
  canEdit: boolean;
  tenantId: string;
  caller: { uid: string; email: string } | undefined;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [salary, setSalary] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [startDate, setStartDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const create = async () => {
    if (!salary || !startDate) return;
    await OfferService.create(
      tenantId,
      {
        candidateId: candidate.id,
        candidateName: `${candidate.firstName} ${candidate.lastName}`,
        candidateEmail: candidate.email,
        jobId: candidate.jobId,
        jobTitle: candidate.jobTitle,
        salary: Number(salary),
        currency,
        startDate,
        expiryDate: expiryDate || startDate,
        createdBy: caller?.uid || "",
      },
      caller
    );
    setOpen(false);
    setSalary("");
    onChanged();
  };

  return (
    <div className="space-y-4">
      {canEdit && !open && (
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer">
          <BadgeDollarSign size={16} /> Create Offer
        </button>
      )}
      {open && (
        <div className="rounded-xl border border-slate-200 p-3 space-y-2">
          <div className="flex gap-2">
            <input type="number" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="Annual salary" className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <input value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <label className="block text-xs font-semibold text-slate-600">Start date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <label className="block text-xs font-semibold text-slate-600">Expiry date</label>
          <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <div className="flex justify-end gap-2">
            <button onClick={() => setOpen(false)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm cursor-pointer">Cancel</button>
            <button onClick={create} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white cursor-pointer">Create</button>
          </div>
        </div>
      )}
      {offers.length === 0 ? (
        <p className="text-sm text-slate-400">No offers yet.</p>
      ) : (
        offers.map((of) => (
          <div key={of.id} className="rounded-xl border border-slate-100 p-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-sm">{of.currency} {of.salary.toLocaleString()}</span>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${offerStatusClass(of.status)}`}>{titleCase(of.status)}</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">Start {of.startDate} · Expires {of.expiryDate}</div>
            {canEdit && (
              <div className="mt-2 flex flex-wrap gap-2">
                {(of.status === "draft" || of.status === "approved") && (
                  <button onClick={async () => { await OfferService.send(of.id, caller); onChanged(); }} className="text-xs font-medium text-indigo-600 hover:underline cursor-pointer">Send to candidate</button>
                )}
                {of.status === "sent" && (
                  <>
                    <button onClick={async () => { await OfferService.setOutcome(of.id, "accepted", caller); onChanged(); }} className="text-xs font-medium text-emerald-600 hover:underline cursor-pointer">Mark accepted</button>
                    <button onClick={async () => { await OfferService.setOutcome(of.id, "declined", caller); onChanged(); }} className="text-xs font-medium text-rose-600 hover:underline cursor-pointer">Mark declined</button>
                  </>
                )}
                <button onClick={async () => { await OfferService.remove(of.id); onChanged(); }} className="text-xs font-medium text-slate-500 hover:underline cursor-pointer inline-flex items-center gap-1"><Trash2 size={12} /> Remove</button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
