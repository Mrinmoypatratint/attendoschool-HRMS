/**
 * LoginPage
 *
 * Public entry page combining two flows in a tabbed layout:
 *   - "Sign In": email/password login (and Google SSO for already-provisioned
 *     accounts) that navigates to /dashboard on success.
 *   - "Create Organization": registers a new user with email/password and
 *     bootstraps a brand-new tenant, granting the user the `org_admin` role,
 *     then navigates to /dashboard.
 *
 * Google SSO is intentionally login-only: it never auto-creates accounts and
 * signs out any user lacking a users/{uid} profile with an active tenant.
 *
 * When running against the Firebase emulator (VITE_USE_EMULATOR === "true"),
 * a panel of seeded demo accounts is shown for quick autofill.
 *
 * Forms are validated with react-hook-form + Zod.
 */
import { getFriendlyErrorMessage } from "../../../lib/errors";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { auth, db, googleProvider, functions } from "../../../lib/firebase";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Za-z]/, "Include at least one letter")
    .regex(/[0-9]/, "Include at least one number"),
  orgName: z.string().min(2, "Company name must be at least 2 characters"),
  industry: z.string().min(2, "Please specify an industry"),
  timezone: z.string().min(2, "Please select a timezone"),
  address: z.string().min(5, "Please enter your company address"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

/**
 * Demo login accounts seeded by `npm run seed` (emulator only).
 * Keep these in sync with backend/seed-demo.cjs.
 */
const DEMO_PASSWORD = "Demo@1234";
const DEMO_ACCOUNTS: Array<{ label: string; email: string }> = [
  { label: "Super Admin", email: "superadmin@demo.io" },
  { label: "Org Admin", email: "orgadmin@demo.io" },
  { label: "HR Manager", email: "hr@demo.io" },
  { label: "Recruiter", email: "recruiter@demo.io" },
  { label: "Employee", email: "employee@demo.io" },
];
const SHOW_DEMO = import.meta.env.VITE_USE_EMULATOR === "true";

/**
 * LoginPage
 *
 * Renders the sign-in / create-organization tabbed UI, the Google SSO button,
 * and (in emulator mode) the demo-accounts panel. Manages tab, loading, and
 * error state for the auth flows.
 *
 * @returns The login page element.
 */
export function LoginPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState("");

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const snap = await getDocs(collection(db, "tenants"));
        const list: any[] = [];
        snap.forEach((doc) => {
          list.push(doc.data());
        });
        setTenants(list);
      } catch (err) {
        console.error("Failed to load organizations:", err);
      }
    };
    fetchTenants();
  }, []);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      orgName: "",
      industry: "Technology",
      timezone: "GMT+5:30",
      address: "",
    },
  });

  const reportLoginFailure = (email: string, attemptedTenantId?: string) => {
    if (!email) return;
    try {
      if (import.meta.env.VITE_USE_EMULATOR === "true") {
        const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-mock-project";
        fetch(`http://127.0.0.1:5001/${projectId}/us-central1/reportFailedLoginHttp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, attemptedTenantId }),
        }).catch((fetchErr) => console.error("Failed to report login failure via HTTP:", fetchErr));
      } else {
        const reportFn = httpsCallable<{ email: string; attemptedTenantId?: string | undefined }, { success: boolean; type: string }>(functions, "reportFailedLogin");
        reportFn({ email, attemptedTenantId }).catch((callErr) => console.error("Failed to report login failure via Callable:", callErr));
      }
    } catch (reportErr) {
      console.error("Failed to send login failure report:", reportErr);
    }
  };

  const reportWrongOrgAttempt = (email: string, attemptedTenantId: string) => {
    if (!email || !attemptedTenantId) return;
    try {
      if (import.meta.env.VITE_USE_EMULATOR === "true") {
        const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-mock-project";
        fetch(`http://127.0.0.1:5001/${projectId}/us-central1/reportWrongOrganizationAttemptHttp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, attemptedTenantId }),
        }).catch((fetchErr) => console.error("Failed to report wrong org attempt via HTTP:", fetchErr));
      } else {
        const reportFn = httpsCallable<{ email: string; attemptedTenantId: string }, { success: boolean }>(
          functions,
          "reportWrongOrganizationAttempt"
        );
        reportFn({ email, attemptedTenantId }).catch((callErr) =>
          console.error("Failed to report wrong org attempt via Callable:", callErr)
        );
      }
    } catch (reportErr) {
      console.error("Failed to send wrong org attempt report:", reportErr);
    }
  };

  const onLoginSubmit = async (data: LoginForm) => {
    setError(null);
    setLoading(true);
    if (!selectedTenantId) {
      setError("Please choose your organization name.");
      setLoading(false);
      return;
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const uid = userCredential.user.uid;

      // Fetch user profile to verify tenant membership
      const userSnap = await getDoc(doc(db, "users", uid));
      if (!userSnap.exists()) {
        await signOut(auth);
        setError("User profile not found. Please contact support.");
        reportLoginFailure(data.email, selectedTenantId);
        return;
      }

      const profile = userSnap.data();
      const userTenant = profile?.tenants?.[selectedTenantId];

      if (!userTenant || userTenant.status !== "active") {
        await signOut(auth);
        setError("You do not have access to the selected organization.");
        reportWrongOrgAttempt(data.email, selectedTenantId);
        return;
      }

      // Automatically set their active tenant ID on successful login
      if (profile.activeTenantId !== selectedTenantId) {
        await setDoc(doc(db, "users", uid), { activeTenantId: selectedTenantId }, { merge: true });
      }

      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyErrorMessage(err, "Failed to log in. Please check your credentials."));
      reportLoginFailure(data.email, selectedTenantId);
    } finally {
      setLoading(false);
    }
  };

  const onRegisterSubmit = async (data: RegisterForm) => {
    setError(null);
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const uid = userCredential.user.uid;

      const tenantId = `tenant_${Math.random().toString(36).substring(2, 9)}`;

      const tenantRef = doc(db, "tenants", tenantId);
      const now = Date.now();
      await setDoc(tenantRef, {
        id: tenantId,
        name: data.orgName,
        industry: data.industry,
        timezone: data.timezone,
        address: data.address,
        logoURL: null,
        createdAt: now,
        updatedAt: now,
      });

      const userRef = doc(db, "users", uid);
      await setDoc(userRef, {
        id: uid,
        email: data.email,
        displayName: data.fullName,
        photoURL: null,
        createdAt: now,
        updatedAt: now,
        activeTenantId: tenantId,
        tenants: {
          [tenantId]: {
            role: "org_admin",
            status: "active",
            joinedAt: now,
          },
        },
      });

      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyErrorMessage(err, "Failed to register organization."));
    } finally {
      setLoading(false);
    }
  };

  // Google SSO: only lets in users who already have a users/{uid} doc
  // with an active tenant. No auto-account-creation. Anyone else gets
  // signed out + error.
  const onGoogleSignIn = async () => {
    setError(null);
    if (!selectedTenantId) {
      setError("Please choose your organization name before signing in.");
      return;
    }
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const uid = result.user.uid;

      const userSnap = await getDoc(doc(db, "users", uid));

      if (!userSnap.exists()) {
        const userEmail = result.user.email || "";
        await signOut(auth);
        setError(
          "Your Google account is not registered. Please contact your admin to get access."
        );
        reportLoginFailure(userEmail, selectedTenantId);
        return;
      }

      const profile = userSnap.data();
      const userTenant = profile?.tenants?.[selectedTenantId];

      if (!userTenant || userTenant.status !== "active") {
        const userEmail = result.user.email || "";
        await signOut(auth);
        setError(
          "You do not have access to the selected organization."
        );
        reportWrongOrgAttempt(userEmail, selectedTenantId);
        return;
      }

      // Automatically set active tenant ID
      if (profile.activeTenantId !== selectedTenantId) {
        await setDoc(doc(db, "users", uid), { activeTenantId: selectedTenantId }, { merge: true });
      }

      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/popup-closed-by-user") {
        setError(null);
      } else {
        setError(getFriendlyErrorMessage(err, "Failed to sign in with Google."));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const loginFormSetValue = loginForm.setValue;
  const fillDemo = (email: string) => {
    setActiveTab("login");
    setError(null);
    loginFormSetValue("email", email, { shouldValidate: true });
    loginFormSetValue("password", DEMO_PASSWORD, { shouldValidate: true });
    setSelectedTenantId("tenant_demo");
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-slate-50 p-6 md:p-10">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 font-bold text-xl">
            HR
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900 tracking-tight">Enterprise HRMS</h1>
          <p className="mt-1.5 text-sm text-slate-500">Simplify your people operations and recruitment</p>
        </div>

        <div className="mt-8 flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
            onClick={() => {
              setActiveTab("login");
              setError(null);
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "register" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
            onClick={() => {
              setActiveTab("register");
              setError(null);
            }}
          >
            Create Organization
          </button>
        </div>

        {error && (
          <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700 border border-red-100">
            {error}
          </div>
        )}

        {activeTab === "login" ? (
          <>
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="mt-6 space-y-4">
              <div>
                <label htmlFor="org-select" className="text-sm font-semibold text-slate-700">
                  Organization Name
                </label>
                <select
                  id="org-select"
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-semibold text-slate-700"
                >
                  <option value="">Select your organization...</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="email-login" className="text-sm font-semibold text-slate-700">
                  Email Address
                </label>
                <input
                  id="email-login"
                  type="email"
                  placeholder="you@company.com"
                  {...loginForm.register("email")}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                {loginForm.formState.errors.email && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="password-login" className="text-sm font-semibold text-slate-700">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-xs font-semibold text-blue-600 hover:underline">
                    Forgot Password?
                  </Link>
                </div>
                <input
                  id="password-login"
                  type="password"
                  placeholder="••••••••"
                  {...loginForm.register("password")}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                {loginForm.formState.errors.password && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            <div className="mt-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-semibold text-slate-400">OR</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <button
              type="button"
              onClick={onGoogleSignIn}
              disabled={googleLoading}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.616z" fill="#4285F4" />
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
                <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05" />
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" fill="#EA4335" />
              </svg>
              {googleLoading ? "Signing in..." : "Sign in with Google"}
            </button>
            <p className="mt-3 text-center text-xs text-slate-400">
              Google sign-in is only available to accounts already added by your admin.
            </p>
          </>
        ) : (
          <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="fullName" className="text-sm font-semibold text-slate-700">Your Name</label>
                <input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  {...registerForm.register("fullName")}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                {registerForm.formState.errors.fullName && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{registerForm.formState.errors.fullName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email-reg" className="text-sm font-semibold text-slate-700">Work Email</label>
                <input
                  id="email-reg"
                  type="email"
                  placeholder="john@company.com"
                  {...registerForm.register("email")}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                {registerForm.formState.errors.email && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{registerForm.formState.errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password-reg" className="text-sm font-semibold text-slate-700">Password</label>
              <input
                id="password-reg"
                type="password"
                placeholder="••••••••"
                {...registerForm.register("password")}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
              />
              {registerForm.formState.errors.password && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{registerForm.formState.errors.password.message}</p>
              )}
            </div>

            <div className="border-t border-slate-100 my-4 pt-4" />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="orgName" className="text-sm font-semibold text-slate-700">Company Name</label>
                <input
                  id="orgName"
                  type="text"
                  placeholder="Acme Corp"
                  {...registerForm.register("orgName")}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                {registerForm.formState.errors.orgName && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{registerForm.formState.errors.orgName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="industry" className="text-sm font-semibold text-slate-700">Industry</label>
                <input
                  id="industry"
                  type="text"
                  placeholder="Technology"
                  {...registerForm.register("industry")}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                {registerForm.formState.errors.industry && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{registerForm.formState.errors.industry.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="timezone" className="text-sm font-semibold text-slate-700">Timezone</label>
                <input
                  id="timezone"
                  type="text"
                  placeholder="GMT+5:30"
                  {...registerForm.register("timezone")}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                {registerForm.formState.errors.timezone && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{registerForm.formState.errors.timezone.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="address" className="text-sm font-semibold text-slate-700">Address</label>
                <input
                  id="address"
                  type="text"
                  placeholder="123 main street"
                  {...registerForm.register("address")}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                {registerForm.formState.errors.address && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{registerForm.formState.errors.address.message}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Registering..." : "Create Account & Org"}
            </button>
          </form>
        )}
      </div>

      {SHOW_DEMO && (
        <div className="w-full max-w-lg rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700">Demo accounts</h2>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
              Emulator
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Click any account to autofill. Password for all:{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-700">{DEMO_PASSWORD}</code>
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => fillDemo(acc.email)}
                className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm hover:border-blue-300 hover:bg-blue-50/40 transition-colors cursor-pointer"
              >
                <span>
                  <span className="block font-semibold text-slate-800">{acc.label}</span>
                  <span className="block text-xs text-slate-500">{acc.email}</span>
                </span>
                <span className="shrink-0 text-xs font-semibold text-blue-600">Use</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Run <code className="rounded bg-slate-100 px-1 py-0.5 font-mono">npm run seed</code> (with emulators running) to create these accounts and demo data.
          </p>
        </div>
      )}
    </div>
  );
}

export default LoginPage;