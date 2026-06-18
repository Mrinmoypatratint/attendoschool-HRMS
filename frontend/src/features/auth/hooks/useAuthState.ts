/**
 * useAuthState
 *
 * A lightweight hook that tracks the current Firebase Auth user and whether the
 * initial auth state has resolved. Unlike the full `AuthContext`, this hook does
 * not load Firestore profile/tenant/permission data — it only mirrors the raw
 * Firebase Auth user, which is useful for simple "is signed in?" checks.
 */
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../../../lib/firebase";

/**
 * useAuthState
 *
 * Subscribes to Firebase Auth state changes for the lifetime of the component.
 *
 * @returns An object with `user` (the current Firebase `User` or `null`) and
 *   `loading` (true until the first auth state callback fires).
 */
export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { user, loading };
}

export default useAuthState;

