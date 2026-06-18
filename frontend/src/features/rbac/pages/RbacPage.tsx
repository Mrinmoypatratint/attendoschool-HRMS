import { getFriendlyErrorMessage } from "../../../lib/errors";
import { useState, useEffect, useMemo } from "react";
import { collection, doc, setDoc, getDocs, deleteDoc, query, where, updateDoc, orderBy } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useAuth } from "../../auth/context/AuthContext";
import { Skeleton } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/ErrorState";
import { 
  Shield, 
  Plus, 
  Check, 
  Trash2, 
  X, 
  Lock, 
  Users, 
  FileText, 
  Search, 
  Copy, 
  AlertCircle, 
  Activity, 
  Save, 
  RefreshCw,
  RotateCcw 
} from "lucide-react";
import { 
  SYSTEM_ROLES, 
  EDITABLE_SYSTEM_ROLES,
  getSystemRoleOverrideId,
  type PermissionKey, 
  type Role, 
  type DataAccessLevel, 
  type SystemRoleType, 
  type SystemRoleOverride,
  type UserProfile 
} from "@hrms/middleware";
import { logAuditTrail, type AuditLog } from "../utils/audit";
import { assignRoleToUser } from "../utils/roleAssign";

// Grid configuration for the permission matrix
const RESOURCES = [
  { key: "users", label: "Users", desc: "System directory and tenant profiles" },
  { key: "roles", label: "Roles", desc: "Access tiers and matrix configurations" },
  { key: "departments", label: "Departments", desc: "Corporate divisions and branches" },
  { key: "jobs", label: "Jobs", desc: "ATS postings and recruitment pipeline" },
  { key: "candidates", label: "Candidates", desc: "ATS applicants and resumes" },
  { key: "employees", label: "Employees", desc: "Core employee profiles and files" },
  { key: "leave", label: "Leave Requests", desc: "Time-off policies and requests" },
  { key: "documents", label: "Documents", desc: "Shared and private contract assets" },
];

const ACTIONS = [
  { key: "view", label: "View" },
  { key: "create", label: "Create" },
  { key: "update", label: "Edit" },
  { key: "delete", label: "Delete" },
  { key: "approve", label: "Approve" },
  { key: "export", label: "Export" },
];

// Checks if a permission combination is supported in the schema
function isPermissionValid(resource: string, action: string): boolean {
  if (resource === "candidates" && action === "export") return true;
  if (resource === "leave" && action === "approve") return true;
  return ["view", "create", "update", "delete"].includes(action);
}

