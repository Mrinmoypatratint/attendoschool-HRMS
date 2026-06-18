import { getFriendlyErrorMessage } from "../../../lib/errors";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { useNavigate } from "react-router-dom";
import { db, functions } from "../../../lib/firebase";
import { useAuth } from "../../auth/context/AuthContext";
import { useEmployeeData } from "../hooks/useEmployeeData";
import { EmployeeService } from "../services/employeeService";
import { useHasPermission } from "../../rbac/hooks/usePermissions";
import { hasCircularDependency, buildDepartmentTree, type DepartmentNode } from "../utils/departments";
import { Skeleton } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/ErrorState";
import { EmptyState } from "../../../components/ui/EmptyState";
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit2, 
  X, 
  Briefcase, 
  MapPin, 
  Calendar, 
  DollarSign, 
  FolderTree, 
  Search, 
  Eye, 
  EyeOff, 
  ShieldAlert,
  Network,
  Mail,
  Copy,
  Check,
  KeyRound
} from "lucide-react";
import type { Employee, Department, UserProfile, EmployeeStatus } from "@hrms/middleware";

interface OrgNodeProps {
  employee: Employee;
  allEmployees: Employee[];
  departments: Department[];
  expandedNodes: Record<string, boolean>;
  toggleExpand: (id: string) => void;
  primaryColor: string;
}

