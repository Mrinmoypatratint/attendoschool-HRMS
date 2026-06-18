import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import {
  sendInvitationEmail,
  sendEmployeeWelcomeEmail,
  sendPasswordResetEmail,
  sendApplicationReceivedEmail,
  sendStatusUpdateEmail,
  sendRejectionEmail,
  sendOfferEmail,
  sendInterviewInviteEmail,
  sendNotificationEmail,
  MAIL_SECRETS,
  getAppUrl,
} from "./mailer";

// Initialize the Firebase Admin SDK to interact with Firestore and Auth
admin.initializeApp();
const db = admin.firestore();

/**
 * SEC-003: App Check enforcement flag.
 * Off by default for local development & emulators.
 * Set ENFORCE_APP_CHECK=true in production to require valid App Check tokens.
 */
const ENFORCE_APP_CHECK = process.env.ENFORCE_APP_CHECK === "true";

/**
 * Best-effort sliding-window rate limiter backed by Firestore.
 * Bypasses security rules (Admin SDK). rateLimits collection is default-deny.
 * Throws resource-exhausted HttpsError when the cap is exceeded.
 * Used to protect unauthenticated/public endpoints from abuse.
 *
 * @param key Unique key to identify the client/action (e.g., ip or email)
 * @param maxAttempts Maximum attempts allowed within the window
 * @param windowMs Time window in milliseconds
 */
async function enforceRateLimit(key: string, maxAttempts: number, windowMs: number): Promise<void> {
  const ref = db.collection("rateLimits").doc(key.replace(/[^a-zA-Z0-9_.-]/g, "_"));
  const now = Date.now();

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? (snap.data() as { count: number; windowStart: number }) : null;

    // If no limit recorded, or window has elapsed, reset window
    if (!data || now - data.windowStart > windowMs) {
      tx.set(ref, { count: 1, windowStart: now });
      return;
    }

    // If limit exceeded, abort with error
    if (data.count >= maxAttempts) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        "Too many requests. Please wait a while and try again."
      );
    }

    // Increment request count
    tx.update(ref, { count: data.count + 1 });
  });
}

/**
 * Create an in-app notification document for a user.
 * Bypasses Firestore rules as it uses the Admin SDK.
 *
 * @param tenantId Target organization ID
 * @param userId Target user ID
 * @param type Category/type of notification
 * @param title Subject/header
 * @param body Notification message body
 * @param link Optional internal path for UI redirection
 */
async function createNotification(
  tenantId: string,
  userId: string,
  type: string,
  title: string,
  body: string,
  link?: string
): Promise<void> {
  if (!tenantId || !userId) return;

  // Optimize document ID generation using native Firebase auto-ID
  const notificationRef = db.collection("notifications").doc();
  const id = notificationRef.id;

  await notificationRef.set({
    id,
    tenantId,
    userId,
    type,
    title,
    body,
    ...(link ? { link } : {}),
    read: false,
    createdAt: Date.now(),
  });
}

/**
 * Resolve a user's email + display name from their profile collection.
 *
 * @param uid Firebase Auth UID of the user
 * @returns Resolves user email and name, or null if not found
 */
async function resolveUser(uid: string): Promise<{ email?: string; name?: string } | null> {
  if (!uid) return null;
  try {
    const s = await db.collection("users").doc(uid).get();
    if (!s.exists) return null;
    const d = s.data();
    return { email: d?.email, name: d?.displayName };
  } catch {
    return null;
  }
}

/**
 * Deliver a notification through BOTH channels:
 * 1. Creates an in-app notification document in Firestore.
 * 2. Attempts to send a formatted email notification (best-effort).
 */
async function notifyUser(
  tenantId: string,
  userId: string,
  email: string | undefined,
  recipientName: string | undefined,
  type: string,
  title: string,
  body: string,
  link: string
): Promise<void> {
  await createNotification(tenantId, userId, type, title, body, link);
  if (email) {
    try {
      await sendNotificationEmail({
        to: email,
        recipientName,
        heading: title,
        lines: [body],
        ctaUrl: `${getAppUrl()}${link}`,
        ctaLabel: "Open in app",
      });
    } catch (err) {
      functions.logger.error("[notifyUser] email failed", { userId, error: String(err) });
    }
  }
}

