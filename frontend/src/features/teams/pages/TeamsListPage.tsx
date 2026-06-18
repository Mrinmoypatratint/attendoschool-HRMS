/**
 * TeamsListPage
 * -----------------------------------------------------------------------------
 * Lists, creates, edits, and deletes teams for the active tenant. Teams belong
 * to a department and carry an optional lead plus a member roster. Data is
 * loaded alongside departments and employees (scoped by the caller's data
 * access level). Mutating actions are gated behind RBAC permission checks
 * (teams.create / teams.update / teams.delete).
 */
import { getFriendlyErrorMessage } from "../../../lib/errors";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../auth/context/AuthContext";
import { useHasPermission } from "../../rbac/hooks/usePermissions";
import { TeamService } from "../services/teamService";
import { EmployeeService } from "../../employees/services/employeeService";
import { Skeleton } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/ErrorState";
import { EmptyState } from "../../../components/ui/EmptyState";
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  X,
  Network,
  Search,
  UserCheck,
  FolderTree,
} from "lucide-react";
import type { Team, Department, Employee } from "@hrms/middleware";

/**
 * Renders the teams management page: a searchable/filterable grid of team
 * cards plus a create/edit modal. Reads auth context for tenant scoping and
 * RBAC permissions, and refreshes data after each successful mutation.
 */
