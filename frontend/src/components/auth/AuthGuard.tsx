/**
 * AuthGuard
 * ---------
 * Authentication boundary component. Wraps protected UI and ensures that only
 * authenticated users can view its children. While the auth state is still
 * resolving it shows a loading screen, and unauthenticated users are redirected
 * to the login route.
 */
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../features/auth/context/AuthContext";
import { LoadingScreen } from "../ui/LoadingScreen";

/**
 * Renders its children only for authenticated users.
 *
 * @param children - The protected content to render once authentication is confirmed.
 * @returns A loading screen while auth resolves, a redirect to `/login` when no
 *          user is present, or the children when authenticated.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  // Auth state not yet resolved — avoid flashing a redirect before we know.
  if (loading) {
    return <LoadingScreen title="Checking authentication..." />;
  }

  // No authenticated user — send them to the login page.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default AuthGuard;