/**
 * Server-side leave-balance settlement (Admin SDK).
 * Applies pending/used deltas based on a leave request's status transitions.
 * Authority for balance mutations so clients do not require elevated leaveBalances permissions.
 *
 * @param before State of the leave request before update
 * @param after State of the leave request after update
 */
async function settleLeaveBalance(
  before: Record<string, any> | null,
  after: Record<string, any>
): Promise<void> {
  const beforeStatus = before?.status;
  const afterStatus = after.status;

  // Only run mutations if there is a real status transition
  if (beforeStatus === afterStatus) return;

  const days = Number(after.days) || 0;
  if (days <= 0 || !after.tenantId || !after.employeeId || !after.leaveTypeId || !after.startDate) return;

  const year = new Date(`${after.startDate}T00:00:00Z`).getUTCFullYear();
  const balId = `${after.tenantId}_${after.employeeId}_${after.leaveTypeId}_${year}`;

  let pendingDelta = 0;
  let usedDelta = 0;
  const created = !before;

  // Simplify status transitions logic into nested structured blocks
  if (created) {
    if (afterStatus === "pending") {
      pendingDelta = days;
    } else if (afterStatus === "approved") {
      usedDelta = days;
    }
  } else if (beforeStatus === "pending") {
    if (afterStatus === "approved") {
      pendingDelta = -days;
      usedDelta = days;
    } else if (afterStatus === "rejected" || afterStatus === "cancelled") {
      pendingDelta = -days;
    }
  } else if (beforeStatus === "approved" && afterStatus === "cancelled") {
    usedDelta = -days;
  } else {
    // Other transitions have no balance impact
    return;
  }

  const ref = db.collection("leaveBalances").doc(balId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const now = Date.now();

    if (!snap.exists) {
      tx.set(ref, {
        id: balId,
        tenantId: after.tenantId,
        employeeId: after.employeeId,
        leaveTypeId: after.leaveTypeId,
        year,
        accruedDays: 0,
        usedDays: Math.max(0, usedDelta),
        pendingDays: Math.max(0, pendingDelta),
        carriedOverDays: 0,
        lastAccruedAt: 0,
        createdAt: now,
        updatedAt: now,
      });
      return;
    }

    const d = snap.data() as Record<string, any>;
    tx.update(ref, {
      pendingDays: Math.max(0, (d.pendingDays || 0) + pendingDelta),
      usedDays: Math.max(0, (d.usedDays || 0) + usedDelta),
      updatedAt: now,
    });
  });
}

/**
 * Built-in default permission sets for roles.
 * Mirrors SYSTEM_ROLES in packages/shared and hardcoded lists in firestore.rules.
 * Resolves permissions on server side without database queries.
 */
const ROLE_DEFAULT_PERMS: Record<string, string[]> = {
  hr_manager: [
    "users.view", "users.create", "users.update",
    "departments.view", "departments.create", "departments.update", "departments.delete",
    "teams.view", "teams.create", "teams.update", "teams.delete",
    "jobs.view",
    "candidates.view",
    "employees.view", "employees.create", "employees.update", "employees.delete",
    "leave.view", "leave.create", "leave.update", "leave.delete", "leave.approve",
    "documents.view", "documents.create", "documents.update", "documents.delete",
  ],
  recruiter: [
    "users.view",
    "departments.view",
    "jobs.view", "jobs.create", "jobs.update", "jobs.delete",
    "candidates.view", "candidates.create", "candidates.update", "candidates.delete", "candidates.export",
    "employees.view",
  ],
  employee: [
    "users.view",
    "departments.view",
    "teams.view",
    "jobs.view",
    "employees.view",
    "leave.view", "leave.create",
    "documents.view",
  ],
};

/**
 * Resolves a caller's permissions within a specific tenant.
 * Honors system role defaults, custom role overrides, and database-defined custom roles.
 *
 * @returns Object indicating active role, admin access, and permissions set
 */
