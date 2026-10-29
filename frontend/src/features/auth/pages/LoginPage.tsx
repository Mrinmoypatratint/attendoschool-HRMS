/**
 * LoginPage.tsx
 * -------------
 * Clean, Natural Human-Centric Institutional Authentication Portal.
 * Designed with a warm Japanese-Scandinavian natural aesthetic (Figma Community style):
 * - Soft cream & beige palette (#FAF6F0) with zero artificial neon/AI tropes.
 * - Minimalist 3D clay character illustration with headphones on laptop.
 * - Pill-shaped clean inputs with subtle warm borders and clear icons.
 * - Warm pastel peach "Login" button (#FADCC9).
 * - Social login icons (Google, Facebook, Apple).
 * - Instant automated organization lookup (GreenWood International School).
 * - Post-password celebratory organization splash screen with official crest.
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
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";
import { auth, db, googleProvider } from "../../../lib/firebase";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";

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

// Seeded Institutional Personas for quick one-click autofill & testing
const INSTITUTION_TEST_ACCOUNTS = [
  {
    role: "Principal & Academic Director",
    name: "Dr. Rajesh Sharma",
    email: "principal@greenwood.edu.in",
    label: "Principal",
    department: "Science & Physics",
  },
  {
    role: "Campus Admin",
    name: "Ananya Deshmukh",
    email: "admin.campus@greenwood.edu.in",
    label: "Campus Admin",
    department: "Administration",
  },
  {
    role: "Human Resources Lead",
    name: "Sunita Menon",
    email: "hr@greenwood.edu.in",
    label: "HR Lead",
    department: "Administration",
  },
  {
    role: "PGT Physics Faculty",
    name: "Pooja Iyer",
    email: "teacher.physics@greenwood.edu.in",
    label: "Teacher",
    department: "Science",
  },
];

function formatLastLogin(timestamp?: number | null): string {
  if (!timestamp) return "Never logged in";
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
  const [showPassword, setShowPassword] = useState(false);
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

  const emailInput = loginForm.watch("email");

  // Dynamic email lookup
  const handleEmailLookup = (rawEmail: string, tenantList = tenants) => {
    const emailTrimmed = (rawEmail || "").trim().toLowerCase();

    if (!emailTrimmed || !emailTrimmed.includes("@")) {
      setEmailLookupStatus("idle");
      setMatchedTenant(null);
      setMatchedMember(null);
      return;
    }

    const emailParts = emailTrimmed.split("@");
    if (emailParts.length !== 2 || !emailParts[1]?.includes(".")) {
      setEmailLookupStatus("idle");
      setMatchedTenant(null);
      setMatchedMember(null);
      return;
    }

    setEmailLookupStatus("checking");

    let foundTenant: any = null;
    let foundMember: any = null;

    for (const t of tenantList) {
      if (t.memberDirectory && t.memberDirectory[emailTrimmed]) {
        foundTenant = t;
        foundMember = t.memberDirectory[emailTrimmed];
        break;
      }
    }

    if (foundTenant && foundMember) {
      setMatchedTenant(foundTenant);
      setMatchedMember(foundMember);
      setEmailLookupStatus("found");
      setError(null);
    } else {
      setMatchedTenant(null);
      setMatchedMember(null);
      setEmailLookupStatus("not_found");
    }
  };

  const onEmailChange = (val: string) => {
    loginForm.setValue("email", val, { shouldValidate: true });
    handleEmailLookup(val);
  };

  const fillTestAccount = (email: string) => {
    loginForm.setValue("email", email, { shouldValidate: true });
    loginForm.setValue("password", "Greenwood@2026", { shouldValidate: true });
    handleEmailLookup(email);
    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 150);
  };

  // Submit Institutional Login
  const onLoginSubmit = async (data: LoginForm) => {
    setError(null);

    if (emailLookupStatus === "not_found") {
      setError("No organization registered for this email address. Please check your credentials.");
      return;
    }

    setLoading(true);

    try {
      const userCred = await signInWithEmailAndPassword(auth, data.email, data.password);
      const uid = userCred.user.uid;

      const userDocRef = doc(db, "users", uid);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        await signOut(auth);
        setError("Account not found. Please ask your administrator to provision your account.");
        setLoading(false);
        return;
      }

      const userData = userSnap.data();
      let tenantToActivate = matchedTenant?.id || userData.activeTenantId;

      if (!tenantToActivate && userData.tenants) {
        tenantToActivate = Object.keys(userData.tenants)[0];
      }

      if (!tenantToActivate) {
        await signOut(auth);
        setError("Your account does not belong to any active institution.");
        setLoading(false);
        return;
      }

      if (userData.activeTenantId !== tenantToActivate) {
        await setDoc(userDocRef, { activeTenantId: tenantToActivate }, { merge: true });
      }

      // Smooth Celebration Splash Transition
      setLoading(false);
      setShowOrgSplash(true);

      setSplashProgress(35);
      setSplashStatusText("Authenticating institutional session...");

      setTimeout(() => {
        setSplashProgress(70);
        setSplashStatusText("Securing campus workspace...");
      }, 600);

      setTimeout(() => {
        setSplashProgress(100);
        setSplashStatusText("Entering dashboard...");
      }, 1200);

      setTimeout(() => {
        navigate("/dashboard");
      }, 1800);
    } catch (err: any) {
      console.error("Login failure:", err);
      setLoading(false);
      setError(getFriendlyErrorMessage(err, "Invalid email or password. Please verify credentials."));
    }
  };

  // Register New Organization Flow
  const onRegisterSubmit = async (data: RegisterForm) => {
    setError(null);
    setLoading(true);

    try {
      const userCred = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const uid = userCred.user.uid;
      const tenantId = `tenant_${Math.random().toString(36).substring(2, 9)}`;
      const now = Date.now();

      await setDoc(doc(db, "tenants", tenantId), {
        id: tenantId,
        name: data.orgName,
        industry: data.industry,
        timezone: data.timezone,
        address: data.address,
        logoUrl: "/greenwood-logo.png",
        logoURL: "/greenwood-logo.png",
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
            designation: "Principal / Administrator",
            joinedAt: now,
          },
        },
      });

      setLoading(false);
      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      setLoading(false);
      setError(getFriendlyErrorMessage(err, "Failed to register institution."));
    }
  };

  // Google Workspace SSO
  const onGoogleSignIn = async () => {
    if (!matchedTenant) {
      setError("Please type your institutional email first to route Google SSO.");
      return;
    }

    setError(null);
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

      setGoogleLoading(false);
      setShowOrgSplash(true);
      setTimeout(() => navigate("/dashboard"), 1800);
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
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-[#FAF6F0] p-4 sm:p-6 md:p-10 font-sans text-[#23201D] selection:bg-[#F3CDB5] selection:text-[#452718]">
      {/* Subtle organic warmth */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#F6E3D4]/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#F0EBE1]/50 rounded-full blur-3xl pointer-events-none" />

      {/* Main Figma Clean Login Card */}
      <div className="relative w-full max-w-5xl rounded-[36px] bg-white border border-[#EFEAE2] shadow-[0_20px_60px_-15px_rgba(60,45,30,0.06)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        {/* Left Column: Form & Actions */}
        <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-14">
          {/* Header Bar */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <img
                src="/attendoschool-logo.png"
                alt="AttendoSchool — Smart Attendance System"
                className="h-10 sm:h-12 w-auto object-contain"
              />
              <div className="flex rounded-full bg-[#F5F0E8] p-1 border border-[#EAE3D6] text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("login");
                    setError(null);
                  }}
                  className={`rounded-full px-3.5 py-1.5 transition-all cursor-pointer ${
                    activeTab === "login"
                      ? "bg-white text-[#23201D] shadow-2xs font-bold"
                      : "text-[#7D766E] hover:text-[#23201D]"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("register");
                    setError(null);
                  }}
                  className={`rounded-full px-3.5 py-1.5 transition-all cursor-pointer ${
                    activeTab === "register"
                      ? "bg-white text-[#23201D] shadow-2xs font-bold"
                      : "text-[#7D766E] hover:text-[#23201D]"
                  }`}
                >
                  Register
                </button>
              </div>
            </div>

            {/* Mobile Hero Illustration Banner (< lg screens, matching phone mockup in Figma) */}
            <div className="lg:hidden w-full h-44 sm:h-52 overflow-hidden rounded-2xl mb-6 shadow-xs border border-[#F2ECE3] bg-[#FAF6F0]">
              <img
                src="/login-character.jpg"
                alt="Student working on laptop"
                className="w-full h-full object-cover object-center"
              />
            </div>

            {/* Heading */}
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#23201D] tracking-tight">
              {activeTab === "login" ? "Welcome Back!!" : "Register Institution"}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#7D766E]">
              {activeTab === "login"
                ? "Smart attendance & institutional operations portal"
                : "Provision your school tenant and super admin credentials"}
            </p>

            {/* Error Banner */}
            {error && (
              <div className="mt-4 rounded-2xl bg-[#FFF1F0] border border-[#FFD0CC] p-3.5 text-xs font-semibold text-[#B92518] flex items-center gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 text-[#B92518]" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Form Content */}
          <div className="my-6">
            {activeTab === "login" ? (
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                {/* Email Input */}
                <div>
                  <label htmlFor="email-login" className="block text-xs font-bold text-[#736E67] mb-1.5 ml-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A8A196]" />
                    <input
                      id="email-login"
                      type="email"
                      value={emailInput}
                      onChange={(e) => onEmailChange(e.target.value)}
                      placeholder="email@gmail.com"
                      autoComplete="email"
                      className={`w-full rounded-2xl border pl-11 pr-11 py-3 text-sm font-medium text-[#23201D] placeholder-[#A8A196] outline-none transition-all ${
                        emailLookupStatus === "found"
                          ? "border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-100/60"
                          : emailLookupStatus === "not_found"
                          ? "border-rose-300 bg-rose-50/20 ring-2 ring-rose-100/60"
                          : "border-[#E5DFD6] focus:border-[#C48460] focus:ring-2 focus:ring-[#F8D8C3]/60 bg-white"
                      }`}
                    />
                    {emailLookupStatus === "checking" && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#C48460] border-t-transparent" />
                      </div>
                    )}
                    {emailLookupStatus === "found" && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">
                        ✓
                      </div>
                    )}
                  </div>
                  {loginForm.formState.errors.email && (
                    <p className="mt-1 text-xs font-semibold text-rose-600 ml-1">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                {/* Status: Not Found Warning */}
                {emailLookupStatus === "not_found" && (
                  <div className="rounded-2xl border border-rose-200 bg-[#FFF5F5] p-3.5 text-xs text-rose-900 flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                    <div>
                      <p className="font-bold text-rose-950">No organization registered for this email</p>
                      <p className="mt-0.5 text-[#884343] leading-relaxed">
                        Please enter your institutional email (e.g.{" "}
                        <button
                          type="button"
                          onClick={() => fillTestAccount("principal@greenwood.edu.in")}
                          className="underline font-bold text-rose-900 hover:text-black cursor-pointer"
                        >
                          principal@greenwood.edu.in
                        </button>
                        ) or contact your administrator.
                      </p>
                    </div>
                  </div>
                )}

                {/* Status: Verified Institution Card */}
                {emailLookupStatus === "found" && matchedTenant && (
                  <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 via-white to-stone-50 p-3.5 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                        {matchedTenant.institutionCode || "VERIFIED INSTITUTION"}
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-11 w-11 rounded-xl bg-white border border-emerald-200 p-1 flex items-center justify-center shadow-2xs shrink-0 overflow-hidden">
                        <img
                          src={(matchedTenant as any).logoURL || matchedTenant.logoUrl || "/greenwood-logo.png"}
                          alt={matchedTenant.name}
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-[#23201D] truncate">{matchedTenant.name}</h3>
                        <p className="text-xs font-semibold text-emerald-800">
                          {matchedMember?.displayName || "Faculty Member"}
                          {matchedMember?.designation && (
                            <span className="font-normal text-[#6B655D]"> • {matchedMember.designation}</span>
                          )}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#8C857B] flex items-center gap-1.5">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Last Login:{" "}
                          <span className="font-medium text-[#4E4841]">
                            {formatLastLogin(matchedMember?.lastLoginAt)}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Password Input */}
                <div
                  className={`transition-opacity duration-200 ${
                    emailLookupStatus === "not_found" ? "opacity-40 pointer-events-none" : "opacity-100"
                  }`}
                >
                  <label htmlFor="password-login" className="block text-xs font-bold text-[#736E67] mb-1.5 ml-1">
                    Password{" "}
                    {matchedMember && (
                      <span className="text-emerald-800 font-semibold">
                        (for {matchedMember.displayName.split(" ")[0]})
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A8A196]" />
                    <input
                      id="password-login"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      disabled={emailLookupStatus === "not_found"}
                      {...loginForm.register("password")}
                      className="w-full rounded-2xl border border-[#E5DFD6] focus:border-[#C48460] focus:ring-2 focus:ring-[#F8D8C3]/60 bg-white pl-11 pr-11 py-3 text-sm font-medium text-[#23201D] placeholder-[#A8A196] outline-none transition-all disabled:bg-[#F9F7F3]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A8A196] hover:text-[#5E5953] transition-colors cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="mt-1 text-xs font-semibold text-rose-600 ml-1">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                  <div className="mt-2 text-right">
                    <Link
                      to="/forgot-password"
                      className="text-xs font-medium text-[#736E67] hover:text-[#23201D] transition-colors"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                </div>

                {/* Login Button (Clean warm peach matching Figma) */}
                <button
                  type="submit"
                  disabled={loading || emailLookupStatus === "not_found"}
                  className="mt-5 w-full rounded-2xl bg-[#FADCC9] hover:bg-[#F3CDB5] active:scale-[0.99] py-3.5 text-sm sm:text-base font-bold text-[#452718] shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? "Authenticating..." : "Login"}
                </button>
              </form>
            ) : (
              /* Register Institution Form */
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-3.5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="fullName" className="block text-xs font-bold text-[#736E67] mb-1 ml-1">
                      Principal / Lead Name
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      placeholder="e.g. Dr. Rajesh Sharma"
                      {...registerForm.register("fullName")}
                      className="w-full rounded-2xl border border-[#E5DFD6] px-4 py-2.5 text-sm outline-none focus:border-[#C48460] focus:ring-2 focus:ring-[#F8D8C3]/60 bg-white"
                    />
                    {registerForm.formState.errors.fullName && (
                      <p className="mt-1 text-xs text-rose-600 font-medium ml-1">
                        {registerForm.formState.errors.fullName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email-reg" className="block text-xs font-bold text-[#736E67] mb-1 ml-1">
                      Official Email
                    </label>
                    <input
                      id="email-reg"
                      type="email"
                      placeholder="principal@school.edu"
                      {...registerForm.register("email")}
                      className="w-full rounded-2xl border border-[#E5DFD6] px-4 py-2.5 text-sm outline-none focus:border-[#C48460] focus:ring-2 focus:ring-[#F8D8C3]/60 bg-white"
                    />
                    {registerForm.formState.errors.email && (
                      <p className="mt-1 text-xs text-rose-600 font-medium ml-1">
                        {registerForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="password-reg" className="block text-xs font-bold text-[#736E67] mb-1 ml-1">
                    Master Password
                  </label>
                  <input
                    id="password-reg"
                    type="password"
                    placeholder="••••••••"
                    {...registerForm.register("password")}
                    className="w-full rounded-2xl border border-[#E5DFD6] px-4 py-2.5 text-sm outline-none focus:border-[#C48460] focus:ring-2 focus:ring-[#F8D8C3]/60 bg-white"
                  />
                  {registerForm.formState.errors.password && (
                    <p className="mt-1 text-xs text-rose-600 font-medium ml-1">
                      {registerForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="orgName" className="block text-xs font-bold text-[#736E67] mb-1 ml-1">
                      Institution Name
                    </label>
                    <input
                      id="orgName"
                      type="text"
                      placeholder="GreenWood International School"
                      {...registerForm.register("orgName")}
                      className="w-full rounded-2xl border border-[#E5DFD6] px-4 py-2.5 text-sm outline-none focus:border-[#C48460] focus:ring-2 focus:ring-[#F8D8C3]/60 bg-white"
                    />
                    {registerForm.formState.errors.orgName && (
                      <p className="mt-1 text-xs text-rose-600 font-medium ml-1">
                        {registerForm.formState.errors.orgName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="industry" className="block text-xs font-bold text-[#736E67] mb-1 ml-1">
                      Affiliation / Category
                    </label>
                    <input
                      id="industry"
                      type="text"
                      placeholder="CBSE / ICSE / IB / CAIE"
                      {...registerForm.register("industry")}
                      className="w-full rounded-2xl border border-[#E5DFD6] px-4 py-2.5 text-sm outline-none focus:border-[#C48460] focus:ring-2 focus:ring-[#F8D8C3]/60 bg-white"
                    />
                    {registerForm.formState.errors.industry && (
                      <p className="mt-1 text-xs text-rose-600 font-medium ml-1">
                        {registerForm.formState.errors.industry.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="address" className="block text-xs font-bold text-[#736E67] mb-1 ml-1">
                    Campus Location
                  </label>
                  <input
                    id="address"
                    type="text"
                    placeholder="Whitefield Campus, Bengaluru 560087"
                    {...registerForm.register("address")}
                    className="w-full rounded-2xl border border-[#E5DFD6] px-4 py-2.5 text-sm outline-none focus:border-[#C48460] focus:ring-2 focus:ring-[#F8D8C3]/60 bg-white"
                  />
                  {registerForm.formState.errors.address && (
                    <p className="mt-1 text-xs text-rose-600 font-medium ml-1">
                      {registerForm.formState.errors.address.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-4 w-full rounded-2xl bg-[#FADCC9] hover:bg-[#F3CDB5] active:scale-[0.99] py-3 text-sm font-bold text-[#452718] shadow-xs transition-all cursor-pointer"
                >
                  {loading ? "Registering Institution..." : "Register Institution & Provision Super Admin"}
                </button>
              </form>
            )}

            {/* Social Divider */}
            {activeTab === "login" && (
              <>
                <div className="my-5 flex items-center justify-center gap-3">
                  <div className="h-px flex-1 bg-[#EBE5DB]" />
                  <span className="text-xs font-medium text-[#A8A196] lowercase">- or -</span>
                  <div className="h-px flex-1 bg-[#EBE5DB]" />
                </div>

                {/* Social Login Icons Row */}
                <div className="flex items-center justify-center gap-4">
                  {/* Google */}
                  <button
                    type="button"
                    onClick={onGoogleSignIn}
                    disabled={googleLoading}
                    title="Sign in with Google"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E5DFD6] bg-white shadow-2xs hover:bg-[#FAF7F2] hover:scale-105 transition-all cursor-pointer"
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18">
                      <path
                        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.616z"
                        fill="#4285F4"
                      />
                      <path
                        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
                        fill="#34A853"
                      />
                      <path
                        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z"
                        fill="#EA4335"
                      />
                    </svg>
                  </button>
                  {/* Facebook */}
                  <button
                    type="button"
                    title="Sign in with Facebook"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E5DFD6] bg-white shadow-2xs hover:bg-[#FAF7F2] hover:scale-105 transition-all cursor-pointer"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </button>
                  {/* Apple */}
                  <button
                    type="button"
                    title="Sign in with Apple"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E5DFD6] bg-white shadow-2xs hover:bg-[#FAF7F2] hover:scale-105 transition-all cursor-pointer"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1E1E1E">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.87-.93.04-2.02.63-2.65 1.38-.56.65-.99 1.72-.88 2.76 1.02.08 2.05-.53 2.61-1.27z" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Footer Text */}
          <div className="pt-2 text-center text-xs text-[#736E67]">
            {activeTab === "login" ? (
              <p>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setActiveTab("register")}
                  className="font-bold text-[#D06A38] hover:underline cursor-pointer"
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p>
                Already have an institution?{" "}
                <button
                  type="button"
                  onClick={() => setActiveTab("login")}
                  className="font-bold text-[#D06A38] hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Right Column: 3D Clay Character & Arch Illustration (Desktop) */}
        <div className="lg:col-span-5 hidden lg:flex items-center justify-center p-6 lg:p-8 bg-[#FAF6F0] relative border-l border-[#F0EBE2]">
          <div className="relative w-full h-full min-h-[560px] flex items-center justify-center rounded-[28px] overflow-hidden shadow-2xs border border-[#EFEAE2]">
            <img
              src="/login-character.jpg"
              alt="Student working on laptop"
              className="w-full h-full object-cover object-center"
            />
          </div>
        </div>
      </div>

      {/* Quick Test Personas in Matching Natural Theme */}
      <div className="mt-6 w-full max-w-5xl rounded-[28px] border border-[#EBE4D8] bg-white/80 backdrop-blur-sm p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#EFEAE2] pb-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#5A544C]">
              Quick Test Personas (GreenWood International School)
            </h2>
          </div>
          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
            Live Database
          </span>
        </div>
        <p className="mt-2 text-xs text-[#827B72]">
          Click any persona to autofill credentials and test instant organization matching:
        </p>

        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {INSTITUTION_TEST_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              type="button"
              onClick={() => fillTestAccount(acc.email)}
              className="group flex flex-col text-left rounded-2xl border border-[#EBE4D8] bg-white p-3 hover:border-[#D06A38]/50 hover:shadow-xs transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#23201D] group-hover:text-[#D06A38] transition-colors">
                  {acc.label}
                </span>
                <span className="text-[10px] font-semibold text-[#A8A196] group-hover:text-[#D06A38] transition-colors">
                  Autofill →
                </span>
              </div>
              <span className="text-xs font-medium text-[#5E5850] mt-0.5">{acc.name}</span>
              <span className="text-[11px] font-mono text-[#8C857B] truncate">{acc.email}</span>
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