/**
 * UserDetailsPage
 * -----------------------------------------------------------------------------
 * Read-only profile view for a single user, resolved from the `:id` route
 * param. Fetches the user document from Firestore and displays identity,
 * status, role (scoped to the active tenant), and account metadata. Renders
 * loading skeletons and an error/retry state as appropriate.
 */
import { getFriendlyErrorMessage } from "../../../lib/errors";
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../../lib/firebase";
import { useAuth } from "../../auth/context/AuthContext";
import { Skeleton } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/ErrorState";
import { ChevronLeft, Mail, Calendar, Shield, Info, Landmark, Building2 } from "lucide-react";
import type { UserProfile, Tenant } from "@hrms/middleware";
import { formatDate } from "../../../lib/utils";

/**
 * Renders the detail view for the user identified by the `id` route param,
 * loading the profile from Firestore on mount and showing the tenant-scoped
 * role/status alongside core account information.
 */
export function UserDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [tenantNames, setTenantNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchUser = async () => {
      setLoading(true);
      setError(null);
      try {
        const snap = await getDoc(doc(db, "users", id));
        if (snap.exists()) {
          const userData = snap.data() as UserProfile;
          setUser(userData);

          // Fetch tenant names for all associated tenants
          const tenantIds = Object.keys(userData.tenants || {});
          const names: Record<string, string> = {};
          await Promise.all(
            tenantIds.map(async (tid) => {
              try {
                const tenantSnap = await getDoc(doc(db, "tenants", tid));
                if (tenantSnap.exists()) {
                  names[tid] = (tenantSnap.data() as Tenant).name;
                } else {
                  names[tid] = tid;
                }
              } catch {
                names[tid] = tid;
              }
            })
          );
          setTenantNames(names);
        } else {
          setError("User not found.");
        }
      } catch (err: any) {
        console.error(err);
        setError(getFriendlyErrorMessage(err, "Failed to load user profile."));
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  if (error || !user) {
    return <ErrorState description={error || "User details could not be loaded."} onRetry={() => navigate("/users")} />;
  }

  const tenantId = profile?.activeTenantId || "";
  const memberTenant = user.tenants?.[tenantId];

  return (
    <div className="space-y-6">
      {/* Back button and page title */}
      <div>
        <button
          onClick={() => navigate("/users")}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
        >
          <ChevronLeft size={16} />
          <span>Back to Users</span>
        </button>
        <h1 className="mt-3 text-xl font-bold text-slate-900">User Profile Details</h1>
      </div>

      {/* Main details card */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Left Card: Avatar and quick details */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center md:col-span-1">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-3xl font-bold">
            {user.displayName.substring(0, 2).toUpperCase()}
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-900">{user.displayName}</h2>
          <p className="text-sm text-slate-500">{user.email}</p>

          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                memberTenant?.status === "active"
                  ? "bg-green-50 text-green-700"
                  : memberTenant?.status === "invited"
                  ? "bg-blue-50 text-blue-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {memberTenant?.status || "unknown"}
            </span>

            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              <Shield size={12} />
              {memberTenant?.role.replace("_", " ") || "employee"}
            </span>
          </div>
        </div>

        {/* Right Card: Full properties list */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2 space-y-6">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Info size={18} className="text-slate-400" />
            <span>Information</span>
          </h3>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 text-sm">
            <div className="flex items-start gap-2.5">
              <Mail size={16} className="text-slate-400 mt-0.5" />
              <div>
                <div className="font-semibold text-slate-500">Email Address</div>
                <div className="text-slate-900 mt-0.5">{user.email}</div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Calendar size={16} className="text-slate-400 mt-0.5" />
              <div>
                <div className="font-semibold text-slate-500">Profile Created</div>
                <div className="text-slate-900 mt-0.5">
                  {formatDate(user.createdAt)}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Landmark size={16} className="text-slate-400 mt-0.5" />
              <div>
                <div className="font-semibold text-slate-500">Active Tenant</div>
                <div className="text-slate-900 mt-0.5">
                  {user.activeTenantId
                    ? tenantNames[user.activeTenantId] || user.activeTenantId
                    : "None"}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Building2 size={16} className="text-slate-400 mt-0.5" />
              <div>
                <div className="font-semibold text-slate-500">Associated Tenants</div>
                <div className="mt-1 space-y-1">
                  {Object.keys(user.tenants).map((tid) => (
                    <div key={tid} className="flex items-center gap-2">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                      <span className="text-slate-900 text-sm">
                        {tenantNames[tid] || tid}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