async function getCallerAccess(
  uid: string,
  tenantId: string
): Promise<{ role: string; all: boolean; perms: Set<string> }> {
  const snap = await db.collection("users").doc(uid).get();
  const tenant = snap.exists ? (snap.data() as any)?.tenants?.[tenantId] : null;

  // Active status check
  if (!tenant || tenant.status !== "active") {
    return { role: "", all: false, perms: new Set() };
  }

  const role = String(tenant.role || "");

  // Super administrators and organization admins get master clearance
  if (role === "super_admin" || role === "org_admin") {
    return { role, all: true, perms: new Set() };
  }

  let list: string[] = [];
  if (ROLE_DEFAULT_PERMS[role]) {
    // Fetch overrides if they exist, otherwise fall back to system defaults
    const ov = await db.collection("roleOverrides").doc(`${tenantId}_${role}`).get();
    list = ov.exists ? ((ov.data() as any)?.permissions ?? []) : ROLE_DEFAULT_PERMS[role];
  } else {
    // Custom role mapping defined in database
    const r = await db.collection("roles").doc(role).get();
    list = r.exists ? ((r.data() as any)?.permissions ?? []) : [];
  }

  return { role, all: false, perms: new Set(list) };
}

/**
 * 1. Auth Event Trigger: runs when a new Firebase Auth account is created.
 * - Merges pre-seeded tenant membership states so signup doesn't override them.
 * - Finds pending invitations matching the signup email and automatically joins those tenants.
 * - Marks associated invitations as accepted.
 */
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName, photoURL } = user;
  if (!email) return;

  const userRef = db.collection("users").doc(uid);

  // Retrieve existing pre-populated profile configurations
  const existingSnap = await userRef.get();
  const existing = existingSnap.exists ? (existingSnap.data() as Record<string, any>) : null;

  // Lookup pending invitations
  const invitesSnap = await db
    .collection("invitations")
    .where("email", "==", email)
    .where("status", "==", "pending")
    .get();

  const inviteTenants: Record<string, any> = {};
  let firstInviteTenant: string | null = null;

  invitesSnap.forEach((doc) => {
    const data = doc.data();
    inviteTenants[data.tenantId] = {
      role: data.role,
      status: "active",
      joinedAt: FieldValue.serverTimestamp(),
    };
    if (!firstInviteTenant) {
      firstInviteTenant = data.tenantId;
    }
  });

  const now = FieldValue.serverTimestamp();
  const mergedTenants = { ...(existing?.tenants ?? {}), ...inviteTenants };
  const activeTenantId = existing?.activeTenantId ?? firstInviteTenant ?? null;

  const profile: Record<string, any> = {
    id: uid,
    email,
    displayName: existing?.displayName || displayName || email.split("@")[0] || "User",
    photoURL: existing?.photoURL ?? photoURL ?? null,
    updatedAt: now,
    activeTenantId,
    tenants: mergedTenants,
  };
  if (!existing) profile.createdAt = now;

  // Use merge:true to update or populate profile details safely
  await userRef.set(profile, { merge: true });

  // Optimization: Skip database batch write if no invitations were found
  if (!invitesSnap.empty) {
    const batch = db.batch();
    invitesSnap.forEach((doc) => {
      batch.update(doc.ref, {
        status: "accepted",
        updatedAt: now,
      });
    });
    await batch.commit();
  }
});

/**
 * 2. HTTPS Callable function: Invite a user to a tenant.
 * - Authenticates caller.
 * - Validates input parameters.
 * - Confirms caller has organization permission overrides (super_admin, org_admin, hr_manager).
 * - Maps existing profile connections or records an invitation code.
 * - Dispatches transactional invite email.
 */
