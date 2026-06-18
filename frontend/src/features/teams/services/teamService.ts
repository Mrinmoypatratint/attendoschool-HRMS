/**
 * teamService
 * -----------------------------------------------------------------------------
 * Firestore-backed service for managing team documents within a tenant.
 * Supports listing, creating, updating, and deleting teams, and emits audit
 * log entries (via AuditLogService) when caller information is supplied.
 */
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
import { db } from "../../../lib/firebase";
import type { Team } from "@hrms/middleware";
import { AuditLogService } from "../../settings/services/auditLogService";

/**
 * Service to manage teams within a tenant.
 * Follows the same pattern as EmployeeService department methods.
 */
export const TeamService = {
  /**
   * Fetches all teams for a tenant.
   */
  async getTeams(tenantId: string): Promise<Team[]> {
    const q = query(collection(db, "teams"), where("tenantId", "==", tenantId));
    const snap = await getDocs(q);
    const list: Team[] = [];
    snap.forEach((docSnap) => {
      list.push(docSnap.data() as Team);
    });
    return list;
  },

  /**
   * Creates a new team.
   */
  async createTeam(
    tenantId: string,
    data: Omit<Team, "id" | "tenantId" | "createdAt" | "updatedAt">,
    callerInfo?: { uid: string; email: string }
  ): Promise<Team> {
    const id = `team_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    const now = Date.now();
    const team: Team = {
      ...data,
      id,
      tenantId,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db, "teams", id), team);

    if (callerInfo) {
      await AuditLogService.createAuditLog(tenantId, {
        userId: callerInfo.uid,
        userEmail: callerInfo.email,
        action: "create",
        resource: "team",
        resourceId: id,
        details: `Created team "${team.name}"`,
      });
    }

    return team;
  },

  /**
   * Updates an existing team.
   */
  async updateTeam(
    teamId: string,
    data: Partial<Omit<Team, "id" | "tenantId" | "createdAt" | "updatedAt">>,
    callerInfo?: { uid: string; email: string }
  ): Promise<void> {
    const ref = doc(db, "teams", teamId);

    if (callerInfo) {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const oldTeam = snap.data() as Team;
        await AuditLogService.createAuditLog(oldTeam.tenantId, {
          userId: callerInfo.uid,
          userEmail: callerInfo.email,
          action: "update",
          resource: "team",
          resourceId: teamId,
          details: `Updated team "${oldTeam.name}" details. Changes: ${JSON.stringify(data)}`,
        });
      }
    }

    await updateDoc(ref, {
      ...data,
      updatedAt: Date.now(),
    });
  },

  /**
   * Deletes a team.
   */
  async deleteTeam(
    teamId: string,
    callerInfo?: { uid: string; email: string }
  ): Promise<void> {
    if (callerInfo) {
      const snap = await getDoc(doc(db, "teams", teamId));
      if (snap.exists()) {
        const team = snap.data() as Team;
        await AuditLogService.createAuditLog(team.tenantId, {
          userId: callerInfo.uid,
          userEmail: callerInfo.email,
          action: "delete",
          resource: "team",
          resourceId: teamId,
          details: `Deleted team "${team.name}"`,
        });
      }
    }
    await deleteDoc(doc(db, "teams", teamId));
  },
};