function OrgNode({
  employee,
  allEmployees,
  departments,
  expandedNodes,
  toggleExpand,
  primaryColor,
}: OrgNodeProps) {
  const reports = allEmployees.filter((e) => e.managerId === employee.id);
  const isExpanded = expandedNodes[employee.id] !== false; // default expanded
  const deptName = departments.find((d) => d.id === employee.departmentId)?.name || "Unassigned";

  return (
    <div className="flex flex-col items-center">
      {/* Employee Card */}
      <div className="relative flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all w-52 text-center z-10">
        <div 
          className="flex h-10 w-10 items-center justify-center rounded-full text-white font-extrabold text-xs mb-2 border-2 border-white ring-4 ring-slate-100/70"
          style={{ backgroundColor: primaryColor }}
        >
          {employee.firstName.substring(0, 1)}
          {employee.lastName.substring(0, 1)}
        </div>
        <h4 className="font-bold text-slate-900 text-[11px] truncate max-w-[180px]">
          {employee.firstName} {employee.lastName}
        </h4>
        <p className="text-[10px] text-slate-400 font-semibold truncate max-w-[180px]">
          {employee.jobTitle}
        </p>
        <span 
          className="mt-1.5 rounded-md px-1.5 py-0.5 text-[8px] font-extrabold tracking-wide uppercase"
          style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}
        >
          {deptName}
        </span>

        {reports.length > 0 && (
          <button
            type="button"
            onClick={() => toggleExpand(employee.id)}
            className="absolute -bottom-3 bg-white border border-slate-200 rounded-full h-6 px-2 text-[8px] font-bold text-slate-500 hover:text-slate-800 hover:border-slate-400 shadow-sm flex items-center gap-1 cursor-pointer transition-colors z-20 outline-none"
          >
            <span>
              {reports.length} {reports.length === 1 ? "report" : "reports"}
            </span>
            <span className="text-[7px]">{isExpanded ? "▲" : "▼"}</span>
          </button>
        )}
      </div>

      {/* Children rendering */}
      {reports.length > 0 && isExpanded && (
        <div className="flex flex-col items-center w-full mt-6 relative">
          {/* Vertical parent connector */}
          <div className="w-px h-6 bg-slate-200" />

          {/* Children container */}
          <div className="flex gap-x-6 pt-0 relative">
            {reports.map((report, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === reports.length - 1;
              const isSingle = reports.length === 1;

              return (
                <div key={report.id} className="relative flex flex-col items-center">
                  {/* Horizontal line logic */}
                  {!isSingle && (
                    <div
                      className="absolute top-0 h-px bg-slate-200"
                      style={{
                        left: isFirst ? "50%" : "0",
                        right: isLast ? "50%" : "0",
                      }}
                    />
                  )}
                  {/* Vertical child connector */}
                  <div className="w-px h-6 bg-slate-200 mb-2" />

                  <OrgNode
                    employee={report}
                    allEmployees={allEmployees}
                    departments={departments}
                    expandedNodes={expandedNodes}
                    toggleExpand={toggleExpand}
                    primaryColor={primaryColor}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface TreeNodeProps {
  node: DepartmentNode;
  allDepartments: Department[];
  employees: Employee[];
  canManage: boolean;
  onEdit: (dept: Department) => void;
  onDelete: (deptId: string, name: string) => void;
  onArchive: (dept: Department, archive: boolean) => void;
  primaryColor: string;
}

function DepartmentTreeNode({
  node,
  allDepartments,
  employees,
  canManage,
  onEdit,
  onDelete,
  onArchive,
  primaryColor
}: TreeNodeProps) {
  const manager = employees.find(e => e.id === node.department.managerId);
  const managerName = manager ? `${manager.firstName} ${manager.lastName}` : "No manager assigned";
  const headCount = employees.filter(e => e.departmentId === node.department.id).length;

  return (
    <div className="ml-6 border-l-2 border-slate-100 pl-4 mt-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-blue-50 px-2.5 py-0.5 text-[9px] font-extrabold text-blue-600 tracking-wider">
            {node.department.code}
          </span>
          <span className="font-bold text-slate-800 text-sm">
            {node.department.name}
          </span>
          {node.department.isArchived && (
            <span className="rounded bg-rose-50 border border-rose-200 px-1.5 py-0.5 text-[8px] font-bold text-rose-600 uppercase">
              Archived
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-4 text-xs">
          <div className="text-slate-500 font-semibold">
            Headcount: <span className="font-bold text-blue-600">{headCount}</span>
          </div>
          <div className="text-slate-500 font-semibold">
            Manager: <span className="font-bold text-slate-700">{managerName}</span>
          </div>
          
          {canManage && (
            <div className="flex items-center gap-1 border border-slate-200 bg-slate-50 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => onEdit(node.department)}
                className="p-1 hover:bg-white text-slate-400 hover:text-slate-750 rounded cursor-pointer"
                title="Edit Department"
              >
                <Edit2 size={12} />
              </button>
              <button
                type="button"
                onClick={() => onArchive(node.department, !node.department.isArchived)}
                className="p-1 hover:bg-white text-slate-400 hover:text-slate-750 rounded cursor-pointer font-extrabold text-[10px] px-1.5"
                title={node.department.isArchived ? "Restore Department" : "Archive Department"}
              >
                {node.department.isArchived ? "Restore" : "Archive"}
              </button>
              <button
                type="button"
                onClick={() => onDelete(node.department.id, node.department.name)}
                className="p-1 hover:bg-white text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                title="Delete Department"
              >
                <Trash2 size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
      
      {node.children.length > 0 && (
        <div className="mt-2 space-y-2">
          {node.children.map(child => (
            <DepartmentTreeNode
              key={child.department.id}
              node={child}
              allDepartments={allDepartments}
              employees={employees}
              canManage={canManage}
              onEdit={onEdit}
              onDelete={onDelete}
              onArchive={onArchive}
              primaryColor={primaryColor}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function EmployeesListPage() {
  const { profile, user, activeTenant } = useAuth();
  const tenantId = profile?.activeTenantId || "";
  const navigate = useNavigate();

  // Permissions checks
  const hasPerm = useHasPermission();
  const canCreateEmployee = hasPerm("employees.create");
  const canEditEmployee = hasPerm("employees.update");
  const canDeleteEmployee = hasPerm("employees.delete");
  const canViewDepartments = hasPerm("departments.view");
  const canManageDepartments = hasPerm("departments.create") || hasPerm("departments.update");

  const callerInfo = user ? { uid: user.uid, email: user.email || "" } : undefined;

  // Tab State: "directory" vs "departments" vs "orgchart"
  const [activeTab, setActiveTab] = useState<"directory" | "departments" | "orgchart">("directory");

  // Org Chart expanded state
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: prev[nodeId] === false ? true : false,
    }));
  };

  const primaryColor = activeTenant?.primaryColor || "#2563eb";

  // Load core employee & department data through custom hook
  const { 
    employees, 
    departments, 
    callerEmployee, 
    loading, 
    error, 
    refetch 
  } = useEmployeeData();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Show/Hide salary state (privacy toggling)
  const [showSalaries, setShowSalaries] = useState(false);

  // Tenant users state (for linking employees to auth users)
  const [tenantUsers, setTenantUsers] = useState<UserProfile[]>([]);

  // Modal / Drawer state for Employee creation/editing
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  // Form inputs state
  const [empId, setEmpId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<EmployeeStatus>("active");
  const [startDate, setStartDate] = useState("");
  const [salary, setSalary] = useState<number>(0);
  // SEC-002: compensation is stored in a separate access-controlled collection
  // and only loaded for privileged roles (employees.update).
  const [compMap, setCompMap] = useState<Record<string, { salary: number; currency: string }>>({});
  const [workLocation, setWorkLocation] = useState("Remote");
  const [linkedUserId, setLinkedUserId] = useState("");
  // When creating a new employee: also provision a login account and email a
  // set-password link so the employee can sign in.
  const [createLogin, setCreateLogin] = useState(true);
  // Result of provisioning, surfaced in a confirmation modal (incl. the
  // set-password link, handy when email delivery isn't configured locally).
  const [provisionInfo, setProvisionInfo] = useState<{ email: string; url: string } | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Modal / Drawer state for Department configuration
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptCode, setNewDeptCode] = useState("");
  const [newDeptDesc, setNewDeptDesc] = useState("");
  const [newDeptManager, setNewDeptManager] = useState("");
  const [deptParentId, setDeptParentId] = useState("");
  const [deptError, setDeptError] = useState("");

  // Custom toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Department Search, Filtering & Pagination
  const [deptSearchQuery, setDeptSearchQuery] = useState("");
  const [deptStatusFilter, setDeptStatusFilter] = useState<"active" | "archived" | "all">("active");
  const [deptLayoutMode, setDeptLayoutMode] = useState<"tree" | "list">("tree");
  const [deptCurrentPage, setDeptCurrentPage] = useState(1);
  const DEPT_PAGE_SIZE = 6;

  // Fetch users within tenant to link their profiles
  const fetchTenantUsers = async () => {
    if (!tenantId) return;
    try {
      const q = query(
        collection(db, "users"),
        where(`tenants.${tenantId}.status`, "in", ["active", "invited"])
      );
      const snap = await getDocs(q);
      const list: UserProfile[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as UserProfile);
      });
      setTenantUsers(list);
    } catch (err) {
      console.error("Failed to load tenant users:", err);
    }
  };

  useEffect(() => {
    if (employeeModalOpen) {
      fetchTenantUsers();
    }
  }, [employeeModalOpen, tenantId]);

  // SEC-002: load compensation only for roles allowed to see it (employees.update).
  useEffect(() => {
    if (!tenantId || !canEditEmployee) {
      setCompMap({});
      return;
    }
    EmployeeService.getCompensations(tenantId).then(setCompMap).catch(() => setCompMap({}));
  }, [tenantId, canEditEmployee, employees]);

  // Open creation modal
  const handleOpenCreateModal = () => {
    if (!canCreateEmployee) {
      showToast("You don't have permission to add employees.");
      return;
    }
    setEditingEmployee(null);
    setEmpId("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setJobTitle("");
    const firstDept = departments[0];
    setSelectedDeptId(firstDept ? firstDept.id : "");
    setSelectedManagerId("");
    setSelectedStatus("active");
    setStartDate(new Date().toISOString().substring(0, 10));
    setSalary(50000);
    setWorkLocation("Remote");
    setLinkedUserId("");
    setCreateLogin(true);
    setEmployeeModalOpen(true);
  };

  // Open edit modal
  const handleOpenEditModal = (emp: Employee) => {
    if (!canEditEmployee) {
      showToast("You don't have permission to edit employees.");
      return;
    }
    setEditingEmployee(emp);
    setFirstName(emp.firstName);
    setLastName(emp.lastName);
    setEmail(emp.email);
    setPhone(emp.phone);
    setJobTitle(emp.jobTitle);
    setSelectedDeptId(emp.departmentId);
    setSelectedManagerId(emp.managerId || "");
    setSelectedStatus(emp.status);
    setStartDate(emp.startDate);
    setSalary(compMap[emp.id]?.salary ?? 0);
    setWorkLocation(emp.workLocation);
    setLinkedUserId(emp.userId || "");
    setEmployeeModalOpen(true);
  };

  // Submit Employee form (create or update)
  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;

    // Permission enforcement for direct submits (e.g. modal opened via state/keyboard)
    if (editingEmployee) {
      if (!canEditEmployee) {
        showToast("You don't have permission to update employees.");
        return;
      }
    } else {
      if (!canCreateEmployee) {
        showToast("You don't have permission to create employees.");
        return;
      }
    }

    setSaveLoading(true);

    const employeeData: Omit<Employee, "id" | "tenantId" | "createdAt" | "updatedAt"> = {
      firstName,
      lastName,
      email,
      phone,
      jobTitle,
      departmentId: selectedDeptId,
      status: selectedStatus,
      startDate,
      workLocation,
    };

    if (selectedManagerId) {
      employeeData.managerId = selectedManagerId;
    }
    if (linkedUserId) {
      employeeData.userId = linkedUserId;
    }

    try {
      if (editingEmployee) {
        await EmployeeService.updateEmployee(editingEmployee.id, employeeData, callerInfo);
        await EmployeeService.setCompensation(editingEmployee.id, tenantId, Number(salary), "USD", callerInfo);
        alert("Employee updated successfully!");
        setEmployeeModalOpen(false);
        refetch();
      } else {
        // Create the employee profile first.
        const created = await EmployeeService.createEmployee(tenantId, empId, employeeData, callerInfo);
        // SEC-002: store salary in the access-controlled compensation collection.
        await EmployeeService.setCompensation(created.id, tenantId, Number(salary), "USD", callerInfo);

        // Optionally provision a login account + email a set-password link.
        if (createLogin && email.trim()) {
          try {
            const provisionFn = httpsCallable(functions, "provisionEmployeeAccount");
            const res = await provisionFn({
              email: email.trim(),
              displayName: `${firstName} ${lastName}`.trim(),
              tenantId,
            });
            const d = (res.data || {}) as { uid?: string; oobCode?: string; setPasswordUrl?: string };

            // Link the new auth uid to the employee record.
            if (d.uid) {
              await EmployeeService.updateEmployee(created.id, { userId: d.uid }, callerInfo);
            }

            // Prefer a link against the current origin (works in local dev where
            // the configured APP_URL may differ from where the app is running).
            const localUrl = d.oobCode
              ? `${window.location.origin}/reset-password?oobCode=${encodeURIComponent(d.oobCode)}`
              : d.setPasswordUrl || "";

            setEmployeeModalOpen(false);
            refetch();
            setLinkCopied(false);
            setProvisionInfo({ email: email.trim(), url: localUrl });
          } catch (provErr: any) {
            console.error(provErr);
            // The profile was created; only the login provisioning failed.
            setEmployeeModalOpen(false);
            refetch();
            showToast(
              getFriendlyErrorMessage(
                provErr,
                "Employee added, but the login account could not be created. Make sure Firebase Functions are running, then try again."
              )
            );
          }
        } else {
          alert("Employee created successfully!");
          setEmployeeModalOpen(false);
          refetch();
        }
      }
    } catch (err: any) {
      console.error(err);
      alert(getFriendlyErrorMessage(err, "Failed to save employee profile."));
    } finally {
      setSaveLoading(false);
    }
  };

  // Provision (or re-send) a login for an employee: creates/reuses their auth
  // account, links it, and emails a fresh set-password link. Works for both
  // offline profiles (no login yet) and re-sending to existing accounts.
  const handleSendLoginEmail = async (emp: Employee) => {
    if (!tenantId) return;
    if (!emp.email) {
      showToast("This employee has no email address to send a login to.");
      return;
    }
    try {
      const provisionFn = httpsCallable(functions, "provisionEmployeeAccount");
      const res = await provisionFn({
        email: emp.email,
        displayName: `${emp.firstName} ${emp.lastName}`.trim(),
        tenantId,
      });
      const d = (res.data || {}) as { uid?: string; oobCode?: string; setPasswordUrl?: string };

      // Link the auth uid if the profile wasn't linked yet.
      if (d.uid && !emp.userId) {
        await EmployeeService.updateEmployee(emp.id, { userId: d.uid }, callerInfo);
      }

      const localUrl = d.oobCode
        ? `${window.location.origin}/reset-password?oobCode=${encodeURIComponent(d.oobCode)}`
        : d.setPasswordUrl || "";

      refetch();
      setLinkCopied(false);
      setProvisionInfo({ email: emp.email, url: localUrl });
    } catch (err: any) {
      console.error(err);
      showToast(
        getFriendlyErrorMessage(
          err,
          "Could not send the login email. Make sure Firebase Functions are running, then try again."
        )
      );
    }
  };

  // Delete employee record
  const handleDeleteEmployee = async (empId: string, name: string) => {
    if (!canDeleteEmployee) {
      showToast("You don't have permission to delete employees.");
      return;
    }
    if (!confirm(`Are you sure you want to remove ${name} from the directory?`)) return;
    try {
      await EmployeeService.deleteEmployee(empId, callerInfo);
      alert("Employee deleted successfully.");
      refetch();
    } catch (err: any) {
      console.error(err);
      alert(getFriendlyErrorMessage(err, "Failed to delete employee."));
    }
  };

  // Open Create Department Modal
  const handleOpenCreateDeptModal = () => {
    setEditingDept(null);
    setNewDeptName("");
    setNewDeptCode("");
    setNewDeptDesc("");
    setNewDeptManager("");
    setDeptParentId("");
    setDeptError("");
    setDeptModalOpen(true);
  };

  // Open Edit Department Modal
  const handleOpenEditDeptModal = (dept: Department) => {
    setEditingDept(dept);
    setNewDeptName(dept.name);
    setNewDeptCode(dept.code);
    setNewDeptDesc(dept.description);
    setNewDeptManager(dept.managerId || "");
    setDeptParentId(dept.parentId || "");
    setDeptError("");
    setDeptModalOpen(true);
  };

  // Create or Update Department
  const handleCreateOrUpdateDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;

    // Validate circular dependency
    if (editingDept && deptParentId) {
      if (hasCircularDependency(departments, editingDept.id, deptParentId)) {
        setDeptError("Setting this parent creates a circular hierarchy loop!");
        return;
      }
    }

    const deptData: Omit<Department, "id" | "tenantId" | "createdAt" | "updatedAt"> & { parentId?: string; isArchived?: boolean } = {
      name: newDeptName.trim(),
      code: newDeptCode.trim().toUpperCase(),
      description: newDeptDesc.trim(),
      parentId: deptParentId,
    };

    if (newDeptManager) {
      deptData.managerId = newDeptManager;
    } else {
      deptData.managerId = ""; // Clear manager
    }

    try {
      if (editingDept) {
        await EmployeeService.updateDepartment(editingDept.id, deptData, callerInfo);
        showToast(`Department "${editingDept.name}" updated successfully!`);
      } else {
        await EmployeeService.createDepartment(tenantId, deptData, callerInfo);
        showToast(`Department "${newDeptName}" created successfully!`);
      }
      setDeptModalOpen(false);
      refetch();
    } catch (err: any) {
      console.error(err);
      setDeptError(getFriendlyErrorMessage(err, "Failed to save department."));
    }
  };

  // Archive / Unarchive Department
  const handleArchiveDepartment = async (dept: Department, archive: boolean) => {
    try {
      await EmployeeService.updateDepartment(dept.id, { isArchived: archive }, callerInfo);
      showToast(`Department "${dept.name}" ${archive ? "archived" : "restored"} successfully!`);
      refetch();
    } catch (err: any) {
      console.error(err);
      showToast(getFriendlyErrorMessage(err, "Failed to update department status."));
    }
  };

  // Delete department submit
  const handleDeleteDepartment = async (deptId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the department "${name}"?`)) return;
    try {
      await EmployeeService.deleteDepartment(deptId, callerInfo);
      showToast("Department deleted.");
      refetch();
    } catch (err: any) {
      console.error(err);
      showToast(getFriendlyErrorMessage(err, "Failed to delete department."));
    }
  };

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = 
      `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = deptFilter === "all" || emp.departmentId === deptFilter;
    const matchesStatus = statusFilter === "all" || emp.status === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

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
    return <ErrorState description={error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Employee Directory</h1>
          <p className="text-sm text-slate-500">
            Manage corporate positions, departments, time structures, and records.
          </p>
        </div>
        
        {activeTab === "directory" && canCreateEmployee && (
          <button
            onClick={handleOpenCreateModal}
            className="self-start inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity cursor-pointer"
            style={{ backgroundColor: primaryColor }}
          >
            <Plus size={16} />
            <span>Add Employee</span>
          </button>
        )}

        {activeTab === "departments" && canManageDepartments && (
          <button
            onClick={handleOpenCreateDeptModal}
            className="self-start inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity cursor-pointer"
            style={{ backgroundColor: primaryColor }}
          >
            <Plus size={16} />
            <span>Add Department</span>
          </button>
        )}
      </div>

      {/* HiBob Inspired tab buttons */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("directory")}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-bold border-b-2 cursor-pointer transition-all ${
            activeTab === "directory"
              ? "text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
          style={activeTab === "directory" ? { borderColor: primaryColor, color: primaryColor } : {}}
        >
          <Users size={16} />
          <span>People Directory</span>
        </button>
        {canViewDepartments && (
          <button
            onClick={() => setActiveTab("departments")}
            className={`flex items-center gap-2 py-3 px-5 text-sm font-bold border-b-2 cursor-pointer transition-all ${
              activeTab === "departments"
                ? "text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
            style={activeTab === "departments" ? { borderColor: primaryColor, color: primaryColor } : {}}
          >
            <FolderTree size={16} />
            <span>Departments ({departments.length})</span>
          </button>
        )}
        <button
          onClick={() => setActiveTab("orgchart")}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-bold border-b-2 cursor-pointer transition-all ${
            activeTab === "orgchart"
              ? "text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
          style={activeTab === "orgchart" ? { borderColor: primaryColor, color: primaryColor } : {}}
        >
          <Network size={16} />
          <span>Org Chart</span>
        </button>
      </div>

      {/* ==================== TAB 1: DIRECTORY ==================== */}
      {activeTab === "directory" && (
        <div className="space-y-4">
          
          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email or job title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-4 text-xs outline-none focus:border-blue-600/60 focus:ring-2 focus:ring-blue-100 transition-all font-semibold"
              />
            </div>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-blue-600 text-slate-700"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-blue-600 text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="onboarding">Onboarding</option>
              <option value="terminated">Terminated</option>
              <option value="suspended">Suspended</option>
            </select>

            {/* Toggle sensitive salary info display (available only for privileged roles) */}
            {(hasPerm("employees.update") || hasPerm("employees.create")) && (
              <button
                type="button"
                onClick={() => setShowSalaries(!showSalaries)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                {showSalaries ? <EyeOff size={14} /> : <Eye size={14} />}
                <span>{showSalaries ? "Hide Salary" : "Show Salary"}</span>
              </button>
            )}
          </div>

          {/* Directory Table */}
          {filteredEmployees.length === 0 ? (
            <EmptyState 
              title="No employees found" 
              description="No employee profiles match your search criteria. Add a new employee or modify filters." 
            />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-5">Name</th>
                      <th className="py-3 px-5">Job Details</th>
                      <th className="py-3 px-5">Location</th>
                      <th className="py-3 px-5">Manager</th>
                      <th className="py-3 px-5">Start Date</th>
                      <th className="py-3 px-5">Status</th>
                      {showSalaries && <th className="py-3 px-5">Salary</th>}
                      {(canEditEmployee || canDeleteEmployee) && <th className="py-3 px-5 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredEmployees.map((emp) => {
                      const deptName = departments.find(d => d.id === emp.departmentId)?.name || "Unassigned";
                      const managerName = employees.find(e => e.id === emp.managerId);
                      const displayManager = managerName ? `${managerName.firstName} ${managerName.lastName}` : "Direct Report to CEO";

                      return (
                        <tr key={emp.id} className="hover:bg-slate-50/40">
                          {/* Name Block */}
                          <td className="py-3 px-5 font-bold text-slate-900 flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-xs font-extrabold">
                              {emp.firstName.substring(0, 1)}{emp.lastName.substring(0, 1)}
                            </div>
                            <div>
                              <button
                                type="button"
                                onClick={() => navigate(`/employees/${emp.id}`)}
                                className="text-left hover:text-blue-600 hover:underline cursor-pointer"
                              >
                                {emp.firstName} {emp.lastName}
                              </button>
                              <div className="text-[10px] text-slate-400 font-medium">{emp.email}</div>
                            </div>
                          </td>

                          {/* Job Details */}
                          <td className="py-3 px-5">
                            <div className="font-semibold text-slate-800 flex items-center gap-1">
                              <Briefcase size={12} className="text-slate-400" />
                              {emp.jobTitle}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{deptName} Department</div>
                          </td>

                          {/* Work Location */}
                          <td className="py-3 px-5">
                            <div className="text-slate-600 font-semibold flex items-center gap-1">
                              <MapPin size={12} className="text-slate-400" />
                              {emp.workLocation}
                            </div>
                          </td>

                          {/* Reporting Line */}
                          <td className="py-3 px-5">
                            <span className="font-semibold text-slate-600">{displayManager}</span>
                          </td>

                          {/* Start Date */}
                          <td className="py-3 px-5">
                            <div className="text-slate-500 font-semibold flex items-center gap-1">
                              <Calendar size={12} className="text-slate-400" />
                              {emp.startDate}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-5">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase ${
                                emp.status === "active"
                                  ? "bg-green-50 text-green-700 border border-green-150"
                                  : emp.status === "onboarding"
                                  ? "bg-blue-50 text-blue-700 border border-blue-150"
                                  : emp.status === "terminated"
                                  ? "bg-red-50 text-red-700 border border-red-150"
                                  : "bg-amber-50 text-amber-700 border border-amber-150"
                              }`}
                            >
                              {emp.status}
                            </span>
                          </td>

                          {/* Salary Column (Conditional Render) */}
                          {showSalaries && (
                            <td className="py-3 px-5 font-bold text-slate-800">
                              <div className="flex items-center gap-0.5">
                                <DollarSign size={12} className="text-slate-400" />
                                {(compMap[emp.id]?.salary ?? 0).toLocaleString()}
                              </div>
                            </td>
                          )}

                          {/* Actions */}
                          {(canEditEmployee || canDeleteEmployee) && (
                            <td className="py-3 px-5 text-right space-x-1.5">
                              {canEditEmployee && emp.email && (
                                <button
                                  onClick={() => handleSendLoginEmail(emp)}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
                                  title={emp.userId ? "Resend set-password email" : "Create login & email set-password link"}
                                >
                                  <KeyRound size={13} />
                                </button>
                              )}
                              {canEditEmployee && (
                                <button
                                  onClick={() => handleOpenEditModal(emp)}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                                  title="Edit Profile"
                                >
                                  <Edit2 size={13} />
                                </button>
                              )}
                              {canDeleteEmployee && emp.id !== callerEmployee?.id && (
                                <button
                                  onClick={() => handleDeleteEmployee(emp.id, `${emp.firstName} ${emp.lastName}`)}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                                  title="Remove Employee"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </td>
                          )}
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

      {/* ==================== TAB 2: DEPARTMENTS ==================== */}
      {/* ==================== TAB 2: DEPARTMENTS ==================== */}
      {activeTab === "departments" && (
        <div className="space-y-6">
          {/* Controls: Search, Filter, Layout Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap flex-1 items-center gap-3 min-w-[280px]">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search departments by name or code..."
                  value={deptSearchQuery}
                  onChange={(e) => {
                    setDeptSearchQuery(e.target.value);
                    setDeptCurrentPage(1);
                  }}
                  className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-4 text-xs outline-none focus:border-blue-600/60 focus:ring-2 focus:ring-blue-100 transition-all font-semibold"
                />
              </div>

              <select
                value={deptStatusFilter}
                onChange={(e) => {
                  setDeptStatusFilter(e.target.value as "active" | "archived" | "all");
                  setDeptCurrentPage(1);
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-blue-600 text-slate-700"
              >
                <option value="active">Active Departments</option>
                <option value="archived">Archived Departments</option>
                <option value="all">All Departments</option>
              </select>
            </div>

            <div className="flex items-center gap-1 border border-slate-200 bg-slate-50 rounded-xl p-1 shrink-0">
              <button
                type="button"
                onClick={() => setDeptLayoutMode("tree")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  deptLayoutMode === "tree"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <FolderTree size={14} />
                <span>Hierarchy Tree</span>
              </button>
              <button
                type="button"
                onClick={() => setDeptLayoutMode("list")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  deptLayoutMode === "list"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Network size={14} />
                <span>Grid List</span>
              </button>
            </div>
          </div>

          {/* Department Content Display */}
          {deptLayoutMode === "tree" ? (
            (() => {
              // 1. Filter departments by archive status
              const statusFiltered = departments.filter((dept) => {
                return deptStatusFilter === "all" ||
                  (deptStatusFilter === "active" && !dept.isArchived) ||
                  (deptStatusFilter === "archived" && dept.isArchived);
              });

              const deptIds = new Set(statusFiltered.map(d => d.id));
              
              // 2. Find roots (no parentId, or parentId is not in statusFiltered)
              const roots = statusFiltered.filter(d => !d.parentId || !deptIds.has(d.parentId));

              // 3. Build subtrees
              const buildSubtree = (dept: Department, level: number = 0): DepartmentNode => {
                return {
                  department: dept,
                  children: statusFiltered
                    .filter(d => d.parentId === dept.id)
                    .map(d => buildSubtree(d, level + 1)),
                  level
                };
              };

              let treeNodes: DepartmentNode[] = roots.map(root => buildSubtree(root, 0));

              // 4. Recursively filter tree nodes by search query
              const filterTreeNodes = (nodes: DepartmentNode[], queryStr: string): DepartmentNode[] => {
                if (!queryStr) return nodes;
                const lowercaseQuery = queryStr.toLowerCase();
                
                return nodes
                  .map(node => {
                    const filteredChildren = filterTreeNodes(node.children, queryStr);
                    const matches = 
                      node.department.name.toLowerCase().includes(lowercaseQuery) ||
                      node.department.code.toLowerCase().includes(lowercaseQuery);
                      
                    if (matches || filteredChildren.length > 0) {
                      return {
                        ...node,
                        children: filteredChildren
                      };
                    }
                    return null;
                  })
                  .filter((node): node is DepartmentNode => node !== null);
              };

              treeNodes = filterTreeNodes(treeNodes, deptSearchQuery);

              if (treeNodes.length === 0) {
                return (
                  <EmptyState 
                    title="No departments found" 
                    description="No organizational departments match your search criteria. Expand filters or add a new department." 
                  />
                );
              }

              return (
                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-6 space-y-4">
                  {treeNodes.map((node) => (
                    <DepartmentTreeNode
                      key={node.department.id}
                      node={node}
                      allDepartments={departments}
                      employees={employees}
                      canManage={canManageDepartments}
                      onEdit={handleOpenEditDeptModal}
                      onDelete={handleDeleteDepartment}
                      onArchive={handleArchiveDepartment}
                      primaryColor={primaryColor}
                    />
                  ))}
                </div>
              );
            })()
          ) : (
            (() => {
              // Grid List layout with pagination
              const filteredList = departments.filter((dept) => {
                const matchesStatus = 
                  deptStatusFilter === "all" ||
                  (deptStatusFilter === "active" && !dept.isArchived) ||
                  (deptStatusFilter === "archived" && dept.isArchived);
                  
                const matchesSearch = 
                  dept.name.toLowerCase().includes(deptSearchQuery.toLowerCase()) ||
                  dept.code.toLowerCase().includes(deptSearchQuery.toLowerCase());
                  
                return matchesStatus && matchesSearch;
              });

              if (filteredList.length === 0) {
                return (
                  <EmptyState 
                    title="No departments found" 
                    description="No organizational departments match your search criteria. Expand filters or add a new department." 
                  />
                );
              }

              const totalDepts = filteredList.length;
              const totalPages = Math.ceil(totalDepts / DEPT_PAGE_SIZE);
              const activePage = Math.min(deptCurrentPage, totalPages || 1);
              const startIndex = (activePage - 1) * DEPT_PAGE_SIZE;
              const paginatedDepts = filteredList.slice(startIndex, startIndex + DEPT_PAGE_SIZE);

              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {paginatedDepts.map((dept) => {
                      const manager = employees.find(e => e.id === dept.managerId);
                      const managerName = manager ? `${manager.firstName} ${manager.lastName}` : "No manager assigned";
                      const headCount = employees.filter(e => e.departmentId === dept.id).length;

                      return (
                        <div key={dept.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow relative">
                          {canManageDepartments && (
                            <div className="absolute right-4 top-4 flex items-center gap-1.5 border border-slate-100 bg-slate-50 rounded-lg p-0.5 z-10">
                              <button
                                onClick={() => handleOpenEditDeptModal(dept)}
                                className="p-1 hover:bg-white text-slate-400 hover:text-slate-800 rounded cursor-pointer"
                                title="Edit Department"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={() => handleArchiveDepartment(dept, !dept.isArchived)}
                                className="p-1 hover:bg-white text-slate-400 hover:text-slate-800 rounded cursor-pointer font-extrabold text-[9px] px-1.5"
                                title={dept.isArchived ? "Restore Department" : "Archive Department"}
                              >
                                {dept.isArchived ? "Restore" : "Archive"}
                              </button>
                              <button
                                onClick={() => handleDeleteDepartment(dept.id, dept.name)}
                                className="p-1 hover:bg-white text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                title="Delete Department"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="rounded-lg bg-blue-50 px-2.5 py-0.5 text-[10px] font-extrabold text-blue-600 tracking-wider">
                                {dept.code}
                              </span>
                              <h3 className="font-bold text-slate-900 text-sm truncate max-w-[150px]">{dept.name}</h3>
                              {dept.isArchived && (
                                <span className="rounded bg-rose-50 border border-rose-200 px-1.5 py-0.5 text-[8px] font-bold text-rose-600 uppercase">
                                  Archived
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 leading-normal pt-1 line-clamp-2 min-h-[32px]">{dept.description || "No description provided."}</p>
                          </div>

                          <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
                            <div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department Manager</div>
                              <div className="font-semibold text-slate-700 mt-0.5 truncate max-w-[130px]">{managerName}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Headcount</div>
                              <div className="font-extrabold text-blue-600 text-sm mt-0.5">{headCount} Members</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-150 pt-4">
                      <span className="text-xs text-slate-500 font-semibold">
                        Showing <span className="font-bold text-slate-800">{startIndex + 1}</span> to{" "}
                        <span className="font-bold text-slate-800">
                          {Math.min(startIndex + DEPT_PAGE_SIZE, totalDepts)}
                        </span>{" "}
                        of <span className="font-bold text-slate-800">{totalDepts}</span> departments
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDeptCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={activePage === 1}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-650 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setDeptCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={activePage === totalPages}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-650 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* ==================== TAB 3: ORG CHART ==================== */}
      {activeTab === "orgchart" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Reporting Hierarchy Tree</h2>
              <p className="text-xs text-slate-500">Visual corporate organizational chart showing manager reporting lines.</p>
            </div>
            <button 
              onClick={() => setExpandedNodes({})}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Reset Chart
            </button>
          </div>
          
          {(() => {
            const roots = employees.filter(emp => !emp.managerId || !employees.some(e => e.id === emp.managerId));
            if (roots.length === 0) {
              return (
                <div className="text-center py-12 text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-slate-200/60">
                  No hierarchy links found. Please assign managers to employees.
                </div>
              );
            }
            return (
              <div className="overflow-auto py-8 px-4 bg-slate-50 rounded-xl border border-slate-200/60 flex justify-center min-h-[500px]">
                <div className="inline-flex flex-col items-center min-w-max">
                  <div className="flex gap-x-8">
                    {roots.map((root) => (
                      <OrgNode
                        key={root.id}
                        employee={root}
                        allEmployees={employees}
                        departments={departments}
                        expandedNodes={expandedNodes}
                        toggleExpand={toggleExpand}
                        primaryColor={primaryColor}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ==================== CREATE / EDIT EMPLOYEE MODAL ==================== */}
      {employeeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-md relative overflow-y-auto max-h-[90dvh] space-y-4">
            
            <button
              onClick={() => setEmployeeModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Users size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{editingEmployee ? "Edit Employee Profile" : "Add New Employee"}</h3>
                <p className="text-xs text-slate-500">Configure corporate identity and access structures.</p>
              </div>
            </div>

            <form onSubmit={handleEmployeeSubmit} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {!editingEmployee && (
                  <div className="sm:col-span-2">
                    <label htmlFor="emp-id" className="text-slate-600 font-bold block mb-1">
                      Employee ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="emp-id"
                      type="text"
                      required
                      placeholder="e.g. EMP001"
                      value={empId}
                      onChange={(e) => setEmpId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-600 transition-all font-semibold"
                    />
                    <p className="mt-1 text-[10px] font-medium text-slate-400">
                      Manually assigned. Letters, numbers, '.', '-' and '_' only. Must be unique.
                    </p>
                  </div>
                )}
                <div>
                  <label htmlFor="first-name" className="text-slate-600 font-bold block mb-1">First Name</label>
                  <input
                    id="first-name"
                    type="text"
                    required
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-600 transition-all font-semibold"
                  />
                </div>
                <div>
                  <label htmlFor="last-name" className="text-slate-600 font-bold block mb-1">Last Name</label>
                  <input
                    id="last-name"
                    type="text"
                    required
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-600 transition-all font-semibold"
                  />
                </div>
                <div>
                  <label htmlFor="emp-email" className="text-slate-600 font-bold block mb-1">Work Email</label>
                  <input
                    id="emp-email"
                    type="email"
                    required
                    placeholder="john.doe@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-600 transition-all font-semibold"
                  />
                </div>
                <div>
                  <label htmlFor="emp-phone" className="text-slate-600 font-bold block mb-1">Contact Phone</label>
                  <input
                    id="emp-phone"
                    type="tel"
                    required
                    placeholder="+1 (555) 123-4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-600 transition-all font-semibold"
                  />
                </div>
                <div>
                  <label htmlFor="job-title" className="text-slate-600 font-bold block mb-1">Job Title</label>
                  <input
                    id="job-title"
                    type="text"
                    required
                    placeholder="Software Engineer"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-600 transition-all font-semibold"
                  />
                </div>
                <div>
                  <label htmlFor="emp-dept" className="text-slate-600 font-bold block mb-1">Department</label>
                  <select
                    id="emp-dept"
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-600 font-semibold"
                  >
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="emp-manager" className="text-slate-600 font-bold block mb-1">Direct Manager</label>
                  <select
                    id="emp-manager"
                    value={selectedManagerId}
                    onChange={(e) => setSelectedManagerId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-600 font-semibold"
                  >
                    <option value="">Direct Report to CEO (No Manager)</option>
                    {employees
                      .filter((emp) => emp.id !== editingEmployee?.id) // Prevent selecting self as manager
                      .map((emp) => (
                        <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                      ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="emp-location" className="text-slate-600 font-bold block mb-1">Work Location</label>
                  <input
                    id="emp-location"
                    type="text"
                    required
                    placeholder="Remote / Office - NYC"
                    value={workLocation}
                    onChange={(e) => setWorkLocation(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-600 transition-all font-semibold"
                  />
                </div>
                <div>
                  <label htmlFor="emp-status" className="text-slate-600 block font-bold mb-1">Status</label>
                  <select
                    id="emp-status"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as EmployeeStatus)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-600 font-semibold"
                  >
                    <option value="active">Active</option>
                    <option value="onboarding">Onboarding</option>
                    <option value="terminated">Terminated</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="start-date" className="text-slate-600 font-bold block mb-1">Start Date</label>
                  <input
                    id="start-date"
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-600 transition-all font-semibold"
                  />
                </div>
                <div>
                  <label htmlFor="salary" className="text-slate-600 font-bold block mb-1">Annual Salary ($)</label>
                  <input
                    id="salary"
                    type="number"
                    required
                    value={salary}
                    onChange={(e) => setSalary(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-600 transition-all font-semibold"
                  />
                </div>
                
                {/* Login provisioning (create mode) */}
                {!editingEmployee && (
                  <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createLogin}
                        onChange={(e) => setCreateLogin(e.target.checked)}
                        className="mt-0.5 rounded"
                      />
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <KeyRound size={13} className="text-blue-600" />
                        <span className="font-bold">Create a login account and email a set-password link</span>
                      </span>
                    </label>
                    <p className="mt-1.5 ml-6 text-[10px] font-medium text-slate-400 leading-normal">
                      Registers the employee with the email above so they can sign in. They'll receive an
                      email with a link to set their password, then log in. Requires a work email.
                    </p>
                  </div>
                )}

                {/* Link to an existing Auth Account (manual) — only when not auto-provisioning */}
                {(editingEmployee || !createLogin) && (
                  <div>
                    <label htmlFor="link-user" className="text-slate-600 font-bold block mb-1">Link to Auth Account</label>
                    <select
                      id="link-user"
                      value={linkedUserId}
                      onChange={(e) => setLinkedUserId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-600 font-semibold"
                    >
                      <option value="">No Active login link (Offline profile)</option>
                      {tenantUsers
                        .filter((u) => {
                          // Allow current linked user in edit mode
                          if (editingEmployee && editingEmployee.userId === u.id) return true;
                          // Otherwise, check if user is already linked elsewhere
                          return !employees.some(e => e.userId === u.id);
                        })
                        .map((u) => (
                          <option key={u.id} value={u.id}>{u.displayName} ({u.email})</option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end border-t border-slate-100 pt-4 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setEmployeeModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {saveLoading ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== CREATE DEPARTMENT MODAL ==================== */}
      {/* ==================== CREATE / EDIT DEPARTMENT MODAL ==================== */}
      {deptModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-md relative space-y-4">
            
            <button
              onClick={() => setDeptModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FolderTree size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{editingDept ? "Edit Department" : "Add Department"}</h3>
                <p className="text-xs text-slate-500">
                  {editingDept ? "Modify department details and hierarchy structure." : "Create a new organizational business unit."}
                </p>
              </div>
            </div>

            {deptError && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-red-650 text-[11px] font-bold flex items-center gap-2">
                <ShieldAlert size={14} className="shrink-0" />
                <span>{deptError}</span>
              </div>
            )}

            <form onSubmit={handleCreateOrUpdateDeptSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
              <div>
                <label htmlFor="dept-name" className="text-slate-650 font-bold block mb-1">Department Name</label>
                <input
                  id="dept-name"
                  type="text"
                  required
                  placeholder="e.g. Engineering"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-blue-600 transition-all font-semibold"
                />
              </div>

              <div>
                <label htmlFor="dept-code" className="text-slate-650 font-bold block mb-1">Department Code</label>
                <input
                  id="dept-code"
                  type="text"
                  required
                  placeholder="e.g. ENG"
                  value={newDeptCode}
                  onChange={(e) => setNewDeptCode(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-blue-600 transition-all font-semibold"
                />
              </div>

              <div>
                <label htmlFor="dept-desc" className="text-slate-650 font-bold block mb-1">Description</label>
                <input
                  id="dept-desc"
                  type="text"
                  placeholder="e.g. Product design and development team"
                  value={newDeptDesc}
                  onChange={(e) => setNewDeptDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-blue-600 transition-all font-semibold"
                />
              </div>

              <div>
                <label htmlFor="dept-manager" className="text-slate-650 font-bold block mb-1">Department Manager</label>
                <select
                  id="dept-manager"
                  value={newDeptManager}
                  onChange={(e) => setNewDeptManager(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 outline-none focus:border-blue-600 font-semibold text-slate-700"
                >
                  <option value="">No Manager Assigned</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="dept-parent" className="text-slate-650 font-bold block mb-1">Parent Department</label>
                <select
                  id="dept-parent"
                  value={deptParentId}
                  onChange={(e) => setDeptParentId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 outline-none focus:border-blue-600 font-semibold text-slate-700"
                >
                  <option value="">None (Root Department)</option>
                  {departments
                    .filter((dept) => {
                      if (editingDept && dept.id === editingDept.id) return false;
                      if (dept.isArchived) return false;
                      return true;
                    })
                    .map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name} ({dept.code})</option>
                    ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-3 text-white hover:bg-blue-700 transition-colors cursor-pointer text-xs font-bold"
              >
                {editingDept ? "Save Changes" : "Create Department"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================== EMPLOYEE LOGIN PROVISIONED MODAL ==================== */}
      {provisionInfo && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-md relative space-y-4">
            <button
              onClick={() => setProvisionInfo(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <Mail size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Set-password email sent</h3>
                <p className="text-xs text-slate-500">The employee can now set their password and sign in.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              We emailed <span className="font-bold text-slate-800">{provisionInfo.email}</span> a link to set
              their password. After setting it, they can sign in with their email address.
            </p>

            {provisionInfo.url && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  <KeyRound size={12} />
                  <span>Set-password link</span>
                </div>
                <div className="break-all rounded-lg bg-white border border-slate-200 px-2.5 py-2 text-[11px] font-medium text-slate-700">
                  {provisionInfo.url}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(provisionInfo.url);
                        setLinkCopied(true);
                        setTimeout(() => setLinkCopied(false), 2000);
                      } catch {
                        /* clipboard may be unavailable */
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    {linkCopied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                    <span>{linkCopied ? "Copied" : "Copy link"}</span>
                  </button>
                  <a
                    href={provisionInfo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 cursor-pointer"
                  >
                    Open reset page
                  </a>
                </div>
                <p className="text-[10px] font-medium text-slate-400 leading-normal">
                  Shown here for convenience (useful when email delivery isn't configured locally). The same link
                  was emailed to the employee.
                </p>
              </div>
            )}

            <div className="flex justify-end border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setProvisionInfo(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TOAST NOTIFICATION ==================== */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom duration-300">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold max-w-sm">
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
