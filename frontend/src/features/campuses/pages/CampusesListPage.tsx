import { useState, useEffect, useCallback } from "react";
import { 
  Building2, 
  Plus, 
  MapPin, 
  Clock, 
  UserCheck, 
  Search, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  Users
} from "lucide-react";
import { CampusService } from "../services/campusService";
import { EmployeeService } from "../../employees/services/employeeService";
import { useAuth } from "../../auth/context/AuthContext";
import { useHasPermission } from "../../rbac/hooks/usePermissions";
import type { Campus, Employee } from "@hrms/middleware";

export function CampusesListPage() {
  const { activeTenant, user } = useAuth();
  const tenantId = activeTenant?.id || "";

  const hasPerm = useHasPermission();
  const hasCreate = hasPerm("campuses.create");
  const hasUpdate = hasPerm("campuses.update");
  const hasDelete = hasPerm("campuses.delete");

  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCampus, setEditingCampus] = useState<Campus | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    address: "",
    city: "",
    state: "",
    phone: "",
    email: "",
    headOfCampusId: "",
    workingHoursStart: "08:00",
    workingHoursEnd: "16:30",
    isActive: true,
  });
  const [errorMsg, setErrorMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const [campusList, empList] = await Promise.all([
        CampusService.getCampuses(tenantId),
        EmployeeService.getEmployees(tenantId, "all", null),
      ]);
      setCampuses(campusList);
      setEmployees(empList);
    } catch (err) {
      console.error("Error loading campuses:", err);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAdd = () => {
    setEditingCampus(null);
    setFormData({
      name: "",
      code: "",
      address: "",
      city: "",
      state: "",
      phone: "",
      email: "",
      headOfCampusId: "",
      workingHoursStart: "08:00",
      workingHoursEnd: "16:30",
      isActive: true,
    });
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleOpenEdit = (c: Campus) => {
    setEditingCampus(c);
    setFormData({
      name: c.name,
      code: c.code,
      address: c.address,
      city: c.city || "",
      state: c.state || "",
      phone: c.phone || "",
      email: c.email || "",
      headOfCampusId: c.headOfCampusId || "",
      workingHoursStart: c.workingHoursStart || "08:00",
      workingHoursEnd: c.workingHoursEnd || "16:30",
      isActive: c.isActive,
    });
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim() || !formData.address.trim()) {
      setErrorMsg("Name, code, and address are required.");
      return;
    }

    setSaving(true);
    setErrorMsg("");
    try {
      const selectedHead = employees.find((emp) => emp.id === formData.headOfCampusId);
      const headName = selectedHead ? `${selectedHead.firstName} ${selectedHead.lastName}` : undefined;

      const caller = user ? { uid: user.uid, email: user.email || "" } : undefined;

      if (editingCampus) {
        await CampusService.updateCampus(
          editingCampus.id,
          {
            ...formData,
            headOfCampusName: headName,
          },
          caller
        );
      } else {
        await CampusService.createCampus(
          tenantId,
          {
            ...formData,
            headOfCampusName: headName,
          },
          caller
        );
      }
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save campus.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete campus "${name}"?`)) return;
    try {
      const caller = user ? { uid: user.uid, email: user.email || "" } : undefined;
      await CampusService.deleteCampus(id, caller);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete campus.");
    }
  };

  const filteredCampuses = campuses.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.city && c.city.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">Campuses & Branches</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage physical campuses, branch codes, operating hours, and institutional branch leadership.
          </p>
        </div>

        {hasCreate && (
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            <Plus size={16} />
            Add Campus
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by campus name, code, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>
        <div className="text-xs font-semibold text-slate-500">
          Total Campuses: <span className="text-slate-900 font-bold">{campuses.length}</span>
        </div>
      </div>

      {/* Campuses Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-slate-500 text-sm">
          Loading campuses...
        </div>
      ) : filteredCampuses.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <Building2 className="mx-auto h-10 w-10 text-slate-300 mb-3" />
          <h3 className="text-base font-semibold text-slate-900">No campuses found</h3>
          <p className="text-sm text-slate-500 mt-1">
            {searchQuery ? "Try adjusting your search query." : "Get started by adding your institution's first campus or branch."}
          </p>
          {hasCreate && !searchQuery && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={16} />
              Add First Campus
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCampuses.map((c) => {
            const assignedCount = employees.filter((emp) => emp.campusId === c.id).length;
            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-block px-2 py-0.5 text-xs font-bold uppercase rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 mb-1.5">
                        {c.code}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900">{c.name}</h3>
                    </div>
                    {c.isActive ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={12} /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        <XCircle size={12} /> Inactive
                      </span>
                    )}
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-slate-600">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>{c.address}{c.city ? `, ${c.city}` : ""}{c.state ? `, ${c.state}` : ""}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>Operating: {c.workingHoursStart || "08:00"} — {c.workingHoursEnd || "16:30"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>Head of Campus: <strong className="text-slate-800">{c.headOfCampusName || "Not assigned"}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <Users size={14} className="text-blue-500" />
                    <span>{assignedCount} Staff Assigned</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasUpdate && (
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(c)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-50 transition"
                        title="Edit campus"
                      >
                        <Edit2 size={15} />
                      </button>
                    )}
                    {hasDelete && (
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id, c.name)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-50 transition"
                        title="Delete campus"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Dialog for Add / Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 my-8">
            <h2 className="text-lg font-bold text-slate-900">
              {editingCampus ? "Edit Campus / Branch" : "Add New Campus / Branch"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure branch identification, address, and administrative leadership.
            </p>

            {errorMsg && (
              <div className="mt-3 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Campus Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. North Campus"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NC-01"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg uppercase focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Street Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 104 Academic Avenue, Sector 4"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Cambridge"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State / Province</label>
                  <input
                    type="text"
                    placeholder="e.g. MA"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Head of Campus / Branch Principal
                </label>
                <select
                  value={formData.headOfCampusId}
                  onChange={(e) => setFormData({ ...formData, headOfCampusId: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                >
                  <option value="">-- Select designated leader (optional) --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.jobTitle})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Shift Start</label>
                  <input
                    type="time"
                    value={formData.workingHoursStart}
                    onChange={(e) => setFormData({ ...formData, workingHoursStart: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Shift End</label>
                  <input
                    type="time"
                    value={formData.workingHoursEnd}
                    onChange={(e) => setFormData({ ...formData, workingHoursEnd: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveCampus"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isActiveCampus" className="text-xs font-medium text-slate-700">
                  Campus is active and open for staff allocations
                </label>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {saving ? "Saving..." : editingCampus ? "Update Campus" : "Create Campus"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default CampusesListPage;
