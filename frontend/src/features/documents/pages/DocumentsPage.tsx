/**
 * DocumentsPage
 * -------------
 * Document Vault screen: lists tenant documents the caller may read, with
 * sidebar category filters, search, scope tabs (org/employee/candidate), and
 * upload / preview / delete flows. Permissions gate the upload and delete
 * actions, and the data is scoped per the caller's role via DocumentService.
 */
import { getFriendlyErrorMessage } from "../../../lib/errors";
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../auth/context/AuthContext";
import { useHasPermission } from "../../rbac/hooks/usePermissions";
import { DocumentService } from "../services/documentService";
import { EmployeeService } from "../../employees/services/employeeService";
import { CandidateService } from "../../recruitment/services/candidateService";
import { useEmployeeData } from "../../employees/hooks/useEmployeeData";
import { DocumentPreviewModal } from "../components/DocumentPreviewModal";
import type { VaultDocument, DocumentCategory, DocumentType, DocumentAccessLevel, Employee, Candidate } from "@hrms/middleware";
import { 
  Search, Upload, Trash2, Eye, Download, Lock, Users, User, Plus, X, 
  FileText, FileImage, File, ShieldAlert, FolderOpen, Calendar, HelpCircle, HardDrive
} from "lucide-react";

// Static category catalog used for the sidebar filters, badges, and the upload
// form select. `color` holds the Tailwind classes for each category badge.
const CATEGORIES: { value: DocumentCategory; label: string; color: string }[] = [
  { value: "contract", label: "Contracts", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "id_proof", label: "ID Proofs", color: "bg-sky-50 text-sky-700 border-sky-200" },
  { value: "resume", label: "Resumes", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "offer_letter", label: "Offer Letters", color: "bg-pink-50 text-pink-700 border-pink-200" },
  { value: "policy", label: "Policies", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "payslip", label: "Payslips", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "other", label: "Other Documents", color: "bg-slate-50 text-slate-700 border-slate-200" }
];