export function RbacPage() {
  const { profile } = useAuth();
  const tenantId = profile?.activeTenantId || "";

  // Navigation Tab State
  const [activeTab, setActiveTab] = useState<"roles" | "users" | "audit">("roles");

  // Roles states
  const [selectedRole, setSelectedRole] = useState<string>("employee");
  const [customRoles, setCustomRoles] = useState<Role[]>([]);
  // Tenant-scoped overrides of system-role permission matrices, keyed by SystemRoleType
  const [systemOverrides, setSystemOverrides] = useState<Partial<Record<SystemRoleType, SystemRoleOverride>>>({});
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [rolesError, setRolesError] = useState<string | null>(null);

  // Search states
  const [roleSearchQuery, setRoleSearchQuery] = useState("");

  // Role Draft Editing States
  const [draftName, setDraftName] = useState("");
  const [draftDesc, setDraftDesc] = useState("");
  const [draftAccessLevel, setDraftAccessLevel] = useState<DataAccessLevel>("self");
  const [draftIsActive, setDraftIsActive] = useState(true);
  const [draftPermissions, setDraftPermissions] = useState<PermissionKey[]>([]);
  const [isSavingRole, setIsSavingRole] = useState(false);

  // User assignments states
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  // Audit Log states
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditFilterAction, setAuditFilterAction] = useState("all");

  // Create Role Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [newRoleAccess, setNewRoleAccess] = useState<DataAccessLevel>("self");
  const [newRolePerms, setNewRolePerms] = useState<PermissionKey[]>(["users.view"]);
  const [isCreatingRole, setIsCreatingRole] = useState(false);

  // Fetch Roles
  const fetchRoles = async () => {
    if (!tenantId) return;
    setLoadingRoles(true);
    setRolesError(null);
    try {
      const q = query(
        collection(db, "roles"),
        where("tenantId", "==", tenantId)
      );
      const snap = await getDocs(q);
      const list: Role[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as Role);
      });
      setCustomRoles(list);
    } catch (err: any) {
      console.error(err);
      setRolesError(getFriendlyErrorMessage(err, "Failed to load custom roles."));
    } finally {
      setLoadingRoles(false);
    }
  };

  // Fetch tenant-scoped system-role permission overrides
  const fetchSystemOverrides = async () => {
    if (!tenantId) return;
    try {
      const q = query(
        collection(db, "roleOverrides"),
        where("tenantId", "==", tenantId)
      );
      const snap = await getDocs(q);
      const map: Partial<Record<SystemRoleType, SystemRoleOverride>> = {};
      snap.forEach((docSnap) => {
        const data = docSnap.data() as SystemRoleOverride;
        if (data.systemRoleType) {
          map[data.systemRoleType] = data;
        }
      });
      setSystemOverrides(map);
    } catch (err) {
      console.error("Failed to fetch system role overrides:", err);
    }
  };

  // Fetch Tenant Members
  const fetchMembers = async () => {
    if (!tenantId) return;
    setLoadingMembers(true);
    try {
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
    } catch (err) {
      console.error("Failed to fetch tenant members:", err);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Fetch Audit Logs
  const fetchAuditLogs = async () => {
    if (!tenantId) return;
    setLoadingAudit(true);
    try {
      const q = query(
        collection(db, "auditLogs"),
        where("tenantId", "==", tenantId),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      const list: AuditLog[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as AuditLog);
      });
      setAuditLogs(list);
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setLoadingAudit(false);
    }
  };

  // Initial Fetch & Tab Sync
  useEffect(() => {
    fetchRoles();
    fetchSystemOverrides();
  }, [tenantId]);

  useEffect(() => {
    if (activeTab === "users") {
      fetchMembers();
      fetchRoles();
    } else if (activeTab === "audit") {
      fetchAuditLogs();
    }
  }, [activeTab, tenantId]);

  // Authorization: only org/super admins may mutate roles & matrices.
  const isAuthorizedToManage =
    profile?.tenants[tenantId]?.role === "org_admin" ||
    profile?.tenants[tenantId]?.role === "super_admin";

  // Handle Selected Role change to initialize Draft Edit state
  const isSelectedRoleSystem = !selectedRole.startsWith("role_");

  // Is the selected role a system role whose matrix tenant admins may customize?
  const isEditableSystemRole =
    isSelectedRoleSystem &&
    EDITABLE_SYSTEM_ROLES.includes(selectedRole as SystemRoleType);

  // Whether the permission matrix is read-only for the current selection.
  const matrixLocked = isSelectedRoleSystem && !(isEditableSystemRole && isAuthorizedToManage);

  // Does a saved tenant override currently exist for the selected system role?
  const activeSystemOverride = isSelectedRoleSystem
    ? systemOverrides[selectedRole as SystemRoleType]
    : undefined;

  // Effective role data driving the UI. For system roles we start from the
  // hardcoded defaults but apply any saved permission override for this tenant.
  const activeRoleData = useMemo(() => {
    if (isSelectedRoleSystem) {
      const base = SYSTEM_ROLES[selectedRole as keyof typeof SYSTEM_ROLES];
      if (!base) return undefined;
      return activeSystemOverride
        ? { ...base, permissions: activeSystemOverride.permissions }
        : base;
    }
    return customRoles.find((r) => r.id === selectedRole);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRole, isSelectedRoleSystem, activeSystemOverride, customRoles]);

  useEffect(() => {
    if (activeRoleData) {
      setDraftName(activeRoleData.name);
      setDraftDesc((activeRoleData as any).description || "");
      setDraftAccessLevel(activeRoleData.dataAccessLevel);
      setDraftIsActive((activeRoleData as any).isActive !== false);
      setDraftPermissions(activeRoleData.permissions || []);
    }
  }, [selectedRole, activeRoleData]);

  // Check if draft has modifications compared to active saved role
  const isDraftModified = () => {
    if (!activeRoleData) return false;

    const originalPerms = activeRoleData.permissions || [];
    const permDiff =
      draftPermissions.length !== originalPerms.length ||
      !draftPermissions.every((p) => originalPerms.includes(p));

    // For system roles, only the permission matrix is editable.
    if (isSelectedRoleSystem) {
      return isEditableSystemRole && permDiff;
    }

    const original = activeRoleData as Role;
    const nameDiff = draftName !== original.name;
    const descDiff = draftDesc !== original.description;
    const accessDiff = draftAccessLevel !== original.dataAccessLevel;
    const activeDiff = draftIsActive !== (original.isActive !== false);

    return nameDiff || descDiff || accessDiff || activeDiff || permDiff;
  };

  // Toggle Matrix Permission in Draft
  const handleTogglePermission = (resource: string, action: string) => {
    if (matrixLocked) return; // Locked system roles are read-only
    const key = `${resource}.${action}` as PermissionKey;
    setDraftPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  // Save Custom Role modifications
  const handleSaveChanges = async () => {
    if (!tenantId || !activeRoleData) return;

    // System role: persist a tenant-scoped permission override.
    if (isSelectedRoleSystem) {
      if (!isEditableSystemRole || !isAuthorizedToManage) return;
      setIsSavingRole(true);

      const systemRoleType = selectedRole as SystemRoleType;
      const overrideId = getSystemRoleOverrideId(tenantId, systemRoleType);
      const override: SystemRoleOverride = {
        id: overrideId,
        tenantId,
        systemRoleType,
        permissions: draftPermissions,
        updatedAt: Date.now(),
      };

      try {
        await setDoc(doc(db, "roleOverrides", overrideId), override);

        await logAuditTrail(
          tenantId,
          profile?.id || "",
          profile?.displayName || "Admin",
          "role.update",
          overrideId,
          `Updated the ${SYSTEM_ROLES[systemRoleType].name} permission matrix for this organization`,
          profile?.email
        );

        await fetchSystemOverrides();
        alert(`${SYSTEM_ROLES[systemRoleType].name} permission matrix saved successfully!`);
      } catch (err: any) {
        console.error(err);
        alert(getFriendlyErrorMessage(err, "Failed to save permission matrix."));
      } finally {
        setIsSavingRole(false);
      }
      return;
    }

    setIsSavingRole(true);

    const roleId = selectedRole;
    const roleRef = doc(db, "roles", roleId);

    try {
      await updateDoc(roleRef, {
        name: draftName,
        description: draftDesc,
        dataAccessLevel: draftAccessLevel,
        isActive: draftIsActive,
        permissions: draftPermissions,
        updatedAt: Date.now(),
      });

      // Log Security Audit Log
      await logAuditTrail(
        tenantId,
        profile?.id || "",
        profile?.displayName || "Admin",
        "role.update",
        roleId,
        `Updated permissions and parameters for custom role "${draftName}"`,
        profile?.email
      );

      // Refresh cache
      await fetchRoles();
      alert("Role changes saved successfully!");
    } catch (err: any) {
      console.error(err);
      alert(getFriendlyErrorMessage(err, "Failed to update role details."));
    } finally {
      setIsSavingRole(false);
    }
  };

  // Reset an editable system role's matrix back to the built-in defaults by
  // removing its tenant override document.
  const handleResetSystemRole = async () => {
    if (!tenantId || !isEditableSystemRole || !isAuthorizedToManage) return;
    const systemRoleType = selectedRole as SystemRoleType;
    if (!activeSystemOverride) return; // Nothing to reset
    if (
      !confirm(
        `Reset the ${SYSTEM_ROLES[systemRoleType].name} permission matrix back to the system defaults? This removes your organization's customizations.`
      )
    )
      return;

    setIsSavingRole(true);
    const overrideId = getSystemRoleOverrideId(tenantId, systemRoleType);

    try {
      await deleteDoc(doc(db, "roleOverrides", overrideId));

      await logAuditTrail(
        tenantId,
        profile?.id || "",
        profile?.displayName || "Admin",
        "role.update",
        overrideId,
        `Reset the ${SYSTEM_ROLES[systemRoleType].name} permission matrix to system defaults`,
        profile?.email
      );

      // Reset local draft to defaults immediately for responsiveness.
      setDraftPermissions(SYSTEM_ROLES[systemRoleType].permissions);
      await fetchSystemOverrides();
      alert(`${SYSTEM_ROLES[systemRoleType].name} matrix reset to defaults.`);
    } catch (err: any) {
      console.error(err);
      alert(getFriendlyErrorMessage(err, "Failed to reset permission matrix."));
    } finally {
      setIsSavingRole(false);
    }
  };

  // Delete Custom Role
  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (isSelectedRoleSystem) return;
    if (!confirm(`Are you sure you want to delete the role "${roleName}"? This action cannot be undone.`)) return;

    try {
      await deleteDoc(doc(db, "roles", roleId));

      // Log Security Audit Log
      await logAuditTrail(
        tenantId,
        profile?.id || "",
        profile?.displayName || "Admin",
        "role.delete",
        roleId,
        `Deleted custom role "${roleName}"`,
        profile?.email
      );

      setSelectedRole("employee");
      fetchRoles();
      alert("Role deleted successfully.");
    } catch (err: any) {
      console.error(err);
      alert(getFriendlyErrorMessage(err, "Failed to delete role."));
    }
  };

  // Create Custom Role Modal Submit
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName || !tenantId) return;

    setIsCreatingRole(true);
    const roleId = `role_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    const now = Date.now();

    const roleDoc: Role = {
      id: roleId,
      tenantId,
      name: newRoleName,
      description: newRoleDesc,
      isSystemRole: false,
      permissions: newRolePerms,
      dataAccessLevel: newRoleAccess,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await setDoc(doc(db, "roles", roleId), roleDoc);

      // Log Security Audit Log
      await logAuditTrail(
        tenantId,
        profile?.id || "",
        profile?.displayName || "Admin",
        "role.create",
        roleId,
        `Created custom role "${newRoleName}"`,
        profile?.email
      );

      setNewRoleName("");
      setNewRoleDesc("");
      setNewRoleAccess("self");
      setNewRolePerms(["users.view"]);
      setCreateModalOpen(false);
      setSelectedRole(roleId);
      fetchRoles();
    } catch (err: any) {
      console.error(err);
      alert(getFriendlyErrorMessage(err, "Failed to create custom role."));
    } finally {
      setIsCreatingRole(false);
    }
  };

  // Clone current selected role
  const handleCloneRole = () => {
    if (!activeRoleData) return;
    setNewRoleName(`${activeRoleData.name} (Copy)`);
    setNewRoleDesc(`Clone of ${activeRoleData.name}. ${(activeRoleData as any).description || ""}`);
    setNewRoleAccess(activeRoleData.dataAccessLevel);
    setNewRolePerms([...activeRoleData.permissions]);
    setCreateModalOpen(true);
  };

  // Assign user a new role
  const handleUserRoleChange = async (userId: string, member: UserProfile, newRole: string) => {
    const oldRole = member.tenants[tenantId]?.role;
    try {
      await assignRoleToUser(
        tenantId,
        profile?.id || "",
        profile?.displayName || "Admin",
        userId,
        member.displayName,
        newRole,
        oldRole,
        profile?.email
      );
      fetchMembers();
    } catch (err: any) {
      console.error(err);
      alert(getFriendlyErrorMessage(err, "Failed to assign new role to user."));
    }
  };

  // Filtered lists
  const filteredRoles = customRoles.filter(
    (r) => r.name.toLowerCase().includes(roleSearchQuery.toLowerCase())
  );

  const filteredMembers = members.filter(
    (m) =>
      m.displayName.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(memberSearchQuery.toLowerCase())
  );

  const filteredAuditLogs = auditLogs.filter((log) => {
    if (auditFilterAction !== "all" && log.action !== auditFilterAction) return false;
    return true;
  });

  if (loadingRoles && customRoles.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/4" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Skeleton className="h-96 md:col-span-1 rounded-2xl" />
          <Skeleton className="h-96 md:col-span-2 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (rolesError) {
    return <ErrorState description={rolesError} onRetry={fetchRoles} />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Enterprise Access Control</h1>
          <p className="text-sm text-slate-500">
            Define system roles, custom permissions matrices, and monitor audit logs.
          </p>
        </div>
        {isAuthorizedToManage && (
          <button
            onClick={() => {
              setNewRoleName("");
              setNewRoleDesc("");
              setNewRoleAccess("self");
              setNewRolePerms(["users.view"]);
              setCreateModalOpen(true);
            }}
            className="self-start inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <Plus size={16} />
            <span>Create Custom Role</span>
          </button>
        )}
      </div>

      {/* HiBob Inspired Custom Sub-Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("roles")}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-bold border-b-2 cursor-pointer transition-all ${
            activeTab === "roles"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Shield size={16} />
          <span>Roles & Permission Matrix</span>
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-bold border-b-2 cursor-pointer transition-all ${
            activeTab === "users"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Users size={16} />
          <span>Member Assignments</span>
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-bold border-b-2 cursor-pointer transition-all ${
            activeTab === "audit"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Activity size={16} />
          <span>Security Audit Trail</span>
        </button>
      </div>

      {/* ==================== TAB 1: ROLES & MATRIX ==================== */}
      {activeTab === "roles" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* Left panel: Roles List */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-1 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search roles..."
                value={roleSearchQuery}
                onChange={(e) => setRoleSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-4 text-xs outline-none focus:border-blue-600/60 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            <div>
              <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1">
                System Default Roles
              </h3>
              <div className="mt-2 space-y-1">
                {(Object.keys(SYSTEM_ROLES) as SystemRoleType[])
                  .filter((roleKey) => roleKey.toLowerCase().includes(roleSearchQuery.toLowerCase()))
                  .map((roleKey) => (
                    <button
                      key={roleKey}
                      onClick={() => setSelectedRole(roleKey)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-bold cursor-pointer ${
                        selectedRole === roleKey
                          ? "bg-blue-50 text-blue-600"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className="capitalize">{roleKey.replace("_", " ")}</span>
                      {EDITABLE_SYSTEM_ROLES.includes(roleKey) && isAuthorizedToManage ? (
                        <span className="text-[8px] font-extrabold uppercase tracking-wider text-blue-500">
                          Editable
                        </span>
                      ) : (
                        <Lock size={12} className="text-slate-400" />
                      )}
                    </button>
                  ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1">
                Custom Tenant Roles
              </h3>
              <div className="mt-2 space-y-1">
                {filteredRoles.length === 0 ? (
                  <p className="text-xs text-slate-400 px-1 py-2 italic">No custom roles created.</p>
                ) : (
                  filteredRoles.map((role) => (
                    <div
                      key={role.id}
                      className={`flex items-center justify-between rounded-xl px-3 py-1 text-left text-xs font-bold ${
                        selectedRole === role.id 
                          ? "bg-blue-50 text-blue-600" 
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <button
                        onClick={() => setSelectedRole(role.id)}
                        className="flex-1 py-1.5 text-left cursor-pointer font-bold"
                      >
                        {role.name}
                        {role.isActive === false && (
                          <span className="ml-2 rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">
                            Inactive
                          </span>
                        )}
                      </button>
                      {isAuthorizedToManage && (
                        <button
                          onClick={() => handleDeleteRole(role.id, role.name)}
                          className="text-slate-400 hover:text-red-600 p-1 cursor-pointer rounded-lg hover:bg-red-50"
                          title="Delete role"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right panel: Details & Matrix */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2 space-y-6">
            
            {/* Active Role Card Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    {draftName} Permissions Matrix
                  </h2>
                  {isSelectedRoleSystem ? (
                    isEditableSystemRole && isAuthorizedToManage ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                        <Shield size={10} />
                        Editable System Role
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                        <Lock size={10} />
                        System Protected
                      </span>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                      Custom Role
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">{draftDesc || "No description provided."}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCloneRole}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                  title="Clone current role properties"
                >
                  <Copy size={12} />
                  <span>Clone</span>
                </button>
              </div>
            </div>

            {/* Config Fields for Custom Role */}
            {!isSelectedRoleSystem && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-xl bg-slate-50/50 p-4 border border-slate-100">
                <div>
                  <label htmlFor="edit-role-name" className="text-xs font-bold text-slate-600">Role Name</label>
                  <input
                    id="edit-role-name"
                    type="text"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-blue-600 transition-all font-semibold"
                  />
                </div>
                <div>
                  <label htmlFor="edit-role-desc" className="text-xs font-bold text-slate-600">Description</label>
                  <input
                    id="edit-role-desc"
                    type="text"
                    value={draftDesc}
                    onChange={(e) => setDraftDesc(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-blue-600 transition-all font-semibold"
                  />
                </div>
                <div>
                  <label htmlFor="edit-data-access" className="text-xs font-bold text-slate-600">Data Access Level</label>
                  <select
                    id="edit-data-access"
                    value={draftAccessLevel}
                    onChange={(e) => setDraftAccessLevel(e.target.value as DataAccessLevel)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold outline-none focus:border-blue-600"
                  >
                    <option value="all">All Records (Full Visibility)</option>
                    <option value="department">Department Records</option>
                    <option value="team">Team Records</option>
                    <option value="reports">Direct Reports Only</option>
                    <option value="self">Self Only</option>
                  </select>
                </div>
                <div className="flex flex-col justify-end">
                  <span className="text-xs font-bold text-slate-600 mb-1">Status</span>
                  <div className="flex items-center gap-2.5 py-1.5">
                    <button
                      type="button"
                      onClick={() => setDraftIsActive(!draftIsActive)}
                      className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                        draftIsActive ? "bg-blue-600" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          draftIsActive ? "translate-x-4.5" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <span className="text-xs font-semibold text-slate-700">
                      {draftIsActive ? "Active" : "Inactive (Members lose access)"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* System Role Data Access Display */}
            {isSelectedRoleSystem && (
              <div className="rounded-xl bg-slate-50/50 p-4 border border-slate-100 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600">Role Data Access Level:</span>
                <span className="font-bold text-slate-800 capitalize bg-slate-100 px-2.5 py-1 rounded-lg">
                  {draftAccessLevel.replace("_", " ")} Records
                </span>
              </div>
            )}

            {/* Editable system-role notice */}
            {isEditableSystemRole && isAuthorizedToManage && (
              <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>
                  You can tailor the <strong>{SYSTEM_ROLES[selectedRole as SystemRoleType].name}</strong> permission
                  matrix for this organization. Changes apply to every member with this role.
                  {activeSystemOverride ? " Customized for this organization." : " Currently using system defaults."}
                </span>
              </div>
            )}

            {/* Permission Matrix Table */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4 w-[250px]">Module / Resource</th>
                      {ACTIONS.map((act) => (
                        <th key={act.key} className="py-3 px-4 text-center">{act.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {RESOURCES.map((res) => (
                      <tr key={res.key} className="hover:bg-slate-50/20 text-xs">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{res.label}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 leading-normal">{res.desc}</div>
                        </td>
                        {ACTIONS.map((act) => {
                          const isValid = isPermissionValid(res.key, act.key);
                          const isChecked = draftPermissions.includes(`${res.key}.${act.key}` as PermissionKey);
                          
                          return (
                            <td key={act.key} className="py-3 px-4 text-center">
                              {isValid ? (
                                <button
                                  type="button"
                                  disabled={matrixLocked}
                                  onClick={() => handleTogglePermission(res.key, act.key)}
                                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150 ease-in-out outline-none ${
                                    isChecked ? "bg-blue-600" : "bg-slate-200"
                                  } ${matrixLocked ? "opacity-50 cursor-not-allowed" : ""}`}
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-150 ease-in-out ${
                                      isChecked ? "translate-x-4" : "translate-x-0"
                                    }`}
                                  />
                                </button>
                              ) : (
                                <span className="text-slate-300 font-bold">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action bar: Custom Role save */}
            {!isSelectedRoleSystem && isDraftModified() && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveChanges}
                  disabled={isSavingRole}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <Save size={16} />
                  <span>{isSavingRole ? "Saving Changes..." : "Save Role changes"}</span>
                </button>
              </div>
            )}

            {/* Action bar: Editable system role (save override / reset to defaults) */}
            {isEditableSystemRole && isAuthorizedToManage && (
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                {activeSystemOverride && (
                  <button
                    onClick={handleResetSystemRole}
                    disabled={isSavingRole}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
                    title="Remove customizations and restore the built-in defaults"
                  >
                    <RotateCcw size={16} />
                    <span>Reset to Default</span>
                  </button>
                )}
                <button
                  onClick={handleSaveChanges}
                  disabled={isSavingRole || !isDraftModified()}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Save size={16} />
                  <span>{isSavingRole ? "Saving..." : "Save Matrix"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 2: USER ROLE ASSIGNMENTS ==================== */}
      {activeTab === "users" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Member Role Assignment</h2>
              <p className="text-xs text-slate-500">
                Grant custom or default system roles to team members within this organization.
              </p>
            </div>
            
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search members by name or email..."
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-4 text-xs outline-none focus:border-blue-600/60 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>

          {loadingMembers && members.length === 0 ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-5">Name</th>
                    <th className="py-3 px-5">Email</th>
                    <th className="py-3 px-5">Current Role</th>
                    <th className="py-3 px-5">Status</th>
                    {isAuthorizedToManage && <th className="py-3 px-5 text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredMembers.map((member) => {
                    const tenantInfo = member.tenants[tenantId];
                    if (!tenantInfo) return null;

                    const userRole = tenantInfo.role;
                    const isSystem = Object.keys(SYSTEM_ROLES).includes(userRole);
                    const roleName = isSystem
                      ? SYSTEM_ROLES[userRole as SystemRoleType].name
                      : customRoles.find((r) => r.id === userRole)?.name || userRole;

                    return (
                      <tr key={member.id} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-5 font-bold text-slate-900 flex items-center gap-2.5">
                          <div className="flex h-7.5 w-7.5 items-center justify-center rounded-full bg-slate-100 text-slate-600 text-xs font-extrabold">
                            {member.displayName.substring(0, 2).toUpperCase()}
                          </div>
                          <span>{member.displayName}</span>
                        </td>
                        <td className="py-3.5 px-5 text-slate-500">{member.email}</td>
                        <td className="py-3.5 px-5 font-semibold">
                          <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md text-slate-700 capitalize">
                            <Shield size={12} className="text-slate-400" />
                            {roleName.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3.5 px-5">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              tenantInfo.status === "active"
                                ? "bg-green-50 text-green-700"
                                : tenantInfo.status === "invited"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {tenantInfo.status}
                          </span>
                        </td>
                        {isAuthorizedToManage && (
                          <td className="py-3.5 px-5 text-right">
                            {member.id !== profile?.id ? (
                              <select
                                value={userRole}
                                onChange={(e) => handleUserRoleChange(member.id, member, e.target.value)}
                                className="rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none focus:border-blue-600 font-semibold text-slate-700 bg-white"
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
                              <span className="text-[10px] text-slate-400 italic">Self Account</span>
                            )}
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

      {/* ==================== TAB 3: AUDIT TRAIL ==================== */}
      {activeTab === "audit" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Security Audit Trail</h2>
              <p className="text-xs text-slate-500">
                A historical log of RBAC structure edits, permission updates, and member privilege adjustments.
              </p>
            </div>
            
            <div className="flex gap-2">
              <select
                value={auditFilterAction}
                onChange={(e) => setAuditFilterAction(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-blue-600"
              >
                <option value="all">All Actions</option>
                <option value="role.create">Role Created</option>
                <option value="role.update">Role Updated</option>
                <option value="role.delete">Role Deleted</option>
                <option value="user.role_assign">Role Assigned</option>
                <option value="user.role_remove">Role Removed</option>
              </select>
              <button
                onClick={fetchAuditLogs}
                disabled={loadingAudit}
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                title="Refresh audit trails"
              >
                <RefreshCw size={14} className={loadingAudit ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {loadingAudit && auditLogs.length === 0 ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : filteredAuditLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs italic">
              No audit log entries recorded.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-5">Timestamp</th>
                      <th className="py-3 px-5">Action</th>
                      <th className="py-3 px-5">Actor</th>
                      <th className="py-3 px-5">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                    {filteredAuditLogs.map((log) => {
                      let badgeColor = "bg-slate-100 text-slate-700 border-slate-200";
                      if (log.action === "role.create") badgeColor = "bg-green-50 text-green-700 border-green-200";
                      else if (log.action === "role.update") badgeColor = "bg-blue-50 text-blue-700 border-blue-200";
                      else if (log.action === "role.delete") badgeColor = "bg-red-50 text-red-700 border-red-200";
                      else if (log.action === "user.role_assign") badgeColor = "bg-indigo-50 text-indigo-700 border-indigo-200";
                      
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/30">
                          <td className="py-3.5 px-5 font-semibold text-slate-400 w-[170px]">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-5">
                            <span className={`inline-flex px-2 py-0.5 rounded border text-[9px] font-bold uppercase ${badgeColor}`}>
                              {log.action.replace(".", " ")}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 font-bold text-slate-700">
                            {log.actorName}
                          </td>
                          <td className="py-3.5 px-5 font-medium text-slate-800">
                            {log.details}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== CREATE ROLE MODAL ==================== */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-md relative overflow-y-auto max-h-[90dvh] space-y-4">
            
            <button
              onClick={() => setCreateModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Configure Custom Role</h3>
                <p className="text-xs text-slate-500">
                  Construct a customized set of privileges and records visibility.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="modal-role-name" className="text-slate-600 font-bold block mb-1">Role Name</label>
                  <input
                    id="modal-role-name"
                    type="text"
                    required
                    placeholder="e.g. ATS Coordinator"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-600 transition-all font-semibold"
                  />
                </div>
                <div>
                  <label htmlFor="modal-role-desc" className="text-slate-600 font-bold block mb-1">Description</label>
                  <input
                    id="modal-role-desc"
                    type="text"
                    placeholder="e.g. Conducts screening and routes applications"
                    value={newRoleDesc}
                    onChange={(e) => setNewRoleDesc(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-600 transition-all font-semibold"
                  />
                </div>
                <div>
                  <label htmlFor="modal-data-access" className="text-slate-600 font-bold block mb-1">Data Access Level</label>
                  <select
                    id="modal-data-access"
                    value={newRoleAccess}
                    onChange={(e) => setNewRoleAccess(e.target.value as DataAccessLevel)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-600 font-semibold"
                  >
                    <option value="all">All Records (Full Visibility)</option>
                    <option value="department">Department Records</option>
                    <option value="team">Team Records</option>
                    <option value="reports">Direct Reports Only</option>
                    <option value="self">Self Only</option>
                  </select>
                </div>
              </div>

              {/* Mini Permission Selector Grid */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h4 className="font-bold text-slate-800 text-sm">Assign Permissions Matrix</h4>
                
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto max-h-[300px]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[9px] font-extrabold text-slate-500 uppercase tracking-wider sticky top-0">
                          <th className="py-2.5 px-3 w-[200px] bg-slate-50">Resource</th>
                          {ACTIONS.map((act) => (
                            <th key={act.key} className="py-2.5 px-3 text-center bg-slate-50">{act.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {RESOURCES.map((res) => (
                          <tr key={res.key} className="hover:bg-slate-50/25">
                            <td className="py-2 px-3 font-bold text-slate-800">{res.label}</td>
                            {ACTIONS.map((act) => {
                              const isValid = isPermissionValid(res.key, act.key);
                              const key = `${res.key}.${act.key}` as PermissionKey;
                              const isChecked = newRolePerms.includes(key);

                              const toggle = () => {
                                setNewRolePerms((prev) =>
                                  prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
                                );
                              };

                              return (
                                <td key={act.key} className="py-2 px-3 text-center">
                                  {isValid ? (
                                    <button
                                      type="button"
                                      onClick={toggle}
                                      className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-150 ease-in-out outline-none ${
                                        isChecked ? "bg-blue-600" : "bg-slate-200"
                                      }`}
                                    >
                                      <span
                                        className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-150 ease-in-out ${
                                          isChecked ? "translate-x-3" : "translate-x-0"
                                        }`}
                                      />
                                    </button>
                                  ) : (
                                    <span className="text-slate-300">-</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end border-t border-slate-100 pt-4 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingRole}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isCreatingRole ? "Creating Role..." : "Create Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
