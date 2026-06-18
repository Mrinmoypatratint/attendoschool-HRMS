import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "../../../lib/firebase";
import type { VaultDocument } from "@hrms/middleware";
import { AuditLogService } from "../../settings/services/auditLogService";
import { getReadableScopes, type DocumentAccessContext } from "./documentAccess";

export type { DocumentAccessContext } from "./documentAccess";

type CallerInfo = { uid: string; email: string };

function rid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
}

export const DocumentService = {
  /**
   * Fetches the vault documents the caller is allowed to read.
   *
   * Rather than querying every tenant document (which fails with
   * permission-denied for non-admin roles, because Firestore rules do not
   * filter results), this issues one query per permitted read scope and
   * merges the results, de-duplicating by document id.
   */
  async getDocuments(
    tenantId: string,
    access: DocumentAccessContext
  ): Promise<VaultDocument[]> {
    const col = collection(db, "documents");
    const scopes = getReadableScopes(access.role);

    const queries = scopes.map((scope) => {
      switch (scope) {
        case "all":
          return query(col, where("tenantId", "==", tenantId));
        case "shared":
          return query(col, where("tenantId", "==", tenantId), where("accessLevel", "==", "shared"));
        case "self":
          return query(col, where("tenantId", "==", tenantId), where("targetUserId", "==", access.uid));
        case "candidate":
          return query(col, where("tenantId", "==", tenantId), where("type", "==", "candidate"));
      }
    });

    const snaps = await Promise.all(queries.map((q) => getDocs(q)));

    // Merge & de-duplicate (a document can match more than one scope).
    const byId = new Map<string, VaultDocument>();
    snaps.forEach((snap) => snap.forEach((d) => byId.set(d.id, d.data() as VaultDocument)));

    // Sort client-side by date descending
    return Array.from(byId.values()).sort((a, b) => b.createdAt - a.createdAt);
  },

  /**
   * Uploads a document to storage and saves metadata in Firestore.
   */
  async uploadDocument(
    tenantId: string,
    file: File,
    metadata: Omit<
      VaultDocument,
      | "id"
      | "tenantId"
      | "createdAt"
      | "updatedAt"
      | "sizeBytes"
      | "contentType"
      | "storagePath"
      | "downloadUrl"
    >,
    caller?: CallerInfo
  ): Promise<VaultDocument> {
    const docId = rid("doc");
    
    // Scoped storage path: tenants/{tenantId}/documents/{docId}
    const storagePath = `tenants/${tenantId}/documents/${docId}`;
    const storageRef = ref(storage, storagePath);
    
    // Upload file
    await uploadBytes(storageRef, file, { contentType: file.type });
    const downloadUrl = await getDownloadURL(storageRef);
    
    const now = Date.now();
    const vaultDoc: VaultDocument = {
      ...metadata,
      id: docId,
      tenantId,
      createdAt: now,
      updatedAt: now,
      sizeBytes: file.size,
      contentType: file.type,
      storagePath,
      downloadUrl,
    };
    
    // Save metadata in Firestore
    await setDoc(doc(db, "documents", docId), vaultDoc);
    
    // Create audit log
    if (caller) {
      await AuditLogService.createAuditLog(tenantId, {
        userId: caller.uid,
        userEmail: caller.email,
        action: "create",
        resource: "employee", // Map it to employee for standard resource schema or auditLog schema
        resourceId: docId,
        details: `Uploaded document "${vaultDoc.name}" in category "${vaultDoc.category}" (${vaultDoc.type} doc)`,
      });
    }
    
    return vaultDoc;
  },

  /**
   * Deletes a document from storage and Firestore.
   */
  async deleteDocument(
    tenantId: string,
    docId: string,
    storagePath: string,
    documentName: string,
    caller?: CallerInfo
  ): Promise<void> {
    // 1. Delete from Storage
    try {
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
    } catch (error) {
      console.warn("Storage file deletion failed or file did not exist:", error);
      // Continue deleting Firestore record even if storage deletion fails
    }

    // 2. Delete from Firestore
    await deleteDoc(doc(db, "documents", docId));

    // 3. Log action
    if (caller) {
      await AuditLogService.createAuditLog(tenantId, {
        userId: caller.uid,
        userEmail: caller.email,
        action: "delete",
        resource: "employee",
        resourceId: docId,
        details: `Deleted vault document "${documentName}"`,
      });
    }
  },
};
