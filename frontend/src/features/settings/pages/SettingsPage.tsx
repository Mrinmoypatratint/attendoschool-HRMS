/**
 * SettingsPage
 * -----------------------------------------------------------------------------
 * Organization settings screen for a tenant. Provides three tabbed sections:
 *   1. Details   – company name, industry, timezone, address, and logo upload.
 *   2. Branding  – primary brand color, support email, and a live preview.
 *   3. Audit     – a filterable, read-only view of the tenant's audit trail.
 *
 * Mutations (details/branding) write to the tenant document in Firestore and
 * emit audit-log entries. Editing controls are gated behind tenant role checks
 * (org_admin / super_admin / hr_manager).
 */
import { getFriendlyErrorMessage } from "../../../lib/errors";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../../lib/firebase";
import { useAuth } from "../../auth/context/AuthContext";
import { Skeleton } from "../../../components/ui/Skeleton";
import { Building2, Upload, MapPin, Globe, CheckCircle, Palette, Activity, Mail, RefreshCw, Check } from "lucide-react";
import { AuditLogService } from "../services/auditLogService";
import type { AuditLog } from "@hrms/middleware";

const settingsSchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters"),
  industry: z.string().min(2, "Please enter an industry"),
  timezone: z.string().min(2, "Please select a timezone"),
  address: z.string().min(5, "Please enter a valid company address"),
});

type SettingsForm = z.infer<typeof settingsSchema>;

const COLOR_PRESETS = [
  { value: "#2563eb", label: "Classic Blue" },
  { value: "#7c3aed", label: "Deep Purple" },
  { value: "#4f46e5", label: "Indigo Accent" },
  { value: "#10b981", label: "Emerald Green" },
  { value: "#f43f5e", label: "Rose Petal" },
  { value: "#d97706", label: "Amber Glow" },
  { value: "#475569", label: "Slate Grey" },
  { value: "#ea580c", label: "Vibrant Orange" },
];

/**
 * Renders the organization settings page with tabbed Details, Branding, and
 * Audit Logs sections. Reads the active tenant/profile from auth context and
 * persists changes to the tenant document while recording audit entries.
 */
