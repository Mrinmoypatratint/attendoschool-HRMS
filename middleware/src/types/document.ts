/**
 * Document Vault type definitions.
 *
 * Models securely stored files (contracts, IDs, payslips, etc.) and their
 * access-control metadata. Consumed via named imports and re-exported by the
 * middleware barrel.
 */

/** Functional category of a vault document. */
export type DocumentCategory = 
  | "contract" 
  | "id_proof" 
  | "resume" 
  | "offer_letter" 
  | "policy" 
  | "payslip" 
  | "other";

/** Which kind of entity a document is associated with. */
export type DocumentType = "employee" | "candidate" | "general";

/** Who may view a document: admins only, the subject employee, or shared. */
export type DocumentAccessLevel = "admin_only" | "employee_self" | "shared";

/**
 * A file stored in the Document Vault, plus the metadata used to gate access at
 * the Storage-rule layer (target linkage + access level).
 */
export interface VaultDocument {
  id: string;
  tenantId: string;
  name: string;
  category: DocumentCategory;
  type: DocumentType;
  targetId?: string;       // Employee ID or Candidate ID
  targetName?: string;     // Name of employee/candidate (for display)
  targetUserId?: string;   // Firebase Auth UID of the target employee (for access control)
  uploadedBy: string;      // User UID
  uploadedByName: string;
  createdAt: number;
  updatedAt: number;
  sizeBytes: number;
  contentType: string;
  storagePath: string;     // tenants/{tenantId}/documents/{docId}
  downloadUrl: string;
  accessLevel: DocumentAccessLevel;
}