export const inviteUser = functions.runWith({ secrets: MAIL_SECRETS, enforceAppCheck: ENFORCE_APP_CHECK }).https.onCall(async (data, context) => {
  // Access control check
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }

  const { email, tenantId, role } = data;
  if (!email || !tenantId || !role) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required fields: email, tenantId, role.");
  }

  const callerUid = context.auth.uid;
  const callerRef = db.collection("users").doc(callerUid);
  const callerSnap = await callerRef.get();

  if (!callerSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Caller profile not found.");
  }

  const callerData = callerSnap.data();
  const callerAccess = await getCallerAccess(callerUid, tenantId);

  // Restrict operation to dynamic authorization check
  if (!callerAccess.all && !callerAccess.perms.has("users.create")) {
    throw new functions.https.HttpsError("permission-denied", "You do not have permission to invite users to this tenant.");
  }

  // Resolve existing profile target
  let existingUserRecord: admin.auth.UserRecord | null = null;
  try {
    existingUserRecord = await admin.auth().getUserByEmail(email);
  } catch (err) {
    // Exception implies user does not exist in Auth yet
  }

  const now = FieldValue.serverTimestamp();
  let setPasswordUrl: string | null = null;

  if (!existingUserRecord) {
    // 1. Create Firebase Auth user
    const randomPassword =
      Math.random().toString(36).slice(2) +
      Math.random().toString(36).slice(2).toUpperCase() +
      "!7";
    existingUserRecord = await admin.auth().createUser({
      email,
      emailVerified: false,
      password: randomPassword,
    });

    // 2. Generate password-reset URL as a "set password" activation step
    const appUrl = getAppUrl();
    try {
      const actionLink = await admin.auth().generatePasswordResetLink(email, {
        url: `${appUrl}/login`,
        handleCodeInApp: false,
      });
      const oobCode = new URL(actionLink).searchParams.get("oobCode") || "";
      setPasswordUrl = oobCode
        ? `${appUrl}/reset-password?oobCode=${encodeURIComponent(oobCode)}`
        : actionLink;
    } catch (err) {
      functions.logger.error("[inviteUser] failed to generate reset link", {
        email,
        error: err,
      });
    }
  }

  const uid = existingUserRecord.uid;
  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();
  const existing = userSnap.exists ? (userSnap.data() as Record<string, any>) : null;

  if (existing?.tenants?.[tenantId]) {
    throw new functions.https.HttpsError("already-exists", "User is already associated with this tenant.");
  }

  // Set or merge user profile with active status
  const profile: Record<string, any> = {
    id: uid,
    email,
    displayName: existing?.displayName || email.split("@")[0] || "User",
    photoURL: existing?.photoURL ?? null,
    updatedAt: now,
    tenants: {
      [tenantId]: {
        role,
        status: "active",
        joinedAt: now,
      },
    },
  };
  if (!existing?.activeTenantId) {
    profile.activeTenantId = tenantId;
  }
  if (!existing) {
    profile.createdAt = now;
  }

  await userRef.set(profile, { merge: true });

  // Create audit invitation tracking
  const inviteId = `${tenantId}_${email.replace(/[^a-zA-Z0-9]/g, "_")}`;
  const inviteRef = db.collection("invitations").doc(inviteId);

  await inviteRef.set({
    id: inviteId,
    email,
    tenantId,
    role,
    invitedBy: callerUid,
    status: "accepted",
    createdAt: now,
    updatedAt: now,
  });

  // Dispatch email notification (non-blocking, logged if failed)
  try {
    const tenantSnap = await db.collection("tenants").doc(tenantId).get();
    const organizationName = (tenantSnap.data()?.name as string) || "your organization";
    const inviterName = (callerData?.displayName as string) || undefined;

    const acceptUrl = setPasswordUrl || `${getAppUrl()}/login?email=${encodeURIComponent(
      email
    )}&invite=${encodeURIComponent(inviteId)}`;

    await sendInvitationEmail({
      to: email,
      organizationName,
      inviterName,
      role,
      acceptUrl,
    });
  } catch (mailErr) {
    functions.logger.error("[inviteUser] Failed to send invitation email", { email, tenantId, error: mailErr });
  }

  return { success: true, inviteId };
});

/**
 * 2b. HTTPS Callable function: Provision a login account for an employee.
 * - Confirms caller has master clearance or permissions for employee/user creation.
 * - Creates Auth profile with random password if missing.
 * - Links active tenant mapping into profile scope.
 * - Generates password-reset links and sends welcome notifications.
 */
