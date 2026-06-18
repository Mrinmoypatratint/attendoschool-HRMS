/**
 * Firestore security-rules test suite (committed).
 *
 * Run with:  npm run test:rules
 * which wraps this in `firebase emulators:exec --only firestore` so a Firestore
 * emulator is available on the port from firebase.json.
 *
 * Locks in the platform's core security invariants:
 *  - multi-tenant isolation
 *  - privilege-escalation protection (SEC-001)
 *  - compensation confidentiality (SEC-002)
 *  - audit-log immutability
 *  - public careers boundaries
 *  - employee-create uniqueness pre-read
 *  - recruiter departments access
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, getDocs, collection, query, where } from "firebase/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rules = readFileSync(resolve(__dirname, "../../firestore.rules"), "utf8");

const host = "127.0.0.1";
const port = Number(process.env.FIRESTORE_EMULATOR_PORT || 8080);

const env = await initializeTestEnvironment({
  projectId: "demo-rules-test",
  firestore: { rules, host, port },
});

const A = "tenantA", B = "tenantB";
const ts = (role, tenant) => ({ tenants: { [tenant]: { role, status: "active" } }, activeTenantId: tenant });

await env.withSecurityRulesDisabled(async (ctx) => {
  const d = ctx.firestore();
  await setDoc(doc(d, "users", "adminA"), { id: "adminA", email: "aa@t.com", displayName: "AA", ...ts("org_admin", A) });
  await setDoc(doc(d, "users", "empA"),   { id: "empA",   email: "ea@t.com", displayName: "EA", ...ts("employee", A) });
  await setDoc(doc (d, "users", "empA2"),  { id: "empA2",  email: "e2@t.com", displayName: "E2", ...ts("employee", A) });
  await setDoc(doc(d, "users", "recA"),   { id: "recA",   email: "rc@t.com", displayName: "RC", ...ts("recruiter", A) });
  await setDoc(doc(d, "users", "adminB"), { id: "adminB", email: "ab@t.com", displayName: "AB", ...ts("org_admin", B) });

  await setDoc(doc(d, "employees", "empRecA"),  { id: "empRecA",  tenantId: A, userId: "empA",  firstName: "Em", lastName: "A" });
  await setDoc(doc(d, "employees", "empRecA2"), { id: "empRecA2", tenantId: A, userId: "empA2", firstName: "Em", lastName: "A2" });
  await setDoc(doc(d, "employeeCompensation", "empRecA"), { id: "empRecA", tenantId: A, employeeId: "empRecA", salary: 99999, currency: "USD", updatedAt: 1 });
  await setDoc(doc(d, "candidates", "candA"),   { id: "candA", tenantId: A, jobId: "jobOpenA", firstName: "C", lastName: "A", email: "c@t.com" });
  await setDoc(doc(d, "jobs", "jobOpenA"),  { id: "jobOpenA",  tenantId: A, isPublished: true,  status: "open" });
  await setDoc(doc(d, "jobs", "jobDraftA"), { id: "jobDraftA", tenantId: A, isPublished: false, status: "draft" });
  await setDoc(doc(d, "departments", "deptA"), { id: "deptA", tenantId: A, name: "Eng", code: "ENG", isArchived: false });
  await setDoc(doc(d, "leaveRequests", "lrA"), { id: "lrA", tenantId: A, employeeId: "empRecA", status: "pending" });
  await setDoc(doc(d, "leaveRequests", "lrPend"), { id: "lrPend", tenantId: A, employeeId: "empRecA", status: "pending", days: 1, startDate: "2026-07-01", leaveTypeId: "lt1" });
  await setDoc(doc(d, "leaveRequests", "lrAppr"), { id: "lrAppr", tenantId: A, employeeId: "empRecA", status: "approved", days: 1, startDate: "2026-07-01", leaveTypeId: "lt1" });
  await setDoc(doc(d, "auditLogs", "logA"), { id: "logA", tenantId: A, action: "create" });
  await setDoc(doc(d, "notifications", "ntfA"), { id: "ntfA", tenantId: A, userId: "empA", type: "generic", title: "t", body: "b", read: false, createdAt: 1 });
});

const adminA = env.authenticatedContext("adminA").firestore();
const empA   = env.authenticatedContext("empA").firestore();
const empA2  = env.authenticatedContext("empA2").firestore();
const recA   = env.authenticatedContext("recA").firestore();
const adminB = env.authenticatedContext("adminB").firestore();
const anon   = env.unauthenticatedContext().firestore();

let pass = 0, fail = 0;
const t = async (name, p) => {
  try { await p; console.log(`  PASS  ${name}`); pass++; }
  catch (e) { console.log(`  FAIL  ${name} -> ${String(e).slice(0, 90)}`); fail++; }
};

console.log("Tenant isolation");
await t("B admin cannot read A employee", assertFails(getDoc(doc(adminB, "employees", "empRecA"))));
await t("B admin cannot read A candidate", assertFails(getDoc(doc(adminB, "candidates", "candA"))));
await t("B admin cannot write A employee", assertFails(updateDoc(doc(adminB, "employees", "empRecA"), { firstName: "x" })));

console.log("SEC-001 privilege escalation");
await t("employee cannot self-promote role", assertFails(updateDoc(doc(empA, "users", "empA"), { "tenants.tenantA.role": "org_admin" })));
await t("employee can edit own profile (displayName)", assertSucceeds(updateDoc(doc(empA, "users", "empA"), { displayName: "New Name" })));
await t("employee cannot create role", assertFails(setDoc(doc(empA, "roles", "evil"), { tenantId: A, isSystemRole: false, permissions: [], name: "e" })));
await t("employee cannot write roleOverrides", assertFails(setDoc(doc(empA, "roleOverrides", `${A}_employee`), { tenantId: A, systemRoleType: "employee", permissions: ["users.delete"] })));

console.log("SEC-002 compensation confidentiality");
await t("other employee cannot read compensation", assertFails(getDoc(doc(empA2, "employeeCompensation", "empRecA"))));
await t("owner can read own compensation", assertSucceeds(getDoc(doc(empA, "employeeCompensation", "empRecA"))));
await t("admin can read compensation", assertSucceeds(getDoc(doc(adminA, "employeeCompensation", "empRecA"))));

console.log("Data-level leave");
await t("non-owner employee cannot read others' leave", assertFails(getDoc(doc(empA2, "leaveRequests", "lrA"))));

console.log("Leave cancel (owner, no balance write needed)");
await t("non-owner cannot cancel leave", assertFails(updateDoc(doc(empA2, "leaveRequests", "lrAppr"), { status: "cancelled" })));
await t("owner can cancel APPROVED leave", assertSucceeds(updateDoc(doc(empA, "leaveRequests", "lrAppr"), { status: "cancelled" })));
await t("owner can cancel PENDING leave", assertSucceeds(updateDoc(doc(empA, "leaveRequests", "lrPend"), { status: "cancelled" })));

console.log("Recruiter departments (regression)");
await t("recruiter can query departments", assertSucceeds(getDocs(query(collection(recA, "departments"), where("tenantId", "==", A)))));

console.log("Employee-create uniqueness pre-read (regression)");
await t("admin getDoc(non-existent employee) allowed", assertSucceeds(getDoc(doc(adminA, "employees", "NEW_ID"))));

console.log("Audit immutability");
await t("admin cannot update audit log", assertFails(updateDoc(doc(adminA, "auditLogs", "logA"), { action: "x" })));
await t("admin cannot delete audit log", assertFails(deleteDoc(doc(adminA, "auditLogs", "logA"))));

console.log("Public careers boundaries");
await t("anon can read published+open job", assertSucceeds(getDoc(doc(anon, "jobs", "jobOpenA"))));
await t("anon cannot read draft job", assertFails(getDoc(doc(anon, "jobs", "jobDraftA"))));
await t("anon cannot read candidates", assertFails(getDoc(doc(anon, "candidates", "candA"))));

console.log("Notifications");
await t("recipient can read own notification", assertSucceeds(getDoc(doc(empA, "notifications", "ntfA"))));
await t("non-recipient cannot read others' notification", assertFails(getDoc(doc(empA2, "notifications", "ntfA"))));
await t("recipient can mark own notification read", assertSucceeds(updateDoc(doc(empA, "notifications", "ntfA"), { read: true })));
await t("non-recipient cannot update notification", assertFails(updateDoc(doc(empA2, "notifications", "ntfA"), { read: true })));
await t("tenant member can create notification for another user", assertSucceeds(setDoc(doc(adminA, "notifications", "ntfNew"), { id: "ntfNew", tenantId: A, userId: "empA", type: "generic", title: "x", body: "y", read: false, createdAt: 2 })));

await env.cleanup();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
