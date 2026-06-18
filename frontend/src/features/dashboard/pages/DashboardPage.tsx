import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useAuth } from "../../auth/context/AuthContext";
import { useHasPermission } from "../../rbac/hooks/usePermissions";
import { Users, Shield, Building2, MapPin, Clock, Briefcase } from "lucide-react";
import { Skeleton } from "../../../components/ui/Skeleton";
import type { UserProfile } from "@hrms/middleware";

export function DashboardPage() {
  const { activeTenant, profile } = useAuth();
  const hasPermission = useHasPermission();
  // The member directory widgets surface data from the `users` collection, so
  // they're only shown to roles granted `users.view` in the permission matrix.
  const canViewUsers = hasPermission("users.view");
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.activeTenantId) {
      setMembers([]);
      setLoading(false);
      return;
    }
    // Skip the members query entirely when the role can't view users.
    if (!canViewUsers) {
      setMembers([]);
      setLoading(false);
      return;
    }

    const fetchMembers = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "users"),
          where(`tenants.${profile.activeTenantId}.status`, "in", ["active", "invited", "disabled"])
        );
        const snap = await getDocs(q);
        const list: UserProfile[] = [];
        snap.forEach((docSnap) => {
          list.push(docSnap.data() as UserProfile);
        });
        setMembers(list);
      } catch (err) {
        console.error("Error fetching tenant members:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [profile?.activeTenantId, canViewUsers]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/4" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
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
          Here's what is happening at <strong className="text-slate-700">{activeTenant?.name}</strong> today.
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {canViewUsers && (
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Users size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{members.length}</div>
              <div className="text-xs font-semibold text-slate-500">Team Members</div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600">
            <Shield size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {Object.keys(SYSTEM_ROLES_META).length}
            </div>
            <div className="text-xs font-semibold text-slate-500">Standard Roles</div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Briefcase size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">0</div>
            <div className="text-xs font-semibold text-slate-500">Open Jobs (Phase 2)</div>
          </div>
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
            <h2 className="text-base font-bold text-slate-900">Team Members List</h2>
            <div className="mt-4 divide-y divide-slate-100">
              {members.slice(0, 5).map((member) => (
                <div key={member.id} className="flex items-center justify-between py-3">
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
                      ? member.tenants?.[profile.activeTenantId]?.role?.replace("_", " ") || "member"
                      : "member"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const SYSTEM_ROLES_META = {
  super_admin: "Super Admin",
  org_admin: "Org Admin",
  hr_manager: "HR Manager",
  recruiter: "Recruiter",
  employee: "Employee",
};