export function SettingsPage() {
  const { activeTenant, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"details" | "branding" | "audit">("details");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Logo upload state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Custom branding states
  const [brandingColor, setBrandingColor] = useState("#2563eb");
  const [supportEmail, setSupportEmail] = useState("");
  const [savingBranding, setSavingBranding] = useState(false);

  // Audit Logs states
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditFilterAction, setAuditFilterAction] = useState("all");
  const [auditFilterResource, setAuditFilterResource] = useState("all");

  const tenantId = profile?.activeTenantId || "";
  const primaryColor = activeTenant?.primaryColor || "#2563eb";

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: "",
      industry: "",
      timezone: "",
      address: "",
    },
  });

  useEffect(() => {
    if (activeTenant) {
      setValue("name", activeTenant.name);
      setValue("industry", activeTenant.industry);
      setValue("timezone", activeTenant.timezone);
      setValue("address", activeTenant.address);
      if (activeTenant.logoURL) {
        setLogoPreview(activeTenant.logoURL);
      }
      setBrandingColor(activeTenant.primaryColor || "#2563eb");
      setSupportEmail(activeTenant.supportEmail || "");
    }
  }, [activeTenant, setValue]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const onDetailsSubmit = async (data: SettingsForm) => {
    if (!tenantId || !profile) return;

    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      let finalLogoURL = activeTenant?.logoURL || null;

      if (logoFile) {
        setUploadingLogo(true);
        const logoRef = ref(storage, `tenants/${tenantId}/logos/logo_${Date.now()}`);
        const uploadResult = await uploadBytes(logoRef, logoFile);
        finalLogoURL = await getDownloadURL(uploadResult.ref);
        setUploadingLogo(false);
      }

      const tenantRef = doc(db, "tenants", tenantId);
      await updateDoc(tenantRef, {
        name: data.name,
        industry: data.industry,
        timezone: data.timezone,
        address: data.address,
        logoURL: finalLogoURL,
        updatedAt: Date.now(),
      });

      // Write Audit Log
      await AuditLogService.createAuditLog(tenantId, {
        userId: profile.id,
        userEmail: profile.email,
        action: "update",
        resource: "tenant",
        resourceId: tenantId,
        details: `Updated company details (Name: "${data.name}", Industry: "${data.industry}")`,
      });

      setSuccess(true);
      setLogoFile(null);
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyErrorMessage(err, "Failed to save organization settings."));
    } finally {
      setSaving(false);
    }
  };

  const onBrandingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !profile) return;

    setSavingBranding(true);
    setSuccess(false);
    setError(null);

    try {
      const tenantRef = doc(db, "tenants", tenantId);
      await updateDoc(tenantRef, {
        primaryColor: brandingColor,
        supportEmail: supportEmail,
        updatedAt: Date.now(),
      });

      // Write Audit Log
      await AuditLogService.createAuditLog(tenantId, {
        userId: profile.id,
        userEmail: profile.email,
        action: "branding_change",
        resource: "tenant",
        resourceId: tenantId,
        details: `Updated branding settings (Primary Color: "${brandingColor}", Support Email: "${supportEmail}")`,
      });

      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyErrorMessage(err, "Failed to save branding settings."));
    } finally {
      setSavingBranding(false);
    }
  };

  const fetchAuditLogs = async () => {
    if (!tenantId) return;
    setLoadingAudit(true);
    try {
      const logs = await AuditLogService.getAuditLogs(tenantId);
      setAuditLogs(logs);
    } catch (err: any) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (activeTab === "audit") {
      fetchAuditLogs();
    }
  }, [activeTab, tenantId]);

  const currentUserRole = profile?.tenants[tenantId]?.role || "";
  const isAuthorizedToManage =
    currentUserRole === "org_admin" || currentUserRole === "super_admin" || currentUserRole === "hr_manager";

  if (!activeTenant) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Filter logs locally
  const filteredAuditLogs = auditLogs.filter((log) => {
    const logAction = log.action as string;
    const logResource = (log.resource || "role") as string;
    if (auditFilterAction !== "all" && logAction !== auditFilterAction) {
      // support legacy action checks if mapping isn't fully completed in some older logs
      const isLegacyMatch = 
        (auditFilterAction === "create" && logAction === "role.create") ||
        (auditFilterAction === "update" && logAction === "role.update") ||
        (auditFilterAction === "delete" && logAction === "role.delete") ||
        (auditFilterAction === "role_change" && (logAction === "user.role_assign" || logAction === "user.role_remove"));
      if (!isLegacyMatch) return false;
    }
    if (auditFilterResource !== "all" && logResource !== auditFilterResource) {
      // If resource is empty (older mock logs), we check if action starts with 'role' or 'user'
      const isLegacyMatch = 
        (auditFilterResource === "role" && (logAction.includes("role") || logResource === "role"));
      if (!isLegacyMatch && logResource) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Organization Settings</h1>
        <p className="text-sm text-slate-500">Manage company details, custom branding, and audit histories.</p>
      </div>

      {/* Dynamic Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => {
            setActiveTab("details");
            setSuccess(false);
            setError(null);
          }}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-bold border-b-2 cursor-pointer transition-all ${
            activeTab === "details"
              ? "text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
          style={activeTab === "details" ? { borderColor: primaryColor, color: primaryColor } : {}}
        >
          <Building2 size={16} />
          <span>Details</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("branding");
            setSuccess(false);
            setError(null);
          }}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-bold border-b-2 cursor-pointer transition-all ${
            activeTab === "branding"
              ? "text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
          style={activeTab === "branding" ? { borderColor: primaryColor, color: primaryColor } : {}}
        >
          <Palette size={16} />
          <span>Branding Customizer</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("audit");
            setSuccess(false);
            setError(null);
          }}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-bold border-b-2 cursor-pointer transition-all ${
            activeTab === "audit"
              ? "text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
          style={activeTab === "audit" ? { borderColor: primaryColor, color: primaryColor } : {}}
        >
          <Activity size={16} />
          <span>Audit Logs</span>
        </button>
      </div>

      {success && (
        <div className="rounded-xl bg-green-50 p-4 text-sm font-medium text-green-700 border border-green-100 flex items-center gap-2">
          <CheckCircle size={18} />
          <span>Settings saved successfully!</span>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700 border border-red-100">
          {error}
        </div>
      )}

      {/* ==================== TAB 1: COMPANY DETAILS ==================== */}
      {activeTab === "details" && (
        <form onSubmit={handleSubmit(onDetailsSubmit)} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Card: Branding Logo */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1 flex flex-col items-center text-center">
            <h2 className="text-sm font-bold text-slate-800 self-start mb-4">Company Logo</h2>

            {/* Logo container */}
            <div className="relative flex h-32 w-32 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 overflow-hidden group">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo preview" className="h-full w-full object-cover" />
              ) : (
                <Building2 size={40} className="text-slate-300" />
              )}

              {isAuthorizedToManage && (
                <label className="absolute inset-0 bg-slate-900/50 flex flex-col items-center justify-center text-white text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Upload size={18} className="mb-1" />
                  Change Logo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="sr-only"
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-3">Supports JPG, PNG. Max size 2MB.</p>
            {uploadingLogo && <p className="text-xs text-blue-600 mt-2 font-semibold animate-pulse">Uploading logo...</p>}
          </div>

          {/* Right Card: Fields */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2 space-y-4">
            <h2 className="text-sm font-bold text-slate-800">Company Details</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="company-name" className="text-xs font-bold text-slate-600">
                  Company Name
                </label>
                <input
                  id="company-name"
                  type="text"
                  disabled={!isAuthorizedToManage}
                  placeholder="Acme Corp"
                  {...register("name")}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all disabled:bg-slate-50"
                  style={isAuthorizedToManage ? {} : { backgroundColor: "#f8fafc" }}
                />
                {errors.name && (
                  <p className="mt-1.5 text-[10px] font-semibold text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="industry" className="text-xs font-bold text-slate-600">
                  Industry
                </label>
                <input
                  id="industry"
                  type="text"
                  disabled={!isAuthorizedToManage}
                  placeholder="Technology"
                  {...register("industry")}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all disabled:bg-slate-50"
                  style={isAuthorizedToManage ? {} : { backgroundColor: "#f8fafc" }}
                />
                {errors.industry && (
                  <p className="mt-1.5 text-[10px] font-semibold text-red-600">{errors.industry.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="timezone" className="text-xs font-bold text-slate-600 flex items-center gap-1">
                  <Globe size={12} className="text-slate-400" />
                  Timezone
                </label>
                <select
                  id="timezone"
                  disabled={!isAuthorizedToManage}
                  {...register("timezone")}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-semibold text-slate-700 disabled:bg-slate-50"
                  style={isAuthorizedToManage ? {} : { backgroundColor: "#f8fafc" }}
                >
                  <option value="GMT-8:00">PST (Pacific Standard Time - GMT-8)</option>
                  <option value="GMT-5:00">EST (Eastern Standard Time - GMT-5)</option>
                  <option value="GMT+0:00">UTC (Coordinated Universal Time - GMT)</option>
                  <option value="GMT+1:00">CET (Central European Time - GMT+1)</option>
                  <option value="GMT+5:30">IST (India Standard Time - GMT+5:30)</option>
                  <option value="GMT+8:00">SGT (Singapore Time - GMT+8)</option>
                </select>
              </div>

              <div>
                <label htmlFor="address" className="text-xs font-bold text-slate-600 flex items-center gap-1">
                  <MapPin size={12} className="text-slate-400" />
                  Company Address
                </label>
                <input
                  id="address"
                  type="text"
                  disabled={!isAuthorizedToManage}
                  placeholder="123 Corporate Way, City"
                  {...register("address")}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all disabled:bg-slate-50"
                  style={isAuthorizedToManage ? {} : { backgroundColor: "#f8fafc" }}
                />
                {errors.address && (
                  <p className="mt-1.5 text-[10px] font-semibold text-red-600">{errors.address.message}</p>
                )}
              </div>
            </div>

            {isAuthorizedToManage && (
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl px-5 py-2.5 text-xs font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  {saving ? "Saving Changes..." : "Save Settings"}
                </button>
              </div>
            )}
          </div>
        </form>
      )}

      {/* ==================== TAB 2: BRANDING CUSTOMIZER ==================== */}
      {activeTab === "branding" && (
        <form onSubmit={onBrandingSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Customizer Panel */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2 space-y-6">
            <h2 className="text-sm font-bold text-slate-800">Custom Branding Layout</h2>

            {/* Colors picker */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-600 block">
                Primary Brand Color
              </label>
              <div className="flex flex-wrap gap-2.5">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setBrandingColor(preset.value)}
                    className="h-8 w-8 rounded-full border border-slate-300 relative flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
                    style={{ backgroundColor: preset.value }}
                    title={preset.label}
                  >
                    {brandingColor === preset.value && (
                      <Check size={14} className="text-white drop-shadow-md" />
                    )}
                  </button>
                ))}
                
                {/* Custom Color Selector */}
                <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-2.5 py-1 bg-slate-50">
                  <input
                    type="color"
                    value={brandingColor}
                    onChange={(e) => setBrandingColor(e.target.value)}
                    className="h-6 w-8 rounded border border-slate-300 cursor-pointer"
                  />
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    {brandingColor}
                  </span>
                </div>
              </div>
            </div>

            {/* Support Email */}
            <div className="space-y-1.5 max-w-md">
              <label htmlFor="support-email" className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <Mail size={12} className="text-slate-400" />
                Support Email Address
              </label>
              <input
                id="support-email"
                type="email"
                required
                disabled={!isAuthorizedToManage}
                placeholder="support@company.com"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all disabled:bg-slate-50"
                style={isAuthorizedToManage ? {} : { backgroundColor: "#f8fafc" }}
              />
              <p className="text-[10px] text-slate-400">
                This email is displayed to tenant members in portals and support queries.
              </p>
            </div>

            {isAuthorizedToManage && (
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={savingBranding}
                  className="rounded-xl px-5 py-2.5 text-xs font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                  style={{ backgroundColor: brandingColor }}
                >
                  {savingBranding ? "Applying Branding..." : "Update Branding"}
                </button>
              </div>
            )}
          </div>

          {/* Real-time branding visual preview card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1 space-y-4">
            <h2 className="text-sm font-bold text-slate-800">Dynamic Preview</h2>
            <p className="text-xs text-slate-500 leading-normal">
              Observe how your selected primary color and support email apply across the portal navigation and branding elements.
            </p>

            <div className="border border-slate-200 rounded-2xl bg-slate-50 p-4 space-y-3">
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden h-48 flex">
                {/* Mock Sidebar */}
                <div className="w-1/4 border-r border-slate-100 p-2 space-y-2 flex flex-col justify-between bg-white">
                  <div className="space-y-1.5">
                    {/* Mock Logo */}
                    {logoPreview ? (
                      <img src={logoPreview} alt="mock" className="h-4 w-4 rounded object-cover" />
                    ) : (
                      <div className="h-4 w-4 rounded" style={{ backgroundColor: brandingColor }} />
                    )}
                    <div className="h-1.5 w-full rounded bg-slate-100" />
                    <div className="h-1.5 w-5/6 rounded bg-slate-100" />
                    <div className="h-2 w-3/4 rounded" style={{ backgroundColor: `${brandingColor}15` }} /> {/* active menu */}
                  </div>
                  <div className="h-1.5 w-1/2 rounded bg-slate-100" />
                </div>
                {/* Mock Content area */}
                <div className="flex-1 p-3 space-y-3 bg-slate-50/30">
                  {/* Mock Header */}
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <div className="h-2 w-16 bg-slate-100 rounded" />
                    <div className="flex gap-1.5">
                      <div className="h-3 w-3 bg-slate-100 rounded-full" />
                      <div className="h-3 w-6 rounded" style={{ backgroundColor: `${brandingColor}20`, border: `1px solid ${brandingColor}` }} />
                    </div>
                  </div>
                  {/* Mock Dashboard Widget */}
                  <div className="p-2.5 border border-slate-100 rounded-lg space-y-1.5 bg-white shadow-2xs">
                    <div className="h-2 w-1/3 bg-slate-200 rounded" />
                    <div className="h-1.5 w-full bg-slate-100 rounded" />
                    <div className="flex justify-end pt-1">
                      <div className="h-4.5 w-12 rounded-md text-white text-[8px] font-bold flex items-center justify-center" style={{ backgroundColor: brandingColor }}>
                        Submit
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {supportEmail && (
              <div className="rounded-xl border border-slate-100 p-3 bg-slate-50/50 space-y-1">
                <div className="text-[9px] font-bold text-slate-400 uppercase">Need Help?</div>
                <div className="text-[10px] font-bold text-slate-700 flex items-center gap-1">
                  <Mail size={10} style={{ color: brandingColor }} />
                  <span>{supportEmail}</span>
                </div>
              </div>
            )}
          </div>
        </form>
      )}

      {/* ==================== TAB 3: AUDIT LOGS VIEWER ==================== */}
      {activeTab === "audit" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">System Audit Trail</h2>
              <p className="text-xs text-slate-500">
                A historical log of critical modifications made inside this organization.
              </p>
            </div>

            {/* Filtering parameters */}
            <div className="flex flex-wrap gap-2">
              <select
                value={auditFilterAction}
                onChange={(e) => setAuditFilterAction(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-blue-600"
              >
                <option value="all">All Actions</option>
                <option value="create">Created</option>
                <option value="update">Updated</option>
                <option value="delete">Deleted</option>
                <option value="role_change">Role Assignment</option>
                <option value="branding_change">Branding Settings</option>
              </select>

              <select
                value={auditFilterResource}
                onChange={(e) => setAuditFilterResource(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-blue-600"
              >
                <option value="all">All Resources</option>
                <option value="employee">Employees</option>
                <option value="department">Departments</option>
                <option value="team">Teams</option>
                <option value="role">Roles</option>
                <option value="tenant">Tenant Settings</option>
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
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : filteredAuditLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs italic">
              No audit log records matching the criteria.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-5">Date & Time</th>
                      <th className="py-3 px-5">User</th>
                      <th className="py-3 px-5">Action</th>
                      <th className="py-3 px-5">Resource</th>
                      <th className="py-3 px-5">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                    {filteredAuditLogs.map((log) => {
                      // Determine badge stylings
                      const logAction = log.action as string;
                      const logResource = (log.resource || "role") as string;
                      let actionText = logAction;
                      let resourceText = logResource;
                      
                      let actionBadge = "bg-slate-100 text-slate-700 border-slate-200";
                      if (logAction === "create" || logAction === "role.create") {
                        actionBadge = "bg-green-50 text-green-700 border-green-200";
                        actionText = "create";
                      } else if (logAction === "update" || logAction === "role.update") {
                        actionBadge = "bg-blue-50 text-blue-700 border-blue-200";
                        actionText = "update";
                      } else if (logAction === "delete" || logAction === "role.delete") {
                        actionBadge = "bg-red-50 text-red-700 border-red-200";
                        actionText = "delete";
                      } else if (logAction === "branding_change") {
                        actionBadge = "bg-amber-50 text-amber-700 border-amber-200";
                        actionText = "branding";
                      } else if (logAction === "role_change" || logAction === "user.role_assign" || logAction === "user.role_remove") {
                        actionBadge = "bg-indigo-50 text-indigo-700 border-indigo-200";
                        actionText = "privileges";
                      }

                      let resourceBadge = "bg-slate-50 text-slate-600";
                      if (resourceText === "employee") resourceBadge = "bg-sky-50 text-sky-700";
                      else if (resourceText === "department") resourceBadge = "bg-teal-50 text-teal-700";
                      else if (resourceText === "team") resourceBadge = "bg-purple-50 text-purple-700";
                      else if (resourceText === "role") resourceBadge = "bg-violet-50 text-violet-700";
                      else if (resourceText === "tenant") resourceBadge = "bg-pink-50 text-pink-700";

                      const displayTime = log.timestamp || (log as any).createdAt;

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/20">
                          <td className="py-3.5 px-5 font-semibold text-slate-400 w-[180px]">
                            {new Date(displayTime).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-5 font-bold text-slate-700">
                            {log.userEmail || (log as any).actorName || "system"}
                          </td>
                          <td className="py-3.5 px-5">
                            <span className={`inline-flex px-2 py-0.5 rounded border text-[9px] font-bold uppercase ${actionBadge}`}>
                              {actionText}
                            </span>
                          </td>
                          <td className="py-3.5 px-5">
                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${resourceBadge}`}>
                              {resourceText}
                            </span>
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
    </div>
  );
}

// Additive default export; named export `SettingsPage` is preserved above.
export default SettingsPage;
