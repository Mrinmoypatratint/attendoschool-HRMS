import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type { AcademicSession, AcademicTerm, HolidayCalendar, Holiday } from "@hrms/middleware";
import { AuditLogService } from "../../settings/services/auditLogService";

export const AcademicCalendarService = {
  /**
   * Fetches all academic sessions for a tenant.
   */
  async getAcademicSessions(tenantId: string): Promise<AcademicSession[]> {
    const q = query(
      collection(db, "academicSessions"),
      where("tenantId", "==", tenantId),
      orderBy("startDate", "desc")
    );
    const snap = await getDocs(q);
    const list: AcademicSession[] = [];
    snap.forEach((d) => list.push(d.data() as AcademicSession));
    return list;
  },

  /**
   * Fetches the current active academic session.
   */
  async getCurrentSession(tenantId: string): Promise<AcademicSession | null> {
    const sessions = await this.getAcademicSessions(tenantId);
    return sessions.find((s) => s.isCurrent) || sessions[0] || null;
  },

  /**
   * Creates a new academic session.
   */
  async createAcademicSession(
    tenantId: string,
    data: Omit<AcademicSession, "id" | "tenantId" | "createdAt" | "updatedAt">,
    callerInfo?: { uid: string; email: string }
  ): Promise<AcademicSession> {
    const id = `session_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    const now = Date.now();

    // If marked current, ensure others are set to not current
    if (data.isCurrent) {
      const existing = await this.getAcademicSessions(tenantId);
      for (const sess of existing) {
        if (sess.isCurrent) {
          await updateDoc(doc(db, "academicSessions", sess.id), {
            isCurrent: false,
            updatedAt: now,
          });
        }
      }
    }

    const session: AcademicSession = {
      ...data,
      id,
      tenantId,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(db, "academicSessions", id), session);

    if (callerInfo) {
      await AuditLogService.createAuditLog(tenantId, {
        userId: callerInfo.uid,
        userEmail: callerInfo.email,
        action: "create",
        resource: "holiday_calendar",
        resourceId: id,
        details: `Created academic session: ${data.name} (${data.code})`,
      });
    }

    return session;
  },

  /**
   * Updates an existing academic session.
   */
  async updateAcademicSession(
    tenantId: string,
    id: string,
    data: Partial<Omit<AcademicSession, "id" | "tenantId" | "createdAt" | "updatedAt">>,
    callerInfo?: { uid: string; email: string }
  ): Promise<void> {
    const ref = doc(db, "academicSessions", id);
    const now = Date.now();

    if (data.isCurrent) {
      const existing = await this.getAcademicSessions(tenantId);
      for (const sess of existing) {
        if (sess.isCurrent && sess.id !== id) {
          await updateDoc(doc(db, "academicSessions", sess.id), {
            isCurrent: false,
            updatedAt: now,
          });
        }
      }
    }

    await updateDoc(ref, {
      ...data,
      updatedAt: now,
    });

    if (callerInfo) {
      await AuditLogService.createAuditLog(tenantId, {
        userId: callerInfo.uid,
        userEmail: callerInfo.email,
        action: "update",
        resource: "holiday_calendar",
        resourceId: id,
        details: `Updated academic session: ${id}`,
      });
    }
  },

  /**
   * Fetches holiday calendars for a year.
   */
  async getHolidayCalendars(tenantId: string, year: number): Promise<HolidayCalendar[]> {
    const q = query(
      collection(db, "holidayCalendars"),
      where("tenantId", "==", tenantId),
      where("year", "==", year)
    );
    const snap = await getDocs(q);
    const list: HolidayCalendar[] = [];
    snap.forEach((d) => list.push(d.data() as HolidayCalendar));
    return list;
  },

  /**
   * Adds a holiday to an existing or newly initialized calendar.
   */
  async addHoliday(
    tenantId: string,
    calendarId: string,
    holiday: Holiday,
    callerInfo?: { uid: string; email: string }
  ): Promise<void> {
    const ref = doc(db, "holidayCalendars", calendarId);
    const snap = await getDoc(ref);
    const now = Date.now();

    if (snap.exists()) {
      const cal = snap.data() as HolidayCalendar;
      const exists = cal.holidays.some((h) => h.date === holiday.date);
      if (!exists) {
        const updatedHolidays = [...cal.holidays, holiday].sort((a, b) =>
          a.date.localeCompare(b.date)
        );
        await updateDoc(ref, {
          holidays: updatedHolidays,
          updatedAt: now,
        });
      }
    } else {
      const year = parseInt(holiday.date.split("-")[0] || "2026", 10);
      const newCal: HolidayCalendar = {
        id: calendarId,
        tenantId,
        name: `Academic Holiday Calendar ${year}`,
        year,
        holidays: [holiday],
        isDefault: true,
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(ref, newCal);
    }

    if (callerInfo) {
      await AuditLogService.createAuditLog(tenantId, {
        userId: callerInfo.uid,
        userEmail: callerInfo.email,
        action: "update",
        resource: "holiday_calendar",
        resourceId: calendarId,
        details: `Added holiday: ${holiday.name} on ${holiday.date}`,
      });
    }
  },

  /**
   * Removes a holiday from calendar by date.
   */
  async removeHoliday(
    tenantId: string,
    calendarId: string,
    date: string,
    callerInfo?: { uid: string; email: string }
  ): Promise<void> {
    const ref = doc(db, "holidayCalendars", calendarId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const cal = snap.data() as HolidayCalendar;
    const filtered = cal.holidays.filter((h) => h.date !== date);
    await updateDoc(ref, {
      holidays: filtered,
      updatedAt: Date.now(),
    });

    if (callerInfo) {
      await AuditLogService.createAuditLog(tenantId, {
        userId: callerInfo.uid,
        userEmail: callerInfo.email,
        action: "delete",
        resource: "holiday_calendar",
        resourceId: calendarId,
        details: `Removed holiday for date: ${date}`,
      });
    }
  },
};
