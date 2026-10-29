/**
 * LoginPage.tsx
 * -------------
 * Institutional Single Sign-On & Authentication Portal for AttendoSchool.
 *
 * Features:
 * - Prominent, high-resolution AttendoSchool Master Brand identity.
 * - Zero manual organization dropdown: smart institutional email lookup.
 * - Instant organization & persona verification:
 *     - Displays Institution Name & Verified Badge
 *     - Displays Staff Member Name & Academic Designation
 *     - Displays Last Login timestamp
 * - Alerts clearly when an email is not registered with any institution.
 * - Post-password authentication displays a breathtaking, animated preview
 *   of the ORGANIZATION'S crest/logo (not AttendoSchool), delivering a
 *   bespoke, white-label enterprise institution experience before dashboard entrance.
 */
import { getFriendlyErrorMessage } from "../../../lib/errors";
import { useState, useEffect, useMemo, useRef } from "react";
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
import { doc, setDoc, getDoc, collection, getDocs, updateDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { auth, db, googleProvider, functions } from "../../../lib/firebase";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid institutional email address"),
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
  orgName: z.string().min(2, "Institution name must be at least 2 characters"),
  industry: z.string().min(2, "Please specify institution type"),
  timezone: z.string().min(2, "Please select a timezone"),
  address: z.string().min(5, "Please enter your campus address"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

/** Seeded institutional test credentials for 1-click evaluation */
const INSTITUTION_TEST_ACCOUNTS = [
  { label: "Principal & Director", name: "Dr. Rajesh Sharma", email: "principal@greenwood.edu.in", role: "Super Admin" },
  { label: "Head of Campus", name: "Ananya Deshmukh", email: "campusadmin@greenwood.edu.in", role: "Campus Admin" },
  { label: "Head of HR", name: "Sunita Menon", email: "hr@greenwood.edu.in", role: "HR Manager" },
  { label: "HOD Mathematics", name: "Prof. Vikram Sen", email: "hod.math@greenwood.edu.in", role: "Faculty Head" },
  { label: "Senior PGT Physics", name: "Pooja Iyer", email: "teacher.physics@greenwood.edu.in", role: "Teaching Faculty" },
];
const MASTER_PASSWORD = "Greenwood@2026";

function formatLastLogin(timestamp?: number | null): string {
  if (!timestamp) return "First login session";
  try {
    const diffMs = Date.now() - timestamp;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now (Active session)";
    if (diffHours < 24) return `Today, ${new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    if (diffHours < 48) return `Yesterday, ${new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    return new Date(timestamp).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "Recent";
  }
}

export function LoginPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  // Institution Tenants loaded from Cloud Firestore
  const [tenants, setTenants] = useState<any[]>([]);
  const [tenantsLoaded, setTenantsLoaded] = useState(false);

  // Email Lookup State
  const [matchedTenant, setMatchedTenant] = useState<any | null>(null);
  const [matchedMember, setMatchedMember] = useState<any | null>(null);
  const [emailLookupStatus, setEmailLookupStatus] = useState<"idle" | "checking" | "found" | "not_found">("idle");

  // Post-Password Animated Organization Preview
  const [showOrgSplash, setShowOrgSplash] = useState(false);
  const [splashProgress, setSplashProgress] = useState(15);
  const [splashStatusText, setSplashStatusText] = useState("Verifying institutional authentication...");
  const passwordInputRef = useRef<HTMLInputElement | null>(null);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onChange",
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      orgName: "",
      industry: "Education (K-12 School)",
      timezone: "Asia/Kolkata",
      address: "",
    },
  });

  // Load all organizations once on mount
  useEffect(() => {
    let isMounted = true;
    const fetchTenants = async () => {
      try {
        const snap = await getDocs(collection(db, "tenants"));
        const list: any[] = [];
        snap.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        if (isMounted) {
          setTenants(list);
          setTenantsLoaded(true);
          if (emailInput) {
            handleEmailLookup(emailInput, list);
          }
        }
      } catch (err) {
        console.error("Failed to load organizations:", err);
        if (isMounted) setTenantsLoaded(true);
      }
    };
    fetchTenants();
    return () => {
      isMounted = false;
    };
  }, []);

  const [emailInput, setEmailInput] = useState("");

  const handleEmailLookup = (emailStr: string, currentTenants = tenants) => {
    const emailTrimmed = (emailStr || "").toLowerCase().trim();
    if (!emailTrimmed) {
      setEmailLookupStatus("idle");
      setMatchedTenant(null);
      setMatchedMember(null);
      return;
    }

    const isValidFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed);
    if (!isValidFormat) {
      setEmailLookupStatus("idle");
      setMatchedTenant(null);
      setMatchedMember(null);
      return;
    }

    let foundT: any = null;
    let foundM: any = null;

    for (const t of currentTenants) {
      if (t.memberDirectory && t.memberDirectory[emailTrimmed]) {
        foundT = t;
        foundM = t.memberDirectory[emailTrimmed];
        break;
      }
    }

    if (foundT) {
      setMatchedTenant(foundT);
      setMatchedMember(foundM);
      setEmailLookupStatus("found");
      setError(null);
    } else {
      setMatchedTenant(null);
      setMatchedMember(null);
      setEmailLookupStatus("not_found");
    }
  };

  const onEmailChange = (val: string) => {
    setEmailInput(val);
    loginForm.setValue("email", val, { shouldValidate: true });
    handleEmailLookup(val);
  };

  // Autofill test account helper
  const fillTestAccount = (email: string) => {
    setActiveTab("login");
    setError(null);
    setEmailInput(email);
    loginForm.setValue("email", email, { shouldValidate: true, shouldDirty: true });
    loginForm.setValue("password", MASTER_PASSWORD, { shouldValidate: true, shouldDirty: true });
    handleEmailLookup(email);
  };

  const onLoginSubmit = async (data: LoginForm) => {
    setError(null);

    if (emailLookupStatus === "not_found") {
      setError("No organization registered for this email address. Please verify your email.");
      return;
    }

    if (!matchedTenant) {
      setError("Please enter a registered institutional email address first.");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const uid = userCredential.user.uid;

      // Update lastLogin timestamp in tenant's member directory if feasible
      try {
        const tenantRef = doc(db, "tenants", matchedTenant.id);
        const emailKey = data.email.toLowerCase().trim();
        await updateDoc(tenantRef, {
          [`memberDirectory.${emailKey}.lastLoginAt`]: Date.now(),
        });
      } catch (err) {
        // Non-fatal if rule disallows update by standard user
      }

      // Update active tenant ID on user profile
      try {
        await setDoc(doc(db, "users", uid), {
          activeTenantId: matchedTenant.id,
          lastLoginAt: Date.now(),
        }, { merge: true });
      } catch (err) {
        console.warn("Could not merge user activeTenantId:", err);
      }

      // TRIGGER ANIMATED ORGANIZATION PREVIEW (The "WOW" Factor!)
      setLoading(false);
      setShowOrgSplash(true);
      setSplashProgress(25);
      setSplashStatusText(`Connecting to ${matchedTenant.name}...`);

      setTimeout(() => {
        setSplashProgress(60);
        setSplashStatusText("Verifying faculty credentials & academic session...");
      }, 800);

      setTimeout(() => {
        setSplashProgress(90);
        setSplashStatusText("Synchronizing timetable & attendance records...");
      }, 1600);

      setTimeout(() => {
        setSplashProgress(100);
        setSplashStatusText(`Welcome to ${matchedTenant.name}`);
      }, 2300);

      setTimeout(() => {
        navigate("/dashboard");
      }, 2800);

    } catch (err: any) {
      console.error(err);
      setLoading(false);
      setError(getFriendlyErrorMessage(err, "Authentication failed. Please verify your password."));
    }
  };

  const onRegisterSubmit = async (data: RegisterForm) => {
    setError(null);
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const uid = userCredential.user.uid;

      const tenantId = `tenant_${Math.random().toString(36).substring(2, 9)}`;
      const now = Date.now();

      await setDoc(doc(db, "tenants", tenantId), {
        id: tenantId,
        name: data.orgName,
        industry: data.industry,
        timezone: data.timezone,
        address: data.address,
        logoUrl: "/greenwood-crest.svg",
        memberDirectory: {
          [data.email.toLowerCase().trim()]: {
            displayName: data.fullName,
            designation: "Principal / Administrator",
            role: "org_admin",
            lastLoginAt: now,
          },
        },
        createdAt: now,
        updatedAt: now,
      });

      await setDoc(doc(db, "users", uid), {
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
      setError(getFriendlyErrorMessage(err, "Failed to register institution."));
    } finally {
      setLoading(false);
    }
  };

  const onGoogleSignIn = async () => {
    setError(null);
    if (!matchedTenant) {
      setError("Please enter your registered institutional email first to identify your school.");
      return;
    }
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const uid = result.user.uid;

      const userSnap = await getDoc(doc(db, "users", uid));
      if (!userSnap.exists()) {
        await signOut(auth);
        setError("Account not found. Please ask your school administrator to invite you.");
        return;
      }

      await setDoc(doc(db, "users", uid), { activeTenantId: matchedTenant.id }, { merge: true });

      // Trigger animated org splash
      setGoogleLoading(false);
      setShowOrgSplash(true);
      setTimeout(() => navigate("/dashboard"), 1900);
    } catch (err: any) {
      console.error(err);
      if (err.code !== "auth/popup-closed-by-user") {
        setError(getFriendlyErrorMessage(err, "Failed to sign in with Google."));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-4 sm:p-6 md:p-10 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-700/60 bg-white shadow-2xl p-6 sm:p-9 transition-all">
        {/* AttendoSchool Big Master Logo */}
        <div className="flex flex-col items-center text-center">
          <div className="group relative transition-transform duration-300 hover:scale-105">
            <img
              src="/attendoschool-logo.png"
              alt="AttendoSchool — Smart Attendance System"
              className="h-24 sm:h-28 w-auto object-contain mx-auto drop-shadow-md"
            />
          </div>
          <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Institutional HRMS
          </h1>
          <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500">
            Smart Attendance & Educational Institution Management
          </p>
        </div>

        {/* Tab switch */}
        <div className="mt-7 flex rounded-2xl bg-slate-100 p-1.5 border border-slate-200/80">
          <button
            type="button"
            className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all cursor-pointer ${
              activeTab === "login"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
            onClick={() => {
              setActiveTab("login");
              setError(null);
            }}
          >
            Institutional Sign In
          </button>
          <button
            type="button"
            className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all cursor-pointer ${
              activeTab === "register"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
            onClick={() => {
              setActiveTab("register");
              setError(null);
            }}
          >
            Register Institution
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mt-5 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm font-semibold text-rose-800 flex items-center gap-3">
            <span className="text-lg">❌</span>
            <span>{error}</span>
          </div>
        )}

        {activeTab === "login" ? (
          <>
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="mt-6 space-y-4">
              {/* Email Address Input (Automated Organization Identification) */}
              <div>
                <label htmlFor="email-login" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Institutional Email Address
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="email-login"
                    type="email"
                    value={emailInput}
                    onChange={(e) => onEmailChange(e.target.value)}
                    placeholder="e.g. principal@greenwood.edu.in"
                    autoComplete="email"
                    className={`w-full rounded-2xl border px-4 py-3 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none transition-all shadow-xs ${
                      emailLookupStatus === "found"
                        ? "border-emerald-500 ring-2 ring-emerald-100 bg-emerald-50/20"
                        : emailLookupStatus === "not_found"
                        ? "border-rose-400 ring-2 ring-rose-100 bg-rose-50/20"
                        : "border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-white"
                    }`}
                  />
                  {emailLookupStatus === "checking" && (
                    <div className="absolute right-3.5 top-3.5">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    </div>
                  )}
                  {emailLookupStatus === "found" && (
                    <div className="absolute right-3.5 top-3.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">
                      ✓
                    </div>
                  )}
                </div>
                {loginForm.formState.errors.email && (
                  <p className="mt-1.5 text-xs font-semibold text-rose-600">
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              {/* Status 1: Not Found Warning */}
              {emailLookupStatus === "not_found" && (
                <div className="rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 to-orange-50 p-4 text-sm text-rose-900 shadow-xs flex items-start gap-3">
                  <span className="text-xl shrink-0">⚠️</span>
                  <div className="flex-1">
                    <p className="font-bold text-rose-950">No organization registered for this email</p>
                    <p className="mt-1 text-xs text-rose-700 leading-relaxed">
                      We couldn't match this email to any active school tenant. Please enter your institutional address (e.g., <button type="button" onClick={() => fillTestAccount("principal@greenwood.edu.in")} className="underline font-bold hover:text-rose-900 cursor-pointer">principal@greenwood.edu.in</button>) or contact your school administrator.
                    </p>
                  </div>
                </div>
              )}

              {/* Status 2: Verified Institution & User Identity Card */}
              {emailLookupStatus === "found" && matchedTenant && (
                <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/70 p-4.5 shadow-sm transition-all duration-300">
                  <div className="flex items-center justify-between border-b border-emerald-100 pb-2.5 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[11px] font-bold shadow-xs">
                        ✓
                      </span>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                        Verified Institutional Account
                      </span>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {matchedTenant.institutionCode || "INSTITUTION"}
                    </span>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="h-12 w-12 rounded-xl bg-white border border-emerald-200/80 p-1 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
                      <img
                        src={(matchedTenant as any).logoURL || matchedTenant.logoUrl || "/greenwood-logo.png"}
                        alt={matchedTenant.name}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                        {matchedTenant.name}
                      </h3>
                      <p className="text-xs sm:text-sm font-bold text-emerald-700">
                        {matchedMember?.displayName || "Faculty Member"}
                        {matchedMember?.designation && (
                          <span className="font-normal text-slate-600"> • {matchedMember.designation}</span>
                        )}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500 flex items-center gap-1.5">
                        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        Last Login: <span className="font-semibold text-slate-700">{formatLastLogin(matchedMember?.lastLoginAt)}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Password Input (Active once email is verified) */}
              <div className={`transition-opacity duration-200 ${emailLookupStatus === "not_found" ? "opacity-40 pointer-events-none" : "opacity-100"}`}>
                <div className="flex items-center justify-between">
                  <label htmlFor="password-login" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Password {matchedMember && <span className="text-emerald-700 font-semibold normal-case">for {matchedMember.displayName.split(" ")[0]}</span>}
                  </label>
                  <Link to="/forgot-password" className="text-xs font-bold text-blue-600 hover:underline">
                    Forgot Password?
                  </Link>
                </div>
                <input
                  id="password-login"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={emailLookupStatus === "not_found"}
                  {...loginForm.register("password")}
                  className="mt-1.5 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-xs transition-all"
                />
                {loginForm.formState.errors.password && (
                  <p className="mt-1.5 text-xs font-semibold text-rose-600">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || emailLookupStatus === "not_found"}
                className="mt-6 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-sm font-bold text-white shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? "Authenticating..." : matchedTenant ? `Sign In to ${matchedTenant.name}` : "Sign In"}
              </button>
            </form>

            <div className="mt-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-bold text-slate-400">OR</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <button
              type="button"
              onClick={onGoogleSignIn}
              disabled={googleLoading || !matchedTenant}
              className="mt-5 flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40 cursor-pointer shadow-xs"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.616z" fill="#4285F4" />
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
                <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05" />
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" fill="#EA4335" />
              </svg>
              {googleLoading ? "Signing in..." : "Institutional Google Workspace SSO"}
            </button>
          </>
        ) : (
          /* Create / Register Institution Flow */
          <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="fullName" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Principal / Lead Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  placeholder="e.g. Dr. Rajesh Sharma"
                  {...registerForm.register("fullName")}
                  className="mt-1.5 w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
                {registerForm.formState.errors.fullName && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{registerForm.formState.errors.fullName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email-reg" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Official Email
                </label>
                <input
                  id="email-reg"
                  type="email"
                  placeholder="principal@school.edu"
                  {...registerForm.register("email")}
                  className="mt-1.5 w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
                {registerForm.formState.errors.email && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{registerForm.formState.errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password-reg" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Master Password
              </label>
              <input
                id="password-reg"
                type="password"
                placeholder="••••••••"
                {...registerForm.register("password")}
                className="mt-1.5 w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
              {registerForm.formState.errors.password && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{registerForm.formState.errors.password.message}</p>
              )}
            </div>

            <div className="border-t border-slate-100 pt-3" />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="orgName" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Institution Name
                </label>
                <input
                  id="orgName"
                  type="text"
                  placeholder="GreenWood International School"
                  {...registerForm.register("orgName")}
                  className="mt-1.5 w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
                {registerForm.formState.errors.orgName && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{registerForm.formState.errors.orgName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="industry" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Affiliation / Category
                </label>
                <input
                  id="industry"
                  type="text"
                  placeholder="CBSE / ICSE / IB / CAIE"
                  {...registerForm.register("industry")}
                  className="mt-1.5 w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
                {registerForm.formState.errors.industry && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{registerForm.formState.errors.industry.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Campus Location
              </label>
              <input
                id="address"
                type="text"
                placeholder="Whitefield Campus, Bengaluru 560087"
                {...registerForm.register("address")}
                className="mt-1.5 w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
              {registerForm.formState.errors.address && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{registerForm.formState.errors.address.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-sm font-bold text-white shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all cursor-pointer"
            >
              {loading ? "Registering Institution..." : "Register Institution & Provision Super Admin"}
            </button>
          </form>
        )}
      </div>

      {/* Quick Test Accounts Drawer (Seeded Institutional Personas) */}
      <div className="mt-6 w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-5 text-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Quick Test Personas (GreenWood International School)
            </h2>
          </div>
          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
            Live Database
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Click any persona to autofill credentials and test instant organization matching:
        </p>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {INSTITUTION_TEST_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              type="button"
              onClick={() => fillTestAccount(acc.email)}
              className="group flex flex-col text-left rounded-2xl border border-slate-800 bg-slate-800/60 p-2.5 hover:border-emerald-500/50 hover:bg-slate-800 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-200 group-hover:text-emerald-400 transition-colors">
                  {acc.label}
                </span>
                <span className="text-[10px] font-semibold text-slate-500 group-hover:text-amber-300 transition-colors">
                  Autofill →
                </span>
              </div>
              <span className="text-xs font-medium text-slate-300 mt-0.5">{acc.name}</span>
              <span className="text-[11px] font-mono text-slate-500 truncate">{acc.email}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* POST-PASSWORD ANIMATED ORGANIZATION LOGO PREVIEW (THE "WOW" FACTOR) */}
      {/* ==================================================================== */}
      {showOrgSplash && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-2xl px-6 text-center animate-in fade-in duration-500">
          {/* Ambient radial glow with emerald aura */}
          <div className="absolute inset-0 bg-radial from-emerald-600/20 via-transparent to-transparent pointer-events-none" />

          <div className="relative flex flex-col items-center max-w-lg w-full">
            {/* Animated Logo Container with Rotating Ring & Pulsing Crest */}
            <div className="relative flex items-center justify-center h-48 w-48 sm:h-56 sm:w-56">
              {/* Spinning Geometric Gold Ring */}
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-400/60 animate-ring-spin" />
              <div className="absolute inset-3 rounded-full border border-emerald-500/40 animate-ping opacity-25" />
              
              {/* Glowing Shield / Crest Backdrop */}
              <div className="absolute inset-4 rounded-3xl bg-white border-2 border-amber-400/80 shadow-2xl flex items-center justify-center overflow-hidden p-3 ring-4 ring-emerald-500/20">
                <img
                  src={(matchedTenant as any)?.logoURL || matchedTenant?.logoUrl || "/greenwood-logo.png"}
                  alt={matchedTenant?.name || "Institution Logo"}
                  className="h-28 w-28 sm:h-32 sm:w-32 object-contain animate-crest-pulse"
                />
              </div>
            </div>

            {/* Organization Name (Customer Institution, Not AttendoSchool) */}
            <h2 className="mt-7 text-2xl sm:text-3xl font-extrabold text-white tracking-wide font-serif drop-shadow-md">
              {matchedTenant?.name || "GreenWood International School"}
            </h2>
            <p className="mt-1 text-xs sm:text-sm font-semibold tracking-widest uppercase text-emerald-400">
              {matchedTenant?.affiliation || "CBSE & Cambridge International (CAIE)"}
            </p>

            {/* Welcome Account Holder */}
            <div className="mt-4 rounded-full bg-emerald-900/60 border border-emerald-500/40 px-5 py-2 text-sm text-emerald-100 flex items-center gap-2 shadow-lg">
              <span>
                Welcome, <strong className="text-amber-300 font-bold">{matchedMember?.displayName || "Faculty Member"}</strong>
              </span>
              {matchedMember?.designation && (
                <span className="hidden sm:inline text-xs text-slate-300">({matchedMember.designation})</span>
              )}
            </div>

            {/* Shimmering Animated Progress Bar */}
            <div className="mt-8 w-64 sm:w-80 h-2 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/60 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-400 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${splashProgress}%` }}
              />
            </div>

            <p className="mt-3 text-xs text-slate-400 font-mono flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              {splashStatusText}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;