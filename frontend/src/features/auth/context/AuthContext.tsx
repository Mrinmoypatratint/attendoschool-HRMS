/**
 * AuthContext
 *
 * Provides application-wide authentication and authorization state for the
 * multi-tenant HRMS app. It bridges Firebase Auth and Firestore so that
 * consumers can read the current Firebase user, their Firestore user profile,
 * the active tenant, and the resolved RBAC permissions / data access level for
 * the active tenant's role.
 *
 * The provider wires up a chain of real-time Firestore listeners:
 *   1. Firebase Auth state (the signed-in user).
 *   2. The user's profile document (users/{uid}).
 *   3. The active tenant document (tenants/{activeTenantId}).
 *   4. The permissions + data access level for the active role, sourced either
 *      from a per-tenant system-role override document, a custom role document,
 *      or the hardcoded system-role defaults.
 *
 * It also exposes `switchTenant` (changes the user's active tenant) and
 * `logout` (signs out of Firebase Auth), and a `useAuth` hook for consuming
 * the context safely.
 */
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";
import type { UserProfile, Tenant, PermissionKey, DataAccessLevel, SystemRoleType } from "@hrms/middleware";
import { SYSTEM_ROLES, getSystemRoleOverrideId } from "@hrms/middleware";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  activeTenant: Tenant | null;
  permissions: PermissionKey[];
  dataAccessLevel: DataAccessLevel;
  loading: boolean;
  switchTenant: (tenantId: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider
 *
 * React context provider that establishes the authentication/authorization
 * listeners described above and supplies the resulting state to descendants.
 *
 * @param children - The subtree that should have access to the auth context.
 * @returns A context provider element wrapping `children`.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [permissions, setPermissions] = useState<PermissionKey[]>([]);
  const [dataAccessLevel, setDataAccessLevel] = useState<DataAccessLevel>("self");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Listen to Firebase Auth state
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);

      if (!firebaseUser) {
        setProfile(null);
        setActiveTenant(null);
        setPermissions([]);
        setDataAccessLevel("self");
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    setLoading(true);

    // 2. Listen to User Profile in Firestore
    const userRef = doc(db, "users", user.uid);
    const unsubscribeProfile = onSnapshot(
      userRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const profileData = docSnap.data() as UserProfile;
          setProfile(profileData);

          // If there is an active tenant, we will listen to it next (handled by separate useEffect)
          if (!profileData.activeTenantId) {
            setActiveTenant(null);
            setPermissions([]);
            setDataAccessLevel("self");
            setLoading(false);
          }
        } else {
          // Profile document doesn't exist yet (functions might be creating it)
          setProfile(null);
          setActiveTenant(null);
          setPermissions([]);
          setDataAccessLevel("self");
          setLoading(false);
        }
      },
      (error) => {
        console.error("Error listening to user profile:", error);
        setLoading(false);
      }
    );

    return () => unsubscribeProfile();
  }, [user]);

  useEffect(() => {
    if (!profile?.activeTenantId) {
      setActiveTenant(null);
      return;
    }

    setLoading(true);

    // 3. Listen to Active Tenant in Firestore
    const tenantRef = doc(db, "tenants", profile.activeTenantId);
    const unsubscribeTenant = onSnapshot(
      tenantRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setActiveTenant(docSnap.data() as Tenant);
        } else {
          setActiveTenant(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to tenant:", error);
        setLoading(false);
      }
    );

    return () => unsubscribeTenant();
  }, [profile?.activeTenantId]);

  // 4. Resolve permissions and dataAccessLevel based on active role
  useEffect(() => {
    if (!profile?.activeTenantId) {
      setPermissions([]);
      setDataAccessLevel("self");
      return;
    }

    const tenantInfo = profile.tenants[profile.activeTenantId];
    if (!tenantInfo) {
      setPermissions([]);
      setDataAccessLevel("self");
      return;
    }

    const roleId = tenantInfo.role;
    if (!roleId) {
      setPermissions([]);
      setDataAccessLevel("self");
      return;
    }

    // Check if it is a system role
    const systemRoleKeys = Object.keys(SYSTEM_ROLES);
    if (systemRoleKeys.includes(roleId)) {
      const config = SYSTEM_ROLES[roleId as SystemRoleType];
      // Data access level for system roles is fixed by the system config.
      setDataAccessLevel(config.dataAccessLevel);

      // Permissions may be customized per-tenant via a role override document.
      // Listen to it so admin edits to (e.g.) the Employee matrix take effect
      // live for every member holding that system role. When no override exists,
      // fall back to the hardcoded system defaults.
      const overrideRef = doc(
        db,
        "roleOverrides",
        getSystemRoleOverrideId(profile.activeTenantId, roleId as SystemRoleType)
      );
      const unsubscribeOverride = onSnapshot(
        overrideRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setPermissions(
              (data?.permissions as PermissionKey[]) || config.permissions
            );
          } else {
            setPermissions(config.permissions);
          }
        },
        (error) => {
          console.error("Error listening to system role override:", error);
          setPermissions(config.permissions);
        }
      );

      return () => unsubscribeOverride();
    } else {
      // It is a custom role, listen to it in the root "roles" collection
      const roleRef = doc(db, "roles", roleId);
      const unsubscribeRole = onSnapshot(
        roleRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const roleData = docSnap.data();
            if (roleData && roleData.isActive !== false) {
              setPermissions(roleData.permissions as PermissionKey[] || []);
              setDataAccessLevel(roleData.dataAccessLevel as DataAccessLevel || "self");
            } else {
              // Deactivated custom role
              setPermissions([]);
              setDataAccessLevel("self");
            }
          } else {
            setPermissions([]);
            setDataAccessLevel("self");
          }
        },
        (error) => {
          console.error("Error listening to custom role:", error);
          setPermissions([]);
          setDataAccessLevel("self");
        }
      );

      return () => unsubscribeRole();
    }
  }, [profile?.activeTenantId, profile?.tenants]);

  const switchTenant = async (tenantId: string) => {
    if (!user || !profile) return;
    if (!profile.tenants[tenantId]) {
      throw new Error("User does not have access to this tenant.");
    }

    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      activeTenantId: tenantId,
    });
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        activeTenant,
        permissions,
        dataAccessLevel,
        loading,
        switchTenant,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth
 *
 * Hook to access the authentication context. Must be called from within an
 * `AuthProvider`.
 *
 * @returns The current auth context value (user, profile, activeTenant,
 *   permissions, dataAccessLevel, loading, switchTenant, logout).
 * @throws Error if used outside of an `AuthProvider`.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

