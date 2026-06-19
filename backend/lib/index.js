"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onLeaveRequestUpdated = exports.onJobUpdated = exports.onInterviewCreated = exports.onOfferUpdated = exports.onCandidateUpdated = exports.submitApplication = exports.reportFailedLoginHttp = exports.reportFailedLogin = exports.reportWrongOrganizationAttemptHttp = exports.reportWrongOrganizationAttempt = exports.updateUserProfileHttp = exports.updateUserProfile = exports.toggleUserTenantStatusHttp = exports.toggleUserTenantStatus = exports.requestPasswordReset = exports.provisionEmployeeAccount = exports.inviteUser = exports.onUserCreate = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const mailer_1 = require("./mailer");
// Initialize the Firebase Admin SDK to interact with Firestore and Auth
admin.initializeApp();
const db = admin.firestore();
/**
 * SEC-003: App Check enforcement flag.
 * Off by default for local development & emulators.
 * Set ENFORCE_APP_CHECK=true in production to require valid App Check tokens.
 */
/**
 * App Check enforcement:
 * - Default: controlled by ENFORCE_APP_CHECK
 * - In emulator mode (VITE_USE_EMULATOR=true on the frontend), never enforce App Check,
 *   otherwise callable requests can fail due to missing/invalid tokens.
 */
