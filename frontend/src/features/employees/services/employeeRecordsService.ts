import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "../../../lib/firebase";
import type {
  EmployeeContract,
  EmergencyContact,
  EmploymentHistoryEntry,
  EmployeeAsset,
  LifecycleEvent,
} from "@hrms/middleware";
import { AuditLogService } from "../../settings/services/auditLogService";

type CallerInfo = { uid: string; email: string };

function rid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
}

async function logEmployee(
  tenantId: string,
  caller: CallerInfo | undefined,
  action: "create" | "update" | "delete" | "status_change",
  employeeId: string,
  details: string
) {
  if (!caller) return;
  await AuditLogService.createAuditLog(tenantId, {
    userId: caller.uid,
    userEmail: caller.email,
    action,
    resource: "employee",
    resourceId: employeeId,
    details,
  });
}

async function listByEmployee<T>(
  collectionName: string,
  tenantId: string,
  employeeId: string
): Promise<T[]> {
  // NOTE: filter by tenantId AND employeeId. The tenantId filter is required so
  // the read rule (which checks resource.data.tenantId) can authorise the query;
  // two equality filters need no composite index.
  const q = query(
    collection(db, collectionName),
    where("tenantId", "==", tenantId),
    where("employeeId", "==", employeeId)
  );
  const snap = await getDocs(q);
  const list: T[] = [];
  snap.forEach((d) => list.push(d.data() as T));
  return list;
}

/* ------------------------------------------------------------------ */
/*  Contracts                                                          */
/* ------------------------------------------------------------------ */

export const ContractService = {
  list: (tenantId: string, employeeId: string) => listByEmployee<EmployeeContract>("employeeContracts", tenantId, employeeId),

  async uploadDocument(tenantId: string, file: File): Promise<{ documentUrl: string; documentPath: string }> {
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const documentPath = `tenants/${tenantId}/employee-docs/${Date.now()}_${safe}`;
    const r = ref(storage, documentPath);
    await uploadBytes(r, file, { contentType: file.type });
    const documentUrl = await getDownloadURL(r);
    return { documentUrl, documentPath };
  },

  async create(
    tenantId: string,
    data: Omit<EmployeeContract, "id" | "tenantId" | "createdAt" | "updatedAt">,
    caller?: CallerInfo
  ): Promise<EmployeeContract> {
    const id = rid("contract");
    const now = Date.now();
    const contract: EmployeeContract = { ...data, id, tenantId, createdAt: now, updatedAt: now };
    await setDoc(doc(db, "employeeContracts", id), contract);
    await logEmployee(tenantId, caller, "create", data.employeeId, `Added contract "${contract.title}"`);
    return contract;
  },

  async update(
    id: string,
    data: Partial<Omit<EmployeeContract, "id" | "tenantId" | "createdAt" | "updatedAt">>,
    caller?: CallerInfo
  ): Promise<void> {
    const snap = await getDoc(doc(db, "employeeContracts", id));
    if (!snap.exists()) return;
    const old = snap.data() as EmployeeContract;
    await updateDoc(doc(db, "employeeContracts", id), { ...data, updatedAt: Date.now() });
    await logEmployee(old.tenantId, caller, "update", old.employeeId, `Updated contract "${old.title}"`);
  },

  async remove(id: string, caller?: CallerInfo): Promise<void> {
    const snap = await getDoc(doc(db, "employeeContracts", id));
    if (snap.exists()) {
      const c = snap.data() as EmployeeContract;
      if (c.documentPath) {
        try {
          await deleteObject(ref(storage, c.documentPath));
        } catch {
          /* ignore missing file */
        }
      }
      await logEmployee(c.tenantId, caller, "delete", c.employeeId, `Removed contract "${c.title}"`);
    }
    await deleteDoc(doc(db, "employeeContracts", id));
  },
};

/* ------------------------------------------------------------------ */
/*  Emergency contacts                                                 */
/* ------------------------------------------------------------------ */

export const EmergencyContactService = {
  list: (tenantId: string, employeeId: string) => listByEmployee<EmergencyContact>("emergencyContacts", tenantId, employeeId),

  async create(
    tenantId: string,
    data: Omit<EmergencyContact, "id" | "tenantId" | "createdAt" | "updatedAt">,
    caller?: CallerInfo
  ): Promise<EmergencyContact> {
    const id = rid("ec");
    const now = Date.now();
    const contact: EmergencyContact = { ...data, id, tenantId, createdAt: now, updatedAt: now };
    await setDoc(doc(db, "emergencyContacts", id), contact);
    await logEmployee(tenantId, caller, "create", data.employeeId, `Added emergency contact "${contact.name}"`);
    return contact;
  },

  async update(
    id: string,
    data: Partial<Omit<EmergencyContact, "id" | "tenantId" | "createdAt" | "updatedAt">>,
    caller?: CallerInfo
  ): Promise<void> {
    const snap = await getDoc(doc(db, "emergencyContacts", id));
    if (!snap.exists()) return;
    const old = snap.data() as EmergencyContact;
    await updateDoc(doc(db, "emergencyContacts", id), { ...data, updatedAt: Date.now() });
    await logEmployee(old.tenantId, caller, "update", old.employeeId, `Updated emergency contact "${old.name}"`);
  },

  async remove(id: string, caller?: CallerInfo): Promise<void> {
    const snap = await getDoc(doc(db, "emergencyContacts", id));
    if (snap.exists()) {
      const c = snap.data() as EmergencyContact;
      await logEmployee(c.tenantId, caller, "delete", c.employeeId, `Removed emergency contact "${c.name}"`);
    }
    await deleteDoc(doc(db, "emergencyContacts", id));
  },
};

