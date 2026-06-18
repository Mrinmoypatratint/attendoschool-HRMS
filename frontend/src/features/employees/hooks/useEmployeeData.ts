import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../auth/context/AuthContext";
import { EmployeeService } from "../services/employeeService";
import { getFriendlyErrorMessage } from "../../../lib/errors";
import type { Employee, Department } from "@hrms/middleware";

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

      // 3. Fetch filtered employees list based on active dataAccessLevel
      const list = await EmployeeService.getEmployees(tenantId, dataAccessLevel, resolvedCallerEmp);
      setEmployees(list);
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
