import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../auth/context/AuthContext";
import { useHasPermission } from "../../rbac/hooks/usePermissions";
import { WorkloadService } from "../services/workloadService";
import { AcademicCalendarService } from "../../calendar/services/academicCalendarService";
import { CampusService } from "../../campuses/services/campusService";
import { EmployeeService } from "../../employees/services/employeeService";
import type { 
  FacultyWorkload, 
  TeachingSchedule, 
  AcademicSession, 
  Campus, 
  Employee,
  DayOfWeek 
} from "@hrms/middleware";
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Building2, 
  User, 
  CheckCircle2, 
  AlertTriangle 
} from "lucide-react";
import { Skeleton } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/ErrorState";
import { EmptyState } from "../../../components/ui/EmptyState";
import { getFriendlyErrorMessage } from "../../../lib/errors";

const DAYS_OF_WEEK: { key: DayOfWeek; label: string }[] = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
];

const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export function WorkloadPage() {
  const { profile, user } = useAuth();
  const tenantId = profile?.activeTenantId || "";
  const hasPerm = useHasPermission();
  const canManage = hasPerm("workload.manage");

  const [activeTab, setActiveTab] = useState<"capacity" | "timetable">("capacity");
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [selectedCampusId, setSelectedCampusId] = useState<string>("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>("");

  const [workloads, setWorkloads] = useState<FacultyWorkload[]>([]);
  const [schedules, setSchedules] = useState<TeachingSchedule[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // New Schedule Slot Modal
  const [scheduleModalOpen, setScheduleModalOpen] = useState<boolean>(false);
  const [formEmpId, setFormEmpId] = useState<string>("");
  const [formDay, setFormDay] = useState<DayOfWeek>("monday");
  const [formPeriod, setFormPeriod] = useState<number>(1);
  const [formSubjectCode, setFormSubjectCode] = useState<string>("");
  const [formSubjectName, setFormSubjectName] = useState<string>("");
  const [formGrade, setFormGrade] = useState<string>("");
  const [formSection, setFormSection] = useState<string>("A");
  const [formRoom, setFormRoom] = useState<string>("");
  const [formCampusId, setFormCampusId] = useState<string>("");

  const loadData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const [sessList, campList, empList] = await Promise.all([
        AcademicCalendarService.getAcademicSessions(tenantId),
        CampusService.getCampuses(tenantId),
        EmployeeService.getEmployees(tenantId),
      ]);

      setSessions(sessList);
      setCampuses(campList);

      const teachingStaff = empList.filter(
        (e) => e.teachingStatus === "teaching" || e.staffCategory === "teaching"
      );
      setEmployees(teachingStaff);

      const activeSess = sessList.find((s) => s.isCurrent) || sessList[0];
      const sessId = selectedSessionId || (activeSess?.id ?? "");
      setSelectedSessionId(sessId);

      if (sessId) {
        const [wlList, schedList] = await Promise.all([
          WorkloadService.getFacultyWorkloads(tenantId, sessId, selectedCampusId || undefined),
          WorkloadService.getTeachingSchedules(
            tenantId,
            sessId,
            selectedCampusId || undefined,
            selectedFacultyId || undefined
          ),
        ]);
        setWorkloads(wlList);
        setSchedules(schedList);
      }
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [tenantId, selectedSessionId, selectedCampusId, selectedFacultyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle schedule creation with conflict prevention
  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !user || !selectedSessionId || !formEmpId) return;
    const emp = employees.find((x) => x.id === formEmpId);
    if (!emp) return;

    try {
      await WorkloadService.createTeachingSchedule(
        tenantId,
        {
          campusId: formCampusId || selectedCampusId || (campuses[0]?.id ?? ""),
          employeeId: emp.id,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          academicSessionId: selectedSessionId,
          dayOfWeek: formDay,
          periodNumber: formPeriod,
          startTime: `${8 + formPeriod}:00`,
          endTime: `${8 + formPeriod}:45`,
          subjectCode: formSubjectCode,
          subjectName: formSubjectName,
          classGrade: formGrade,
          section: formSection,
          room: formRoom,
        },
        { uid: user.uid, email: user.email || "" }
      );

      setScheduleModalOpen(false);
      setFormSubjectCode("");
      setFormSubjectName("");
      setFormGrade("");
      setFormRoom("");
      await loadData();
    } catch (err) {
      alert("Scheduling Conflict: " + getFriendlyErrorMessage(err));
    }
  };

  // Delete schedule slot
  const handleDeleteSchedule = async (sched: TeachingSchedule) => {
    if (!tenantId || !user) return;
    if (!confirm(`Remove ${sched.subjectName} class for ${sched.employeeName}?`)) return;
    try {
      await WorkloadService.deleteTeachingSchedule(tenantId, sched, {
        uid: user.uid,
        email: user.email || "",
      });
      await loadData();
    } catch (err) {
      alert("Error deleting slot: " + getFriendlyErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="text-blue-600" size={26} />
            Faculty Workload & Timetable
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor weekly teaching period allocations, prevent timetable schedule conflicts, and balance faculty workloads.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setScheduleModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl shadow-sm transition-colors"
          >
            <Plus size={16} />
            Schedule Class Slot
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("capacity")}
            className={`px-3.5 py-1.5 text-sm font-medium rounded-xl transition-colors ${
              activeTab === "capacity"
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Workload Capacity
          </button>
          <button
            onClick={() => setActiveTab("timetable")}
            className={`px-3.5 py-1.5 text-sm font-medium rounded-xl transition-colors ${
              activeTab === "timetable"
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Weekly Timetable Grid
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Academic Session */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-sm">
            <Calendar size={14} className="text-slate-500" />
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="bg-transparent text-slate-800 focus:outline-none"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.isCurrent ? "(Current)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Campus */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-sm">
            <Building2 size={14} className="text-slate-500" />
            <select
              value={selectedCampusId}
              onChange={(e) => setSelectedCampusId(e.target.value)}
              className="bg-transparent text-slate-800 focus:outline-none"
            >
              <option value="">All Campuses</option>
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {activeTab === "timetable" && (
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-sm">
              <User size={14} className="text-slate-500" />
              <select
                value={selectedFacultyId}
                onChange={(e) => setSelectedFacultyId(e.target.value)}
                className="bg-transparent text-slate-800 focus:outline-none"
              >
                <option value="">All Faculty</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.firstName} {e.lastName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Tab 1: Workload Capacity */}
      {activeTab === "capacity" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : error ? (
            <ErrorState title="Failed to load workloads" description={error} onRetry={loadData} />
          ) : employees.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="text-slate-300" size={40} />}
              title="No teaching staff found"
              description="Ensure employees have 'Teaching' set under their Academic & Faculty profile."
            />
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {employees.map((emp) => {
                  const wl = workloads.find((w) => w.employeeId === emp.id);
                  const assigned = wl?.assignedWeeklyPeriods || 0;
                  const maxPeriods = wl?.maxWeeklyPeriods || 22;
                  const pct = Math.min(100, Math.round((assigned / maxPeriods) * 100));

                  const isOver = assigned > maxPeriods;
                  const isUnder = assigned < 12;

                  return (
                    <div
                      key={emp.id}
                      className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-white shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">
                              {emp.firstName} {emp.lastName}
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {emp.jobTitle || "Faculty"} • {emp.facultyGrade || "Lecturer"}
                            </p>
                          </div>
                          {isOver ? (
                            <span className="text-xs bg-rose-50 text-rose-700 border border-rose-200 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <AlertCircle size={12} /> Overallocated
                            </span>
                          ) : isUnder ? (
                            <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                              <AlertTriangle size={12} /> Underallocated
                            </span>
                          ) : (
                            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 size={12} /> Optimal
                            </span>
                          )}
                        </div>

                        {/* Capacity meter */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                            <span>Weekly Load</span>
                            <span className="font-semibold text-slate-900">
                              {assigned} / {maxPeriods} Periods
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isOver
                                  ? "bg-rose-500"
                                  : pct > 80
                                  ? "bg-amber-500"
                                  : "bg-blue-600"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>

                        {/* Subjects taught */}
                        {emp.subjectsTaught && emp.subjectsTaught.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {emp.subjectsTaught.map((sub, i) => (
                              <span
                                key={i}
                                className="text-[11px] bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md"
                              >
                                {sub}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                        <span>Campus: {campuses.find((c) => c.id === emp.campusId)?.name || "Main"}</span>
                        <button
                          onClick={() => {
                            setSelectedFacultyId(emp.id);
                            setActiveTab("timetable");
                          }}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          View Schedule →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Timetable Grid */}
      {activeTab === "timetable" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 overflow-x-auto">
          {schedules.length === 0 ? (
            <EmptyState
              icon={<Calendar className="text-slate-300" size={40} />}
              title="No timetable schedule slots configured"
              description="Use the 'Schedule Class Slot' button above to assign periods, subjects, grades, and classrooms."
            />
          ) : (
            <div className="min-w-[800px]">
              <div className="grid grid-cols-7 gap-2 border-b border-slate-200 pb-2 text-center text-xs font-semibold text-slate-500 uppercase">
                <div className="py-2">Period</div>
                {DAYS_OF_WEEK.map((d) => (
                  <div key={d.key} className="py-2">
                    {d.label}
                  </div>
                ))}
              </div>

              <div className="space-y-2 mt-2">
                {PERIODS.map((periodNum) => (
                  <div key={periodNum} className="grid grid-cols-7 gap-2 min-h-[85px]">
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-slate-600">
                      <span className="font-bold text-sm">Period {periodNum}</span>
                      <span className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {8 + periodNum}:00 - {8 + periodNum}:45
                      </span>
                    </div>

                    {DAYS_OF_WEEK.map((day) => {
                      const slot = schedules.find(
                        (s) => s.periodNumber === periodNum && s.dayOfWeek === day.key
                      );

                      if (!slot) {
                        return (
                          <div
                            key={day.key}
                            className="p-2 bg-slate-50/40 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-slate-300 text-xs"
                          >
                            —
                          </div>
                        );
                      }

                      return (
                        <div
                          key={day.key}
                          className="p-2.5 bg-blue-50/70 border border-blue-200/80 rounded-xl flex flex-col justify-between group relative"
                        >
                          <div>
                            <div className="font-bold text-slate-900 text-xs leading-tight">
                              {slot.subjectName}
                            </div>
                            <div className="text-[11px] text-blue-700 font-medium mt-0.5">
                              {slot.classGrade} ({slot.section})
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1">
                              {slot.employeeName}
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 mt-1 border-t border-blue-100">
                            <span>Room: {slot.room}</span>
                            {canManage && (
                              <button
                                onClick={() => handleDeleteSchedule(slot)}
                                className="text-rose-500 hover:text-rose-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove slot"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Schedule Modal */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <form
            onSubmit={handleCreateSchedule}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Clock className="text-blue-600" size={20} />
              Schedule Class Slot
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Assign a faculty member to a subject, classroom, and period. Checks for teacher and room double-booking automatically.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Faculty Member</label>
                <select
                  required
                  value={formEmpId}
                  onChange={(e) => setFormEmpId(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select Teacher --</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName} ({e.facultyGrade || "Faculty"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Day of Week</label>
                  <select
                    value={formDay}
                    onChange={(e) => setFormDay(e.target.value as DayOfWeek)}
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d.key} value={d.key}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Period Number</label>
                  <select
                    value={formPeriod}
                    onChange={(e) => setFormPeriod(Number(e.target.value))}
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                  >
                    {PERIODS.map((p) => (
                      <option key={p} value={p}>
                        Period {p} ({8 + p}:00 - {8 + p}:45)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Subject Code</label>
                  <input
                    type="text"
                    required
                    placeholder="MATH-101"
                    value={formSubjectCode}
                    onChange={(e) => setFormSubjectCode(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Subject Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Calculus & Vectors"
                    value={formSubjectName}
                    onChange={(e) => setFormSubjectName(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Grade / Class</label>
                  <input
                    type="text"
                    required
                    placeholder="Grade 11"
                    value={formGrade}
                    onChange={(e) => setFormGrade(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Section</label>
                  <input
                    type="text"
                    required
                    placeholder="A"
                    value={formSection}
                    onChange={(e) => setFormSection(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Room / Lab</label>
                  <input
                    type="text"
                    required
                    placeholder="Room 204"
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setScheduleModalOpen(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
              >
                Verify & Add to Timetable
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