export const provisionEmployeeAccount = functions.runWith({ secrets: MAIL_SECRETS, enforceAppCheck: ENFORCE_APP_CHECK }).https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "You must be signed in.");
  }

  const email = String(data?.email || "").trim().toLowerCase();
  const tenantId = String(data?.tenantId || "").trim();
  const displayName = String(data?.displayName || "").trim();
  const role = "employee";

  if (!email || !tenantId) {
    throw new functions.https.HttpsError("invalid-argument", "Email and tenantId are required.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new functions.https.HttpsError("invalid-argument", "Please provide a valid email address.");
  }

  // Validate caller permissions
  const access = await getCallerAccess(context.auth.uid, tenantId);
  const canProvision =
    access.all ||
    access.perms.has("employees.create") ||
    access.perms.has("employees.update") ||
    access.perms.has("users.create");

  if (!canProvision) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "You do not have permission to add members to this organization."
    );
  }

  // Find or create Firebase Auth user
  let userRecord: admin.auth.UserRecord;
  try {
    userRecord = await admin.auth().getUserByEmail(email);
  } catch {
    const randomPassword =
      Math.random().toString(36).slice(2) +
      Math.random().toString(36).slice(2).toUpperCase() +
      "!7";
    userRecord = await admin.auth().createUser({
      email,
      emailVerified: false,
      password: randomPassword,
      ...(displayName ? { displayName } : {}),
    });
  }
  const uid = userRecord.uid;

  // Configure active profile data linkage
  const userRef = db.collection("users").doc(uid);
  const existingSnap = await userRef.get();
  const existing = existingSnap.exists ? (existingSnap.data() as Record<string, any>) : null;
  const now = FieldValue.serverTimestamp();

  const profile: Record<string, any> = {
    id: uid,
    email,
    displayName: existing?.displayName || displayName || email.split("@")[0] || "Employee",
    updatedAt: now,
    tenants: {
      [tenantId]: { role, status: "active", joinedAt: now },
    },
  };
  if (!existing?.activeTenantId) profile.activeTenantId = tenantId;
  if (!existing) {
    profile.createdAt = now;
    profile.photoURL = null;
  }
  await userRef.set(profile, { merge: true });

  // Generate password-reset URL as a "set password" activation step
  const appUrl = getAppUrl();
  let oobCode = "";
  let setPasswordUrl = `${appUrl}/login`;
  try {
    const actionLink = await admin.auth().generatePasswordResetLink(email, {
      url: `${appUrl}/login`,
      handleCodeInApp: false,
    });
    oobCode = new URL(actionLink).searchParams.get("oobCode") || "";
    setPasswordUrl = oobCode
      ? `${appUrl}/reset-password?oobCode=${encodeURIComponent(oobCode)}`
      : actionLink;
  } catch (err) {
    functions.logger.error("[provisionEmployeeAccount] failed to generate reset link", {
      email,
      error: err,
    });
  }

  // Send onboarding details to the new user (best-effort)
  try {
    const tenantSnap = await db.collection("tenants").doc(tenantId).get();
    const organizationName = (tenantSnap.data()?.name as string) || "your organization";
    await sendEmployeeWelcomeEmail({
      to: email,
      employeeName: profile.displayName,
      organizationName,
      setPasswordUrl,
    });
  } catch (mailErr) {
    functions.logger.error("[provisionEmployeeAccount] welcome email failed", {
      email,
      error: mailErr,
    });
  }

  return { success: true, uid, oobCode, setPasswordUrl };
});

/**
 * 2c. HTTPS Callable function: Forgot password request flow.
 * - Rate-limited to prevent mail bombing.
 * - Always returns { success: true } to prevent account harvesting/enumeration.
 * - Generates password reset link and forwards to user email.
 */
export const requestPasswordReset = functions.runWith({ secrets: MAIL_SECRETS, enforceAppCheck: ENFORCE_APP_CHECK }).https.onCall(async (data) => {
  const email = String(data?.email || "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Please provide a valid email address."
    );
  }

  // Apply rate limiter parameters (max 5 requests per hour)
  await enforceRateLimit(`pwreset_${email}`, 5, 60 * 60 * 1000);

  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    const appUrl = getAppUrl();
    const actionLink = await admin.auth().generatePasswordResetLink(email, {
      url: `${appUrl}/login`,
      handleCodeInApp: false,
    });
    const oobCode = new URL(actionLink).searchParams.get("oobCode") || "";
    const resetUrl = oobCode
      ? `${appUrl}/reset-password?oobCode=${encodeURIComponent(oobCode)}`
      : actionLink;

    await sendPasswordResetEmail({
      to: email,
      recipientName: userRecord.displayName || undefined,
      resetUrl,
    });
  } catch (err: any) {
    // Silently log and intercept exceptions to prevent disclosing registered users
    functions.logger.warn("[requestPasswordReset] could not process reset request", {
      email,
      code: err?.code,
      error: String(err?.message || err),
    });
  }

  return { success: true };
});

