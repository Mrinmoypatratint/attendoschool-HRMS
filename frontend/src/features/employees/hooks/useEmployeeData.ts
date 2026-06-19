import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../auth/context/AuthContext";
import { EmployeeService } from "../services/employeeService";
import { getFriendlyErrorMessage } from "../../../lib/errors";
import type { Employee, Department } from "@hrms/middleware";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../../lib/firebase";

/**
 * Custom hook to load and manage tenant employee directory and departments data,
 * honoring strict data-level access rules.
 */
export function useEmployeeData() {
  const { profile, dataAccessLevel } = useAuth();
  const tenantId = profile?.activeTenantId || "";
  const userId = profile?.id || "";

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [callerEmployee, setCallerEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch departments (including archived ones so the UI can manage/view them)
      const depts = await EmployeeService.getDepartments(tenantId, true);
      setDepartments(depts);

      // 2. Fetch the caller's employee profile
      let resolvedCallerEmp: Employee | null = null;
      if (userId) {
        resolvedCallerEmp = await EmployeeService.getCallerEmployee(tenantId, userId);
        setCallerEmployee(resolvedCallerEmp);
      }

      // 3. Load tenant users (to filter out CEO/CTO in Employees section)
      // CEO: org_admin
      // CTO: superadmin
      const roleByUserId: Record<string, string> = {};
      try {
        const qUsers = query(
          collection(db, "users"),
          where(`tenants.${tenantId}.status`, "in", ["active", "invited"])
        );

        const snap = await getDocs(qUsers);
        snap.forEach((docSnap) => {
          const data = docSnap.data() as any;
          const tInfo = data.tenants?.[tenantId];
          if (tInfo?.role) {
            roleByUserId[data.id] = String(tInfo.role);
          }
        });
      } catch {
        // If tenant users can't be read, don't block employees view entirely.
        // (permission rules should still allow Employees directory access via employees.view)
      }

      // 4. Fetch employees list based on active dataAccessLevel relations
      const list = await EmployeeService.getEmployees(tenantId, dataAccessLevel, resolvedCallerEmp);

      // 5. Apply CEO/CTO exclusion for users that are linked to employee records
      // Requirement: "if any user is invited and joined ... should show in employees section
      // and CEO/CTO should not be there"
      const filtered = list.filter((emp) => {
        if (!emp.userId) return true; // keep unlinked employee records

        const roleRaw = roleByUserId[emp.userId];
        if (!roleRaw) return true; // if we can't determine role, don't hide

        const role = String(roleRaw).toLowerCase().trim();

        // Requirement mapping:
        // org_admin = CEO
        // superadmin = CTO
        //
        // Be tolerant to role storage variations (id vs name vs casing).
        const isCEO = role === "org_admin" || role === "ceo" || role.includes("org_admin") || role.includes("ceo");
        const isCTO =
          role === "superadmin" ||
          role === "cto" ||
          role === "super_admin" ||
          role.includes("superadmin") ||
          role.includes("super_admin") ||
          role.includes("cto");

        return !(isCEO || isCTO);
      });

      setEmployees(filtered);
    } catch (err: any) {
      console.error("Error loading employee dashboard data:", err);
      setError(getFriendlyErrorMessage(err, "Failed to load directory details."));
    } finally {
      setLoading(false);
    }
  }, [tenantId, userId, dataAccessLevel]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    employees,
    departments,
    callerEmployee,
    loading,
    error,
    refetch: fetchData,
  };
}
