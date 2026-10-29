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
  limit 
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type { Employee, Department, DataAccessLevel, EmployeeCompensation } from "@hrms/middleware";
import { AuditLogService } from "../../settings/services/auditLogService";

/**
 * Service to manage departments and employees, implementing strict data access level security.
 */
export const EmployeeService = {
  // ==================== DEPARTMENTS ====================

  /**
   * Fetches all departments for a tenant, optionally including archived ones.
   */
  async getDepartments(tenantId: string, includeArchived: boolean = false): Promise<Department[]> {
    const q = query(collection(db, "departments"), where("tenantId", "==", tenantId));
    const snap = await getDocs(q);
    const list: Department[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data() as Department;
      if (includeArchived || !data.isArchived) {
        list.push(data);
      }
    });
    return list;
  },

  /**
   * Creates a new department.
   */
  async createDepartment(
    tenantId: string, 
    data: Omit<Department, "id" | "tenantId" | "createdAt" | "updatedAt">,
    callerInfo?: { uid: string; email: string }
  ): Promise<Department> {
    const id = `dept_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    const now = Date.now();
    const dept: Department = {
      ...data,
      id,
      tenantId,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db, "departments", id), dept);

    if (callerInfo) {
      await AuditLogService.createAuditLog(tenantId, {
        userId: callerInfo.uid,
        userEmail: callerInfo.email,
        action: "create",
        resource: "department",
        resourceId: id,
        details: `Created department "${dept.name}" with code "${dept.code}"`,
      });
    }

    return dept;
  },

  /**
   * Updates an existing department.
   */
  async updateDepartment(
    departmentId: string, 
    data: Partial<Omit<Department, "id" | "tenantId" | "createdAt" | "updatedAt">>,
    callerInfo?: { uid: string; email: string }
  ): Promise<void> {
    const ref = doc(db, "departments", departmentId);
    
    if (callerInfo) {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const oldDept = snap.data() as Department;
        await AuditLogService.createAuditLog(oldDept.tenantId, {
          userId: callerInfo.uid,
          userEmail: callerInfo.email,
          action: "update",
          resource: "department",
          resourceId: departmentId,
          details: `Updated department "${oldDept.name}" details. Changes: ${JSON.stringify(data)}`,
        });
      }
    }

    await updateDoc(ref, {
      ...data,
      updatedAt: Date.now(),
    });
  },

  /**
   * Deletes a department.
   */
  async deleteDepartment(
    departmentId: string,
    callerInfo?: { uid: string; email: string }
  ): Promise<void> {
    if (callerInfo) {
      const snap = await getDoc(doc(db, "departments", departmentId));
      if (snap.exists()) {
        const dept = snap.data() as Department;
        await AuditLogService.createAuditLog(dept.tenantId, {
          userId: callerInfo.uid,
          userEmail: callerInfo.email,
          action: "delete",
          resource: "department",
          resourceId: departmentId,
          details: `Deleted department "${dept.name}" (${dept.code})`,
        });
      }
    }
    await deleteDoc(doc(db, "departments", departmentId));
  },


  // ==================== EMPLOYEES ====================

  /**
   * Resolves the caller's employee profile by matching Firebase Auth userId.
   */
  async getCallerEmployee(tenantId: string, userId: string): Promise<Employee | null> {
    const q = query(
      collection(db, "employees"), 
      where("tenantId", "==", tenantId),
      where("userId", "==", userId)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const firstDoc = snap.docs[0];
    if (!firstDoc) return null;
    return firstDoc.data() as Employee;
  },

  /**
   * Fetches employees for a tenant, applying granular data level access checks on the client.
   * Scopes include: "all", "department", "team", "reports", "self".
   */
  async getEmployees(
    tenantId: string, 
    dataAccessLevel: DataAccessLevel = "all", 
    callerEmployee: Employee | null = null
  ): Promise<Employee[]> {
    // 1. Fetch all employees in tenant first (to apply filter locally based on relations)
    // This is safe since we query by tenantId first, satisfying tenant isolation.
    const q = query(collection(db, "employees"), where("tenantId", "==", tenantId), limit(5000));
    const snap = await getDocs(q);
    const allEmployees: Employee[] = [];
    snap.forEach((docSnap) => {
      allEmployees.push(docSnap.data() as Employee);
    });

    // 2. If access level is "all", return everything
    if (dataAccessLevel === "all") {
      return allEmployees;
    }

    // If there's no matching caller employee record but access level requires relations,
    // fallback to returning empty list (except if they can see themselves, but there is no self record).
    if (!callerEmployee) {
      return [];
    }

    // 3. Filter employees based on access tier relations
    switch (dataAccessLevel) {
      case "self":
        // Can only see their own profile
        return allEmployees.filter(e => e.id === callerEmployee.id);

      case "reports":
        // Can see themselves + anyone reporting directly to them
        return allEmployees.filter(e => e.id === callerEmployee.id || e.managerId === callerEmployee.id);

      case "team":
        // Can see themselves + peers sharing their manager + direct reports
        return allEmployees.filter(e => 
          e.id === callerEmployee.id || 
          e.managerId === callerEmployee.id ||
          (callerEmployee.managerId && e.managerId === callerEmployee.managerId)
        );

      case "campus":
        // Can see anyone inside the same campus / branch
        return callerEmployee.campusId 
          ? allEmployees.filter(e => e.campusId === callerEmployee.campusId)
          : allEmployees;

      case "department":
        // Can see anyone inside the same department
        return allEmployees.filter(e => e.departmentId === callerEmployee.departmentId);

      default:
        return [];
    }
  },

  /**
   * Fetches a single employee record.
   */
  async getEmployeeById(employeeId: string): Promise<Employee | null> {
    const snap = await getDoc(doc(db, "employees", employeeId));
    if (!snap.exists()) return null;
    return snap.data() as Employee;
  },

  /**
   * Creates a new employee using a caller-supplied (manual) employee ID.
   * The ID becomes the Firestore document id and must be unique within the tenant.
   */
  async createEmployee(
    tenantId: string,
    employeeId: string,
    data: Omit<Employee, "id" | "tenantId" | "createdAt" | "updatedAt">,
    callerInfo?: { uid: string; email: string }
  ): Promise<Employee> {
    const id = (employeeId || "").trim();
    if (!id) {
      throw new Error("Employee ID is required.");
    }
    // Allow letters, numbers, dot, dash, underscore (safe as a Firestore doc id).
    if (!/^[A-Za-z0-9._-]+$/.test(id)) {
      throw new Error("Employee ID may only contain letters, numbers, '.', '-' and '_'.");
    }

    const ref = doc(db, "employees", id);
    const existing = await getDoc(ref);
    if (existing.exists()) {
      throw new Error(`Employee ID "${id}" already exists.`);
    }

    const now = Date.now();
    const emp: Employee = {
      ...data,
      id,
      tenantId,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(ref, emp);

    if (callerInfo) {
      await AuditLogService.createAuditLog(tenantId, {
        userId: callerInfo.uid,
        userEmail: callerInfo.email,
        action: "create",
        resource: "employee",
        resourceId: id,
        details: `Created employee profile for "${emp.firstName} ${emp.lastName}" as "${emp.jobTitle}" (ID: ${id})`,
      });
    }

    return emp;
  },

  /**
   * Updates an existing employee.
   */
  async updateEmployee(
    employeeId: string, 
    data: Partial<Omit<Employee, "id" | "tenantId" | "createdAt" | "updatedAt">>,
    callerInfo?: { uid: string; email: string }
  ): Promise<void> {
    const ref = doc(db, "employees", employeeId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      throw new Error(`Employee with ID ${employeeId} not found.`);
    }
    const oldEmp = snap.data() as Employee;

    if (callerInfo) {
      await AuditLogService.createAuditLog(oldEmp.tenantId, {
        userId: callerInfo.uid,
        userEmail: callerInfo.email,
        action: "update",
        resource: "employee",
        resourceId: employeeId,
        details: `Updated employee profile for "${oldEmp.firstName} ${oldEmp.lastName}". Changes: ${JSON.stringify(data)}`,
      });
    }

    // Sync changes to the User Profile in Firestore
    const targetUserId = data.userId || oldEmp.userId;
    if (targetUserId) {
      const newFirstName = data.firstName !== undefined ? data.firstName : oldEmp.firstName;
      const newLastName = data.lastName !== undefined ? data.lastName : oldEmp.lastName;
      const newDisplayName = `${newFirstName} ${newLastName}`.trim();
      const newEmail = data.email !== undefined ? data.email : oldEmp.email;

      try {
        await updateDoc(doc(db, "users", targetUserId), {
          displayName: newDisplayName,
          email: newEmail.trim().toLowerCase(),
          updatedAt: Date.now(),
        });
      } catch (userUpdateErr) {
        console.error("Failed to sync user profile from employee update:", userUpdateErr);
      }
    }

    await updateDoc(ref, {
      ...data,
      updatedAt: Date.now(),
    });
  },

  /**
   * SEC-002: read all compensation records for a tenant as a map
   * employeeId -> { salary, currency }. Only succeeds for callers with
   * employees.update (HR/admins); returns {} on permission denial so the
   * directory still renders for everyone else.
   */
  async getCompensations(
    tenantId: string
  ): Promise<Record<string, { salary: number; currency: string }>> {
    try {
      const q = query(collection(db, "employeeCompensation"), where("tenantId", "==", tenantId));
      const snap = await getDocs(q);
      const map: Record<string, { salary: number; currency: string }> = {};
      snap.forEach((d) => {
        const c = d.data() as EmployeeCompensation;
        map[c.employeeId] = { salary: c.salary, currency: c.currency || "INR" };
      });
      return map;
    } catch {
      // Caller lacks employees.update — no compensation visibility.
      return {};
    }
  },

  /** Read a single employee's compensation (owner or employees.update holder). */
  async getCompensation(employeeId: string): Promise<EmployeeCompensation | null> {
    try {
      const snap = await getDoc(doc(db, "employeeCompensation", employeeId));
      return snap.exists() ? (snap.data() as EmployeeCompensation) : null;
    } catch {
      return null;
    }
  },

  /**
   * Create/update an employee's compensation record (employees.create on first
   * write, employees.update thereafter — enforced by rules).
   */
  async setCompensation(
    employeeId: string,
    tenantId: string,
    salary: number,
    currency: string = "INR",
    callerInfo?: { uid: string; email: string }
  ): Promise<void> {
    const comp: EmployeeCompensation = {
      id: employeeId,
      tenantId,
      employeeId,
      salary: Number(salary) || 0,
      currency,
      updatedAt: Date.now(),
    };
    await setDoc(doc(db, "employeeCompensation", employeeId), comp, { merge: true });

    if (callerInfo) {
      await AuditLogService.createAuditLog(tenantId, {
        userId: callerInfo.uid,
        userEmail: callerInfo.email,
        action: "update",
        resource: "employee",
        resourceId: employeeId,
        details: `Updated compensation for employee ${employeeId}`,
      });
    }
  },

  /**
   * Terminate or change employee status.
   */
  async updateEmployeeStatus(
    employeeId: string, 
    status: Employee["status"],
    callerInfo?: { uid: string; email: string }
  ): Promise<void> {
    const ref = doc(db, "employees", employeeId);

    if (callerInfo) {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const oldEmp = snap.data() as Employee;
        await AuditLogService.createAuditLog(oldEmp.tenantId, {
          userId: callerInfo.uid,
          userEmail: callerInfo.email,
          action: "update",
          resource: "employee",
          resourceId: employeeId,
          details: `Changed employee status for "${oldEmp.firstName} ${oldEmp.lastName}" from "${oldEmp.status}" to "${status}"`,
        });
      }
    }

    await updateDoc(ref, {
      status,
      updatedAt: Date.now(),
    });
  },

  /**
   * Deletes an employee.
   */
  async deleteEmployee(
    employeeId: string,
    callerInfo?: { uid: string; email: string }
  ): Promise<void> {
    if (callerInfo) {
      const snap = await getDoc(doc(db, "employees", employeeId));
      if (snap.exists()) {
        const emp = snap.data() as Employee;
        await AuditLogService.createAuditLog(emp.tenantId, {
          userId: callerInfo.uid,
          userEmail: callerInfo.email,
          action: "delete",
          resource: "employee",
          resourceId: employeeId,
          details: `Deleted employee profile for "${emp.firstName} ${emp.lastName}"`,
        });
      }
    }
    await deleteDoc(doc(db, "employees", employeeId));
  }
};