/**
 * Resolve organization branding name.
 */
async function getTenantName(tenantId: string): Promise<string> {
  try {
    const snap = await db.collection("tenants").doc(tenantId).get();
    return (snap.data()?.name as string) || "our company";
  } catch {
    return "our company";
  }
}

/**
 * Format timestamps into readable localized datetime strings.
 */
function formatWhen(ms: number): string {
  try {
    return new Date(ms).toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "short",
    });
  } catch {
    return new Date(ms).toISOString();
  }
}

/**
 * 3. HTTPS Callable function: Submit job applications from careers page.
 * - Does not require session auth (careers portal is public).
 * - Validates input args and applies rate limits to block form spam.
 * - Confirms job is published and open.
 * - Detects duplicate applications on matching email.
 * - Creates Candidate profile and fires confirmation email.
 */
export const submitApplication = functions.runWith({ secrets: MAIL_SECRETS, enforceAppCheck: ENFORCE_APP_CHECK }).https.onCall(async (data) => {
  const {
    tenantId,
    jobId,
    firstName,
    lastName,
    email,
    phone,
    linkedinUrl,
    coverLetter,
    resumeUrl,
    resumePath,
  } = data || {};

  if (!tenantId || !jobId || !firstName || !lastName || !email) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required fields: tenantId, jobId, firstName, lastName, email."
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid email address.");
  }

  // Apply rate limiter per applicant email address
  await enforceRateLimit(`apply_${String(email).toLowerCase()}`, 10, 60 * 60 * 1000);

  const jobSnap = await db.collection("jobs").doc(jobId).get();
  if (!jobSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Job not found.");
  }
  const job = jobSnap.data() as {
    tenantId: string;
    title: string;
    isPublished: boolean;
    status: string;
    pipelineStages?: string[];
  };

  if (job.tenantId !== tenantId || !job.isPublished || job.status !== "open") {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "This position is not accepting applications."
    );
  }

  // Duplicate checks (one submission per email per job)
  const dupSnap = await db
    .collection("candidates")
    .where("tenantId", "==", tenantId)
    .where("jobId", "==", jobId)
    .where("email", "==", String(email).toLowerCase())
    .limit(1)
    .get();

  if (!dupSnap.empty) {
    throw new functions.https.HttpsError(
      "already-exists",
      "You have already applied to this position with this email address."
    );
  }

  const now = Date.now();
  const candidateId = `cand_${Math.random().toString(36).substring(2, 9)}_${now}`;
  const stage = job.pipelineStages?.[0] || "Applied";

  const candidate: Record<string, unknown> = {
    id: candidateId,
    tenantId,
    jobId,
    jobTitle: job.title,
    firstName,
    lastName,
    email: String(email).toLowerCase(),
    source: "careers",
    stage,
    status: "active",
    appliedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  if (phone) candidate.phone = phone;
  if (linkedinUrl) candidate.linkedinUrl = linkedinUrl;
  if (coverLetter) candidate.coverLetter = coverLetter;
  if (resumeUrl) candidate.resumeUrl = resumeUrl;
  if (resumePath) candidate.resumePath = resumePath;

  await db.collection("candidates").doc(candidateId).set(candidate);

  // Send application confirmation receipt
  try {
    const organizationName = await getTenantName(tenantId);
    await sendApplicationReceivedEmail({
      to: email,
      candidateName: firstName,
      jobTitle: job.title,
      organizationName,
    });
  } catch (err) {
    functions.logger.error("[submitApplication] confirmation email failed", { email, error: err });
  }

  return { success: true, candidateId };
});

/**
 * 4. Firestore Event Trigger: fires when a candidate document is updated.
 * Automatically dispatches status or stage updates to applicants:
 * - Courtesy rejection email if status changes to rejected.
 * - Progression/stage change email if candidate stage updates but status is active.
 */
