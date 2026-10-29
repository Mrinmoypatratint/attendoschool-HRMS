/**
 * Employee type definitions.
 *
 * Models the tenant-readable employee directory record and the separately
 * stored, access-controlled compensation record. Consumed via named imports and
 * re-exported by the middleware barrel.
 */

/** Current employment state of an employee. */
export type EmployeeStatus = "active" | "onboarding" | "terminated" | "suspended";

/**
 * Core employee directory record (non-sensitive, tenant-readable). Sensitive
 * pay data lives separately in {@link EmployeeCompensation}.
 */
export interface Employee {
  id: string;
  tenantId: string;
  userId?: string; // Optional link to Firebase Auth/User Profile ID
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  departmentId: string; // References Department.id
  managerId?: string; // References Employee.id (for direct reports/manager relationships)
  status: EmployeeStatus;
  startDate: string; // ISO date string (YYYY-MM-DD)
  workLocation: string; // e.g. "Remote", "Main Campus", "Downtown Branch"
  
  // Educational Institution Extensions
  campusId?: string | undefined; // References Campus.id
  staffCategory?: "teaching" | "non_teaching" | "administrative" | "technical" | "support" | undefined;
  teachingStatus?: "teaching" | "non_teaching" | undefined;
  facultyGrade?: string | undefined; // e.g. "Professor", "Associate Professor", "Assistant Professor", "Senior Lecturer", "Teacher"
  highestQualification?: string | undefined; // e.g. "Ph.D", "M.Tech", "M.Sc", "B.Ed", "M.Ed"
  specialization?: string | undefined; // e.g. "Computer Science & Engineering", "Organic Chemistry"
  subjectsTaught?: string[] | undefined; // e.g. ["Physics", "Mathematics"]
  teachingExperienceYears?: number | undefined;
  academicExperienceYears?: number | undefined;
  probationEndDate?: string | undefined; // ISO date string (YYYY-MM-DD)
  confirmationDate?: string | undefined; // ISO date string (YYYY-MM-DD)

  createdAt: number;
  updatedAt: number;
}

/**
 * Sensitive compensation data, stored SEPARATELY from the (tenant-readable)
 * Employee directory record so it can be access-controlled at the database
 * layer (SEC-002). Doc id == employeeId. Readable only by holders of
 * employees.update (HR/admins) or the record owner; see firestore.rules
 * /employeeCompensation.
 */
export interface EmployeeCompensation {
  id: string; // == employeeId
  tenantId: string;
  employeeId: string;
  salary: number;
  currency: string;
  updatedAt: number;
}
