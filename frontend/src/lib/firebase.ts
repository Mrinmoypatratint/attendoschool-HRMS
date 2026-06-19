/**
 * firebase.ts
 * -----------
 * Initializes the shared Firebase singletons (App, Auth, Firestore, Storage,
 * Functions, App Check) used throughout the frontend, and wires up emulator
 * connections when running locally.
 *
 * IMPORTANT: This module is side-effecting. Importing it triggers
 * `initializeApp` and emulator wiring exactly once. Initialization order and
 * configuration values must not be changed.
 */
import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getFunctions, type Functions } from "firebase/functions";
import { connectAuthEmulator } from "firebase/auth";
import { connectFirestoreEmulator } from "firebase/firestore";
import { connectStorageEmulator } from "firebase/storage";
import { connectFunctionsEmulator } from "firebase/functions";

// Project configuration sourced from Vite build-time env vars (VITE_*).
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
};

import { initializeAppCheck, ReCaptchaV3Provider, type AppCheck } from "firebase/app-check";

const app: FirebaseApp = initializeApp(firebaseConfig);

/**
 * Initialize App Check only for real (non-emulator) usage.
 * In emulator mode, App Check frequently causes preflight/token-exchange
 * issues that break callable requests from the browser.
 */
let appCheck: AppCheck | undefined = undefined;
if (typeof window !== "undefined" && import.meta.env.VITE_USE_EMULATOR !== "true") {
  // Enable self debug token for local non-emulator development
  // (not applied when VITE_USE_EMULATOR === "true")
  (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;

  appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(
      import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
    ),
    isTokenAutoRefreshEnabled: true,
  });
}

/** App Check instance (browser only); `undefined` in non-window environments. */
export { appCheck };
/** Firebase Authentication service singleton. */
export const auth: Auth = getAuth(app);
/** Cloud Firestore database singleton. */
export const db: Firestore = getFirestore(app);
/** Cloud Storage service singleton. */
export const storage: FirebaseStorage = getStorage(app);
/** Callable Cloud Functions service singleton. */
export const functions: Functions = getFunctions(app);

// Google provider for SSO login. "prompt: select_account" forces the
// account chooser every time instead of silently reusing the last session.
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

if (import.meta.env.VITE_USE_EMULATOR === "true") {
  const host = "127.0.0.1";

  // Auth emulator is DISABLED by default so that Google OAuth popup works
  // against real Firebase. Enable it only if you explicitly set
  // VITE_USE_AUTH_EMULATOR=true (useful for email/password-only testing).
  if (import.meta.env.VITE_USE_AUTH_EMULATOR === "true") {
    connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
  }

  connectFirestoreEmulator(db, host, 8080);
  connectStorageEmulator(storage, host, 9199);
  connectFunctionsEmulator(functions, host, 5001);
}