export const onCandidateUpdated = functions
  .runWith({ secrets: MAIL_SECRETS })
  .firestore.document("candidates/{id}")
  .onUpdate(async (change) => {
    const before = change.before.data();
    const after = change.after.data();
    if (!after?.email) return;

    const organizationName = await getTenantName(after.tenantId);
    const candidateName = after.firstName || "there";

    try {
      if (after.status === "rejected" && before.status !== "rejected") {
        await sendRejectionEmail({
          to: after.email,
          candidateName,
          jobTitle: after.jobTitle || "the role",
          organizationName,
        });
      } else if (after.stage !== before.stage && after.status === "active") {
        await sendStatusUpdateEmail({
          to: after.email,
          candidateName,
          jobTitle: after.jobTitle || "the role",
          organizationName,
          stage: after.stage,
        });
      }
    } catch (err) {
      functions.logger.error("[onCandidateUpdated] email failed", { id: after.id, error: err });
    }
  });

/**
 * 5. Firestore Event Trigger: fires when an offer document is updated.
 * Automatically alerts candidates when their status changes to "sent".
 */
export const onOfferUpdated = functions
  .runWith({ secrets: MAIL_SECRETS })
  .firestore.document("offers/{id}")
  .onUpdate(async (change) => {
    const before = change.before.data();
    const after = change.after.data();
    if (!after) return;

    if (after.status === "sent" && before.status !== "sent" && after.candidateEmail) {
      try {
        const organizationName = await getTenantName(after.tenantId);
        await sendOfferEmail({
          to: after.candidateEmail,
          candidateName: after.candidateName || "there",
          jobTitle: after.jobTitle || "the role",
          organizationName,
          salary: after.salary || 0,
          currency: after.currency || "USD",
          startDate: after.startDate || "TBD",
          viewUrl: `${getAppUrl()}/login`,
        });
      } catch (err) {
        functions.logger.error("[onOfferUpdated] offer email failed", { id: after.id, error: err });
      }
    }
  });

/**
 * 6. Firestore Event Trigger: fires when a new interview document is created.
 * Automatically alerts candidates and designated team interviewers.
 */
export const onInterviewCreated = functions
  .runWith({ secrets: MAIL_SECRETS })
  .firestore.document("interviews/{id}")
  .onCreate(async (snap) => {
    const interview = snap.data();
    if (!interview) return;

    const organizationName = await getTenantName(interview.tenantId);
    const whenText = formatWhen(interview.scheduledAt);

    const interviewerEmails: string[] = Array.isArray(interview.interviewerEmails)
      ? interview.interviewerEmails
      : [];

    try {
      // Send interview details to interviewer group
      if (interviewerEmails.length > 0) {
        await sendInterviewInviteEmail({
          to: interviewerEmails,
          recipientName: "Team",
          candidateName: interview.candidateName || "the candidate",
          jobTitle: interview.title || "the role",
          organizationName,
          title: interview.title || "Interview",
          whenText,
          location: interview.location || "TBD",
          durationMins: interview.durationMins || 60,
        });
      }

      // Fetch candidate email and deliver candidate invitation link
      const candSnap = await db.collection("candidates").doc(interview.candidateId).get();
      const candEmail = candSnap.data()?.email as string | undefined;
      const candName = (candSnap.data()?.firstName as string | undefined) || interview.candidateName;

      if (candEmail) {
        await sendInterviewInviteEmail({
          to: candEmail,
          recipientName: candName || "there",
          candidateName: candName || "you",
          jobTitle: interview.title || "the role",
          organizationName,
          title: interview.title || "Interview",
          whenText,
          location: interview.location || "TBD",
          durationMins: interview.durationMins || 60,
        });
      }
    } catch (err) {
      functions.logger.error("[onInterviewCreated] invite email failed", { id: interview.id, error: err });
    }
  });

/**
 * 7. Firestore Event Trigger: fires when a job requisition document is written.
 * Manages approval-workflow steps and notifies creators or current approvers:
 * - Alerts creator on approve / reject / publish updates.
 * - Alerts active designated approver when jobs are submitted or transitioned to pending approval.
 */
