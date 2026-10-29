import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../auth/context/AuthContext";
import { useHasPermission } from "../../rbac/hooks/usePermissions";
import { SubstituteService, type SubstituteCandidate } from "../services/substituteService";
import { WorkloadService } from "../services/workloadService";
import { AcademicCalendarService } from "../../calendar/services/academicCalendarService";
import { CampusService } from "../../campuses/services/campusService";
import { EmployeeService } from "../../employees/services/employeeService";
import type { 
  SubstituteAssignment, 
  TeachingSchedule, 
  AcademicSession, 
  Campus, 
  Employee,
  DayOfWeek 
} from "@hrms/middleware";
import { 
  UserCheck, 
  Calendar, 
  Clock, 
  AlertCircle, 
  Plus, 
  CheckCircle2, 
  X, 
  Check, 
  Building2, 
  Sparkles, 
  BookOpen 
} from "lucide-react";
import { Skeleton } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/ErrorState";
import { EmptyState } from "../../../components/ui/EmptyState";
import { getFriendlyErrorMessage } from "../../../lib/errors";

const DAY_NAMES: DayOfWeek[] = ["sunday" as any, "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export function SubstituteManagementPage() {
  const { profile, user } = useAuth();
  const tenantId = profile?.activeTenantId || "";
  const hasPerm = useHasPermission();
  const canManage = hasPerm("substitutes.assign");

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [assignments, setAssignments] = useState<SubstituteAssignment[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [selectedCampusId, setSelectedCampusId] = useState<string>("");
  const [filterDate, setFilterDate] = useState<string>(todayStr);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Substitution Assignment Wizard Modal
  const [wizardOpen, setWizardOpen] = useState<boolean>(false);
  const [wizardAbsentEmpId, setWizardAbsentEmpId] = useState<string>("");
  const [wizardDate, setWizardDate] = useState<string>(todayStr);
  const [wizardAffectedSlots, setWizardAffectedSlots] = useState<TeachingSchedule[]>([]);
  const [wizardSelectedSlot, setWizardSelectedSlot] = useState<TeachingSchedule | null>(null);
  const [wizardCandidates, setWizardCandidates] = useState<SubstituteCandidate[]>([]);
  const [searchingCandidates, setSearchingCandidates] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const [sessList, campList, empList, subList] = await Promise.all([
        AcademicCalendarService.getAcademicSessions(tenantId),
        CampusService.getCampuses(tenantId),
        EmployeeService.getEmployees(tenantId),
        SubstituteService.getSubstituteAssignments(tenantId, selectedCampusId || undefined),
      ]);

      setSessions(sessList);
      setCampuses(campList);
      setEmployees(
        empList.filter((e) => e.teachingStatus === "teaching" || e.staffCategory === "teaching")
      );
      setAssignments(subList);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [tenantId, selectedCampusId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeSession = useMemo(() => {
    return sessions.find((s) => s.isCurrent) || sessions[0] || null;
  }, [sessions]);

  // When absent teacher or date is picked in wizard, look up their scheduled periods for that day
  const handleLookupTeacherSchedule = async (empId: string, dateStr: string) => {
    setWizardAbsentEmpId(empId);
    setWizardDate(dateStr);
    setWizardSelectedSlot(null);
    setWizardCandidates([]);

    if (!empId || !dateStr || !activeSession) {
      setWizardAffectedSlots([]);
      return;
    }

    const d = new Date(dateStr);
    const dayName = DAY_NAMES[d.getDay()] || "monday";

    try {
      const allSched = await WorkloadService.getTeachingSchedules(
        tenantId,
        activeSession.id,
        undefined,
        empId
      );
      const daySlots = allSched
        .filter((s) => s.dayOfWeek === dayName)
        .sort((a, b) => a.periodNumber - b.periodNumber);
      setWizardAffectedSlots(daySlots);
    } catch (err) {
      alert("Error finding schedule: " + getFriendlyErrorMessage(err));
    }
  };

  // Find candidates for the chosen slot
  const handleSelectSlotToCover = async (slot: TeachingSchedule) => {
    setWizardSelectedSlot(slot);
    setSearchingCandidates(true);
    try {
      const d = new Date(wizardDate);
      const dayName = (DAY_NAMES[d.getDay()] || "monday") as DayOfWeek;

      const candidates = await SubstituteService.findAvailableSubstitutes(
        tenantId,
        slot.campusId,
        activeSession?.id || "",
        wizardDate,
        dayName,
        slot.periodNumber,
        slot.subjectCode,
        slot.employeeId
      );
      setWizardCandidates(candidates);
    } catch (err) {
      alert("Error finding substitutes: " + getFriendlyErrorMessage(err));
    } finally {
      setSearchingCandidates(false);
    }
  };

  // Confirm assignment
  const handleConfirmSubstitute = async (candidate: SubstituteCandidate) => {
    if (!tenantId || !user || !wizardSelectedSlot) return;
    try {
      const absentEmp = employees.find((e) => e.id === wizardAbsentEmpId);
      await SubstituteService.assignSubstitute(
        tenantId,
        {
          campusId: wizardSelectedSlot.campusId,
          date: wizardDate,
          periodNumber: wizardSelectedSlot.periodNumber,
          subjectCode: wizardSelectedSlot.subjectCode,
          subjectName: wizardSelectedSlot.subjectName,
          classGrade: wizardSelectedSlot.classGrade,
          section: wizardSelectedSlot.section,
          room: wizardSelectedSlot.room,
          absentEmployeeId: wizardSelectedSlot.employeeId,
          absentEmployeeName: wizardSelectedSlot.employeeName || (absentEmp ? `${absentEmp.firstName} ${absentEmp.lastName}` : "Faculty"),
          substituteEmployeeId: candidate.employee.id,
          substituteEmployeeName: `${candidate.employee.firstName} ${candidate.employee.lastName}`,
          status: "confirmed",
          assignedBy: profile?.displayName || user.email || "Administrator",
        },
        { uid: user.uid, email: user.email || "" }
      );

      setWizardOpen(false);
      setWizardSelectedSlot(null);
      setWizardCandidates([]);
      await loadData();
      alert(`Substitute teacher assigned: ${candidate.employee.firstName} ${candidate.employee.lastName}`);
    } catch (err) {
      alert("Error assigning substitute: " + getFriendlyErrorMessage(err));
    }
  };

  // Update status
  const handleUpdateStatus = async (
    id: string,
    status: SubstituteAssignment["status"]
  ) => {
    if (!tenantId || !user) return;
    try {
      await SubstituteService.updateSubstituteStatus(tenantId, id, status, {
        uid: user.uid,
        email: user.email || "",
      });
      await loadData();
    } catch (err) {
      alert("Error updating status: " + getFriendlyErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="text-blue-600" size={26} />
            Substitute Teacher Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Detect absent teacher schedule disruptions, query conflict-free candidate faculty, and dispatch class substitutions.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => {
              setWizardOpen(true);
              setWizardAbsentEmpId("");
              setWizardAffectedSlots([]);
              setWizardSelectedSlot(null);
              setWizardCandidates([]);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl shadow-sm transition-colors"
          >
            <Plus size={16} />
            Dispatch Class Substitute
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Active Substitutions:
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            {assignments.filter((a) => a.status === "confirmed" || a.status === "assigned").length} In Progress
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-sm">
            <Calendar size={14} className="text-slate-500" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-transparent text-slate-800 focus:outline-none"
            />
          </div>

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
        </div>
      </div>

      {/* Assignments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <ErrorState title="Failed to load substitutions" description={error} onRetry={loadData} />
        ) : assignments.length === 0 ? (
          <EmptyState
            icon={<UserCheck className="text-slate-300" size={40} />}
            title="No substitute teacher assignments"
            description="When faculty members take leave or are on duty, use 'Dispatch Class Substitute' to assign available cover teachers."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-medium text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Date & Period</th>
                  <th className="py-3 px-4">Subject & Class</th>
                  <th className="py-3 px-4">Absent Faculty</th>
                  <th className="py-3 px-4">Cover Teacher</th>
                  <th className="py-3 px-4">Status</th>
                  {canManage && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignments.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-medium text-slate-900">{item.date}</div>
                      <div className="text-xs text-slate-400">Period {item.periodNumber}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{item.subjectName}</div>
                      <div className="text-xs text-slate-500">
                        {item.classGrade} ({item.section}) • Room {item.room}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <div className="font-medium">{item.absentEmployeeName}</div>
                      <div className="text-xs text-rose-500">On Leave / Duty</div>
                    </td>
                    <td className="py-3 px-4 text-slate-900">
                      <div className="font-semibold text-blue-700">{item.substituteEmployeeName}</div>
                      <div className="text-xs text-slate-400">Assigned by {item.assignedBy}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                          item.status === "completed"
                            ? "bg-slate-100 text-slate-700 border-slate-200"
                            : item.status === "confirmed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : item.status === "cancelled"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                      >
                        {item.status.toUpperCase()}
                      </span>
                    </td>
                    {canManage && (
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.status === "assigned" && (
                            <button
                              onClick={() => handleUpdateStatus(item.id, "confirmed")}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                              title="Confirm Cover"
                            >
                              <Check size={16} />
                            </button>
                          )}
                          {item.status === "confirmed" && (
                            <button
                              onClick={() => handleUpdateStatus(item.id, "completed")}
                              className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md"
                            >
                              Mark Done
                            </button>
                          )}
                          {item.status !== "cancelled" && item.status !== "completed" && (
                            <button
                              onClick={() => handleUpdateStatus(item.id, "cancelled")}
                              className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                              title="Cancel"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Substitution Wizard Modal */}
      {wizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="text-blue-600" size={20} />
              Intelligent Substitute Teacher Dispatch
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select an absent faculty member to detect disrupted classes and query conflict-free cover teachers.
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Absent Faculty</label>
                <select
                  value={wizardAbsentEmpId}
                  onChange={(e) => handleLookupTeacherSchedule(e.target.value, wizardDate)}
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose Absent Faculty --</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName} ({e.facultyGrade || e.jobTitle || "Teacher"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Absence Date</label>
                <input
                  type="date"
                  value={wizardDate}
                  onChange={(e) => handleLookupTeacherSchedule(wizardAbsentEmpId, e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Step 2: Scheduled slots for that teacher on that day */}
            {wizardAbsentEmpId && (
              <div className="mt-5 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Scheduled Classes to Cover ({wizardAffectedSlots.length} Periods)
                </h3>
                {wizardAffectedSlots.length === 0 ? (
                  <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 border border-slate-100">
                    No teaching periods scheduled for this faculty member on this day of the week.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {wizardAffectedSlots.map((slot) => {
                      const isSelected = wizardSelectedSlot?.id === slot.id;
                      return (
                        <div
                          key={slot.id}
                          onClick={() => handleSelectSlotToCover(slot)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? "bg-blue-50 border-blue-400 ring-2 ring-blue-500/20"
                              : "bg-slate-50 hover:bg-slate-100/70 border-slate-200"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-900">
                              Period {slot.periodNumber}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500">
                              {slot.startTime} - {slot.endTime}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-blue-700 mt-1">
                            {slot.subjectName} ({slot.classGrade} {slot.section})
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Room: {slot.room}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Available candidate substitutes */}
            {wizardSelectedSlot && (
              <div className="mt-5 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>
                    Eligible Cover Faculty for Period {wizardSelectedSlot.periodNumber} ({wizardSelectedSlot.subjectName})
                  </span>
                  {searchingCandidates && <span className="text-xs text-blue-600">Analyzing conflicts...</span>}
                </h3>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {wizardCandidates.map((cand) => (
                    <div
                      key={cand.employee.id}
                      className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">
                            {cand.employee.firstName} {cand.employee.lastName}
                          </span>
                          {cand.isSubjectMatch && (
                            <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5">
                              <BookOpen size={10} /> Subject Match
                            </span>
                          )}
                          {cand.isAvailable ? (
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5">
                              <CheckCircle2 size={10} /> Free (No Conflict)
                            </span>
                          ) : (
                            <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5">
                              <AlertCircle size={10} /> Busy
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {cand.isAvailable
                            ? `Qualification: ${cand.employee.highestQualification || "Master's"} • Grade: ${cand.employee.facultyGrade || "Lecturer"}`
                            : cand.conflictReason}
                        </div>
                      </div>

                      {cand.isAvailable && (
                        <button
                          type="button"
                          onClick={() => handleConfirmSubstitute(cand)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                        >
                          Assign Cover
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setWizardOpen(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
