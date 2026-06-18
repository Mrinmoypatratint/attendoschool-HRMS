import { describe, it, expect, vi } from "vitest";
import type { VaultDocument, DocumentCategory, DocumentType, DocumentAccessLevel, SystemRoleType } from "@hrms/middleware";
import { SYSTEM_ROLES } from "@hrms/middleware";
import { getReadableScopes } from "./documentAccess";

// Standard mock fixtures for testing
function makeDoc(overrides: Partial<VaultDocument> = {}): VaultDocument {
  return {
    id: "doc_1",
    tenantId: "t1",
    name: "Standard Resume",
    category: "resume",
    type: "candidate",
    targetId: "cand_1",
    uploadedBy: "u1",
    uploadedByName: "Hr Member",
    createdAt: 1000,
    updatedAt: 1000,
    sizeBytes: 1024 * 1024,
    contentType: "application/pdf",
    storagePath: "tenants/t1/documents/doc_1",
    downloadUrl: "https://mock-storage.firebase/doc_1",
    accessLevel: "shared",
    ...overrides,
  };
}

// Client filtering helper logic (usually run inside DocumentsPage.tsx)
function filterDocs(
  docs: VaultDocument[],
  filters: { query?: string; category?: string; type?: string }
): VaultDocument[] {
  return docs.filter((doc) => {
    const query = (filters.query || "").toLowerCase();
    const matchesSearch = 
      doc.name.toLowerCase().includes(query) ||
      (doc.targetName && doc.targetName.toLowerCase().includes(query));
    
    const matchesCategory = !filters.category || filters.category === "all" || doc.category === filters.category;
    const matchesType = !filters.type || filters.type === "all" || doc.type === filters.type;

    return matchesSearch && matchesCategory && matchesType;
  });
}

// Access evaluation logic mimicking firestore.rules and storage.rules
function evaluateAccess(
  doc: VaultDocument,
  user: { uid: string; role: string; tenantId: string }
): boolean {
  if (user.tenantId !== doc.tenantId) return false;
  
  // Admins & HR Managers always have access
  if (["super_admin", "org_admin", "hr_manager"].includes(user.role)) return true;
  
  // Recruiters have access to candidate documents
  if (user.role === "recruiter" && doc.type === "candidate") return true;
  
  // Employees have access to shared documents, or documents targeted specifically to their userId
  if (doc.accessLevel === "shared") return true;
  if (doc.targetUserId && doc.targetUserId === user.uid) return true;

  return false;
}

describe("Document Category and Filtering", () => {
  const docs = [
    makeDoc({ id: "1", name: "Job Contract NDA", category: "contract", type: "employee" }),
    makeDoc({ id: "2", name: "Ada Resume", category: "resume", type: "candidate", targetName: "Ada Lovelace" }),
    makeDoc({ id: "3", name: "Office Policy Manual", category: "policy", type: "general" }),
  ];

  it("filters by query matching document name case-insensitively", () => {
    const results = filterDocs(docs, { query: "contract" });
    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe("1");
  });

  it("filters by query matching target owner name", () => {
    const results = filterDocs(docs, { query: "Ada" });
    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe("2");
  });

  it("filters by category", () => {
    const results = filterDocs(docs, { category: "policy" });
    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe("3");
  });

  it("filters by type (employee, candidate, general)", () => {
    const results = filterDocs(docs, { type: "candidate" });
    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe("2");
  });

  it("combines multiple filter parameters", () => {
    const results = filterDocs(docs, { category: "contract", type: "employee" });
    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe("1");
  });

  it("returns all when filter parameters are set to 'all' or empty", () => {
    const results = filterDocs(docs, { category: "all", type: "all" });
    expect(results).toHaveLength(3);
  });
});

describe("Document Vault RBAC & Access Control Rules", () => {
  const adminUser = { uid: "admin_u", role: "org_admin", tenantId: "t1" };
  const hrUser = { uid: "hr_u", role: "hr_manager", tenantId: "t1" };
  const recruiterUser = { uid: "recruiter_u", role: "recruiter", tenantId: "t1" };
  const employeeUser = { uid: "emp_u", role: "employee", tenantId: "t1" };
  const otherTenantUser = { uid: "other_u", role: "org_admin", tenantId: "t2" };

  const contractDoc = makeDoc({ 
    id: "contract_1", 
    type: "employee", 
    category: "contract", 
    accessLevel: "admin_only" 
  });
  
  const personalPayslipDoc = makeDoc({ 
    id: "slip_1", 
    type: "employee", 
    category: "payslip", 
    accessLevel: "employee_self",
    targetUserId: "emp_u" 
  });
  
  const sharedPolicyDoc = makeDoc({ 
    id: "policy_1", 
    type: "general", 
    category: "policy", 
    accessLevel: "shared" 
  });
  
  const candidateDoc = makeDoc({ 
    id: "resume_1", 
    type: "candidate", 
    category: "resume" 
  });

  it("denies access to users from different tenants", () => {
    expect(evaluateAccess(sharedPolicyDoc, otherTenantUser)).toBe(false);
    expect(evaluateAccess(contractDoc, otherTenantUser)).toBe(false);
  });

  it("allows Org Admin and HR Manager to access all documents", () => {
    // Contract
    expect(evaluateAccess(contractDoc, adminUser)).toBe(true);
    expect(evaluateAccess(contractDoc, hrUser)).toBe(true);
    // Payslip
    expect(evaluateAccess(personalPayslipDoc, adminUser)).toBe(true);
    expect(evaluateAccess(personalPayslipDoc, hrUser)).toBe(true);
    // Shared
    expect(evaluateAccess(sharedPolicyDoc, adminUser)).toBe(true);
    expect(evaluateAccess(sharedPolicyDoc, hrUser)).toBe(true);
  });

  it("allows Recruiters to access candidate documents, but denies employee contracts and payslips", () => {
    expect(evaluateAccess(candidateDoc, recruiterUser)).toBe(true);
    expect(evaluateAccess(contractDoc, recruiterUser)).toBe(false);
    expect(evaluateAccess(personalPayslipDoc, recruiterUser)).toBe(false);
  });

  it("allows employees to see general shared documents and their own target documents, but denies other private files", () => {
    // Shared policy
    expect(evaluateAccess(sharedPolicyDoc, employeeUser)).toBe(true);
    // Self payslip
    expect(evaluateAccess(personalPayslipDoc, employeeUser)).toBe(true);
    // Other employee contract
    expect(evaluateAccess(contractDoc, employeeUser)).toBe(false);
  });
});

