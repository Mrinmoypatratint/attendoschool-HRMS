/**
 * errors.ts
 * ---------
 * Centralized translation of low-level / vendor error codes into clear,
 * human-readable messages for display in the UI.
 *
 * Why: Firebase (Auth, Firestore, Storage, Functions) surfaces errors as
 * machine codes such as `permission-denied`, `auth/wrong-password`,
 * `storage/unauthorized`, or raw strings like
 * "PERMISSION_DENIED: evaluation error ...". Showing these to end users is
 * confusing. Every user-facing catch block should funnel its error through
 * `getFriendlyErrorMessage` so the UI only ever displays plain language.
 *
 * Usage:
 *   } catch (err) {
 *     setError(getFriendlyErrorMessage(err, "Failed to save changes."));
 *   }
 *
 * The optional `fallback` is shown when the error isn't a recognized code.
 * It should itself be a friendly, context-specific sentence.
 */

/** Generic last-resort message used when no friendlier text can be derived. */
const DEFAULT_FALLBACK = "Something went wrong. Please try again.";

/**
 * Map of known error codes -> friendly messages.
 * Keys are normalized to lowercase. Both prefixed (e.g. `auth/wrong-password`,
 * `storage/unauthorized`) and bare Firestore codes (e.g. `permission-denied`)
 * are supported.
 */
const CODE_MESSAGES: Record<string, string> = {
  // ---- Firebase Auth -----------------------------------------------------
  "auth/invalid-email": "That email address doesn't look valid.",
  "auth/user-disabled": "This account has been disabled. Please contact your administrator.",
  "auth/user-not-found": "We couldn't find an account with those details.",
  "auth/wrong-password": "The email or password is incorrect.",
  "auth/invalid-credential": "The email or password is incorrect.",
  "auth/invalid-login-credentials": "The email or password is incorrect.",
  "auth/email-already-in-use": "An account with this email already exists. Try signing in instead.",
  "auth/weak-password": "Please choose a stronger password (at least 6 characters).",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
  "auth/network-request-failed": "Network error. Please check your internet connection and try again.",
  "auth/popup-closed-by-user": "Sign-in was cancelled.",
  "auth/cancelled-popup-request": "Sign-in was cancelled.",
  "auth/popup-blocked": "Your browser blocked the sign-in popup. Please allow popups and try again.",
  "auth/requires-recent-login": "For your security, please sign in again to complete this action.",
  "auth/operation-not-allowed": "This sign-in method isn't enabled. Please contact your administrator.",
  "auth/expired-action-code": "This link has expired. Please request a new one.",
  "auth/invalid-action-code": "This link is invalid or has already been used.",
  "auth/missing-password": "Please enter your password.",
  "auth/internal-error": "Something went wrong while signing in. Please try again.",

  // ---- Firestore ---------------------------------------------------------
  "permission-denied": "You don't have permission to do this. Please contact your administrator if you think this is a mistake.",
  "unauthenticated": "Your session has expired. Please sign in again.",
  "not-found": "The requested item could not be found. It may have been deleted.",
  "already-exists": "This item already exists.",
  "unavailable": "The service is temporarily unavailable. Please try again in a moment.",
  "deadline-exceeded": "The request took too long. Please check your connection and try again.",
  "resource-exhausted": "You've reached a usage limit. Please try again later.",
  "cancelled": "The operation was cancelled.",
  "failed-precondition": "This action can't be completed right now. Please refresh and try again.",
  "aborted": "Your change conflicted with another update. Please refresh and try again.",
  "out-of-range": "Some of the information provided is out of the allowed range.",
  "invalid-argument": "Some of the information provided is invalid. Please review and try again.",
  "data-loss": "Something went wrong and the data could not be processed. Please try again.",
  "internal": "Something went wrong on our end. Please try again.",
  "unknown": "An unexpected error occurred. Please try again.",

  // ---- Firebase Storage --------------------------------------------------
  "storage/unauthorized": "You don't have permission to access this file.",
  "storage/unauthenticated": "Your session has expired. Please sign in again.",
  "storage/canceled": "The upload was cancelled.",
  "storage/retry-limit-exceeded": "The upload timed out. Please check your connection and try again.",
  "storage/object-not-found": "The file could not be found. It may have been deleted.",
  "storage/quota-exceeded": "Storage limit reached. Please contact your administrator.",
  "storage/invalid-checksum": "The file got corrupted during upload. Please try uploading it again.",
  "storage/server-file-wrong-size": "The upload didn't complete correctly. Please try again.",
  "storage/unknown": "Something went wrong with the file. Please try again.",

  // ---- Cloud Functions (callable) ---------------------------------------
  "functions/permission-denied": "You don't have permission to do this.",
  "functions/unauthenticated": "Your session has expired. Please sign in again.",
  "functions/not-found": "The requested action is unavailable.",
  "functions/deadline-exceeded": "The request took too long. Please try again.",
  "functions/unavailable": "The service is temporarily unavailable. Please try again in a moment.",
  "functions/internal": "Something went wrong on our end. Please try again.",
};

/** Extract a vendor error code (e.g. `auth/wrong-password`, `permission-denied`) if present. */
function extractCode(err: unknown): string | null {
  if (err && typeof err === "object" && "code" in err) {
    const code = (err as { code?: unknown }).code;
    if (typeof code === "string" && code.trim()) return code.trim().toLowerCase();
  }
  return null;
}

/** Extract a raw message string from an unknown error value. */
function extractRawMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === "string") return msg;
  }
  return "";
}

/**
 * Heuristic: does this string look like a raw/technical error rather than a
 * sentence written for humans? We avoid surfacing such strings directly.
 */
function looksTechnical(message: string): boolean {
  const m = message.trim();
  if (!m) return true;
  return (
    m.includes("Firebase:") ||
    /\b[a-z]+\/[a-z0-9-]+\b/.test(m) ||              // service/code style (auth/…, storage/…)
    /\b[A-Z][A-Z0-9_]{3,}\b/.test(m) ||             // SCREAMING_SNAKE codes (PERMISSION_DENIED)
    /evaluation error|rules|denied by|at L\d+/i.test(m) || // security-rule internals
    /\b(null|undefined|NaN)\b/.test(m) ||
    m.includes("at <") || m.includes("\n at ")      // stack-ish
  );
}

/**
 * Translate any caught error into a clear, human-readable message.
 *
 * Resolution order:
 *  1. Known vendor code -> mapped friendly message.
 *  2. Unknown vendor code (has a `code` but unmapped) -> the provided fallback.
 *  3. No code, but a message that reads like a human sentence -> that message
 *     (covers intentionally friendly errors thrown by our own services).
 *  4. Otherwise -> the provided fallback.
 *
 * Raw/technical strings are never returned.
 */
export function getFriendlyErrorMessage(err: unknown, fallback: string = DEFAULT_FALLBACK): string {
  const code = extractCode(err);
  if (code) {
    const mapped = CODE_MESSAGES[code];
    if (mapped) return mapped;
    // Some Firestore errors arrive with the code embedded in the message only.
    const raw = extractRawMessage(err).toLowerCase();
    for (const key of Object.keys(CODE_MESSAGES)) {
      if (raw.includes(key)) {
        const byKey = CODE_MESSAGES[key];
        if (byKey) return byKey;
      }
    }
    return fallback;
  }

  const raw = extractRawMessage(err);
  if (raw && !looksTechnical(raw)) {
    // An app-thrown Error with a human-friendly message — keep it.
    return raw;
  }

  return fallback;
}
