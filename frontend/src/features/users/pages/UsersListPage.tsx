import { getFriendlyErrorMessage } from "../../../lib/errors";
import { useState, useEffect, useCallback } from "react";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions, auth } from "../../../lib/firebase";
import { useAuth } from "../../auth/context/AuthContext";
import { useHasPermission } from "../../rbac/hooks/usePermissions";
import { Skeleton } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/ErrorState";
import { EmptyState } from "../../../components/ui/EmptyState";
import { UserPlus, Search, Shield, ToggleLeft, ToggleRight, Mail, UserCheck, X, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { UserProfile } from "@hrms/middleware";
import { assignRoleToUser } from "../../rbac/utils/roleAssign";

export function UsersListPage() {
  const { profile, activeTenant } = useAuth();
  const navigate = useNavigate();
  const hasPermission = useHasPermission();

  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search, Filter, Sort, Pagination states
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name-asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Invite modal states
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("employee");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Edit modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const tenantId = profile?.activeTenantId || "";

  const [customRoles, setCustomRoles] = useState<any[]>([]);

  const fetchMembers = useCallback(async () => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch members
      // Keep disabled in the dataset so the "Disabled" filter can work.
      // We'll exclude it from display when the UI is in the default "All" state.
      const q = query(
        collection(db, "users"),
        where(`tenants.${tenantId}.status`, "in", ["active", "invited", "disabled"])
      );
      const snap = await getDocs(q);
      const list: UserProfile[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as UserProfile);
      });
      setMembers(list);

      // 2. Fetch custom roles for this tenant
      const rq = query(
        collection(db, "roles"),
        where("tenantId", "==", tenantId)
      );
      const rSnap = await getDocs(rq);
      const rList: any[] = [];
      rSnap.forEach((docSnap) => {
        rList.push(docSnap.data());
      });
      setCustomRoles(rList);
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyErrorMessage(err, "Failed to load organization members."));
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchMembers();
  }, [tenantId, fetchMembers]);

  // Handle Enable/Disable Status
  const toggleUserStatus = async (user: UserProfile) => {
    const currentStatus = user.tenants?.[tenantId]?.status;
    const nextStatus = currentStatus === "active" ? "disabled" : "active";

    try {
      if (import.meta.env.VITE_USE_EMULATOR === "true") {
        try {
          const token = await auth.currentUser?.getIdToken();
          if (!token) throw new Error("No auth token available.");

          const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-mock-project";
          const response = await fetch(
            `http://127.0.0.1:5001/${projectId}/us-central1/toggleUserTenantStatusHttp`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
              },
              body: JSON.stringify({
                tenantId,
                userId: user.id,
                nextStatus,
              }),
            }
          );

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `HTTP error ${response.status}`);
          }

          // Refresh list and exit
          fetchMembers();
          return;
        } catch (httpErr) {
          console.warn("HTTP status toggle failed, falling back to callable function", httpErr);
        }
      }

      const toggleFn = httpsCallable<{ tenantId: string; userId: string; nextStatus: string }, { success: boolean; status: string }>(
        functions,
        "toggleUserTenantStatus"
      );
      await toggleFn({
        tenantId,
        userId: user.id,
        nextStatus,
      });

      // Refresh list
      fetchMembers();
    } catch (err: any) {
      console.error(err);
      alert(getFriendlyErrorMessage(err, "Failed to update user status."));
    }
  };

  // Handle Role Change
  const handleRoleChange = async (userId: string, member: UserProfile, newRole: string) => {
    const oldRole = member.tenants?.[tenantId]?.role;
    try {
      await assignRoleToUser(
        tenantId,
        profile?.id || "",
        profile?.displayName || "Admin",
        userId,
        member.displayName,
        newRole,
        oldRole
      );
      // Refresh list
      fetchMembers();
    } catch (err: any) {
      console.error(err);
      alert(getFriendlyErrorMessage(err, "Failed to change user role."));
    }
  };

  // Handle Invite Submit
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setInviteLoading(true);
    setInviteError(null);
    setInviteSuccess(false);

    try {
      const inviteUserFn = httpsCallable<{ email: string; tenantId: string; role: string; displayName?: string }, { success: boolean; inviteId: string }>(
        functions,
        "inviteUser"
      );
      await inviteUserFn({ email: inviteEmail, tenantId, role: inviteRole, displayName: inviteName });
      setInviteSuccess(true);
      setInviteEmail("");
      setInviteName("");
      fetchMembers();
    } catch (err: any) {
      console.error(err);
      setInviteError(getFriendlyErrorMessage(err, "Failed to send invitation. Make sure Firebase Functions are running."));
    } finally {
      setInviteLoading(false);
    }
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editName.trim() || !editEmail.trim()) return;

    setEditLoading(true);
    setEditError(null);
    try {
      if (import.meta.env.VITE_USE_EMULATOR === "true") {
        try {
          const token = await auth.currentUser?.getIdToken();
          if (!token) throw new Error("No auth token available.");

          const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-mock-project";
          const response = await fetch(
            `http://127.0.0.1:5001/${projectId}/us-central1/updateUserProfileHttp`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
              },
              body: JSON.stringify({
                tenantId,
                userId: editingUser.id,
                displayName: editName.trim(),
                email: editEmail.trim().toLowerCase(),
              }),
            }
          );

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `HTTP error ${response.status}`);
          }

          setEditModalOpen(false);
          setEditingUser(null);
          fetchMembers();
          return;
        } catch (httpErr) {
          console.warn("HTTP profile update failed, falling back to callable function", httpErr);
        }
      }

      const updateProfileFn = httpsCallable<{ tenantId: string; userId: string; displayName: string; email: string }, { success: boolean }>(
        functions,
        "updateUserProfile"
      );
      await updateProfileFn({
        tenantId,
        userId: editingUser.id,
        displayName: editName.trim(),
        email: editEmail.trim().toLowerCase(),
      });

      setEditModalOpen(false);
      setEditingUser(null);
      fetchMembers();
    } catch (err: any) {
      console.error(err);
      setEditError(getFriendlyErrorMessage(err, "Failed to update user details."));
    } finally {
      setEditLoading(false);
    }
  };

  // Filter and Sort Logic
  const filteredMembers = members.filter((member) => {
    const memberTenant = member.tenants?.[tenantId];
    if (!memberTenant) return false;

    // Search query match
    const matchesSearch =
      member.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());

    // Role filter match
    const matchesRole = roleFilter === "all" || memberTenant.role === roleFilter;

    // Status filter match
    const matchesStatus = statusFilter === "all" || memberTenant.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const sortedMembers = [...filteredMembers].sort((a, b) => {
    const aTenant = a.tenants?.[tenantId];
    const bTenant = b.tenants?.[tenantId];
    if (!aTenant || !bTenant) return 0;

    if (sortBy === "name-asc") {
      return a.displayName.localeCompare(b.displayName);
    } else if (sortBy === "name-desc") {
      return b.displayName.localeCompare(a.displayName);
    } else if (sortBy === "email-asc") {
      return a.email.localeCompare(b.email);
    } else if (sortBy === "role-asc") {
      return aTenant.role.localeCompare(bTenant.role);
    }
    return 0;
  });

  // Pagination Logic
  const totalPages = Math.ceil(sortedMembers.length / itemsPerPage);
  const paginatedMembers = sortedMembers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );



  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return <ErrorState description={error} onRetry={fetchMembers} />;
  }

  return (
    <div className="space-y-6">
      {/* Top Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Users & Team Members</h1>
          <p className="text-sm text-slate-500">Manage access and organization roles.</p>
        </div>
        {hasPermission("users.create") && (
          <button
            onClick={() => {
              setInviteModalOpen(true);
              setInviteName("");
              setInviteEmail("");
              setInviteSuccess(false);
              setInviteError(null);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <UserPlus size={16} />
            <span>Invite Member</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by name or email..."
            className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-600/60 focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-semibold text-slate-700"
        >
          <option value="all">All Roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="org_admin">Org Admin</option>
          <option value="hr_manager">HR Manager</option>
          <option value="recruiter">Recruiter</option>
          <option value="employee">Employee</option>
          {customRoles.map((role) => (
            <option key={role.id} value={role.id}>{role.name}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-semibold text-slate-700"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="invited">Invited</option>
          <option value="disabled">Disabled</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-semibold text-slate-700"
        >
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
          <option value="email-asc">Email (A-Z)</option>
          <option value="role-asc">Role</option>
        </select>
      </div>

      {/* Member Table */}
      {paginatedMembers.length === 0 ? (
        <EmptyState
          title="No users match your filters"
          description="Try modifying your search query or reset filters to see your organization members."
          actionLabel="Clear Search"
          onAction={() => {
            setSearchQuery("");
            setRoleFilter("all");
            setStatusFilter("all");
          }}
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Email</th>
                  <th className="py-4 px-6">Role</th>
                  <th className="py-4 px-6">Status</th>
                  {hasPermission("users.update") && <th className="py-4 px-6 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedMembers.map((member) => {
                  const memberTenant = member.tenants?.[tenantId];
                  if (!memberTenant) return null;

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <button
                          onClick={() => navigate(`/users/${member.id}`)}
                          className="flex items-center gap-3 text-left font-semibold text-slate-900 hover:text-blue-600 cursor-pointer"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 text-sm font-bold">
                            {member.displayName.substring(0, 2).toUpperCase()}
                          </div>
                          <span>{member.displayName}</span>
                        </button>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-500">{member.email}</td>
                      <td className="py-4 px-6">
                        {hasPermission("users.update") && member.id !== profile?.id ? (
                          <select
                            value={memberTenant.role}
                            onChange={(e) => handleRoleChange(member.id, member, e.target.value)}
                            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold outline-none focus:border-blue-600"
                          >
                            <option value="super_admin">Super Admin</option>
                            <option value="org_admin">Org Admin</option>
                            <option value="hr_manager">HR Manager</option>
                            <option value="recruiter">Recruiter</option>
                            <option value="employee">Employee</option>
                            {customRoles.map((role) => (
                              <option key={role.id} value={role.id}>{role.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                            <Shield size={14} className="text-slate-400" />
                            {customRoles.find((r) => r.id === memberTenant.role)?.name || memberTenant.role.replace("_", " ")}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            memberTenant.status === "active"
                              ? "bg-green-50 text-green-700"
                              : memberTenant.status === "invited"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {memberTenant.status}
                        </span>
                      </td>
                      {hasPermission("users.update") && (
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          {member.id !== profile?.id && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingUser(member);
                                  setEditName(member.displayName);
                                  setEditEmail(member.email);
                                  setEditError(null);
                                  setEditModalOpen(true);
                                }}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-900 cursor-pointer transition-colors"
                                title="Edit User"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleUserStatus(member)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-900 cursor-pointer transition-colors"
                                title={memberTenant.status === "active" ? "Disable User" : "Activate User"}
                              >
                                {memberTenant.status === "active" ? (
                                  <ToggleRight size={20} className="text-blue-600" />
                                ) : (
                                  <ToggleLeft size={20} className="text-slate-400" />
                                )}
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
              <span className="text-sm text-slate-500">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((c) => Math.max(c - 1, 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage((c) => Math.min(c + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invite Member Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-md relative">
            <button
              onClick={() => setInviteModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Mail size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Invite new member</h3>
                <p className="text-xs text-slate-500">They will receive an email to activate their account.</p>
              </div>
            </div>

            {inviteError && (
              <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-100">
                {inviteError}
              </div>
            )}

            {inviteSuccess ? (
              <div className="mt-4 space-y-4 text-center">
                <div className="rounded-xl bg-green-50 p-3 text-xs font-medium text-green-700 border border-green-100 flex items-center justify-center gap-2">
                  <UserCheck size={16} />
                  <span>Invitation successfully sent!</span>
                </div>
                <button
                  onClick={() => setInviteModalOpen(false)}
                  className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleInviteSubmit} className="mt-4 space-y-4">
                <div>
                  <label htmlFor="invite-name" className="text-sm font-semibold text-slate-700">
                    Full Name
                  </label>
                  <input
                    id="invite-name"
                    type="text"
                    required
                    placeholder="John Doe"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="invite-email" className="text-sm font-semibold text-slate-700">
                    Email Address
                  </label>
                  <input
                    id="invite-email"
                    type="email"
                    required
                    placeholder="teammate@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="invite-role" className="text-sm font-semibold text-slate-700">
                    Organization Role
                  </label>
                  <select
                    id="invite-role"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-semibold text-slate-700"
                  >
                    <option value="org_admin">Org Admin</option>
                    <option value="hr_manager">HR Manager</option>
                    <option value="recruiter">Recruiter</option>
                    <option value="employee">Employee</option>
                    {customRoles.map((role) => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="mt-6 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {inviteLoading ? "Sending Invite..." : "Send Invite"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editModalOpen && editingUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-md relative">
            <button
              onClick={() => {
                setEditModalOpen(false);
                setEditingUser(null);
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Edit size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Edit User Details</h3>
                <p className="text-xs text-slate-500">Update the profile details for this user.</p>
              </div>
            </div>

            {editError && (
              <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-100">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="edit-name" className="text-sm font-semibold text-slate-700">
                  Full Name
                </label>
                <input
                  id="edit-name"
                  type="text"
                  required
                  placeholder="John Doe"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>

              <div>
                <label htmlFor="edit-email" className="text-sm font-semibold text-slate-700">
                  Email Address
                </label>
                <input
                  id="edit-email"
                  type="email"
                  required
                  placeholder="teammate@company.com"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setEditModalOpen(false);
                    setEditingUser(null);
                  }}
                  className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {editLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
