import { getFriendlyErrorMessage } from "../../../lib/errors";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { CareersService, type ApplicationInput } from "../services/careersService";
import { titleCase } from "../components/recruitmentUi";
import type { Job, Tenant } from "@hrms/middleware";
import { Briefcase, MapPin, Clock, Upload, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

export function CareersPage() {
  const { tenantId = "" } = useParams();
  const [resolvedTenantId, setResolvedTenantId] = useState<string>("");
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Job | null>(null);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Resolve actual tenant ID (e.g. tenant_demo) if the parameter is a company name
      let resolvedId = tenantId;
      let tenantDoc = await CareersService.getTenantById(tenantId);

      if (tenantDoc) {
        resolvedId = tenantId;
        setActiveTenant(tenantDoc);
      } else {
        // Find tenant by matching normalized name/slug
        const tenants = await CareersService.getAllTenants();
        const normalizedParam = decodeURIComponent(tenantId).toLowerCase().replace(/[^a-z0-9]/g, "");
        const matchedTenant = tenants.find(t => {
          const normalizedName = (t.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
          return normalizedName === normalizedParam;
        });

        if (matchedTenant) {
          resolvedId = matchedTenant.id;
          setActiveTenant(matchedTenant);
        } else {
          setActiveTenant(null);
        }
      }

      setResolvedTenantId(resolvedId);
      const data = await CareersService.listPublishedJobs(resolvedId);
      setJobs(data);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "Failed to load openings."));
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    load();
  }, [load]);

  // SEO: set document title + meta/OG tags per page (list vs. selected job).
  useEffect(() => {
    const setMeta = (name: string, content: string, attr: "name" | "property" = "name") => {
      let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const companyName = activeTenant?.name || "Careers";
    const title = selected
      ? `${selected.title} — ${companyName}`
      : `${companyName} — Open Positions`;
    const description = selected
      ? (selected.description?.slice(0, 155) || `Apply for ${selected.title}. ${titleCase(selected.employmentType)}, ${titleCase(selected.workMode)}.`)
      : `Explore open roles at ${companyName} and join the team.`;

    const prevTitle = document.title;
    document.title = title;
    setMeta("description", description);
    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    setMeta("og:type", "website", "property");

    return () => {
      document.title = prevTitle;
    };
  }, [selected, jobs, loading, activeTenant]);

  const primaryColor = activeTenant?.primaryColor || "#2563eb";
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <div className="flex items-center gap-4">
            {(activeTenant?.logoURL || (activeTenant as any)?.logoUrl) ? (
              <img
                src={activeTenant?.logoURL || (activeTenant as any)?.logoUrl}
                alt={activeTenant?.name}
                className="h-12 w-12 rounded-xl object-contain p-1 border border-slate-200 bg-white shrink-0 shadow-xs"
              />
            ) : (
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white font-bold text-lg shadow-sm"
                style={{ backgroundColor: primaryColor }}
              >
                {activeTenant ? getInitials(activeTenant.name) : <Briefcase className="h-6 w-6" />}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {activeTenant ? `${activeTenant.name} Careers` : "Careers"}
              </h1>
              <p className="text-slate-500 mt-1">
                {activeTenant ? `Explore open roles and join the team at ${activeTenant.name}.` : "Explore open roles and join our team."}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        {loading ? (
          <p className="text-slate-500 flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading openings…</p>
        ) : error ? (
          <div className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : selected ? (
          <JobApplication tenantId={resolvedTenantId} job={selected} onBack={() => setSelected(null)} activeTenant={activeTenant} />
        ) : jobs.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
            <p className="text-slate-500">There are no open positions right now. Please check back later.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <button
                key={job.id}
                onClick={() => setSelected(job)}
                className="block w-full text-left rounded-2xl border border-slate-200 bg-white p-5 hover:border-blue-300 hover:shadow-sm transition cursor-pointer"
              >
                <h2 className="text-lg font-semibold text-slate-900">{job.title}</h2>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><MapPin size={14} /> {job.location || "—"}</span>
                  <span className="flex items-center gap-1"><Clock size={14} /> {titleCase(job.employmentType)}</span>
                  <span>{titleCase(job.workMode)}</span>
                </div>
                {job.description && <p className="mt-3 text-sm text-slate-600 line-clamp-2">{job.description}</p>}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function JobApplication({
  tenantId,
  job,
  onBack,
  activeTenant
}: {
  tenantId: string;
  job: Job;
  onBack: () => void;
  activeTenant: Tenant | null;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const primaryColor = activeTenant?.primaryColor || "#2563eb";

  const submit = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setErr("Please fill in your name and email.");
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      let resume: { resumeUrl: string; resumePath: string } | undefined;
      if (file) resume = await CareersService.uploadResume(tenantId, file);
      const input: ApplicationInput = {
        tenantId,
        jobId: job.id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        ...(phone ? { phone: phone.trim() } : {}),
        ...(linkedinUrl ? { linkedinUrl: linkedinUrl.trim() } : {}),
        ...(coverLetter ? { coverLetter: coverLetter.trim() } : {}),
        ...(resume ? { resumeUrl: resume.resumeUrl, resumePath: resume.resumePath } : {}),
      };
      await CareersService.submitApplication(input);
      setDone(true);
    } catch (e) {
      setErr(getFriendlyErrorMessage(e, "Failed to submit application."));
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
        <h2 className="mt-4 text-xl font-bold text-slate-900">Application submitted</h2>
        <p className="mt-2 text-slate-500">Thank you for applying to {job.title}. We've emailed you a confirmation and will be in touch.</p>
        <button
          onClick={onBack}
          className="mt-6 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white cursor-pointer hover:opacity-90 transition-all"
          style={{ backgroundColor: primaryColor }}
        >
          Back to openings
        </button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={onBack} className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800 cursor-pointer">
        <ArrowLeft size={16} /> All openings
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-2xl font-bold text-slate-900">{job.title}</h2>
        <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1"><MapPin size={14} /> {job.location || "—"}</span>
          <span className="flex items-center gap-1"><Clock size={14} /> {titleCase(job.employmentType)}</span>
          <span>{titleCase(job.workMode)}</span>
        </div>

        {job.description && <Section title="About the role" body={job.description} />}
        {job.responsibilities && <Section title="Responsibilities" body={job.responsibilities} />}
        {job.requirements && <Section title="Requirements" body={job.requirements} />}

        <hr className="my-6 border-slate-100" />

        <h3 className="text-lg font-semibold text-slate-900 mb-4">Apply for this position</h3>
        {err && <div className="mb-4 rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700">{err}</div>}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name *" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name *" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          </div>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email *" type="email" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          <input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="LinkedIn URL" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          <textarea value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} placeholder="Cover letter (optional)" rows={4} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          <label className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-3 text-sm text-slate-600 cursor-pointer hover:bg-slate-50">
            <Upload size={16} />
            {file ? file.name : "Upload your résumé (PDF/DOC, max 5MB)"}
            <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <button
            onClick={submit}
            disabled={submitting}
            className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-60 cursor-pointer hover:opacity-90 transition-all"
            style={{ backgroundColor: primaryColor }}
          >
            {submitting ? "Submitting…" : "Submit Application"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">{body}</p>
    </div>
  );
}