/** Top-level Document Vault page component (route view). */
export function DocumentsPage() {
  const { profile, activeTenant } = useAuth();
  const tenantId = profile?.activeTenantId || "";
  const primaryColor = activeTenant?.primaryColor || "#2563eb";
  
  // Permissions
  const hasPerm = useHasPermission();
  const canUpload = hasPerm("documents.create") || hasPerm("candidates.create") || hasPerm("employees.update");
  const canDelete = hasPerm("documents.delete") || hasPerm("candidates.delete") || hasPerm("employees.delete");

  // State
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Custom alerts state
  const [deleteDocConfirm, setDeleteDocConfirm] = useState<VaultDocument | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");

  // Modal / Preview States
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<VaultDocument | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Upload Form State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [docName, setDocName] = useState("");
  const [docCategory, setDocCategory] = useState<DocumentCategory>("other");
  const [docType, setDocType] = useState<DocumentType>("general");
  const [targetEmployeeId, setTargetEmployeeId] = useState("");
  const [targetCandidateId, setTargetCandidateId] = useState("");
  const [accessLevel, setAccessLevel] = useState<DocumentAccessLevel>("shared");


  // Load employee data via the standard hook
  const { employees, loading: empLoading } = useEmployeeData();

  const loadDocuments = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const role = profile?.tenants?.[tenantId]?.role || "employee";
      const [docs, cands] = await Promise.all([
        DocumentService.getDocuments(tenantId, { role, uid: profile?.id || "" }),
        CandidateService.getCandidates(tenantId).catch(() => [] as Candidate[])
      ]);
      setDocuments(docs);
      setCandidates(cands);
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyErrorMessage(err, "Failed to load Document Vault."));
    } finally {
      setLoading(false);
    }
  }, [tenantId, profile]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setUploadFile(file);
    if (file && !docName) {
      // Set default name without extension
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
      setDocName(nameWithoutExt);
    }
  };

  // Handle Upload Submission
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !uploadFile) return;
    
    setUploadLoading(true);
    try {
      let targetName = "";
      let targetUserId = "";

      if (docType === "employee") {
        const emp = employees.find(e => e.id === targetEmployeeId);
        if (emp) {
          targetName = `${emp.firstName} ${emp.lastName}`;
          targetUserId = emp.userId || "";
        }
      } else if (docType === "candidate") {
        const cand = candidates.find(c => c.id === targetCandidateId);
        if (cand) {
          targetName = `${cand.firstName} ${cand.lastName}`;
        }
      }

      await DocumentService.uploadDocument(
        tenantId,
        uploadFile,
        {
          name: docName.trim() || uploadFile.name,
          category: docCategory,
          type: docType,
          ...(docType === "employee" && targetEmployeeId ? { targetId: targetEmployeeId, targetName, targetUserId } : {}),
          ...(docType === "candidate" && targetCandidateId ? { targetId: targetCandidateId, targetName } : {}),
          uploadedBy: profile?.id || "",
          uploadedByName: profile?.displayName || "System User",
          accessLevel
        },
        profile ? { uid: profile.id, email: profile.email } : undefined
      );

      // Reset Form & Close
      setUploadModalOpen(false);
      setUploadFile(null);
      setDocName("");
      setDocCategory("other");
      setDocType("general");
      setTargetEmployeeId("");
      setTargetCandidateId("");
      setAccessLevel("shared");
      
      await loadDocuments();
      showToast("Document uploaded successfully!");
    } catch (err: any) {
      console.error(err);
      showToast(getFriendlyErrorMessage(err, "Failed to upload document."));
    } finally {
      setUploadLoading(false);
    }
  };

  // Handle Document Deletion
  const handleDeleteDoc = async () => {
    if (!deleteDocConfirm) return;
    const docToDelete = deleteDocConfirm;
    setDeleteDocConfirm(null);
    try {
      await DocumentService.deleteDocument(
        tenantId,
        docToDelete.id,
        docToDelete.storagePath,
        docToDelete.name,
        profile ? { uid: profile.id, email: profile.email } : undefined
      );
      await loadDocuments();
      showToast(`Document "${docToDelete.name}" deleted successfully.`);
    } catch (err: any) {
      console.error(err);
      showToast(getFriendlyErrorMessage(err, "Failed to delete document."));
    }
  };


  // Format Helper
  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  // Filter Logic
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.targetName && doc.targetName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory;
    const matchesType = selectedType === "all" || doc.type === selectedType;

    return matchesSearch && matchesCategory && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <HardDrive className="h-6 w-6 text-slate-600" />
            Document Vault
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Secure, encrypted documents repository for employees, candidates, and organizational settings.
          </p>
        </div>

        {canUpload && (
          <button
            onClick={() => setUploadModalOpen(true)}
            className="self-start inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
            style={{ backgroundColor: primaryColor }}
          >
            <Upload size={16} />
            <span>Upload Document</span>
          </button>
        )}
      </div>

      {/* Main Section */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Sidebar Categories Panel */}
        <div className="w-full lg:w-60 shrink-0 space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-3">Categories</div>
          <button
            onClick={() => setSelectedCategory("all")}
            className={`w-full flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-bold text-left transition-all cursor-pointer ${
              selectedCategory === "all"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <span>All Documents</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${selectedCategory === "all" ? "bg-slate-800 text-slate-200" : "bg-slate-200 text-slate-600"}`}>
              {documents.length}
            </span>
          </button>
          
          {CATEGORIES.map((cat) => {
            const count = documents.filter(d => d.category === cat.value).length;
            return (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`w-full flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-bold text-left transition-all cursor-pointer ${
                  selectedCategory === cat.value
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${selectedCategory === cat.value ? "bg-slate-800 text-slate-200" : "bg-slate-200 text-slate-600"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* List Content and Filter Bar */}
        <div className="flex-1 space-y-4 min-w-0">
          
          {/* Filters Dashboard */}
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search documents by name or linked owner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-4 text-xs outline-none focus:border-blue-600/60 focus:ring-2 focus:ring-blue-100 transition-all font-semibold"
              />
            </div>

            {/* Scope tabs */}
            <div className="flex rounded-xl bg-slate-150 p-1 font-bold text-xs">
              <button
                onClick={() => setSelectedType("all")}
                className={`rounded-lg px-3 py-1.5 cursor-pointer transition-colors ${selectedType === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"}`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedType("general")}
                className={`rounded-lg px-3 py-1.5 cursor-pointer transition-colors ${selectedType === "general" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"}`}
              >
                Org Docs
              </button>
              <button
                onClick={() => setSelectedType("employee")}
                className={`rounded-lg px-3 py-1.5 cursor-pointer transition-colors ${selectedType === "employee" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"}`}
              >
                Employee Docs
              </button>
              <button
                onClick={() => setSelectedType("candidate")}
                className={`rounded-lg px-3 py-1.5 cursor-pointer transition-colors ${selectedType === "candidate" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"}`}
              >
                Candidate Docs
              </button>
            </div>

          </div>

          {/* Documents Display */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 rounded-2xl border border-slate-200 bg-white p-4 animate-pulse flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-slate-100 rounded-lg" />
                    <div className="space-y-1.5">
                      <div className="h-3 w-40 bg-slate-100 rounded-sm" />
                      <div className="h-2.5 w-24 bg-slate-100 rounded-sm" />
                    </div>
                  </div>
                  <div className="h-7 w-20 bg-slate-100 rounded-lg" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-center text-rose-700">
              <ShieldAlert className="h-10 w-10 mx-auto mb-2 text-rose-500" />
              <h3 className="font-bold text-sm">Failed to load Document Vault</h3>
              <p className="text-xs text-rose-600 mt-1">{error}</p>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
              <FolderOpen className="h-14 w-14 mx-auto mb-3 text-slate-300" />
              <h3 className="font-bold text-slate-800">No documents found</h3>
              <p className="text-xs text-slate-400 mt-1.5 max-w-sm mx-auto">
                {searchQuery || selectedCategory !== "all" || selectedType !== "all" 
                  ? "Try relaxing your filters or check your permissions rules."
                  : "No documents have been uploaded to the vault yet."}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
              <div className="divide-y divide-slate-100">
                {filteredDocs.map((doc) => {
                  const isPdf = doc.contentType.includes("pdf");
                  const isImage = doc.contentType.startsWith("image/");
                  const catColor = CATEGORIES.find(c => c.value === doc.category)?.color || "bg-slate-50 text-slate-700";

                  return (
                    <div key={doc.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/40 transition-colors">
                      
                      {/* Document Meta */}
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-slate-100 border border-slate-200">
                          {isPdf && <FileText className="h-5 w-5 text-rose-500" />}
                          {!isPdf && isImage && <FileImage className="h-5 w-5 text-blue-500" />}
                          {!isPdf && !isImage && <File className="h-5 w-5 text-slate-400" />}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-sm truncate" title={doc.name}>
                            {doc.name}
                          </h4>
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-slate-400 font-semibold text-[10px] mt-0.5">
                            <span>{formatSize(doc.sizeBytes)}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar size={11} />
                              {formatDate(doc.createdAt)}
                            </span>
                            <span>•</span>
                            <span>Uploaded by {doc.uploadedByName}</span>
                          </div>
                        </div>
                      </div>

                      {/* Info Badges & Actions */}
                      <div className="flex flex-wrap items-center gap-3 justify-between sm:justify-end">
                        
                        {/* Scope/Target details */}
                        {doc.targetName && (
                          <div className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                            Linked: <span className="text-slate-800">{doc.targetName}</span>
                          </div>
                        )}

                        {/* Access Level Badge */}
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-100/60 border border-slate-200/60 rounded-md px-2 py-0.5">
                          {doc.accessLevel === "admin_only" && (
                            <>
                              <Lock size={10} className="text-rose-500" />
                              <span>Admin Only</span>
                            </>
                          )}
                          {doc.accessLevel === "employee_self" && (
                            <>
                              <User size={10} className="text-sky-500" />
                              <span>Employee Self</span>
                            </>
                          )}
                          {doc.accessLevel === "shared" && (
                            <>
                              <Users size={10} className="text-emerald-500" />
                              <span>Shared</span>
                            </>
                          )}
                        </div>

                        {/* Category Badge */}
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase border ${catColor}`}>
                          {doc.category}
                        </span>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-white transition-colors cursor-pointer"
                            title="Preview File"
                          >
                            <Eye size={14} />
                          </button>
                          <a
                            href={doc.downloadUrl}
                            download={doc.name}
                            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-white transition-colors cursor-pointer"
                            title="Download File"
                          >
                            <Download size={14} />
                          </a>
                          {canDelete && (
                            <button
                              onClick={() => setDeleteDocConfirm(doc)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete File"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>

                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* ==================== PREVIEW MODAL ==================== */}
      {previewDoc && (
        <DocumentPreviewModal
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {/* ==================== UPLOAD MODAL ==================== */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl relative overflow-y-auto max-h-[90vh]">
            
            <button
              onClick={() => setUploadModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
              aria-label="Close upload modal"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Upload size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Upload New Document</h3>
                <p className="text-xs text-slate-500">Add secure documents to the tenant repository.</p>
              </div>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs font-bold text-slate-700">
              
              {/* File Select */}
              <div className="space-y-1.5">
                <label className="text-slate-600">Select File *</label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-350 hover:border-blue-500 hover:bg-slate-50/50 rounded-2xl cursor-pointer transition-colors p-4">
                    <div className="flex flex-col items-center justify-center text-center">
                      <Upload className="h-8 w-8 text-slate-400 mb-2" />
                      {uploadFile ? (
                        <div className="text-slate-800 text-xs font-semibold max-w-[300px] truncate">
                          {uploadFile.name} ({formatSize(uploadFile.size)})
                        </div>
                      ) : (
                        <div className="text-slate-500 text-xs">
                          Drag and drop or <span className="text-blue-600 underline">click to browse</span>
                        </div>
                      )}
                      <p className="text-[10px] text-slate-400 mt-1">PDF, DOC, DOCX, PNG, JPG, or WEBP</p>
                    </div>
                    <input
                      type="file"
                      required
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              </div>

              {/* Name Input */}
              <div className="space-y-1.5">
                <label htmlFor="doc-name" className="text-slate-600 font-bold">Document Name *</label>
                <input
                  id="doc-name"
                  type="text"
                  required
                  placeholder="E.g., NDA Contract 2026"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs outline-none focus:border-blue-600/60 focus:ring-2 focus:ring-blue-100 transition-all font-semibold"
                />
              </div>

              {/* Category and Access Level grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="doc-category" className="text-slate-600">Category *</label>
                  <select
                    id="doc-category"
                    value={docCategory}
                    onChange={(e) => setDocCategory(e.target.value as DocumentCategory)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 bg-white text-slate-750 outline-none focus:border-blue-600 transition-all"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="doc-access" className="text-slate-600">Access Control *</label>
                  <select
                    id="doc-access"
                    value={accessLevel}
                    onChange={(e) => setAccessLevel(e.target.value as DocumentAccessLevel)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 bg-white text-slate-750 outline-none focus:border-blue-600 transition-all"
                  >
                    <option value="shared">Shared (All Org)</option>
                    <option value="admin_only">Restricted (Admin & HR)</option>
                    <option value="employee_self">Employee Self (Target Only)</option>
                  </select>
                </div>
              </div>

              {/* Target Type selection */}
              <div className="space-y-1.5">
                <label htmlFor="doc-type" className="text-slate-600">Target Type *</label>
                <select
                  id="doc-type"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as DocumentType)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 bg-white text-slate-750 outline-none focus:border-blue-600 transition-all"
                >
                  <option value="general">General Organization Doc</option>
                  <option value="employee">Employee Specific Doc</option>
                  <option value="candidate">Candidate Specific Doc</option>
                </select>
              </div>

              {/* Target selection list dropdowns */}
              {docType === "employee" && (
                <div className="space-y-1.5 animate-in fade-in duration-200">
                  <label htmlFor="target-employee" className="text-slate-600">Link Employee *</label>
                  {empLoading ? (
                    <div className="h-9 w-full bg-slate-50 border border-slate-200 rounded-xl animate-pulse" />
                  ) : (
                    <select
                      id="target-employee"
                      required
                      value={targetEmployeeId}
                      onChange={(e) => setTargetEmployeeId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 bg-white text-slate-750 outline-none focus:border-blue-600 transition-all"
                    >
                      <option value="">-- Choose Employee --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.firstName} {emp.lastName} ({emp.jobTitle})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {docType === "candidate" && (
                <div className="space-y-1.5 animate-in fade-in duration-200">
                  <label htmlFor="target-candidate" className="text-slate-600">Link Candidate *</label>
                  <select
                    id="target-candidate"
                    required
                    value={targetCandidateId}
                    onChange={(e) => setTargetCandidateId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 bg-white text-slate-750 outline-none focus:border-blue-600 transition-all"
                  >
                    <option value="">-- Choose Candidate --</option>
                    {candidates.map(cand => (
                      <option key={cand.id} value={cand.id}>
                        {cand.firstName} {cand.lastName} — {cand.jobTitle}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 mt-6 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadLoading}
                  className="rounded-xl px-5 py-2.5 text-white disabled:opacity-60 cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  {uploadLoading ? "Uploading..." : "Save to Vault"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ==================== DELETE CONFIRMATION MODAL ==================== */}
      {deleteDocConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900">Delete Document</h3>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to permanently delete <span className="font-bold text-slate-800">"{deleteDocConfirm.name}"</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setDeleteDocConfirm(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-650 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteDoc}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TOAST NOTIFICATION ==================== */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom duration-300">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold">
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

    </div>
  );
}

export default DocumentsPage;
