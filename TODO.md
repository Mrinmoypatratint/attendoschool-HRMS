# TODO - Fix “Add Employee” permission issue

- [x] Add permission guards in `frontend/src/features/employees/pages/EmployeesListPage.tsx` to prevent create/edit/delete employee actions when the user lacks:
  - `employees.create`
  - `employees.update`
  - `employees.delete`
- [x] Verify UI buttons already hidden still remain unchanged; ensure direct modal submit/delete is also blocked.
