import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import type { Tenant, UserProfile, AcademicSession } from "@hrms/middleware";
import { db } from "../../../lib/firebase";
import { useAuth } from "../../auth/context/AuthContext";
import { useHasPermission } from "../../rbac/hooks/usePermissions";
import { EmployeeService } from "../../employees/services/employeeService";
import { CampusService } from "../../campuses/services/campusService";
import { AcademicCalendarService } from "../../calendar/services/academicCalendarService";
import { AttendanceService } from "../../attendance/services/attendanceService";
import { 
  Users, 
  Shield, 
  Building2, 
  MapPin, 
  Clock, 
  Briefcase, 
  X, 
  Mail, 
  Calendar, 
  Landmark, 
  Info,
  GraduationCap,
  BookOpen,
  UserCheck,
  DollarSign,
  Award,
  CheckCircle2
} from "lucide-react";
import { Skeleton } from "../../../components/ui/Skeleton";
import { formatDate } from "../../../lib/utils";

export function DashboardPage() {
  const { activeTenant, profile } = useAuth();
  const hasPermission = useHasPermission();
  const canViewUsers = hasPermission("users.view");
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [customRoles, setCustomRoles] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<UserProfile | null>(null);
  const [tenantNames, setTenantNames] = useState<Record<string, string>>({});
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [openJobsCount, setOpenJobsCount] = useState(0);

  // Educational institution metrics
  const [teachingStaffCount, setTeachingStaffCount] = useState(0);
  const [nonTeachingStaffCount, setNonTeachingStaffCount] = useState(0);
  const [campusCount, setCampusCount] = useState(0);
  const [currentSessionName, setCurrentSessionName] = useState<string>("Not Configured");
  const [todayAttendanceCount, setTodayAttendanceCount] = useState<number>(0);

  const [loading, setLoading] = useState(true);

  const getRoleLabel = (roleKey: string) => {
    const custom = customRoles.find((r: { id: string; name: string }) => r.id === roleKey);
    if (custom) return custom.name;
    return SYSTEM_ROLES_META[roleKey as keyof typeof SYSTEM_ROLES_META] || roleKey.replace("_", " ");
  };

  // Fetch tenant names when a member is selected
  const handleSelectMember = async (member: UserProfile) => {
    setSelectedMember(member);
    const tenantIds = Object.keys(member.tenants || {});
    // Only fetch tenant IDs we haven't cached yet
    const missingIds = tenantIds.filter((id) => !tenantNames[id]);
    if (missingIds.length > 0) {
      setLoadingTenants(true);
      try {
        const newNames: Record<string, string> = {};
        await Promise.all(
          missingIds.map(async (tid) => {
            const tenantSnap = await getDoc(doc(db, "tenants", tid));
            if (tenantSnap.exists()) {
              newNames[tid] = (tenantSnap.data() as Tenant).name;
            } else {
              newNames[tid] = tid; // fallback to ID
            }
          })
        );
        setTenantNames((prev) => ({ ...prev, ...newNames }));
      } catch (err) {
        console.error("Error fetching tenant names:", err);
      } finally {
        setLoadingTenants(false);
      }
    }
  };

  useEffect(() => {
    if (!profile?.activeTenantId) {
      setMembers([]);
      setCustomRoles([]);
      setLoading(false);
      return;
    }
    // Skip the members query entirely when the role can't view users.
    if (!canViewUsers) {
      setMembers([]);
      setCustomRoles([]);
      setLoading(false);
      // Still fetch open jobs count even without user view permission
      if (profile?.activeTenantId) {
        (async () => {
          try {
            const jq = query(
              collection(db, "jobs"),
              where("tenantId", "==", profile.activeTenantId),
              where("isPublished", "==", true),
              where("status", "==", "open")
            );
            const jSnap = await getDocs(jq);
            setOpenJobsCount(jSnap.size);
          } catch (err) {
            console.error("Error fetching open jobs count:", err);
          }
        })();
      }
      return;
    }

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const tenantId = profile?.activeTenantId;
        if (!tenantId) {
          setLoading(false);
          return;
        }
        const todayStr = new Date().toISOString().slice(0, 10);

        // Fetch users, roles, jobs, employees, campuses, and session in parallel
        const [uSnap, rSnap, jSnap, empList, campList, curSession, attMetrics] = await Promise.all([
          getDocs(query(
            collection(db, "users"),
            where(`tenants.${tenantId}.status`, "in", ["active", "invited", "disabled"])
          )),
          getDocs(query(collection(db, "roles"), where("tenantId", "==", tenantId))),
          getDocs(query(
            collection(db, "jobs"),
            where("tenantId", "==", tenantId),
            where("isPublished", "==", true),
            where("status", "==", "open")
          )),
          EmployeeService.getEmployees(tenantId).catch(() => []),
          CampusService.getCampuses(tenantId).catch(() => []),
          AcademicCalendarService.getCurrentSession(tenantId).catch(() => null),
          AttendanceService.getDailyMetrics(tenantId, todayStr).catch(() => ({ present: 0, totalMarked: 0 })),
        ]);

        const uList: UserProfile[] = [];
        uSnap.forEach((docSnap) => uList.push(docSnap.data() as UserProfile));
        setMembers(uList);

        const rList: any[] = [];
        rSnap.forEach((docSnap) => rList.push(docSnap.data()));
        setCustomRoles(rList);

        setOpenJobsCount(jSnap.size);

        // Compute staff categories
        let teaching = 0;
        let nonTeaching = 0;
        empList.forEach((e) => {
          if (e.teachingStatus === "teaching" || e.staffCategory === "teaching") teaching++;
          else nonTeaching++;
        });
        setTeachingStaffCount(teaching);
        setNonTeachingStaffCount(nonTeaching);

        setCampusCount(campList.length);
        if (curSession) setCurrentSessionName(curSession.name);
        setTodayAttendanceCount(attMetrics.present || 0);

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [profile?.activeTenantId, canViewUsers]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/4" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const activeRole = profile?.tenants[profile.activeTenantId || ""]?.role || "employee";

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Hello, {profile?.displayName || "User"}!
        </h1>
        <p className="text-sm text-slate-500">
          Educational Institution HR & Operations overview for <strong className="text-slate-700">{activeTenant?.name}</strong>.
        </p>
      </div>

      {/* Institutional KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
            <GraduationCap size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{teachingStaffCount + nonTeachingStaffCount}</div>
            <div className="text-xs font-semibold text-slate-500">Total Staff ({teachingStaffCount} Faculty)</div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 shrink-0">
            <Building2 size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{campusCount}</div>
            <div className="text-xs font-semibold text-slate-500">Campuses / Branches</div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{todayAttendanceCount}</div>
            <div className="text-xs font-semibold text-slate-500">Present Today</div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shrink-0">
            <Calendar size={24} />
          </div>
          <div className="truncate">
            <div className="text-base font-bold text-slate-900 truncate">{currentSessionName}</div>
            <div className="text-xs font-semibold text-slate-500">Active Academic Session</div>
          </div>
        </div>
      </div>

      {/* Quick Launchpad for Educational Operations */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
          Institutional Operations & Quick Launchpad
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <Link
            to="/campuses"
            className="p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-colors flex flex-col items-center text-center gap-2"
          >
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Building2 size={18} /></div>
            <span className="text-xs font-semibold text-slate-700">Campuses</span>
          </Link>
          <Link
            to="/attendance"
            className="p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-colors flex flex-col items-center text-center gap-2"
          >
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><Clock size={18} /></div>
            <span className="text-xs font-semibold text-slate-700">Attendance</span>
          </Link>
          <Link
            to="/calendar"
            className="p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-colors flex flex-col items-center text-center gap-2"
          >
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Calendar size={18} /></div>
            <span className="text-xs font-semibold text-slate-700">Calendar & Terms</span>
          </Link>
          <Link
            to="/workload"
            className="p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-colors flex flex-col items-center text-center gap-2"
          >
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><BookOpen size={18} /></div>
            <span className="text-xs font-semibold text-slate-700">Faculty Workload</span>
          </Link>
          <Link
            to="/substitutes"
            className="p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-colors flex flex-col items-center text-center gap-2"
          >
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><UserCheck size={18} /></div>
            <span className="text-xs font-semibold text-slate-700">Substitutes</span>
          </Link>
          <Link
            to="/payroll"
            className="p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-colors flex flex-col items-center text-center gap-2"
          >
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg"><DollarSign size={18} /></div>
            <span className="text-xs font-semibold text-slate-700">Payroll Runs</span>
          </Link>
        </div>
      </div>

      {/* Main dashboard content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Organization Details */}
        <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${canViewUsers ? "lg:col-span-1" : "lg:col-span-3"}`}>
          <h2 className="text-base font-bold text-slate-900">Organization Profile</h2>
          <div className="mt-5 space-y-4">
            <div className="flex items-start gap-3 text-sm">
              <Building2 size={18} className="mt-0.5 text-slate-400 shrink-0" />
              <div>
                <div className="font-semibold text-slate-700">Industry</div>
                <div className="text-slate-500">{activeTenant?.industry}</div>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm">
              <Clock size={18} className="mt-0.5 text-slate-400 shrink-0" />
              <div>
                <div className="font-semibold text-slate-700">Timezone</div>
                <div className="text-slate-500">{activeTenant?.timezone}</div>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm">
              <MapPin size={18} className="mt-0.5 text-slate-400 shrink-0" />
              <div>
                <div className="font-semibold text-slate-700">Address</div>
                <div className="text-slate-500">{activeTenant?.address}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Members */}
        {canViewUsers && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <div className="flex items-baseline justify-between">
              <h2 className="text-base font-bold text-slate-900">Team Members List</h2>
              <span className="text-xs text-slate-400 font-medium">{members.length} total</span>
            </div>
            <div className="mt-4 divide-y divide-slate-100 max-h-[380px] overflow-y-auto pr-1">
              {members.map((member) => (
                <button
                  key={member.id}
                  onClick={() => handleSelectMember(member)}
                  className="flex w-full items-center justify-between py-3 hover:bg-slate-50 transition-colors duration-200 cursor-pointer px-3 -mx-3 rounded-xl text-left border-none focus:outline-none focus:ring-2 focus:ring-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600 text-sm">
                      {member.displayName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{member.displayName}</div>
                      <div className="text-xs text-slate-500">{member.email}</div>
                    </div>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 capitalize">
                    {profile?.activeTenantId
                      ? getRoleLabel(member.tenants?.[profile.activeTenantId]?.role || "member")
                      : "member"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Slide-over Drawer for Member Details */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="absolute inset-0 cursor-default"
            onClick={() => setSelectedMember(null)}
          />

          {/* Drawer Panel */}
          <div className="relative flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <h3 className="text-lg font-bold text-slate-900">Member Details</h3>
              <button
                onClick={() => setSelectedMember(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer border-none outline-none"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Avatar, Name and Status */}
              <div className="text-center pb-6 border-b border-slate-100">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-3xl font-bold">
                  {selectedMember.displayName.substring(0, 2).toUpperCase()}
                </div>
                <h2 className="mt-4 text-xl font-bold text-slate-900">
                  {selectedMember.displayName}
                </h2>
                <p className="text-sm text-slate-500">{selectedMember.email}</p>

                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {profile?.activeTenantId && (
                    <>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          selectedMember.tenants?.[profile.activeTenantId]?.status === "active"
                            ? "bg-green-50 text-green-700 border border-green-100"
                            : selectedMember.tenants?.[profile.activeTenantId]?.status === "invited"
                            ? "bg-blue-50 text-blue-700 border border-blue-100"
                            : "bg-red-50 text-red-700 border border-red-100"
                        }`}
                      >
                        {selectedMember.tenants?.[profile.activeTenantId]?.status || "unknown"}
                      </span>

                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        <Shield size={12} />
                        {getRoleLabel(selectedMember.tenants?.[profile.activeTenantId]?.role || "employee")}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Detailed Information */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Info size={14} />
                  <span>Information</span>
                </h4>

                <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Mail size={16} className="mt-0.5 text-slate-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-500">Email Address</div>
                      <div className="text-slate-900 font-medium mt-0.5">{selectedMember.email}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar size={16} className="mt-0.5 text-slate-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-500">Profile Created</div>
                      <div className="text-slate-900 font-medium mt-0.5">
                        {formatDate(selectedMember.createdAt, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Landmark size={16} className="mt-0.5 text-slate-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-500">Active Tenant</div>
                      <div className="text-slate-900 font-medium mt-0.5">
                        {selectedMember.activeTenantId
                          ? tenantNames[selectedMember.activeTenantId] || selectedMember.activeTenantId
                          : "None"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Building2 size={16} className="mt-0.5 text-slate-400 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-500">Associated Tenants</div>
                      <div className="mt-1 space-y-1">
                        {loadingTenants ? (
                          <div className="text-xs text-slate-400 italic">Loading...</div>
                        ) : (
                          Object.keys(selectedMember.tenants || {}).map((tid) => (
                            <div key={tid} className="flex items-center gap-2">
                              <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                              <span className="text-slate-900 font-medium text-sm">
                                {tenantNames[tid] || tid}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const SYSTEM_ROLES_META = {
  super_admin: "Platform Super Admin",
  org_admin: "Institution Admin",
  principal: "Principal / Director",
  campus_admin: "Campus Administrator",
  hr_manager: "HR Manager",
  hod: "Head of Department (HOD)",
  teacher: "Teaching Faculty / Professor",
  non_teaching: "Non-Teaching Staff",
  payroll_officer: "Payroll Officer",
  recruiter: "Recruiter",
  employee: "Employee",
};
