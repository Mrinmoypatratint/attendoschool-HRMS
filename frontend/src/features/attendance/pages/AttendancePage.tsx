import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../auth/context/AuthContext";
import { useHasPermission } from "../../rbac/hooks/usePermissions";
import { AttendanceService } from "../services/attendanceService";
import { CampusService } from "../../campuses/services/campusService";
import { EmployeeService } from "../../employees/services/employeeService";
import type { 
  StaffAttendance, 
  AttendanceRegularization, 
  Campus, 
  Employee,
  StaffAttendanceStatus,
  StaffDutyType
} from "@hrms/middleware";
import { 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Briefcase, 
  UserCheck, 
  Building2, 
  Plus, 
  Filter, 
  Inbox, 
  Search, 
  Check, 
  X,
  FileText
} from "lucide-react";
import { Skeleton } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/ErrorState";
import { EmptyState } from "../../../components/ui/EmptyState";
import { getFriendlyErrorMessage } from "../../../lib/errors";

const STATUS_CONFIG: Record<StaffAttendanceStatus, { label: string; bg: string; text: string }> = {
  present: { label: "Present", bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
  late: { label: "Late Arrival", bg: "bg-amber-50 border-amber-200", text: "text-amber-700" },
  early_departure: { label: "Early Departure", bg: "bg-orange-50 border-orange-200", text: "text-orange-700" },
  half_day: { label: "Half Day", bg: "bg-blue-50 border-blue-200", text: "text-blue-700" },
  absent: { label: "Absent", bg: "bg-rose-50 border-rose-200", text: "text-rose-700" },
  on_duty: { label: "On Duty", bg: "bg-indigo-50 border-indigo-200", text: "text-indigo-700" },
  holiday: { label: "Holiday", bg: "bg-purple-50 border-purple-200", text: "text-purple-700" },
  leave: { label: "On Leave", bg: "bg-slate-100 border-slate-200", text: "text-slate-700" },
};

const DUTY_LABELS: Record<StaffDutyType, string> = {
  regular: "Regular Classes",
  exam_duty: "Examination Duty",
  training: "Faculty Development / Training",
  institutional_duty: "Institutional Duty",
  off_campus: "Off-Campus / Field Visit",
};

export function AttendancePage() {
  const { profile, user } = useAuth();
  const tenantId = profile?.activeTenantId || "";
  const hasPerm = useHasPermission();
  const canManage = hasPerm("attendance.manage");
  const canRegularize = hasPerm("attendance.approve");

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [activeTab, setActiveTab] = useState<"daily" | "regularizations" | "my">("daily");
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedCampus, setSelectedCampus] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [attendanceList, setAttendanceList] = useState<StaffAttendance[]>([]);
  const [regularizations, setRegularizations] = useState<AttendanceRegularization[]>([]);
  const [myAttendance, setMyAttendance] = useState<StaffAttendance[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [callerEmployee, setCallerEmployee] = useState<Employee | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [punchModalOpen, setPunchModalOpen] = useState<boolean>(false);
  const [regularizeModalOpen, setRegularizeModalOpen] = useState<boolean>(false);
  const [manualEntryModalOpen, setManualEntryModalOpen] = useState<boolean>(false);

  // Punch Form State
  const [punchDuty, setPunchDuty] = useState<StaffDutyType>("regular");
  const [punchNotes, setPunchNotes] = useState<string>("");

  // Regularize Form State
  const [regDate, setRegDate] = useState<string>(todayStr);
  const [regReason, setRegReason] = useState<string>("");
  const [regInTime, setRegInTime] = useState<string>("08:30");
  const [regOutTime, setRegOutTime] = useState<string>("16:30");

  // Manual Entry Form State
  const [manualEmpId, setManualEmpId] = useState<string>("");
  const [manualStatus, setManualStatus] = useState<StaffAttendanceStatus>("present");
  const [manualDuty, setManualDuty] = useState<StaffDutyType>("regular");
  const [manualCheckIn, setManualCheckIn] = useState<string>("08:30");
  const [manualCheckOut, setManualCheckOut] = useState<string>("16:30");

  const loadData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      let callerEmp: Employee | null = null;
      if (user?.uid) {
        callerEmp = await EmployeeService.getCallerEmployee(tenantId, user.uid);
        setCallerEmployee(callerEmp);
      }

      const [campList, empList, dailyAtt, regList] = await Promise.all([
        CampusService.getCampuses(tenantId),
        EmployeeService.getEmployees(tenantId),
        AttendanceService.getDailyAttendance(tenantId, selectedDate, selectedCampus || undefined),
        AttendanceService.getRegularizations(tenantId),
      ]);

      setCampuses(campList);
      setEmployees(empList);
      setAttendanceList(dailyAtt);
      setRegularizations(regList);

      if (callerEmp?.id) {
        const myLogs = await AttendanceService.getStaffAttendanceHistory(tenantId, callerEmp.id);
        setMyAttendance(myLogs);
      }
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [tenantId, selectedDate, selectedCampus, user?.uid]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived metrics
  const metrics = useMemo(() => {
    let present = 0;
    let late = 0;
    let onDuty = 0;
    let absent = 0;
    let onLeave = 0;

    attendanceList.forEach((r) => {
      if (r.status === "present") present++;
      else if (r.status === "late") late++;
      else if (r.status === "on_duty") onDuty++;
      else if (r.status === "absent") absent++;
      else if (r.status === "leave") onLeave++;
    });

    return {
      total: attendanceList.length,
      present,
      late,
      onDuty,
      absent,
      onLeave,
    };
  }, [attendanceList]);

  // Filtered daily list
  const filteredDaily = useMemo(() => {
    return attendanceList.filter((item) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.employeeName.toLowerCase().includes(q) ||
        item.dutyType.toLowerCase().includes(q) ||
        item.status.toLowerCase().includes(q)
      );
    });
  }, [attendanceList, searchQuery]);

  // Quick punch submission
  const handleQuickPunch = async () => {
    if (!tenantId || !user) return;
    try {
      const now = new Date();
      const timeStr = now.toTimeString().split(" ")[0] || "08:30:00";
      const empName = callerEmployee
        ? `${callerEmployee.firstName} ${callerEmployee.lastName}`
        : profile?.displayName || user.email || "Staff Member";
      const empId = callerEmployee?.id || user.uid;

      await AttendanceService.recordAttendance(
        tenantId,
        {
          campusId: selectedCampus || callerEmployee?.campusId || (campuses[0]?.id ?? ""),
          employeeId: empId,
          employeeName: empName,
          date: todayStr,
          checkInTime: timeStr,
          status: "present",
          dutyType: punchDuty,
          verificationStatus: "verified",
          remarks: punchNotes.trim() ? punchNotes.trim() : undefined,
        },
        { uid: user.uid, email: user.email || "" }
      );

      setPunchModalOpen(false);
      setPunchNotes("");
      await loadData();
    } catch (err) {
      alert("Failed to record punch: " + getFriendlyErrorMessage(err));
    }
  };

  // Submit regularization
  const handleSubmitRegularization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !user) return;
    try {
      const empName = callerEmployee
        ? `${callerEmployee.firstName} ${callerEmployee.lastName}`
        : profile?.displayName || user.email || "Staff Member";
      const empId = callerEmployee?.id || user.uid;

      await AttendanceService.submitRegularization(
        tenantId,
        {
          campusId: selectedCampus || callerEmployee?.campusId || undefined,
          employeeId: empId,
          employeeName: empName,
          date: regDate,
          reason: regReason,
          requestedCheckIn: regInTime,
          requestedCheckOut: regOutTime,
        },
        { uid: user.uid, email: user.email || "" }
      );

      setRegularizeModalOpen(false);
      setRegReason("");
      await loadData();
      alert("Regularization request submitted for review.");
    } catch (err) {
      alert("Error submitting regularization: " + getFriendlyErrorMessage(err));
    }
  };

  // Review regularization
  const handleReviewRegularization = async (
    id: string,
    action: "approved" | "rejected"
  ) => {
    if (!user) return;
    try {
      await AttendanceService.reviewRegularization(
        id,
        action,
        {
          uid: user.uid,
          name: profile?.displayName || user.email || "Administrator",
          email: user.email || "",
        }
      );
      await loadData();
    } catch (err) {
      alert("Error reviewing regularization: " + getFriendlyErrorMessage(err));
    }
  };

  // Manual Attendance Entry
  const handleManualEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !user || !manualEmpId) return;
    const emp = employees.find((x) => x.id === manualEmpId);
    if (!emp) return;

    try {
      await AttendanceService.recordAttendance(
        tenantId,
        {
          campusId: emp.campusId || selectedCampus || (campuses[0]?.id ?? ""),
          employeeId: emp.id,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          date: selectedDate,
          checkInTime: manualCheckIn,
          checkOutTime: manualCheckOut,
          status: manualStatus,
          dutyType: manualDuty,
          verificationStatus: "verified",
          remarks: "Manual entry by HR/Admin",
        },
        { uid: user.uid, email: user.email || "" }
      );

      setManualEntryModalOpen(false);
      await loadData();
    } catch (err) {
      alert("Error saving manual attendance: " + getFriendlyErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="text-blue-600" size={26} />
            Staff & Faculty Attendance
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track daily check-ins, examination duties, institutional shifts, and attendance regularizations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setPunchModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl shadow-sm transition-colors"
          >
            <Clock size={16} />
            Quick Punch
          </button>

          <button
            onClick={() => setRegularizeModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-medium rounded-xl shadow-sm transition-colors"
          >
            <FileText size={16} />
            Request Regularization
          </button>

          {canManage && (
            <button
              onClick={() => setManualEntryModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl shadow-sm transition-colors"
            >
              <Plus size={16} />
              Mark Attendance
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Tracked</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{metrics.total}</div>
          <div className="text-xs text-slate-400 mt-0.5">Records for selected date</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm">
          <div className="text-xs font-medium text-emerald-700 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 size={13} /> Present
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{metrics.present}</div>
          <div className="text-xs text-emerald-600/80 mt-0.5">On-time teaching & staff</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm">
          <div className="text-xs font-medium text-amber-700 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle size={13} /> Late Arrival
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-1">{metrics.late}</div>
          <div className="text-xs text-amber-600/80 mt-0.5">Beyond scheduled punch</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm">
          <div className="text-xs font-medium text-indigo-700 uppercase tracking-wider flex items-center gap-1">
            <Briefcase size={13} /> On Duty / Exam
          </div>
          <div className="text-2xl font-bold text-indigo-700 mt-1">{metrics.onDuty}</div>
          <div className="text-xs text-indigo-600/80 mt-0.5">Off-campus / invigilation</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm">
          <div className="text-xs font-medium text-rose-700 uppercase tracking-wider flex items-center gap-1">
            <UserCheck size={13} /> Absent / Leave
          </div>
          <div className="text-2xl font-bold text-rose-700 mt-1">{metrics.absent + metrics.onLeave}</div>
          <div className="text-xs text-rose-600/80 mt-0.5">Unscheduled or approved</div>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("daily")}
              className={`px-3 py-1.5 text-sm font-medium rounded-xl transition-colors ${
                activeTab === "daily"
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Daily Attendance Log
            </button>
            <button
              onClick={() => setActiveTab("regularizations")}
              className={`px-3 py-1.5 text-sm font-medium rounded-xl transition-colors relative ${
                activeTab === "regularizations"
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Regularization Requests
              {regularizations.filter((r) => r.status === "pending").length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-rose-500 text-white rounded-full">
                  {regularizations.filter((r) => r.status === "pending").length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("my")}
              className={`px-3 py-1.5 text-sm font-medium rounded-xl transition-colors ${
                activeTab === "my"
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              My Punch History
            </button>
          </div>

          {activeTab === "daily" && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <Calendar size={14} className="text-slate-500" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-sm text-slate-800 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <Building2 size={14} className="text-slate-500" />
                <select
                  value={selectedCampus}
                  onChange={(e) => setSelectedCampus(e.target.value)}
                  className="bg-transparent text-sm text-slate-800 focus:outline-none"
                >
                  <option value="">All Campuses</option>
                  {campuses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search staff, duty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-44"
                />
              </div>
            </div>
          )}
        </div>

        {/* Tab 1: Daily Log */}
        {activeTab === "daily" && (
          <div className="mt-4">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : error ? (
              <ErrorState title="Failed to load attendance" description={error} onRetry={loadData} />
            ) : filteredDaily.length === 0 ? (
              <EmptyState
                icon={<Clock className="text-slate-300" size={40} />}
                title="No attendance records found"
                description={`No punches or duty logs marked for ${selectedDate}. You can use 'Mark Attendance' or 'Quick Punch' to record activity.`}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase font-medium text-slate-500 border-b border-slate-200/80">
                    <tr>
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Duty Type</th>
                      <th className="py-3 px-4">Check-In</th>
                      <th className="py-3 px-4">Check-Out</th>
                      <th className="py-3 px-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDaily.map((row) => {
                      const cfg = STATUS_CONFIG[row.status] || STATUS_CONFIG.present;
                      return (
                        <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-900">{row.employeeName}</div>
                            <div className="text-xs text-slate-400">ID: {row.employeeId}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text}`}
                            >
                              {cfg.label}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md font-medium">
                              {DUTY_LABELS[row.dutyType] || row.dutyType}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-900 font-mono text-xs">
                            {row.checkInTime || "--:--"}
                          </td>
                          <td className="py-3 px-4 text-slate-900 font-mono text-xs">
                            {row.checkOutTime || "--:--"}
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-500">
                            {row.remarks || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Regularization Approvals */}
        {activeTab === "regularizations" && (
          <div className="mt-4">
            {regularizations.length === 0 ? (
              <EmptyState
                icon={<Inbox className="text-slate-300" size={40} />}
                title="No regularization requests"
                description="When faculty or staff request punch adjustments or off-campus duty confirmations, they will appear here."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase font-medium text-slate-500 border-b border-slate-200/80">
                    <tr>
                      <th className="py-3 px-4">Applicant</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Requested Times</th>
                      <th className="py-3 px-4">Reason</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {regularizations.map((reg) => (
                      <tr key={reg.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-900">
                          {reg.employeeName}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-700">
                          {reg.date}
                        </td>
                        <td className="py-3 px-4 text-xs font-mono">
                          {reg.requestedCheckIn || "08:30"} — {reg.requestedCheckOut || "16:30"}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 max-w-xs truncate">
                          {reg.reason}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              reg.status === "approved"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : reg.status === "rejected"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {reg.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {reg.status === "pending" && canRegularize && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleReviewRegularization(reg.id, "approved")}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Approve Request"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => handleReviewRegularization(reg.id, "rejected")}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Reject Request"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: My Attendance History */}
        {activeTab === "my" && (
          <div className="mt-4">
            {myAttendance.length === 0 ? (
              <EmptyState
                icon={<Clock className="text-slate-300" size={40} />}
                title="No attendance records logged"
                description="Your past check-in and check-out records will be visible here once logged."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase font-medium text-slate-500 border-b border-slate-200/80">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Duty Type</th>
                      <th className="py-3 px-4">Check-In</th>
                      <th className="py-3 px-4">Check-Out</th>
                      <th className="py-3 px-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myAttendance.map((rec) => {
                      const cfg = STATUS_CONFIG[rec.status] || STATUS_CONFIG.present;
                      return (
                        <tr key={rec.id}>
                          <td className="py-3 px-4 font-medium text-slate-900">{rec.date}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text}`}
                            >
                              {cfg.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs font-medium text-slate-600">
                            {DUTY_LABELS[rec.dutyType] || rec.dutyType}
                          </td>
                          <td className="py-3 px-4 font-mono text-xs">{rec.checkInTime || "--:--"}</td>
                          <td className="py-3 px-4 font-mono text-xs">{rec.checkOutTime || "--:--"}</td>
                          <td className="py-3 px-4 text-xs text-slate-500">{rec.remarks || "—"}</td>
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

      {/* Quick Punch Modal */}
      {punchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Clock className="text-blue-600" size={20} />
              Staff Quick Punch
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Record your real-time check-in timestamp for today: {todayStr}
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Duty Type</label>
                <select
                  value={punchDuty}
                  onChange={(e) => setPunchDuty(e.target.value as StaffDutyType)}
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="regular">Regular Classes / Administrative</option>
                  <option value="exam_duty">Examination Duty / Invigilation</option>
                  <option value="training">Faculty Development / Workshop</option>
                  <option value="institutional_duty">Institutional / Committee Duty</option>
                  <option value="off_campus">Off-Campus Educational Visit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Notes / Location (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Science Lab 2, Hall B"
                  value={punchNotes}
                  onChange={(e) => setPunchNotes(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPunchModalOpen(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleQuickPunch}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
              >
                Confirm Punch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Regularization Modal */}
      {regularizeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSubmitRegularization}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100"
          >
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="text-blue-600" size={20} />
              Request Attendance Regularization
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Apply for missed punch correction or off-campus duty regularization.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={regDate}
                  onChange={(e) => setRegDate(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Check-In</label>
                  <input
                    type="time"
                    value={regInTime}
                    onChange={(e) => setRegInTime(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Check-Out</label>
                  <input
                    type="time"
                    value={regOutTime}
                    onChange={(e) => setRegOutTime(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Reason</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Specify duty context or reason for missed punch..."
                  value={regReason}
                  onChange={(e) => setRegReason(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRegularizeModalOpen(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
              >
                Submit Request
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Manual Entry Modal (Admin/HR) */}
      {manualEntryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <form
            onSubmit={handleManualEntry}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100"
          >
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Plus className="text-blue-600" size={20} />
              Mark Staff Attendance
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Record or override attendance for any staff member on {selectedDate}.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Select Employee</label>
                <select
                  required
                  value={manualEmpId}
                  onChange={(e) => setManualEmpId(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose Staff Member --</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName} ({e.jobTitle || "Staff"}) - {e.staffCategory || "General"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={manualStatus}
                    onChange={(e) => setManualStatus(e.target.value as StaffAttendanceStatus)}
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                  >
                    <option value="present">Present</option>
                    <option value="late">Late Arrival</option>
                    <option value="on_duty">On Duty</option>
                    <option value="half_day">Half Day</option>
                    <option value="absent">Absent</option>
                    <option value="leave">On Leave</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Duty Type</label>
                  <select
                    value={manualDuty}
                    onChange={(e) => setManualDuty(e.target.value as StaffDutyType)}
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                  >
                    <option value="regular">Regular Classes</option>
                    <option value="exam_duty">Exam Duty</option>
                    <option value="training">Training</option>
                    <option value="institutional_duty">Institutional Duty</option>
                    <option value="off_campus">Off-Campus</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Check-In Time</label>
                  <input
                    type="time"
                    value={manualCheckIn}
                    onChange={(e) => setManualCheckIn(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Check-Out Time</label>
                  <input
                    type="time"
                    value={manualCheckOut}
                    onChange={(e) => setManualCheckOut(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setManualEntryModalOpen(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
              >
                Save Attendance Record
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