const ENFORCE_APP_CHECK = process.env.ENFORCE_APP_CHECK === "true" && process.env.FUNCTIONS_EMULATOR !== "true";
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
async function enforceRateLimit(key, maxAttempts, windowMs) {
    const ref = db.collection("rateLimits").doc(key.replace(/[^a-zA-Z0-9_.-]/g, "_"));
    const now = Date.now();
    await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        const data = snap.exists ? snap.data() : null;
        // If no limit recorded, or window has elapsed, reset window
        if (!data || now - data.windowStart > windowMs) {
            tx.set(ref, { count: 1, windowStart: now });
            return;
        }
        // If limit exceeded, abort with error
        if (data.count >= maxAttempts) {
            throw new functions.https.HttpsError("resource-exhausted", "Too many requests. Please wait a while and try again.");
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
async function createNotification(tenantId, userId, type, title, body, link) {
    if (!tenantId || !userId)
        return;
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
async function resolveUser(uid) {
    if (!uid)
        return null;
    try {
        const s = await db.collection("users").doc(uid).get();
        if (!s.exists)
            return null;
        const d = s.data();
        return { email: d?.email, name: d?.displayName };
    }
    catch {
        return null;
    }
}
/**
 * Deliver a notification through BOTH channels:
 * 1. Creates an in-app notification document in Firestore.
 * 2. Attempts to send a formatted email notification (best-effort).
 */
async function notifyUser(tenantId, userId, email, recipientName, type, title, body, link) {
    await createNotification(tenantId, userId, type, title, body, link);
    if (email) {
        try {
            await (0, mailer_1.sendNotificationEmail)({
                to: email,
                recipientName,
                heading: title,
                lines: [body],
                ctaUrl: `${(0, mailer_1.getAppUrl)()}${link}`,
                ctaLabel: "Open in app",
            });
        }
        catch (err) {
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
async function settleLeaveBalance(before, after) {
    const beforeStatus = before?.status;
    const afterStatus = after.status;
    // Only run mutations if there is a real status transition
    if (beforeStatus === afterStatus)
        return;
    const days = Number(after.days) || 0;
    if (days <= 0 || !after.tenantId || !after.employeeId || !after.leaveTypeId || !after.startDate)
        return;
    const year = new Date(`${after.startDate}T00:00:00Z`).getUTCFullYear();
    const balId = `${after.tenantId}_${after.employeeId}_${after.leaveTypeId}_${year}`;
    let pendingDelta = 0;
    let usedDelta = 0;
    const created = !before;
    // Simplify status transitions logic into nested structured blocks
    if (created) {
        if (afterStatus === "pending") {
            pendingDelta = days;
        }
        else if (afterStatus === "approved") {
            usedDelta = days;
        }
    }
    else if (beforeStatus === "pending") {
        if (afterStatus === "approved") {
            pendingDelta = -days;
            usedDelta = days;
        }
        else if (afterStatus === "rejected" || afterStatus === "cancelled") {
            pendingDelta = -days;
        }
    }
    else if (beforeStatus === "approved" && afterStatus === "cancelled") {
        usedDelta = -days;
    }
    else {
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
        const d = snap.data();
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
const ROLE_DEFAULT_PERMS = {
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
async function getCallerAccess(uid, tenantId) {
    const snap = await db.collection("users").doc(uid).get();
    const tenant = snap.exists ? snap.data()?.tenants?.[tenantId] : null;
    // Active status check
    if (!tenant || tenant.status !== "active") {
        return { role: "", all: false, perms: new Set() };
    }
    const role = String(tenant.role || "");
    // Super administrators and organization admins get master clearance
    if (role === "super_admin" || role === "org_admin") {
        return { role, all: true, perms: new Set() };
    }
    let list = [];
    if (ROLE_DEFAULT_PERMS[role]) {
        // Fetch overrides if they exist, otherwise fall back to system defaults
        const ov = await db.collection("roleOverrides").doc(`${tenantId}_${role}`).get();
        list = ov.exists ? (ov.data()?.permissions ?? []) : ROLE_DEFAULT_PERMS[role];
    }
    else {
        // Custom role mapping defined in database
        const r = await db.collection("roles").doc(role).get();
        list = r.exists ? (r.data()?.permissions ?? []) : [];
    }
    return { role, all: false, perms: new Set(list) };
}
/**
 * 1. Auth Event Trigger: runs when a new Firebase Auth account is created.
 * - Merges pre-seeded tenant membership states so signup doesn't override them.
 * - Finds pending invitations matching the signup email and automatically joins those tenants.
 * - Marks associated invitations as accepted.
 */
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
    const { uid, email, displayName, photoURL } = user;
    if (!email)
        return;
    const userRef = db.collection("users").doc(uid);
    // Lookup pending invitations
    const invitesSnap = await db
        .collection("invitations")
        .where("email", "==", email)
        .where("status", "==", "pending")
        .get();
    const inviteTenants = {};
    let firstInviteTenant = null;
    invitesSnap.forEach((doc) => {
        const data = doc.data();
        inviteTenants[data.tenantId] = {
            role: data.role,
            status: "active",
            joinedAt: firestore_1.FieldValue.serverTimestamp(),
        };
        if (!firstInviteTenant) {
            firstInviteTenant = data.tenantId;
        }
    });
    const now = firestore_1.FieldValue.serverTimestamp();
    // Run a transaction to safely read and write the user profile, preventing race conditions
    await db.runTransaction(async (tx) => {
        const existingSnap = await tx.get(userRef);
        const existing = existingSnap.exists ? existingSnap.data() : null;
        const mergedTenants = { ...(existing?.tenants ?? {}), ...inviteTenants };
        const activeTenantId = existing?.activeTenantId ?? firstInviteTenant ?? null;
        const profile = {
            id: uid,
            email,
            displayName: existing?.displayName || displayName || email.split("@")[0] || "User",
            photoURL: existing?.photoURL ?? photoURL ?? null,
            updatedAt: now,
            activeTenantId,
            tenants: mergedTenants,
        };
        if (!existing)
            profile.createdAt = now;
        tx.set(userRef, profile, { merge: true });
    });
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
exports.inviteUser = functions.runWith({ secrets: mailer_1.MAIL_SECRETS, enforceAppCheck: ENFORCE_APP_CHECK }).https.onCall(async (data, context) => {
    // Access control check
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
    }
    const { email, tenantId, role, displayName } = data;
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
    let existingUserRecord = null;
    try {
        existingUserRecord = await admin.auth().getUserByEmail(email);
    }
    catch (err) {
        // Exception implies user does not exist in Auth yet
    }
    const now = firestore_1.FieldValue.serverTimestamp();
    let setPasswordUrl = null;
    if (!existingUserRecord) {
        // 1. Create Firebase Auth user
        const randomPassword = Math.random().toString(36).slice(2) +
            Math.random().toString(36).slice(2).toUpperCase() +
            "!7";
        existingUserRecord = await admin.auth().createUser({
            email,
            emailVerified: false,
            password: randomPassword,
            ...(displayName ? { displayName } : {}),
        });
        // 2. Generate password-reset URL as a "set password" activation step
        const appUrl = (0, mailer_1.getAppUrl)();
        try {
            const actionLink = await admin.auth().generatePasswordResetLink(email, {
                url: `${appUrl}/login`,
                handleCodeInApp: false,
            });
            const oobCode = new URL(actionLink).searchParams.get("oobCode") || "";
            setPasswordUrl = oobCode
                ? `${appUrl}/reset-password?oobCode=${encodeURIComponent(oobCode)}`
                : actionLink;
        }
        catch (err) {
            functions.logger.error("[inviteUser] failed to generate reset link", {
                email,
                error: err,
            });
        }
    }
    const uid = existingUserRecord.uid;
    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();
    const existing = userSnap.exists ? userSnap.data() : null;
    if (existing?.tenants?.[tenantId]) {
        throw new functions.https.HttpsError("already-exists", "User is already associated with this tenant.");
    }
    // Set or merge user profile with active status
    const profile = {
        id: uid,
        email,
        displayName: existing?.displayName || displayName || email.split("@")[0] || "User",
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
        const organizationName = tenantSnap.data()?.name || "your organization";
        const inviterName = callerData?.displayName || undefined;
        const acceptUrl = setPasswordUrl || `${(0, mailer_1.getAppUrl)()}/login?email=${encodeURIComponent(email)}&invite=${encodeURIComponent(inviteId)}`;
        await (0, mailer_1.sendInvitationEmail)({
            to: email,
            organizationName,
            inviterName,
            role,
            acceptUrl,
        });
    }
    catch (mailErr) {
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
exports.provisionEmployeeAccount = functions.runWith({ secrets: mailer_1.MAIL_SECRETS, enforceAppCheck: ENFORCE_APP_CHECK }).https.onCall(async (data, context) => {
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
    const canProvision = access.all ||
        access.perms.has("employees.create") ||
        access.perms.has("employees.update") ||
        access.perms.has("users.create");
    if (!canProvision) {
        throw new functions.https.HttpsError("permission-denied", "You do not have permission to add members to this organization.");
    }
    // Find or create Firebase Auth user
    let userRecord;
    try {
        userRecord = await admin.auth().getUserByEmail(email);
    }
    catch {
        const randomPassword = Math.random().toString(36).slice(2) +
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
    const existing = existingSnap.exists ? existingSnap.data() : null;
    const now = firestore_1.FieldValue.serverTimestamp();
    const profile = {
        id: uid,
        email,
        displayName: existing?.displayName || displayName || email.split("@")[0] || "Employee",
        updatedAt: now,
        tenants: {
            [tenantId]: { role, status: "active", joinedAt: now },
        },
    };
    if (!existing?.activeTenantId)
        profile.activeTenantId = tenantId;
    if (!existing) {
        profile.createdAt = now;
        profile.photoURL = null;
    }
    await userRef.set(profile, { merge: true });
    // Generate password-reset URL as a "set password" activation step
    const appUrl = (0, mailer_1.getAppUrl)();
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
    }
    catch (err) {
        functions.logger.error("[provisionEmployeeAccount] failed to generate reset link", {
            email,
            error: err,
        });
    }
    // Send onboarding details to the new user (best-effort)
    try {
        const tenantSnap = await db.collection("tenants").doc(tenantId).get();
        const organizationName = tenantSnap.data()?.name || "your organization";
        await (0, mailer_1.sendEmployeeWelcomeEmail)({
            to: email,
            employeeName: profile.displayName,
            organizationName,
            setPasswordUrl,
        });
    }
    catch (mailErr) {
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
exports.requestPasswordReset = functions.runWith({ secrets: mailer_1.MAIL_SECRETS, enforceAppCheck: ENFORCE_APP_CHECK }).https.onCall(async (data) => {
    const email = String(data?.email || "").trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new functions.https.HttpsError("invalid-argument", "Please provide a valid email address.");
    }
    // Apply rate limiter parameters (max 5 requests per hour)
    await enforceRateLimit(`pwreset_${email}`, 5, 60 * 60 * 1000);
    try {
        const userRecord = await admin.auth().getUserByEmail(email);
        const appUrl = (0, mailer_1.getAppUrl)();
        const actionLink = await admin.auth().generatePasswordResetLink(email, {
            url: `${appUrl}/login`,
            handleCodeInApp: false,
        });
        const oobCode = new URL(actionLink).searchParams.get("oobCode") || "";
        const resetUrl = oobCode
            ? `${appUrl}/reset-password?oobCode=${encodeURIComponent(oobCode)}`
            : actionLink;
        await (0, mailer_1.sendPasswordResetEmail)({
            to: email,
            recipientName: userRecord.displayName || undefined,
            resetUrl,
        });
    }
    catch (err) {
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
 * 2d. HTTPS Callable function: Toggle user account activation within a tenant.
 * - Authenticates caller
 * - Ensures caller has users.update (or master access via org_admin/super_admin/hr_manager)
 * - Updates users/{targetUid}.tenants[tenantId].status
 * - Disables/enables Firebase Auth user login via Admin SDK
 * - Sends active/deactivated email to the target user's email including actor name+role
 * - Creates an in-app notification for the target user
 */
exports.toggleUserTenantStatus = functions
    .runWith({ secrets: mailer_1.MAIL_SECRETS, enforceAppCheck: ENFORCE_APP_CHECK })
    .https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
    }
    const { tenantId, userId, nextStatus } = data || {};
    if (!tenantId || !userId || (nextStatus !== "active" && nextStatus !== "disabled")) {
        throw new functions.https.HttpsError("invalid-argument", "Missing required fields: tenantId, userId, nextStatus (active|disabled).");
    }
    const callerUid = context.auth.uid;
    // Dynamic permission enforcement
    const callerAccess = await getCallerAccess(callerUid, tenantId);
    if (!callerAccess.all && !callerAccess.perms.has("users.update")) {
        throw new functions.https.HttpsError("permission-denied", "You do not have permission to update users.");
    }
    // Load caller identity for email/audit
    const callerSnap = await db.collection("users").doc(callerUid).get();
    const callerProfile = callerSnap.exists ? callerSnap.data() : null;
    const callerTenantInfo = callerProfile?.tenants?.[tenantId];
    const actorRole = callerTenantInfo?.role ? String(callerTenantInfo.role) : undefined;
    const actorName = callerProfile?.displayName ? String(callerProfile.displayName) : undefined;
    // Load target user profile
    const targetSnap = await db.collection("users").doc(userId).get();
    if (!targetSnap.exists) {
        throw new functions.https.HttpsError("not-found", "Target user profile not found.");
    }
    const targetProfile = targetSnap.data();
    const targetTenantInfo = targetProfile?.tenants?.[tenantId];
    if (!targetTenantInfo) {
        throw new functions.https.HttpsError("failed-precondition", "Target user is not part of this tenant.");
    }
    const targetEmail = targetProfile?.email ? String(targetProfile.email) : undefined;
    const currentStatus = String(targetTenantInfo.status || "active");
    if (currentStatus === nextStatus) {
        return { success: true, skipped: true, status: currentStatus };
    }
    // 1) Update Firestore tenant status
    const now = firestore_1.FieldValue.serverTimestamp();
    await db.collection("users").doc(userId).set({
        tenants: {
            [tenantId]: {
                ...(targetTenantInfo || {}),
                status: nextStatus,
            },
        },
        updatedAt: now,
    }, { merge: true });
    // 2) Disable/enable Firebase Auth login
    try {
        await admin.auth().updateUser(userId, { disabled: nextStatus === "disabled" });
    }
    catch (err) {
        // If auth update fails, still keep firestore status but surface error
        throw err;
    }
    // 3) Send email + in-app notification
    try {
        if (targetEmail) {
            const tenantNameSnap = await db.collection("tenants").doc(tenantId).get();
            const organizationName = tenantNameSnap.data()?.name || "your organization";
            await (0, mailer_1.sendAccountStatusEmail)({
                to: targetEmail,
                organizationName,
                actorName,
                actorRole,
                status: nextStatus,
            });
        }
        await createNotification(tenantId, userId, "account.status", nextStatus === "active" ? "Account activated" : "Account deactivated", `Your account status was changed to "${nextStatus}" by ${actorName || "an administrator"}${actorRole ? ` (${actorRole})` : ""}.`, "/users");
    }
    catch (err) {
        functions.logger.error("[toggleUserTenantStatus] notifications failed", { err });
    }
    return { success: true, status: nextStatus };
});
/**
 * 2e. HTTPS HTTP endpoint (TEMP for local emulator only):
 * - Exists to bypass callable/CORS issues in this environment.
 * - Accepts JSON body: { tenantId, userId, nextStatus }
 * - Requires Authorization: Bearer <Firebase ID token>
 */
exports.toggleUserTenantStatusHttp = functions.https.onRequest(async (req, res) => {
    // Permissive CORS for local dev (must be present on *all* responses including OPTIONS)
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Vary", "Origin");
    if (req.method === "OPTIONS") {
        res.status(204).end();
        return;
    }
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }
    try {
        const authHeader = String(req.header("Authorization") || "");
        const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : "";
        if (!token) {
            res.status(401).json({ error: "Unauthenticated" });
            return;
        }
        const decoded = await admin.auth().verifyIdToken(token);
        const callerUid = decoded.uid;
        const { tenantId, userId, nextStatus } = req.body || {};
        if (!tenantId || !userId || (nextStatus !== "active" && nextStatus !== "disabled")) {
            res.status(400).json({ error: "Missing required fields: tenantId, userId, nextStatus (active|disabled)." });
            return;
        }
        const callerAccess = await getCallerAccess(callerUid, String(tenantId));
        if (!callerAccess.all && !callerAccess.perms.has("users.update")) {
            res.status(403).json({ error: "Permission denied" });
            return;
        }
        // Load caller identity for email/audit
        const callerSnap = await db.collection("users").doc(callerUid).get();
        const callerProfile = callerSnap.exists ? callerSnap.data() : null;
        const callerTenantInfo = callerProfile?.tenants?.[tenantId];
        const actorRole = callerTenantInfo?.role ? String(callerTenantInfo.role) : undefined;
        const actorName = callerProfile?.displayName ? String(callerProfile.displayName) : undefined;
        // Load target user profile
        const targetSnap = await db.collection("users").doc(String(userId)).get();
        if (!targetSnap.exists) {
            res.status(404).json({ error: "Target user profile not found" });
            return;
        }
        const targetProfile = targetSnap.data();
        const targetTenantInfo = targetProfile?.tenants?.[tenantId];
        if (!targetTenantInfo) {
            res.status(400).json({ error: "Target user is not part of this tenant." });
            return;
        }
        const targetEmail = targetProfile?.email ? String(targetProfile.email) : undefined;
        const currentStatus = String(targetTenantInfo.status || "active");
        if (currentStatus === nextStatus) {
            res.status(200).json({ success: true, skipped: true, status: currentStatus });
            return;
        }
        const now = firestore_1.FieldValue.serverTimestamp();
        await db.collection("users").doc(String(userId)).set({
            tenants: {
                [tenantId]: {
                    ...(targetTenantInfo || {}),
                    status: nextStatus,
                },
            },
            updatedAt: now,
        }, { merge: true });
        await admin.auth().updateUser(String(userId), { disabled: nextStatus === "disabled" });
        try {
            if (targetEmail) {
                const tenantNameSnap = await db.collection("tenants").doc(tenantId).get();
                const organizationName = tenantNameSnap.data()?.name || "your organization";
                await (0, mailer_1.sendAccountStatusEmail)({
                    to: targetEmail,
                    organizationName,
                    actorName,
                    actorRole,
                    status: nextStatus,
                });
            }
            await createNotification(tenantId, String(userId), "account.status", nextStatus === "active" ? "Account activated" : "Account deactivated", `Your account status was changed to "${nextStatus}" by ${actorName || "an administrator"}${actorRole ? ` (${actorRole})` : ""}.`, "/users");
        }
        catch (err) {
            functions.logger.error("[toggleUserTenantStatusHttp] notifications failed", { err });
        }
        res.status(200).json({ success: true, status: nextStatus });
    }
    catch (err) {
        functions.logger.error("[toggleUserTenantStatusHttp] failed", { err });
        res.status(500).json({ error: String(err?.message || err) });
    }
});
/**
 * HTTPS Callable function: Update user profile details (displayName and email)
 * and update Firebase Auth as well as matching employee profiles.
 */
exports.updateUserProfile = functions
    .runWith({ secrets: mailer_1.MAIL_SECRETS, enforceAppCheck: ENFORCE_APP_CHECK })
    .https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
    }
    const { tenantId, userId, displayName, email } = data || {};
    if (!tenantId || !userId || !displayName || !email) {
        throw new functions.https.HttpsError("invalid-argument", "Missing required fields: tenantId, userId, displayName, email.");
    }
    const callerUid = context.auth.uid;
    // Dynamic permission enforcement
    const callerAccess = await getCallerAccess(callerUid, tenantId);
    if (!callerAccess.all && !callerAccess.perms.has("users.update")) {
        throw new functions.https.HttpsError("permission-denied", "You do not have permission to update users.");
    }
    // Load caller identity
    const callerSnap = await db.collection("users").doc(callerUid).get();
    const callerProfile = callerSnap.exists ? callerSnap.data() : null;
    const actorName = callerProfile?.displayName ? String(callerProfile.displayName) : "Admin";
    // Load target user profile
    const targetSnap = await db.collection("users").doc(userId).get();
    if (!targetSnap.exists) {
        throw new functions.https.HttpsError("not-found", "Target user profile not found.");
    }
    const targetProfile = targetSnap.data();
    const targetTenantInfo = targetProfile?.tenants?.[tenantId];
    if (!targetTenantInfo) {
        throw new functions.https.HttpsError("failed-precondition", "Target user is not part of this tenant.");
    }
    const now = firestore_1.FieldValue.serverTimestamp();
    // 1) Update Firestore user profile
    await db.collection("users").doc(userId).set({
        displayName: displayName.trim(),
        email: email.trim().toLowerCase(),
        updatedAt: now,
    }, { merge: true });
    // 2) Update Firebase Auth
    try {
        await admin.auth().updateUser(userId, {
            displayName: displayName.trim(),
            email: email.trim().toLowerCase(),
        });
    }
    catch (err) {
        functions.logger.error("[updateUserProfile] Auth update failed", { err });
        throw new functions.https.HttpsError("internal", `Firebase Auth update failed: ${err}`);
    }
    // 3) Update any linked employee records
    try {
        const employeeQuery = await db.collection("employees")
            .where("tenantId", "==", tenantId)
            .where("userId", "==", userId)
            .get();
        if (!employeeQuery.empty) {
            const nameParts = displayName.trim().split(/\s+/);
            const firstName = nameParts[0] || "";
            const lastName = nameParts.slice(1).join(" ");
            const batch = db.batch();
            employeeQuery.forEach((docSnap) => {
                batch.update(docSnap.ref, {
                    email: email.trim().toLowerCase(),
                    firstName,
                    lastName,
                    updatedAt: Date.now(),
                });
            });
            await batch.commit();
        }
    }
    catch (err) {
        functions.logger.error("[updateUserProfile] Employee updates failed", { err });
    }
    // 4) Create Notification
    try {
        await createNotification(tenantId, userId, "profile.update", "Profile updated by Admin", `Your profile details were updated by ${actorName}.`, "/users");
    }
    catch (err) {
        functions.logger.error("[updateUserProfile] notifications failed", { err });
    }
    // 5) If email changed, generate a password reset link and send an email
    const emailChanged = targetProfile?.email?.trim().toLowerCase() !== email.trim().toLowerCase();
    if (emailChanged) {
        const appUrl = (0, mailer_1.getAppUrl)();
        let setPasswordUrl = null;
        try {
            const actionLink = await admin.auth().generatePasswordResetLink(email.trim().toLowerCase(), {
                url: `${appUrl}/login`,
                handleCodeInApp: false,
            });
            const oobCode = new URL(actionLink).searchParams.get("oobCode") || "";
            setPasswordUrl = oobCode
                ? `${appUrl}/reset-password?oobCode=${encodeURIComponent(oobCode)}`
                : actionLink;
        }
        catch (err) {
            functions.logger.error("[updateUserProfile] failed to generate reset link", {
                email,
                error: err,
            });
        }
        if (setPasswordUrl) {
            try {
                await (0, mailer_1.sendPasswordResetEmail)({
                    to: email.trim().toLowerCase(),
                    resetUrl: setPasswordUrl,
                    recipientName: displayName.trim(),
                });
            }
            catch (mailErr) {
                functions.logger.error("[updateUserProfile] Failed to send password reset email", {
                    email,
                    error: mailErr,
                });
            }
        }
    }
    return { success: true };
});
/**
 * HTTPS HTTP endpoint (for local emulator fallback):
 * - Accepts JSON body: { tenantId, userId, displayName, email }
 * - Requires Authorization: Bearer <Firebase ID token>
 */
exports.updateUserProfileHttp = functions.https.onRequest(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Vary", "Origin");
    if (req.method === "OPTIONS") {
        res.status(204).end();
        return;
    }
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }
    try {
        const authHeader = String(req.header("Authorization") || "");
        const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : "";
        if (!token) {
            res.status(401).json({ error: "Unauthenticated" });
            return;
        }
        const decoded = await admin.auth().verifyIdToken(token);
        const callerUid = decoded.uid;
        const { tenantId, userId, displayName, email } = req.body || {};
        if (!tenantId || !userId || !displayName || !email) {
            res.status(400).json({ error: "Missing required fields: tenantId, userId, displayName, email." });
            return;
        }
        const callerAccess = await getCallerAccess(callerUid, String(tenantId));
        if (!callerAccess.all && !callerAccess.perms.has("users.update")) {
            res.status(403).json({ error: "Permission denied" });
            return;
        }
        const callerSnap = await db.collection("users").doc(callerUid).get();
        const callerProfile = callerSnap.exists ? callerSnap.data() : null;
        const actorName = callerProfile?.displayName ? String(callerProfile.displayName) : "Admin";
        const targetSnap = await db.collection("users").doc(String(userId)).get();
        if (!targetSnap.exists) {
            res.status(404).json({ error: "Target user profile not found" });
            return;
        }
        const targetProfile = targetSnap.data();
        const targetTenantInfo = targetProfile?.tenants?.[tenantId];
        if (!targetTenantInfo) {
            res.status(400).json({ error: "Target user is not part of this tenant." });
            return;
        }
        const now = firestore_1.FieldValue.serverTimestamp();
        await db.collection("users").doc(String(userId)).set({
            displayName: displayName.trim(),
            email: email.trim().toLowerCase(),
            updatedAt: now,
        }, { merge: true });
        await admin.auth().updateUser(String(userId), {
            displayName: displayName.trim(),
            email: email.trim().toLowerCase(),
        });
        try {
            const employeeQuery = await db.collection("employees")
                .where("tenantId", "==", tenantId)
                .where("userId", "==", userId)
                .get();
            if (!employeeQuery.empty) {
                const nameParts = displayName.trim().split(/\s+/);
                const firstName = nameParts[0] || "";
                const lastName = nameParts.slice(1).join(" ");
                const batch = db.batch();
                employeeQuery.forEach((docSnap) => {
                    batch.update(docSnap.ref, {
                        email: email.trim().toLowerCase(),
                        firstName,
                        lastName,
                        updatedAt: Date.now(),
                    });
                });
                await batch.commit();
            }
        }
        catch (err) {
            functions.logger.error("[updateUserProfileHttp] Employee updates failed", { err });
        }
        try {
            await createNotification(tenantId, String(userId), "profile.update", "Profile updated by Admin", `Your profile details were updated by ${actorName}.`, "/users");
        }
        catch (err) {
            functions.logger.error("[updateUserProfileHttp] notifications failed", { err });
        }
        // If email changed, generate a password reset link and send an email
        const emailChanged = targetProfile?.email?.trim().toLowerCase() !== email.trim().toLowerCase();
        if (emailChanged) {
            const appUrl = (0, mailer_1.getAppUrl)();
            let setPasswordUrl = null;
            try {
                const actionLink = await admin.auth().generatePasswordResetLink(email.trim().toLowerCase(), {
                    url: `${appUrl}/login`,
                    handleCodeInApp: false,
                });
                const oobCode = new URL(actionLink).searchParams.get("oobCode") || "";
                setPasswordUrl = oobCode
                    ? `${appUrl}/reset-password?oobCode=${encodeURIComponent(oobCode)}`
                    : actionLink;
            }
            catch (err) {
                functions.logger.error("[updateUserProfileHttp] failed to generate reset link", {
                    email,
                    error: err,
                });
            }
            if (setPasswordUrl) {
                try {
                    await (0, mailer_1.sendPasswordResetEmail)({
                        to: email.trim().toLowerCase(),
                        resetUrl: setPasswordUrl,
                        recipientName: displayName.trim(),
                    });
                }
                catch (mailErr) {
                    functions.logger.error("[updateUserProfileHttp] Failed to send password reset email", {
                        email,
                        error: mailErr,
                    });
                }
            }
        }
        res.status(200).json({ success: true });
    }
    catch (err) {
        functions.logger.error("[updateUserProfileHttp] failed", { err });
        res.status(500).json({ error: String(err?.message || err) });
    }
});
/**
 * HTTPS Callable function: Report an unauthorized login attempt where the user
 * selects an organization they do not belong to. Emails the attempted organization
 * owners and the user, and creates in-app notifications.
 */
exports.reportWrongOrganizationAttempt = functions
    .runWith({ secrets: mailer_1.MAIL_SECRETS, enforceAppCheck: ENFORCE_APP_CHECK })
    .https.onCall(async (data) => {
    const { email, attemptedTenantId } = data || {};
    if (!email || !attemptedTenantId) {
        throw new functions.https.HttpsError("invalid-argument", "Email and attemptedTenantId are required.");
    }
    // 1. Get the attempted tenant name
    const tenantSnap = await db.collection("tenants").doc(attemptedTenantId).get();
    if (!tenantSnap.exists) {
        return { success: false, error: "Tenant not found" };
    }
    const tenantName = tenantSnap.data()?.name || "your organization";
    // 2. Query target user details if they exist in the system
    const usersSnap = await db.collection("users").where("email", "==", email).limit(1).get();
    const targetName = !usersSnap.empty ? (usersSnap.docs[0].data()?.displayName || "Unknown") : "Unknown User";
    // 3. Find administrators (owners) of the attempted organization
    const adminsSnap = await db
        .collection("users")
        .where(`tenants.${attemptedTenantId}.role`, "in", ["org_admin", "super_admin"])
        .get();
    const adminEmails = [];
    const adminIds = [];
    adminsSnap.forEach((docSnap) => {
        const d = docSnap.data();
        if (d.email)
            adminEmails.push(d.email);
        adminIds.push(docSnap.id);
    });
    const systemOwnerEmail = process.env.SUPPORT_EMAIL || "support@hrms-ats.app";
    if (adminEmails.length === 0) {
        adminEmails.push(systemOwnerEmail);
    }
    // 4. Send emails
    // Mail to owner(s)
    try {
        await (0, mailer_1.sendMail)({
            to: adminEmails,
            subject: `Security Alert: Unauthorized Organization Access Attempt`,
            html: (0, mailer_1.renderEmail)({
                heading: "Unauthorized Access Attempt",
                paragraphs: [
                    `An unauthorized attempt to access your organization (${tenantName}) was detected.`,
                    `User Email: ${email}`,
                    `User Name: ${targetName}`,
                    `Time of attempt: ${new Date().toUTCString()}`,
                    "The user tried to log in under your organization name but does not have access to it."
                ],
                footnote: "This is an automated security alert."
            })
        });
    }
    catch (err) {
        functions.logger.error("[reportWrongOrganizationAttempt] failed to mail admins", err);
    }
    // Mail to the user (if registered)
    if (!usersSnap.empty) {
        try {
            await (0, mailer_1.sendMail)({
                to: email,
                subject: `Security Alert: Unauthorized Access Attempt`,
                html: (0, mailer_1.renderEmail)({
                    heading: "Access Attempt Denied",
                    paragraphs: [
                        `Hello ${targetName},`,
                        `We detected an attempt to sign in to the organization "${tenantName}" using your email address.`,
                        "You do not have access permissions for this organization, and the attempt was blocked.",
                        "If this was not you, someone may be trying to access organizations using your email.",
                        `Time of attempt: ${new Date().toUTCString()}`
                    ],
                    footnote: "This is an automated security alert."
                })
            });
        }
        catch (err) {
            functions.logger.error("[reportWrongOrganizationAttempt] failed to mail user", err);
        }
    }
    // 5. Create in-app notifications for the attempted organization's admins
    if (adminIds.length > 0) {
        for (const adminId of adminIds) {
            try {
                await createNotification(attemptedTenantId, adminId, "security.unauthorized_org", "Unauthorized Org Login Attempt", `An unauthorized login attempt was made by ${email} to access your organization.`, "/users");
            }
            catch (err) {
                functions.logger.error("[reportWrongOrganizationAttempt] failed to create notification", err);
            }
        }
    }
    return { success: true };
});
/**
 * HTTPS HTTP endpoint (for local emulator fallback):
 * - Accepts JSON body: { email, attemptedTenantId }
 */
exports.reportWrongOrganizationAttemptHttp = functions.https.onRequest(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Vary", "Origin");
    if (req.method === "OPTIONS") {
        res.status(204).end();
        return;
    }
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }
    try {
        const { email, attemptedTenantId } = req.body || {};
        if (!email || !attemptedTenantId) {
            res.status(400).json({ error: "Email and attemptedTenantId are required." });
            return;
        }
        const tenantSnap = await db.collection("tenants").doc(String(attemptedTenantId)).get();
        if (!tenantSnap.exists) {
            res.status(404).json({ error: "Tenant not found" });
            return;
        }
        const tenantName = tenantSnap.data()?.name || "your organization";
        const usersSnap = await db.collection("users").where("email", "==", email).limit(1).get();
        const targetName = !usersSnap.empty ? (usersSnap.docs[0].data()?.displayName || "Unknown") : "Unknown User";
        const adminsSnap = await db
            .collection("users")
            .where(`tenants.${attemptedTenantId}.role`, "in", ["org_admin", "super_admin"])
            .get();
        const adminEmails = [];
        const adminIds = [];
        adminsSnap.forEach((docSnap) => {
            const d = docSnap.data();
            if (d.email)
                adminEmails.push(d.email);
            adminIds.push(docSnap.id);
        });
        const systemOwnerEmail = process.env.SUPPORT_EMAIL || "support@hrms-ats.app";
        if (adminEmails.length === 0) {
            adminEmails.push(systemOwnerEmail);
        }
        try {
            await (0, mailer_1.sendMail)({
                to: adminEmails,
                subject: `Security Alert: Unauthorized Organization Access Attempt`,
                html: (0, mailer_1.renderEmail)({
                    heading: "Unauthorized Access Attempt",
                    paragraphs: [
                        `An unauthorized attempt to access your organization (${tenantName}) was detected.`,
                        `User Email: ${email}`,
                        `User Name: ${targetName}`,
                        `Time of attempt: ${new Date().toUTCString()}`,
                        "The user tried to log in under your organization name but does not have access to it."
                    ],
                    footnote: "This is an automated security alert."
                })
            });
        }
        catch (err) {
            functions.logger.error("[reportWrongOrganizationAttemptHttp] failed to mail admins", err);
        }
        if (!usersSnap.empty) {
            try {
                await (0, mailer_1.sendMail)({
                    to: email,
                    subject: `Security Alert: Unauthorized Access Attempt`,
                    html: (0, mailer_1.renderEmail)({
                        heading: "Access Attempt Denied",
                        paragraphs: [
                            `Hello ${targetName},`,
                            `We detected an attempt to sign in to the organization "${tenantName}" using your email address.`,
                            "You do not have access permissions for this organization, and the attempt was blocked.",
                            "If this was not you, someone may be trying to access organizations using your email.",
                            `Time of attempt: ${new Date().toUTCString()}`
                        ],
                        footnote: "This is an automated security alert."
                    })
                });
            }
            catch (err) {
                functions.logger.error("[reportWrongOrganizationAttemptHttp] failed to mail user", err);
            }
        }
        if (adminIds.length > 0) {
            for (const adminId of adminIds) {
                try {
                    await createNotification(String(attemptedTenantId), adminId, "security.unauthorized_org", "Unauthorized Org Login Attempt", `An unauthorized login attempt was made by ${email} to access your organization.`, "/users");
                }
                catch (err) {
                    functions.logger.error("[reportWrongOrganizationAttemptHttp] failed to create notification", err);
                }
            }
        }
        res.status(200).json({ success: true });
    }
    catch (err) {
        functions.logger.error("[reportWrongOrganizationAttemptHttp] failed", { err });
        res.status(500).json({ error: String(err?.message || err) });
    }
});
/**
 * 2f. HTTPS Callable function: Report a failed login attempt.
 * If the email does not exist (unauthenticated), it emails the global owner.
 * If the email exists (unauthorized), it emails the user and the tenant owner(s)/admin(s).
 */
exports.reportFailedLogin = functions.runWith({ secrets: mailer_1.MAIL_SECRETS, enforceAppCheck: ENFORCE_APP_CHECK }).https.onCall(async (data) => {
    const email = String(data?.email || "").trim().toLowerCase();
    const attemptedTenantId = data?.attemptedTenantId ? String(data.attemptedTenantId).trim() : undefined;
    if (!email) {
        throw new functions.https.HttpsError("invalid-argument", "Email is required.");
    }
    // Rate limit to prevent spam (max 10 requests per email per hour)
    await enforceRateLimit(`login_fail_${email}`, 10, 60 * 60 * 1000);
    // 1. Check if user exists in Firestore
    const usersSnap = await db.collection("users").where("email", "==", email).limit(1).get();
    const systemOwnerEmail = process.env.SUPPORT_EMAIL || "support@hrms-ats.app";
    if (usersSnap.empty) {
        // Unauthenticated
        try {
            await (0, mailer_1.sendMail)({
                to: systemOwnerEmail,
                subject: `Failed Login Attempt: Unregistered Email`,
                html: (0, mailer_1.renderEmail)({
                    heading: "Unregistered Login Attempt",
                    paragraphs: [
                        `A login attempt was made using an unregistered email address: ${email}.`,
                        "This email is not associated with any account in the system.",
                        `Time of attempt: ${new Date().toUTCString()}`
                    ],
                    footnote: "This is an automated security alert."
                })
            });
        }
        catch (err) {
            functions.logger.error("[reportFailedLogin] failed to mail owner", err);
        }
        return { success: true, type: "unauthenticated" };
    }
    // Unauthorized
    const userDoc = usersSnap.docs[0];
    const userProfile = userDoc.data();
    const activeTenantId = attemptedTenantId || userProfile.activeTenantId || Object.keys(userProfile.tenants || {})[0];
    const adminEmails = [];
    const adminIds = [];
    if (activeTenantId) {
        const adminsSnap = await db
            .collection("users")
            .where(`tenants.${activeTenantId}.role`, "in", ["org_admin", "super_admin"])
            .get();
        adminsSnap.forEach((doc) => {
            const data = doc.data();
            if (data.email)
                adminEmails.push(data.email);
            adminIds.push(doc.id);
        });
    }
    if (adminEmails.length === 0) {
        adminEmails.push(systemOwnerEmail);
    }
    try {
        // Mail to user
        await (0, mailer_1.sendMail)({
            to: email,
            subject: "Security Alert: Failed Login Attempt",
            html: (0, mailer_1.renderEmail)({
                heading: "Failed Login Attempt",
                paragraphs: [
                    `Hello ${userProfile.displayName || "User"},`,
                    "We detected a failed login attempt on your account.",
                    "If this was you, please verify your credentials and try again.",
                    "If this was not you, someone else may be trying to access your account. Please notify your organization administrator immediately.",
                    `Time of attempt: ${new Date().toUTCString()}`
                ],
                footnote: "This is an automated security alert to protect your account."
            })
        });
        // Mail to owner(s)
        await (0, mailer_1.sendMail)({
            to: adminEmails,
            subject: "Security Alert: Unauthorized Login Attempt",
            html: (0, mailer_1.renderEmail)({
                heading: "Unauthorized Login Attempt",
                paragraphs: [
                    "An unauthorized login attempt was detected for a user in your organization.",
                    `User Email: ${email}`,
                    `User Name: ${userProfile.displayName || "Unknown"}`,
                    `Time of attempt: ${new Date().toUTCString()}`,
                    "Please verify if this account is secure and take action if necessary."
                ],
                footnote: "This is an automated security alert."
            })
        });
        // Create in-app notifications for resolved admins
        if (activeTenantId && adminIds.length > 0) {
            for (const adminId of adminIds) {
                try {
                    await createNotification(activeTenantId, adminId, "security.alert", "Unauthorized Login Attempt", `An unauthorized login attempt was detected for user ${userProfile.displayName || email} (${email}).`, "/users");
                }
                catch (notifErr) {
                    functions.logger.error(`[reportFailedLogin] failed to create notification for admin ${adminId}`, notifErr);
                }
            }
        }
    }
    catch (err) {
        functions.logger.error("[reportFailedLogin] failed to send security emails", err);
    }
    return { success: true, type: "unauthorized" };
});
/**
 * 2g. HTTPS HTTP endpoint: Report a failed login attempt (for emulator and direct calls).
 */
exports.reportFailedLoginHttp = functions.https.onRequest(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Vary", "Origin");
    if (req.method === "OPTIONS") {
        res.status(204).end();
        return;
    }
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }
    try {
        const { email, attemptedTenantId } = req.body || {};
        if (!email) {
            res.status(400).json({ error: "Email is required." });
            return;
        }
        const trimmedEmail = String(email).trim().toLowerCase();
        // 1. Check if user exists in Firestore
        const usersSnap = await db.collection("users").where("email", "==", trimmedEmail).limit(1).get();
        const systemOwnerEmail = process.env.SUPPORT_EMAIL || "support@hrms-ats.app";
        if (usersSnap.empty) {
            // Unauthenticated
            await (0, mailer_1.sendMail)({
                to: systemOwnerEmail,
                subject: `Failed Login Attempt: Unregistered Email`,
                html: (0, mailer_1.renderEmail)({
                    heading: "Unregistered Login Attempt",
                    paragraphs: [
                        `A login attempt was made using an unregistered email address: ${trimmedEmail}.`,
                        "This email is not associated with any account in the system.",
                        `Time of attempt: ${new Date().toUTCString()}`
                    ],
                    footnote: "This is an automated security alert."
                })
            });
            res.status(200).json({ success: true, type: "unauthenticated" });
            return;
        }
        // Unauthorized
        const userDoc = usersSnap.docs[0];
        const userProfile = userDoc.data();
        const activeTenantId = attemptedTenantId || userProfile.activeTenantId || Object.keys(userProfile.tenants || {})[0];
        const adminEmails = [];
        const adminIds = [];
        if (activeTenantId) {
            const adminsSnap = await db
                .collection("users")
                .where(`tenants.${activeTenantId}.role`, "in", ["org_admin", "super_admin"])
                .get();
            adminsSnap.forEach((doc) => {
                const data = doc.data();
                if (data.email)
                    adminEmails.push(data.email);
                adminIds.push(doc.id);
            });
        }
        if (adminEmails.length === 0) {
            adminEmails.push(systemOwnerEmail);
        }
        // Mail to user
        await (0, mailer_1.sendMail)({
            to: trimmedEmail,
            subject: "Security Alert: Failed Login Attempt",
            html: (0, mailer_1.renderEmail)({
                heading: "Failed Login Attempt",
                paragraphs: [
                    `Hello ${userProfile.displayName || "User"},`,
                    "We detected a failed login attempt on your account.",
                    "If this was you, please verify your credentials and try again.",
                    "If this was not you, someone else may be trying to access your account. Please notify your organization administrator immediately.",
                    `Time of attempt: ${new Date().toUTCString()}`
                ],
                footnote: "This is an automated security alert to protect your account."
            })
        });
        // Mail to owner(s)
        await (0, mailer_1.sendMail)({
            to: adminEmails,
            subject: "Security Alert: Unauthorized Login Attempt",
            html: (0, mailer_1.renderEmail)({
                heading: "Unauthorized Login Attempt",
                paragraphs: [
                    "An unauthorized login attempt was detected for a user in your organization.",
                    `User Email: ${trimmedEmail}`,
                    `User Name: ${userProfile.displayName || "Unknown"}`,
                    `Time of attempt: ${new Date().toUTCString()}`,
                    "Please verify if this account is secure and take action if necessary."
                ],
                footnote: "This is an automated security alert."
            })
        });
        // Create in-app notifications for resolved admins
        if (activeTenantId && adminIds.length > 0) {
            for (const adminId of adminIds) {
                try {
                    await createNotification(activeTenantId, adminId, "security.alert", "Unauthorized Login Attempt", `An unauthorized login attempt was detected for user ${userProfile.displayName || trimmedEmail} (${trimmedEmail}).`, "/users");
                }
                catch (notifErr) {
                    functions.logger.error(`[reportFailedLoginHttp] failed to create notification for admin ${adminId}`, notifErr);
                }
            }
        }
        res.status(200).json({ success: true, type: "unauthorized" });
    }
    catch (err) {
        functions.logger.error("[reportFailedLoginHttp] failed", err);
        res.status(500).json({ error: String(err?.message || err) });
    }
});
/**
 * Resolve organization branding name.
 */
async function getTenantName(tenantId) {
    try {
        const snap = await db.collection("tenants").doc(tenantId).get();
        return snap.data()?.name || "our company";
    }
    catch {
        return "our company";
    }
}
/**
 * Format timestamps into readable localized datetime strings.
 */
function formatWhen(ms) {
    try {
        return new Date(ms).toLocaleString("en-US", {
            dateStyle: "full",
            timeStyle: "short",
        });
    }
    catch {
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
exports.submitApplication = functions.runWith({ secrets: mailer_1.MAIL_SECRETS, enforceAppCheck: ENFORCE_APP_CHECK }).https.onCall(async (data) => {
    const { tenantId, jobId, firstName, lastName, email, phone, linkedinUrl, coverLetter, resumeUrl, resumePath, } = data || {};
    if (!tenantId || !jobId || !firstName || !lastName || !email) {
        throw new functions.https.HttpsError("invalid-argument", "Missing required fields: tenantId, jobId, firstName, lastName, email.");
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
    const job = jobSnap.data();
    if (job.tenantId !== tenantId || !job.isPublished || job.status !== "open") {
        throw new functions.https.HttpsError("failed-precondition", "This position is not accepting applications.");
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
        throw new functions.https.HttpsError("already-exists", "You have already applied to this position with this email address.");
    }
    const now = Date.now();
    const candidateId = `cand_${Math.random().toString(36).substring(2, 9)}_${now}`;
    const stage = job.pipelineStages?.[0] || "Applied";
    const candidate = {
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
    if (phone)
        candidate.phone = phone;
    if (linkedinUrl)
        candidate.linkedinUrl = linkedinUrl;
    if (coverLetter)
        candidate.coverLetter = coverLetter;
    if (resumeUrl)
        candidate.resumeUrl = resumeUrl;
    if (resumePath)
        candidate.resumePath = resumePath;
    await db.collection("candidates").doc(candidateId).set(candidate);
    // Send application confirmation receipt
    try {
        const organizationName = await getTenantName(tenantId);
        await (0, mailer_1.sendApplicationReceivedEmail)({
            to: email,
            candidateName: firstName,
            jobTitle: job.title,
            organizationName,
        });
    }
    catch (err) {
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
exports.onCandidateUpdated = functions
    .runWith({ secrets: mailer_1.MAIL_SECRETS })
    .firestore.document("candidates/{id}")
    .onUpdate(async (change) => {
    const before = change.before.data();
    const after = change.after.data();
    if (!after?.email)
        return;
    const organizationName = await getTenantName(after.tenantId);
    const candidateName = after.firstName || "there";
    try {
        if (after.status === "rejected" && before.status !== "rejected") {
            await (0, mailer_1.sendRejectionEmail)({
                to: after.email,
                candidateName,
                jobTitle: after.jobTitle || "the role",
                organizationName,
            });
        }
        else if (after.stage !== before.stage && after.status === "active") {
            await (0, mailer_1.sendStatusUpdateEmail)({
                to: after.email,
                candidateName,
                jobTitle: after.jobTitle || "the role",
                organizationName,
                stage: after.stage,
            });
        }
    }
    catch (err) {
        functions.logger.error("[onCandidateUpdated] email failed", { id: after.id, error: err });
    }
});
/**
 * 5. Firestore Event Trigger: fires when an offer document is updated.
 * Automatically alerts candidates when their status changes to "sent".
 */
exports.onOfferUpdated = functions
    .runWith({ secrets: mailer_1.MAIL_SECRETS })
    .firestore.document("offers/{id}")
    .onUpdate(async (change) => {
    const before = change.before.data();
    const after = change.after.data();
    if (!after)
        return;
    if (after.status === "sent" && before.status !== "sent" && after.candidateEmail) {
        try {
            const organizationName = await getTenantName(after.tenantId);
            await (0, mailer_1.sendOfferEmail)({
                to: after.candidateEmail,
                candidateName: after.candidateName || "there",
                jobTitle: after.jobTitle || "the role",
                organizationName,
                salary: after.salary || 0,
                currency: after.currency || "USD",
                startDate: after.startDate || "TBD",
                viewUrl: `${(0, mailer_1.getAppUrl)()}/login`,
            });
        }
        catch (err) {
            functions.logger.error("[onOfferUpdated] offer email failed", { id: after.id, error: err });
        }
    }
});
/**
 * 6. Firestore Event Trigger: fires when a new interview document is created.
 * Automatically alerts candidates and designated team interviewers.
 */
exports.onInterviewCreated = functions
    .runWith({ secrets: mailer_1.MAIL_SECRETS })
    .firestore.document("interviews/{id}")
    .onCreate(async (snap) => {
    const interview = snap.data();
    if (!interview)
        return;
    const organizationName = await getTenantName(interview.tenantId);
    const whenText = formatWhen(interview.scheduledAt);
    const interviewerEmails = Array.isArray(interview.interviewerEmails)
        ? interview.interviewerEmails
        : [];
    try {
        // Send interview details to interviewer group
        if (interviewerEmails.length > 0) {
            await (0, mailer_1.sendInterviewInviteEmail)({
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
        const candEmail = candSnap.data()?.email;
        const candName = candSnap.data()?.firstName || interview.candidateName;
        if (candEmail) {
            await (0, mailer_1.sendInterviewInviteEmail)({
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
    }
    catch (err) {
        functions.logger.error("[onInterviewCreated] invite email failed", { id: interview.id, error: err });
    }
});
/**
 * 7. Firestore Event Trigger: fires when a job requisition document is written.
 * Manages approval-workflow steps and notifies creators or current approvers:
 * - Alerts creator on approve / reject / publish updates.
 * - Alerts active designated approver when jobs are submitted or transitioned to pending approval.
 */
exports.onJobUpdated = functions
    .runWith({ secrets: mailer_1.MAIL_SECRETS })
    .firestore.document("jobs/{id}")
    .onWrite(async (change) => {
    const after = change.after.exists ? change.after.data() : null;
    if (!after)
        return; // Deleted
    const before = change.before.exists ? change.before.data() : null;
    const beforeStatus = before?.status;
    const tenantId = after.tenantId;
    const link = "/jobs";
    const notifyCreator = async (type, title, body) => {
        const u = await resolveUser(after.createdBy);
        await notifyUser(tenantId, after.createdBy, u?.email, u?.name, type, title, body, link);
    };
    if (after.status === "approved" && beforeStatus !== "approved") {
        await notifyCreator("job.approved", "Job requisition approved", `Your requisition "${after.title}" has been approved.`);
    }
    else if (after.status === "rejected" && beforeStatus !== "rejected") {
        await notifyCreator("job.rejected", "Job requisition rejected", `Your requisition "${after.title}" was rejected.`);
    }
    else if (after.status === "open" && beforeStatus !== "open") {
        await notifyCreator("job.published", "Job requisition published", `Your requisition "${after.title}" is now live on the careers page.`);
    }
    // Advancing through pending approvals -> alert the next approver
    const beforeStep = before?.approval?.currentStep ?? -1;
    const afterStep = after.approval?.currentStep ?? -1;
    const becamePending = after.status === "pending_approval" &&
        (beforeStatus !== "pending_approval" || afterStep > beforeStep);
    if (becamePending) {
        const approver = after.approval?.steps?.[afterStep];
        if (approver?.approverId) {
            await notifyUser(tenantId, approver.approverId, approver.approverEmail, approver.approverName, "approval.requested", "Approval requested", `The requisition "${after.title}" needs your approval.`, link);
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
    .runWith({ secrets: mailer_1.MAIL_SECRETS })
    .firestore.document("leaveRequests/{id}")
    .onWrite(async (change) => {
    const after = change.after.exists ? change.after.data() : null;
    if (!after)
        return; // Deleted
    const before = change.before.exists ? change.before.data() : null;
    const beforeStatus = before?.status;
    const tenantId = after.tenantId;
    const link = "/leave";
    // Reconcile and adjust employee leave balance
    try {
        await settleLeaveBalance(before, after);
    }
    catch (err) {
        functions.logger.error("[onLeaveRequestUpdated] balance settle failed", { id: after.id, error: String(err) });
    }
    const notifyRequester = async (type, title, body) => {
        const u = await resolveUser(after.createdBy);
        await notifyUser(tenantId, after.createdBy, u?.email, u?.name, type, title, body, link);
    };
    if (after.status === "approved" && beforeStatus !== "approved") {
        await notifyRequester("leave.approved", "Leave approved", `Your ${after.leaveTypeName || "leave"} request (${after.startDate} → ${after.endDate}) has been approved.`);
    }
    else if (after.status === "rejected" && beforeStatus !== "rejected") {
        await notifyRequester("leave.rejected", "Leave rejected", `Your ${after.leaveTypeName || "leave"} request (${after.startDate} → ${after.endDate}) was rejected.`);
    }
    // Progression of approval queues -> alert next queue manager
    const beforeStep = before?.approval?.currentStep ?? -1;
    const afterStep = after.approval?.currentStep ?? -1;
    const becamePending = after.status === "pending" &&
        (beforeStatus !== "pending" || afterStep > beforeStep);
    if (becamePending) {
        const approver = after.approval?.steps?.[afterStep];
        if (approver?.approverId) {
            await notifyUser(tenantId, approver.approverId, approver.approverEmail, approver.approverName, "approval.requested", "Leave approval requested", `${after.employeeName || "An employee"} requested ${after.leaveTypeName || "leave"} (${after.startDate} → ${after.endDate}).`, link);
        }
    }
});
exports.onLeaveRequestUpdated = onLeaveRequestUpdated;
// Provide default export for the last export function, satisfying the requirement
exports.default = onLeaveRequestUpdated;
//# sourceMappingURL=index.js.map