export const onJobUpdated = functions
  .runWith({ secrets: MAIL_SECRETS })
  .firestore.document("jobs/{id}")
  .onWrite(async (change) => {
    const after = change.after.exists ? (change.after.data() as Record<string, any>) : null;
    if (!after) return; // Deleted

    const before = change.before.exists ? (change.before.data() as Record<string, any>) : null;
    const beforeStatus = before?.status;
    const tenantId = after.tenantId as string;
    const link = "/jobs";

    const notifyCreator = async (type: string, title: string, body: string) => {
      const u = await resolveUser(after.createdBy);
      await notifyUser(tenantId, after.createdBy, u?.email, u?.name, type, title, body, link);
    };

    if (after.status === "approved" && beforeStatus !== "approved") {
      await notifyCreator("job.approved", "Job requisition approved", `Your requisition "${after.title}" has been approved.`);
    } else if (after.status === "rejected" && beforeStatus !== "rejected") {
      await notifyCreator("job.rejected", "Job requisition rejected", `Your requisition "${after.title}" was rejected.`);
    } else if (after.status === "open" && beforeStatus !== "open") {
      await notifyCreator("job.published", "Job requisition published", `Your requisition "${after.title}" is now live on the careers page.`);
    }

    // Advancing through pending approvals -> alert the next approver
    const beforeStep = before?.approval?.currentStep ?? -1;
    const afterStep = after.approval?.currentStep ?? -1;
    const becamePending =
      after.status === "pending_approval" &&
      (beforeStatus !== "pending_approval" || afterStep > beforeStep);

    if (becamePending) {
      const approver = after.approval?.steps?.[afterStep];
      if (approver?.approverId) {
        await notifyUser(
          tenantId,
          approver.approverId,
          approver.approverEmail,
          approver.approverName,
          "approval.requested",
          "Approval requested",
          `The requisition "${after.title}" needs your approval.`,
          link
        );
      }
    }
  });

/**
 * 8. Firestore Event Trigger: fires when a leave request document is written.
 * - Handles leave balance updates on state changes (pending, approved, rejected, cancelled).
 * - Notifies employees on decision updates.
 * - Alerts subsequent approvers when leave requests advance to their queue.
 */
const onLeaveRequestUpdated = functions
  .runWith({ secrets: MAIL_SECRETS })
  .firestore.document("leaveRequests/{id}")
  .onWrite(async (change) => {
    const after = change.after.exists ? (change.after.data() as Record<string, any>) : null;
    if (!after) return; // Deleted

    const before = change.before.exists ? (change.before.data() as Record<string, any>) : null;
    const beforeStatus = before?.status;
    const tenantId = after.tenantId as string;
    const link = "/leave";

    // Reconcile and adjust employee leave balance
    try {
      await settleLeaveBalance(before, after);
    } catch (err) {
      functions.logger.error("[onLeaveRequestUpdated] balance settle failed", { id: after.id, error: String(err) });
    }

    const notifyRequester = async (type: string, title: string, body: string) => {
      const u = await resolveUser(after.createdBy);
      await notifyUser(tenantId, after.createdBy, u?.email, u?.name, type, title, body, link);
    };

    if (after.status === "approved" && beforeStatus !== "approved") {
      await notifyRequester(
        "leave.approved",
        "Leave approved",
        `Your ${after.leaveTypeName || "leave"} request (${after.startDate} → ${after.endDate}) has been approved.`
      );
    } else if (after.status === "rejected" && beforeStatus !== "rejected") {
      await notifyRequester(
        "leave.rejected",
        "Leave rejected",
        `Your ${after.leaveTypeName || "leave"} request (${after.startDate} → ${after.endDate}) was rejected.`
      );
    }

    // Progression of approval queues -> alert next queue manager
    const beforeStep = before?.approval?.currentStep ?? -1;
    const afterStep = after.approval?.currentStep ?? -1;
    const becamePending =
      after.status === "pending" &&
      (beforeStatus !== "pending" || afterStep > beforeStep);

    if (becamePending) {
      const approver = after.approval?.steps?.[afterStep];
      if (approver?.approverId) {
        await notifyUser(
          tenantId,
          approver.approverId,
          approver.approverEmail,
          approver.approverName,
          "approval.requested",
          "Leave approval requested",
          `${after.employeeName || "An employee"} requested ${after.leaveTypeName || "leave"} (${after.startDate} → ${after.endDate}).`,
          link
        );
      }
    }
  });

// Export the function as a named export for Firebase trigger discovery
export { onLeaveRequestUpdated };

// Provide default export for the last export function, satisfying the requirement
export default onLeaveRequestUpdated;