export function TeamsListPage() {
  const { profile, user, dataAccessLevel } = useAuth();
  const tenantId = profile?.activeTenantId || "";

  // Permissions
  const hasPerm = useHasPermission();
  const canCreateTeam = hasPerm("teams.create");
  const canEditTeam = hasPerm("teams.update");
  const canDeleteTeam = hasPerm("teams.delete");

  const callerInfo = user ? { uid: user.uid, email: user.email || "" } : undefined;

  // Data state
  const [teams, setTeams] = useState<Team[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [callerEmployee, setCallerEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  // Form inputs
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);

    try {
      let resolvedCallerEmp: Employee | null = null;
      if (user?.uid) {
        resolvedCallerEmp = await EmployeeService.getCallerEmployee(tenantId, user.uid);
      }
      setCallerEmployee(resolvedCallerEmp);

      const [teamsData, deptsData, empsData] = await Promise.all([
        TeamService.getTeams(tenantId),
        EmployeeService.getDepartments(tenantId),
        EmployeeService.getEmployees(tenantId, dataAccessLevel, resolvedCallerEmp),
      ]);
      setTeams(teamsData);
      setDepartments(deptsData);
      setEmployees(empsData);
    } catch (err: unknown) {
      const message = getFriendlyErrorMessage(err, "Failed to load teams.");
      console.error("Error loading teams:", err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [tenantId, user, dataAccessLevel]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open Create modal
  const handleOpenCreate = () => {
    setEditingTeam(null);
    setTeamName("");
    setTeamDescription("");
    const firstDept = departments[0];
    setSelectedDeptId(firstDept ? firstDept.id : "");
    setSelectedLeadId("");
    setSelectedMemberIds([]);
    setModalOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (team: Team) => {
    setEditingTeam(team);
    setTeamName(team.name);
    setTeamDescription(team.description);
    setSelectedDeptId(team.departmentId);
    setSelectedLeadId(team.leadId || "");
    setSelectedMemberIds([...team.memberIds]);
    setModalOpen(true);
  };

  // Submit create/update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setSaveLoading(true);

    const teamData: Omit<Team, "id" | "tenantId" | "createdAt" | "updatedAt"> = {
      name: teamName,
      description: teamDescription,
      departmentId: selectedDeptId,
      memberIds: selectedMemberIds,
    };

    if (selectedLeadId) {
      teamData.leadId = selectedLeadId;
    }

    try {
      if (editingTeam) {
        await TeamService.updateTeam(editingTeam.id, teamData, callerInfo);
        alert("Team updated successfully!");
      } else {
        await TeamService.createTeam(tenantId, teamData, callerInfo);
        alert("Team created successfully!");
      }
      setModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const message = getFriendlyErrorMessage(err, "Failed to save team.");
      console.error(err);
      alert(message);
    } finally {
      setSaveLoading(false);
    }
  };

  // Delete team
  const handleDeleteTeam = async (teamId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete team "${name}"?`)) return;
    try {
      await TeamService.deleteTeam(teamId, callerInfo);
      alert("Team deleted.");
      fetchData();
    } catch (err: unknown) {
      const message = getFriendlyErrorMessage(err, "Failed to delete team.");
      console.error(err);
      alert(message);
    }
  };

  // Toggle member selection
  const toggleMember = (empId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  // Filter teams
  const filteredTeams = teams.filter((team) => {
    const matchesSearch = team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptFilter === "all" || team.departmentId === deptFilter;
    return matchesSearch && matchesDept;
  });

  // Helpers
  const getDeptName = (deptId: string) =>
    departments.find((d) => d.id === deptId)?.name || "Unassigned";

  const getEmployeeName = (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    return emp ? `${emp.firstName} ${emp.lastName}` : "Unknown";
  };

  const getEmployeeInitials = (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    return emp
      ? `${emp.firstName.substring(0, 1)}${emp.lastName.substring(0, 1)}`
      : "??";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState description={error} onRetry={fetchData} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Teams</h1>
          <p className="text-sm text-slate-500">
            Manage cross-functional teams within your organization's departments.
          </p>
        </div>

        {canCreateTeam && (
          <button
            onClick={handleOpenCreate}
            className="self-start inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <Plus size={16} />
            <span>Create Team</span>
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search teams by name or description..."
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
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>

        <div className="text-xs font-bold text-slate-500">
          {filteredTeams.length} team{filteredTeams.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Team Cards Grid */}
      {filteredTeams.length === 0 ? (
        <EmptyState
          title="No teams found"
          description={
            teams.length === 0
              ? "Your organization hasn't created any teams yet. Start by creating your first team."
              : "No teams match your current search or filter. Try adjusting your criteria."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTeams.map((team) => {
            const memberCount = team.memberIds.length;
            const leadName = team.leadId
              ? getEmployeeName(team.leadId)
              : "No lead assigned";
            const deptName = getDeptName(team.departmentId);

            return (
              <div
                key={team.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow relative group"
              >
                {/* Action Buttons */}
                {(canEditTeam || canDeleteTeam) && (
                  <div className="absolute right-4 top-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {canEditTeam && (
                      <button
                        onClick={() => handleOpenEdit(team)}
                        className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 cursor-pointer"
                        title="Edit Team"
                      >
                        <Edit2 size={14} />
                      </button>
                    )}
                    {canDeleteTeam && (
                      <button
                        onClick={() => handleDeleteTeam(team.id, team.name)}
                        className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
                        title="Delete Team"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )}

                {/* Team Info */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <Network size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{team.name}</h3>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold">
                        <FolderTree size={10} />
                        <span>{deptName}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal pt-1">
                    {team.description || "No description provided."}
                  </p>
                </div>

                {/* Team Lead & Members */}
                <div className="border-t border-slate-100 pt-3 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Team Lead
                      </div>
                      <div className="font-semibold text-slate-700 mt-0.5 flex items-center gap-1.5">
                        <UserCheck size={12} className="text-indigo-500" />
                        {leadName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Members
                      </div>
                      <div className="font-extrabold text-indigo-600 text-sm mt-0.5">
                        {memberCount}
                      </div>
                    </div>
                  </div>

                  {/* Member Avatars */}
                  {memberCount > 0 && (
                    <div className="flex items-center -space-x-2">
                      {team.memberIds.slice(0, 5).map((memberId) => (
                        <div
                          key={memberId}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[9px] font-extrabold text-slate-600 border-2 border-white"
                          title={getEmployeeName(memberId)}
                        >
                          {getEmployeeInitials(memberId)}
                        </div>
                      ))}
                      {memberCount > 5 && (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-[9px] font-extrabold text-indigo-600 border-2 border-white">
                          +{memberCount - 5}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==================== CREATE / EDIT TEAM MODAL ==================== */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-md relative overflow-y-auto max-h-[90dvh] space-y-4">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Network size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">
                  {editingTeam ? "Edit Team" : "Create New Team"}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingTeam
                    ? "Update team details, lead assignment, and member roster."
                    : "Assemble a new team under an organizational department."}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Team Name */}
                <div>
                  <label
                    htmlFor="team-name"
                    className="text-slate-600 font-bold block mb-1"
                  >
                    Team Name
                  </label>
                  <input
                    id="team-name"
                    type="text"
                    required
                    placeholder="e.g. Frontend Squad"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-600 transition-all font-semibold"
                  />
                </div>

                {/* Department */}
                <div>
                  <label
                    htmlFor="team-dept"
                    className="text-slate-600 font-bold block mb-1"
                  >
                    Department
                  </label>
                  <select
                    id="team-dept"
                    required
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-600 font-semibold"
                  >
                    <option value="">Select a department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="team-desc"
                  className="text-slate-600 font-bold block mb-1"
                >
                  Description
                </label>
                <input
                  id="team-desc"
                  type="text"
                  placeholder="e.g. Responsible for all client-facing UI development"
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-600 transition-all font-semibold"
                />
              </div>

              {/* Team Lead */}
              <div>
                <label
                  htmlFor="team-lead"
                  className="text-slate-600 font-bold block mb-1"
                >
                  Team Lead
                </label>
                <select
                  id="team-lead"
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-600 font-semibold"
                >
                  <option value="">No Lead Assigned</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} — {emp.jobTitle}
                    </option>
                  ))}
                </select>
              </div>

              {/* Member Selection */}
              <div>
                <label className="text-slate-600 font-bold block mb-2">
                  Team Members ({selectedMemberIds.length} selected)
                </label>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                  {employees.length === 0 ? (
                    <div className="px-4 py-6 text-center text-slate-400 text-xs">
                      No employees found. Create employees first.
                    </div>
                  ) : (
                    employees.map((emp) => {
                      const isSelected = selectedMemberIds.includes(emp.id);
                      return (
                        <label
                          key={emp.id}
                          className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-indigo-50/60"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleMember(emp.id)}
                            className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-200"
                          />
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[9px] font-extrabold text-slate-600">
                            {emp.firstName.substring(0, 1)}
                            {emp.lastName.substring(0, 1)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-slate-900 font-semibold">
                              {emp.firstName} {emp.lastName}
                            </span>
                            <span className="ml-2 text-slate-400">
                              {emp.jobTitle}
                            </span>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end border-t border-slate-100 pt-4 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {saveLoading
                    ? "Saving..."
                    : editingTeam
                    ? "Update Team"
                    : "Create Team"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Additive default export; named export `TeamsListPage` is preserved above.
export default TeamsListPage;
