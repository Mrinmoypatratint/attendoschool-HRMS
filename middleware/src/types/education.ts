/**
 * Educational Institution Domain Models & Types
 * ---------------------------------------------
 * Defines multi-campus, academic sessions, staff attendance, faculty workload,
 * timetable scheduling, substitute management, institutional payroll,
 * performance review, and training models for educational institutions.
 */

/* ------------------------------------------------------------------ */
/*  1. Campus / Branch Management                                      */
/* ------------------------------------------------------------------ */

export interface Campus {
  id: string;
  tenantId: string;
  name: string; // e.g. "North Campus", "Downtown Branch"
  code: string; // e.g. "NC-01"
  address: string;
  city?: string | undefined;
  state?: string | undefined;
  country?: string | undefined;
  phone?: string | undefined;
  email?: string | undefined;
  headOfCampusId?: string | undefined; // References Employee.id
  headOfCampusName?: string | undefined;
  workingHoursStart?: string | undefined; // e.g. "08:00"
  workingHoursEnd?: string | undefined; // e.g. "16:30"
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

/* ------------------------------------------------------------------ */
/*  2. Academic Session & Calendar                                     */
/* ------------------------------------------------------------------ */

export interface AcademicTerm {
  id: string;
  name: string; // e.g. "Fall Semester", "Term 1"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export interface AcademicSession {
  id: string;
  tenantId: string;
  name: string; // e.g. "2026-2027 Academic Year"
  code: string; // e.g. "AY-2026-27"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  isCurrent: boolean;
  terms: AcademicTerm[];
  createdAt: number;
  updatedAt: number;
}

/* ------------------------------------------------------------------ */
/*  3. Staff Attendance & Regularization                               */
/* ------------------------------------------------------------------ */

export type StaffAttendanceStatus =
  | "present"
  | "late"
  | "early_departure"
  | "half_day"
  | "absent"
  | "on_duty"
  | "holiday"
  | "leave";

export type StaffDutyType =
  | "regular"
  | "exam_duty"
  | "training"
  | "institutional_duty"
  | "off_campus";

export interface StaffAttendance {
  id: string;
  tenantId: string;
  campusId: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  checkInTime?: string | undefined; // HH:mm:ss or ISO
  checkOutTime?: string | undefined; // HH:mm:ss or ISO
  status: StaffAttendanceStatus;
  dutyType: StaffDutyType;
  workHours?: number | undefined;
  remarks?: string | undefined;
  verificationStatus: "verified" | "regularization_pending" | "discrepancy";
  createdAt: number;
  updatedAt: number;
}

export interface AttendanceRegularization {
  id: string;
  tenantId: string;
  campusId?: string | undefined;
  employeeId: string;
  employeeName: string;
  attendanceId?: string | undefined;
  date: string; // YYYY-MM-DD
  reason: string;
  requestedCheckIn?: string | undefined;
  requestedCheckOut?: string | undefined;
  status: "pending" | "approved" | "rejected";
  approverId?: string | undefined;
  approverName?: string | undefined;
  approverNote?: string | undefined;
  reviewedAt?: number | undefined;
  createdAt: number;
  updatedAt: number;
}

/* ------------------------------------------------------------------ */
/*  4. Faculty Workload & Timetable Scheduling                         */
/* ------------------------------------------------------------------ */

export interface SubjectAllocation {
  subjectCode: string; // e.g. "MATH-101"
  subjectName: string; // e.g. "Advanced Calculus"
  classGrade: string; // e.g. "Grade 11-A", "Semester 3"
  section?: string | undefined;
  weeklyPeriods: number; // e.g. 5
}

export interface FacultyWorkload {
  id: string;
  tenantId: string;
  campusId: string;
  employeeId: string;
  employeeName: string;
  academicSessionId: string;
  departmentId: string;
  maxWeeklyPeriods: number; // e.g. 24
  assignedWeeklyPeriods: number;
  subjects: SubjectAllocation[];
  createdAt: number;
  updatedAt: number;
}

export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday";

export interface TeachingSchedule {
  id: string;
  tenantId: string;
  campusId: string;
  employeeId: string;
  employeeName: string;
  academicSessionId: string;
  dayOfWeek: DayOfWeek;
  periodNumber: number; // 1, 2, 3...
  startTime: string; // e.g. "09:00"
  endTime: string; // e.g. "09:45"
  subjectCode: string;
  subjectName: string;
  classGrade: string;
  section: string;
  room: string;
  createdAt: number;
  updatedAt: number;
}

/* ------------------------------------------------------------------ */
/*  5. Substitute Teacher Management                                   */
/* ------------------------------------------------------------------ */

export interface SubstituteAssignment {
  id: string;
  tenantId: string;
  campusId: string;
  date: string; // YYYY-MM-DD
  periodNumber: number;
  subjectCode: string;
  subjectName: string;
  classGrade: string;
  section: string;
  room: string;
  absentEmployeeId: string;
  absentEmployeeName: string;
  substituteEmployeeId: string;
  substituteEmployeeName: string;
  status: "assigned" | "confirmed" | "completed" | "cancelled";
  assignedBy: string; // User ID / Name
  remarks?: string | undefined;
  createdAt: number;
  updatedAt: number;
}

/* ------------------------------------------------------------------ */
/*  6. Institutional Payroll & Compensation                            */
/* ------------------------------------------------------------------ */

export interface PayrollRun {
  id: string;
  tenantId: string;
  campusId?: string | undefined;
  name: string; // e.g. "October 2026 Faculty & Staff Payroll"
  month: number; // 1 - 12
  year: number;
  currency: string; // e.g. "INR"
  status: "draft" | "review" | "approved" | "paid";
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  employeeCount: number;
  approvedBy?: string | undefined;
  approvedAt?: number | undefined;
  createdAt: number;
  updatedAt: number;
}

export interface Payslip {
  id: string;
  tenantId: string;
  payrollRunId: string;
  employeeId: string;
  employeeName: string;
  month: number;
  year: number;
  currency: string; // e.g. "INR"
  basicSalary: number;
  allowances: {
    da: number; // Dearness Allowance
    hra: number; // House Rent Allowance
    ta: number; // Transport Allowance
    special: number;
    other: number;
  };
  grossEarnings: number;
  deductions: {
    pf: number; // Provident Fund
    esi: number; // Employee State Insurance
    professionalTax: number;
    tds: number; // Tax Deducted at Source
    unpaidLeave: number;
    other: number;
  };
  totalDeductions: number;
  netSalary: number;
  paymentStatus: "unpaid" | "paid";
  paidOn?: string | undefined;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    ifsc: string;
  } | undefined;
  remarks?: string | undefined;
  createdAt: number;
}

