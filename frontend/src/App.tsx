/**
 * App.tsx
 * -------
 * Root application component. Declares the full client-side route table:
 * public auth/careers routes plus authenticated SaaS routes that are gated by
 * `AuthGuard` (session) and `ProtectedRoute` (per-permission RBAC). Lazy route
 * loads are covered by the top-level <Suspense> fallback.
 */
import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense } from "react";
import { AppShell } from "./components/layout/AppShell";
import { AuthGuard } from "./components/auth/AuthGuard";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

// Auth pages
import { LoginPage } from "./features/auth/pages/LoginPage";
import { ForgotPasswordPage } from "./features/auth/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./features/auth/pages/ResetPasswordPage";

// Business pages
import { DashboardPage } from "./features/dashboard/pages/DashboardPage";
import { UsersListPage } from "./features/users/pages/UsersListPage";
import { UserDetailsPage } from "./features/users/pages/UserDetailsPage";
import { RbacPage } from "./features/rbac/pages/RbacPage";
import { SettingsPage } from "./features/settings/pages/SettingsPage";
import { EmployeesListPage } from "./features/employees/pages/EmployeesListPage";
import { EmployeeProfilePage } from "./features/employees/pages/EmployeeProfilePage";
import { TeamsListPage } from "./features/teams/pages/TeamsListPage";
import { JobsListPage } from "./features/recruitment/pages/JobsListPage";
import { PipelinePage } from "./features/recruitment/pages/PipelinePage";
import { CareersPage } from "./features/recruitment/pages/CareersPage";
import { LeaveManagementPage } from "./features/leave/pages/LeaveManagementPage";
import { DocumentsPage } from "./features/documents/pages/DocumentsPage";

// Educational Institution HRMS pages
import { CampusesListPage } from "./features/campuses/pages/CampusesListPage";
import { AttendancePage } from "./features/attendance/pages/AttendancePage";
import { AcademicCalendarPage } from "./features/calendar/pages/AcademicCalendarPage";
import { WorkloadPage } from "./features/workload/pages/WorkloadPage";
import { SubstituteManagementPage } from "./features/workload/pages/SubstituteManagementPage";
import { PayrollPage } from "./features/payroll/pages/PayrollPage";
import { PerformancePage } from "./features/performance/pages/PerformancePage";

// Common pages
import { NotFoundPage } from "./features/common/pages/NotFoundPage";
import { LoadingScreen } from "./components/ui/LoadingScreen";

/** Root component: renders the application's route tree. */
export default function App() {
  return (
    <Suspense fallback={<LoadingScreen title="Loading application..." />}>
      <Routes>
        {/* Public auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Public careers page (no authentication required) */}
        <Route path="/careers/:tenantId" element={<CareersPage />} />

        {/* Protected SaaS routes */}
        <Route
          element={
            <AuthGuard>
              <AppShell />
            </AuthGuard>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route 
            path="/campuses" 
            element={
              <ProtectedRoute permission="campuses.view">
                <CampusesListPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/employees" 
            element={
              <ProtectedRoute permission="employees.view">
                <EmployeesListPage />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/employees/:id"
            element={
              <ProtectedRoute permission="employees.view">
                <EmployeeProfilePage />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/attendance" 
            element={
              <ProtectedRoute permission="attendance.view">
                <AttendancePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/calendar" 
            element={
              <ProtectedRoute permission="academic_calendar.view">
                <AcademicCalendarPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/workload" 
            element={
              <ProtectedRoute permission="workload.view">
                <WorkloadPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/substitutes" 
            element={
              <ProtectedRoute permission="substitutes.view">
                <SubstituteManagementPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/teams" 
            element={
              <ProtectedRoute permission="teams.view">
                <TeamsListPage />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/jobs"
            element={
              <ProtectedRoute permission="jobs.view">
                <JobsListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pipeline"
            element={
              <ProtectedRoute permission="candidates.view">
                <PipelinePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leave"
            element={
              <ProtectedRoute permission="leave.view">
                <LeaveManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payroll"
            element={
              <ProtectedRoute permission="payroll.view">
                <PayrollPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/performance"
            element={
              <ProtectedRoute permission="performance.view">
                <PerformancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/documents"
            element={
              <ProtectedRoute permission="documents.view">
                <DocumentsPage />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/users" 
            element={
              <ProtectedRoute permission="users.view">
                <UsersListPage />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/users/:id" 
            element={
              <ProtectedRoute permission="users.view">
                <UserDetailsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/rbac" 
            element={
              <ProtectedRoute permission="roles.view">
                <RbacPage />
              </ProtectedRoute>
            } 
          />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