describe("getReadableScopes — query scoping mirrors firestore.rules", () => {
  it("grants admins/HR full-tenant read scope", () => {
    expect(getReadableScopes("super_admin")).toEqual(["all"]);
    expect(getReadableScopes("org_admin")).toEqual(["all"]);
    expect(getReadableScopes("hr_manager")).toEqual(["all"]);
  });

  it("grants recruiters shared, self, and candidate scopes (never 'all')", () => {
    const scopes = getReadableScopes("recruiter");
    expect(scopes).toContain("shared");
    expect(scopes).toContain("self");
    expect(scopes).toContain("candidate");
    expect(scopes).not.toContain("all");
  });

  it("limits employees to shared + self scopes only", () => {
    expect(getReadableScopes("employee")).toEqual(["shared", "self"]);
  });

  it("treats unknown/custom roles conservatively (shared + self only)", () => {
    expect(getReadableScopes("custom_role_xyz")).toEqual(["shared", "self"]);
  });

  it("never returns the broad 'all' scope for non-admin roles", () => {
    for (const role of ["recruiter", "employee", "custom_role_xyz"]) {
      expect(getReadableScopes(role)).not.toContain("all");
    }
  });
});

// Mirrors the permission-driven CREATE rule in firestore.rules:
//   hasPermission(tenantId, 'documents.create')
//     || (role == 'recruiter' && type == 'candidate')
// System-role permissions come from the real SYSTEM_ROLES map; custom roles
// supply their own permission list (resolved from /roles at runtime).
function hasDocPermission(
  ctx: { role: string; customPermissions?: string[] },
  permission: "documents.create" | "documents.update" | "documents.delete"
): boolean {
  const sys = SYSTEM_ROLES[ctx.role as SystemRoleType];
  if (sys) return (sys.permissions as string[]).includes(permission);
  return (ctx.customPermissions || []).includes(permission);
}

function evaluateCanCreate(
  doc: VaultDocument,
  ctx: { role: string; tenantId: string; customPermissions?: string[] }
): boolean {
  if (ctx.tenantId !== doc.tenantId) return false;
  if (hasDocPermission(ctx, "documents.create")) return true;
  if (ctx.role === "recruiter" && doc.type === "candidate") return true;
  return false;
}

describe("Document CREATE — permission-driven (RBAC matrix honored)", () => {
  const employeeDoc = makeDoc({ id: "c1", type: "employee", category: "contract", accessLevel: "employee_self" });
  const candidateDoc = makeDoc({ id: "c2", type: "candidate", category: "resume" });

  it("allows admins and HR (system roles carry documents.create)", () => {
    for (const role of ["super_admin", "org_admin", "hr_manager"]) {
      expect(evaluateCanCreate(employeeDoc, { role, tenantId: "t1" })).toBe(true);
    }
  });

  it("denies the built-in employee role (no documents.create) — unchanged", () => {
    expect(evaluateCanCreate(employeeDoc, { role: "employee", tenantId: "t1" })).toBe(false);
    expect(evaluateCanCreate(candidateDoc, { role: "employee", tenantId: "t1" })).toBe(false);
  });

  it("preserves recruiter candidate-doc special case, but not employee docs", () => {
    expect(evaluateCanCreate(candidateDoc, { role: "recruiter", tenantId: "t1" })).toBe(true);
    expect(evaluateCanCreate(employeeDoc, { role: "recruiter", tenantId: "t1" })).toBe(false);
  });

  it("ALLOWS a custom role granted documents.create (the option-2 capability)", () => {
    const customWithCreate = { role: "role_uploader", tenantId: "t1", customPermissions: ["documents.view", "documents.create"] };
    expect(evaluateCanCreate(employeeDoc, customWithCreate)).toBe(true);
    expect(evaluateCanCreate(candidateDoc, customWithCreate)).toBe(true);
  });

  it("denies a custom role that was NOT granted documents.create", () => {
    const customViewOnly = { role: "role_viewer", tenantId: "t1", customPermissions: ["documents.view"] };
    expect(evaluateCanCreate(employeeDoc, customViewOnly)).toBe(false);
  });

  it("denies cross-tenant creation regardless of permission", () => {
    expect(evaluateCanCreate(employeeDoc, { role: "org_admin", tenantId: "t2" })).toBe(false);
  });
});
