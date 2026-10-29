import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type { Campus } from "@hrms/middleware";
import { AuditLogService } from "../../settings/services/auditLogService";

export const CampusService = {
  /**
   * Fetches all campuses for an institution tenant.
   */
  async getCampuses(tenantId: string): Promise<Campus[]> {
    const q = query(
      collection(db, "campuses"),
      where("tenantId", "==", tenantId),
      orderBy("name", "asc")
    );
    const snap = await getDocs(q);
    const list: Campus[] = [];
    snap.forEach((d) => list.push(d.data() as Campus));
    return list;
  },

  /**
   * Fetches a single campus by id.
   */
  async getCampusById(id: string): Promise<Campus | null> {
    const snap = await getDoc(doc(db, "campuses", id));
    if (!snap.exists()) return null;
    return snap.data() as Campus;
  },

  /**
   * Creates a new campus / branch for an educational institution.
   */
  async createCampus(
    tenantId: string,
    data: Omit<Campus, "id" | "tenantId" | "createdAt" | "updatedAt">,
    callerInfo?: { uid: string; email: string }
  ): Promise<Campus> {
    const id = `campus_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    const now = Date.now();
    const campus: Campus = {
      ...data,
      id,
      tenantId,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db, "campuses", id), campus);

    if (callerInfo) {
      await AuditLogService.createAuditLog(tenantId, {
        userId: callerInfo.uid,
        userEmail: callerInfo.email,
        action: "create",
        resource: "campus",
        resourceId: id,
        details: `Created campus "${campus.name}" (${campus.code})`,
      });
    }

    return campus;
  },

  /**
   * Updates an existing campus.
   */
  async updateCampus(
    id: string,
    data: Partial<Omit<Campus, "id" | "tenantId" | "createdAt" | "updatedAt">>,
    callerInfo?: { uid: string; email: string }
  ): Promise<void> {
    const ref = doc(db, "campuses", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error("Campus not found.");
    const old = snap.data() as Campus;

    await updateDoc(ref, {
      ...data,
      updatedAt: Date.now(),
    });

    if (callerInfo) {
      await AuditLogService.createAuditLog(old.tenantId, {
        userId: callerInfo.uid,
        userEmail: callerInfo.email,
        action: "update",
        resource: "campus",
        resourceId: id,
        details: `Updated campus "${old.name}"`,
      });
    }
  },

  /**
   * Deletes a campus.
   */
  async deleteCampus(
    id: string,
    callerInfo?: { uid: string; email: string }
  ): Promise<void> {
    const ref = doc(db, "campuses", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const old = snap.data() as Campus;

    await deleteDoc(ref);

    if (callerInfo) {
      await AuditLogService.createAuditLog(old.tenantId, {
        userId: callerInfo.uid,
        userEmail: callerInfo.email,
        action: "delete",
        resource: "campus",
        resourceId: id,
        details: `Deleted campus "${old.name}"`,
      });
    }
  },
};