/* ------------------------------------------------------------------ */
/*  7. Faculty Performance & Appraisal                                 */
/* ------------------------------------------------------------------ */

export interface PerformanceReview {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeName: string;
  reviewPeriod: string; // e.g. "Annual Review 2025-26"
  academicSessionId: string;
  status: "self_review" | "manager_review" | "completed";
  selfRating?: number | undefined; // 1 to 5
  selfComments?: string | undefined;
  reviewerId?: string | undefined;
  reviewerName?: string | undefined;
  reviewerRating?: number | undefined; // 1 to 5
  reviewerComments?: string | undefined;
  teachingEffectivenessRating?: number | undefined; // 1 to 5
  institutionalContributionsRating?: number | undefined; // 1 to 5
  professionalDevelopmentRating?: number | undefined; // 1 to 5
  finalScore?: number | undefined; // Weighted 1 to 100
  completedAt?: number | undefined;
  createdAt: number;
  updatedAt: number;
}

/* ------------------------------------------------------------------ */
/*  8. Training & Faculty Development Programs (FDP)                   */
/* ------------------------------------------------------------------ */

export interface TrainingProgram {
  id: string;
  tenantId: string;
  title: string;
  category: "faculty_development" | "pedagogy" | "technical" | "administrative" | "compliance";
  instructorOrOrg: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  durationHours: number;
  locationOrUrl: string;
  maxParticipants?: number | undefined;
  description: string;
  attendeesCount?: number | undefined;
  createdAt: number;
  updatedAt: number;
}

export interface StaffTrainingRecord {
  id: string;
  tenantId: string;
  trainingProgramId: string;
  programTitle: string;
  employeeId: string;
  employeeName: string;
  status: "enrolled" | "attended" | "completed" | "certified";
  completionDate?: string | undefined;
  certificateUrl?: string | undefined;
  certificateNumber?: string | undefined;
  validityEndDate?: string | undefined;
  createdAt: number;
  updatedAt: number;
}
