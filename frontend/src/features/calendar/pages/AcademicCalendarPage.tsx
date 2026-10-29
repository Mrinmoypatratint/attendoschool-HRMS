import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../auth/context/AuthContext";
import { useHasPermission } from "../../rbac/hooks/usePermissions";
import { AcademicCalendarService } from "../services/academicCalendarService";
import type { AcademicSession, AcademicTerm, HolidayCalendar, Holiday } from "@hrms/middleware";
import { 
  Calendar, 
  CalendarDays, 
  Plus, 
  Check, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Building2 
} from "lucide-react";
import { Skeleton } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/ErrorState";
import { EmptyState } from "../../../components/ui/EmptyState";
import { getFriendlyErrorMessage } from "../../../lib/errors";

export function AcademicCalendarPage() {
  const { profile, user } = useAuth();
  const tenantId = profile?.activeTenantId || "";
  const hasPerm = useHasPermission();
  const canManage = hasPerm("academic_calendar.manage");

  const [activeTab, setActiveTab] = useState<"sessions" | "holidays">("sessions");
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [holidayCalendars, setHolidayCalendars] = useState<HolidayCalendar[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [sessionModalOpen, setSessionModalOpen] = useState<boolean>(false);
  const [holidayModalOpen, setHolidayModalOpen] = useState<boolean>(false);

  // New Session Form State
  const [sessName, setSessName] = useState<string>("");
  const [sessCode, setSessCode] = useState<string>("");
  const [sessStart, setSessStart] = useState<string>("2026-08-01");
  const [sessEnd, setSessEnd] = useState<string>("2027-05-31");
  const [sessIsCurrent, setSessIsCurrent] = useState<boolean>(true);
  const [terms, setTerms] = useState<Array<{ id: string; name: string; startDate: string; endDate: string }>>([
    { id: "term_1", name: "Fall Semester", startDate: "2026-08-01", endDate: "2026-12-20" },
    { id: "term_2", name: "Spring Semester", startDate: "2027-01-10", endDate: "2027-05-31" },
  ]);

  // Holiday Form State
  const [holDate, setHolDate] = useState<string>("2026-12-25");
  const [holName, setHolName] = useState<string>("");

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const loadData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const [sessList, holList] = await Promise.all([
        AcademicCalendarService.getAcademicSessions(tenantId),
        AcademicCalendarService.getHolidayCalendars(tenantId, currentYear),
      ]);
      setSessions(sessList);
      setHolidayCalendars(holList);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [tenantId, currentYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeSession = useMemo(() => {
    return sessions.find((s) => s.isCurrent) || sessions[0] || null;
  }, [sessions]);

  const activeHolidays = useMemo(() => {
    const defaultCal = holidayCalendars[0];
    return defaultCal?.holidays || [];
  }, [holidayCalendars]);

  // Add term to session form
  const handleAddTerm = () => {
    setTerms((prev) => [
      ...prev,
      {
        id: `term_${Date.now()}`,
        name: `Term ${prev.length + 1}`,
        startDate: sessStart,
        endDate: sessEnd,
      },
    ]);
  };

  const handleRemoveTerm = (idx: number) => {
    setTerms((prev) => prev.filter((_, i) => i !== idx));
  };

  // Submit new Academic Session
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !user) return;
    try {
      await AcademicCalendarService.createAcademicSession(
        tenantId,
        {
          name: sessName,
          code: sessCode,
          startDate: sessStart,
          endDate: sessEnd,
          isCurrent: sessIsCurrent,
          terms,
        },
        { uid: user.uid, email: user.email || "" }
      );
      setSessionModalOpen(false);
      setSessName("");
      setSessCode("");
      await loadData();
    } catch (err) {
      alert("Error creating academic session: " + getFriendlyErrorMessage(err));
    }
  };

  // Set active session
  const handleSetCurrentSession = async (session: AcademicSession) => {
    if (!tenantId || !user) return;
    try {
      await AcademicCalendarService.updateAcademicSession(
        tenantId,
        session.id,
        { isCurrent: true },
        { uid: user.uid, email: user.email || "" }
      );
      await loadData();
    } catch (err) {
      alert("Error setting current session: " + getFriendlyErrorMessage(err));
    }
  };

  // Add Holiday
  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !user) return;
    try {
      const calId = holidayCalendars[0]?.id || `hol_cal_${currentYear}_${tenantId}`;
      await AcademicCalendarService.addHoliday(
        tenantId,
        calId,
        { date: holDate, name: holName },
        { uid: user.uid, email: user.email || "" }
      );
      setHolidayModalOpen(false);
      setHolName("");
      await loadData();
    } catch (err) {
      alert("Error adding holiday: " + getFriendlyErrorMessage(err));
    }
  };

  // Remove Holiday
  const handleRemoveHoliday = async (date: string) => {
    if (!tenantId || !user || !holidayCalendars[0]) return;
    try {
      await AcademicCalendarService.removeHoliday(
        tenantId,
        holidayCalendars[0].id,
        date,
        { uid: user.uid, email: user.email || "" }
      );
      await loadData();
    } catch (err) {
      alert("Error removing holiday: " + getFriendlyErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarDays className="text-blue-600" size={26} />
            Academic Calendar & Sessions
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure institutional academic years, term semesters, and institutional working holidays.
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            {activeTab === "sessions" ? (
              <button
                onClick={() => setSessionModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl shadow-sm transition-colors"
              >
                <Plus size={16} />
                New Academic Session
              </button>
            ) : (
              <button
                onClick={() => setHolidayModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl shadow-sm transition-colors"
              >
                <Plus size={16} />
                Add Institutional Holiday
              </button>
            )}
          </div>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Sparkles size={22} />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase">Active Session</div>
            <div className="text-lg font-bold text-slate-900 mt-0.5">
              {activeSession ? activeSession.name : "None Configured"}
            </div>
            <div className="text-xs text-slate-500">
              {activeSession ? `${activeSession.startDate} to ${activeSession.endDate}` : "Setup session below"}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase">Configured Terms</div>
            <div className="text-lg font-bold text-slate-900 mt-0.5">
              {activeSession ? `${activeSession.terms?.length || 0} Terms / Semesters` : "0 Terms"}
            </div>
            <div className="text-xs text-slate-500">Linked to faculty workload</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Calendar size={22} />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-400 uppercase">Institutional Holidays ({currentYear})</div>
            <div className="text-lg font-bold text-slate-900 mt-0.5">
              {activeHolidays.length} Days
            </div>
            <div className="text-xs text-slate-500">Excluded from staff absence deduction</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
          <button
            onClick={() => setActiveTab("sessions")}
            className={`px-3.5 py-1.5 text-sm font-medium rounded-xl transition-colors ${
              activeTab === "sessions"
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Academic Sessions
          </button>
          <button
            onClick={() => setActiveTab("holidays")}
            className={`px-3.5 py-1.5 text-sm font-medium rounded-xl transition-colors ${
              activeTab === "holidays"
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Institutional Holidays
          </button>
        </div>

        {/* Tab 1: Sessions */}
        {activeTab === "sessions" && (
          <div className="mt-4">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : error ? (
              <ErrorState title="Failed to load sessions" description={error} onRetry={loadData} />
            ) : sessions.length === 0 ? (
              <EmptyState
                icon={<CalendarDays className="text-slate-300" size={40} />}
                title="No academic sessions defined"
                description="Create an academic session (e.g. 2026-2027 Academic Year) to start scheduling faculty workloads."
              />
            ) : (
              <div className="space-y-4">
                {sessions.map((sess) => (
                  <div
                    key={sess.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      sess.isCurrent
                        ? "border-blue-300 bg-blue-50/20"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-base">{sess.name}</h3>
                          <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
                            {sess.code}
                          </span>
                          {sess.isCurrent && (
                            <span className="text-xs bg-emerald-100 text-emerald-800 font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Check size={12} /> Current Active Session
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-4">
                          <span>
                            Dates: <strong>{sess.startDate}</strong> to <strong>{sess.endDate}</strong>
                          </span>
                          <span>{sess.terms?.length || 0} Terms Configured</span>
                        </div>
                      </div>

                      {!sess.isCurrent && canManage && (
                        <button
                          onClick={() => handleSetCurrentSession(sess)}
                          className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-xl transition-colors"
                        >
                          Set as Current
                        </button>
                      )}
                    </div>

                    {/* Terms Breakdown */}
                    {sess.terms && sess.terms.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {sess.terms.map((term) => (
                          <div
                            key={term.id}
                            className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                          >
                            <div className="font-semibold text-slate-800">{term.name}</div>
                            <div className="text-slate-500 mt-0.5">
                              {term.startDate} — {term.endDate}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Holidays */}
        {activeTab === "holidays" && (
          <div className="mt-4">
            {activeHolidays.length === 0 ? (
              <EmptyState
                icon={<Calendar className="text-slate-300" size={40} />}
                title="No holidays found for this year"
                description="Add national, institutional, and examination holidays to configure staff attendance."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase font-medium text-slate-500 border-b border-slate-200/80">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Holiday Name</th>
                      <th className="py-3 px-4">Day of Week</th>
                      {canManage && <th className="py-3 px-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeHolidays.map((h) => {
                      const d = new Date(h.date);
                      const dayName = isNaN(d.getTime())
                        ? ""
                        : d.toLocaleDateString("en-US", { weekday: "long" });

                      return (
                        <tr key={h.date} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-mono font-medium text-slate-900">
                            {h.date}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800">
                            {h.name}
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-500">{dayName}</td>
                          {canManage && (
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleRemoveHoliday(h.date)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Remove Holiday"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Session Modal */}
      {sessionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <form
            onSubmit={handleCreateSession}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CalendarDays className="text-blue-600" size={20} />
              Create Academic Session
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Add a new institutional academic year and configure semesters or terms.
            </p>

            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Session Name</label>
                  <input
                    type="text"
                    required
                    placeholder="2026-2027 Academic Year"
                    value={sessName}
                    onChange={(e) => setSessName(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Session Code</label>
                  <input
                    type="text"
                    required
                    placeholder="AY-2026-27"
                    value={sessCode}
                    onChange={(e) => setSessCode(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={sessStart}
                    onChange={(e) => setSessStart(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={sessEnd}
                    onChange={(e) => setSessEnd(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="sessIsCurrent"
                  checked={sessIsCurrent}
                  onChange={(e) => setSessIsCurrent(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="sessIsCurrent" className="text-xs text-slate-700 font-medium">
                  Set as Current Active Session for the Institution
                </label>
              </div>

              {/* Terms Section */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-800">Terms / Semesters</span>
                  <button
                    type="button"
                    onClick={handleAddTerm}
                    className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1"
                  >
                    <Plus size={13} /> Add Term
                  </button>
                </div>
                <div className="space-y-2">
                  {terms.map((t, idx) => (
                    <div key={t.id} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <input
                        type="text"
                        placeholder="Term Name"
                        value={t.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTerms((prev) => prev.map((item, i) => (i === idx ? { ...item, name: val } : item)));
                        }}
                        className="text-xs bg-white border border-slate-200 rounded-lg p-1.5 flex-1 focus:outline-none"
                      />
                      <input
                        type="date"
                        value={t.startDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTerms((prev) => prev.map((item, i) => (i === idx ? { ...item, startDate: val } : item)));
                        }}
                        className="text-xs bg-white border border-slate-200 rounded-lg p-1.5 w-28 focus:outline-none"
                      />
                      <input
                        type="date"
                        value={t.endDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTerms((prev) => prev.map((item, i) => (i === idx ? { ...item, endDate: val } : item)));
                        }}
                        className="text-xs bg-white border border-slate-200 rounded-lg p-1.5 w-28 focus:outline-none"
                      />
                      {terms.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTerm(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSessionModalOpen(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
              >
                Save Session
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Holiday Modal */}
      {holidayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <form
            onSubmit={handleAddHoliday}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100"
          >
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="text-blue-600" size={20} />
              Add Institutional Holiday
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Add a holiday to the working calendar for {currentYear}.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={holDate}
                  onChange={(e) => setHolDate(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Holiday Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Independence Day, Annual Founder's Day"
                  value={holName}
                  onChange={(e) => setHolName(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setHolidayModalOpen(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
              >
                Add Holiday
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