/* ------------------------------------------------------------------ */
/*  Employment history                                                 */
/* ------------------------------------------------------------------ */

export const EmploymentHistoryService = {
  list: (tenantId: string, employeeId: string) => listByEmployee<EmploymentHistoryEntry>("employmentHistory", tenantId, employeeId),

  async create(
    tenantId: string,
    data: Omit<EmploymentHistoryEntry, "id" | "tenantId" | "createdAt" | "updatedAt">,
    caller?: CallerInfo
  ): Promise<EmploymentHistoryEntry> {
    const id = rid("hist");
    const now = Date.now();
    const entry: EmploymentHistoryEntry = { ...data, id, tenantId, createdAt: now, updatedAt: now };
    await setDoc(doc(db, "employmentHistory", id), entry);
    await logEmployee(tenantId, caller, "update", data.employeeId, `Added "${entry.changeType}" history entry`);
    return entry;
  },

  async remove(id: string, caller?: CallerInfo): Promise<void> {
    const snap = await getDoc(doc(db, "employmentHistory", id));
    if (snap.exists()) {
      const e = snap.data() as EmploymentHistoryEntry;
      await logEmployee(e.tenantId, caller, "delete", e.employeeId, `Removed history entry "${e.changeType}"`);
    }
    await deleteDoc(doc(db, "employmentHistory", id));
  },
};

/* ------------------------------------------------------------------ */
/*  Assets                                                             */
/* ------------------------------------------------------------------ */

export const AssetService = {
  list: (tenantId: string, employeeId: string) => listByEmployee<EmployeeAsset>("employeeAssets", tenantId, employeeId),

  async create(
    tenantId: string,
    data: Omit<EmployeeAsset, "id" | "tenantId" | "createdAt" | "updatedAt">,
    caller?: CallerInfo
  ): Promise<EmployeeAsset> {
    const id = rid("asset");
    const now = Date.now();
    const asset: EmployeeAsset = { ...data, id, tenantId, createdAt: now, updatedAt: now };
    await setDoc(doc(db, "employeeAssets", id), asset);
    await logEmployee(tenantId, caller, "create", data.employeeId, `Assigned asset "${asset.name}"`);
    return asset;
  },

  async update(
    id: string,
    data: Partial<Omit<EmployeeAsset, "id" | "tenantId" | "createdAt" | "updatedAt">>,
    caller?: CallerInfo
  ): Promise<void> {
    const snap = await getDoc(doc(db, "employeeAssets", id));
    if (!snap.exists()) return;
    const old = snap.data() as EmployeeAsset;
    await updateDoc(doc(db, "employeeAssets", id), { ...data, updatedAt: Date.now() });
    await logEmployee(old.tenantId, caller, "update", old.employeeId, `Updated asset "${old.name}"`);
  },

  async remove(id: string, caller?: CallerInfo): Promise<void> {
    const snap = await getDoc(doc(db, "employeeAssets", id));
    if (snap.exists()) {
      const a = snap.data() as EmployeeAsset;
      await logEmployee(a.tenantId, caller, "delete", a.employeeId, `Removed asset "${a.name}"`);
    }
    await deleteDoc(doc(db, "employeeAssets", id));
  },
};

/* ------------------------------------------------------------------ */
/*  Lifecycle events                                                   */
/* ------------------------------------------------------------------ */

export const LifecycleService = {
  list: (tenantId: string, employeeId: string) => listByEmployee<LifecycleEvent>("lifecycleEvents", tenantId, employeeId),

  async add(
    tenantId: string,
    data: Omit<LifecycleEvent, "id" | "tenantId" | "createdAt">,
    caller?: CallerInfo
  ): Promise<LifecycleEvent> {
    const id = rid("life");
    const event: LifecycleEvent = { ...data, id, tenantId, createdAt: Date.now() };
    await setDoc(doc(db, "lifecycleEvents", id), event);
    await logEmployee(tenantId, caller, "status_change", data.employeeId, `Lifecycle → "${event.stage}"`);
    return event;
  },

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(db, "lifecycleEvents", id));
  },
};
