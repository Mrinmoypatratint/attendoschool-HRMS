/*
 * Demo seed script for the Firebase EMULATOR suite.
 *
 * Creates 5 role-based demo login accounts, a demo tenant/org, departments,
 * job requisitions (incl. a published one + one pending approval), and a
 * pipeline of candidates with notes / interviews / offers so every ATS screen
 * has data to show.
 *
 * Usage (with `firebase emulators:start` running in another terminal):
 *   node backend/seed-demo.cjs
 *   (or from repo root: npm run seed)
 *
 * SAFETY: this script refuses to run unless it is pointed at the emulators,
 * so it can never touch a real project's Auth or Firestore.
 *
 * CLEAN + RE-SEED (dev):
 * - Stop emulators (Ctrl+C)
 * - Delete emulator local state (see below) OR run with a fresh volume.
 * - Start emulators again, then re-run this script.
 *
 * Example:
 *   node backend/seed-demo.cjs
 *
 * Notes (optional):
 * - If you're using Firebase emulator, you can also wipe local emulator data
 *   by deleting your emulator data directory (commonly in a `.firebase` folder)
 *   before re-seeding.
 */
const admin = require("firebase-admin");

// --- Force emulator targets (never touch production) ---
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";

const PROJECT_ID = process.env.GCLOUD_PROJECT || "demo-mock-project";

if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  console.error("Refusing to run: emulator host env vars are not set.");
  process.exit(1);
}

admin.initializeApp({ projectId: PROJECT_ID });
const db = admin.firestore();
const auth = admin.auth();

const TENANT_ID = "tenant_demo";
const PASSWORD = "Demo@1234";
const now = Date.now();

const DEMO_USERS = [
  { uid: "demo_super_admin", email: "superadmin@demo.io", displayName: "Sasha Super", role: "super_admin" },
  { uid: "demo_org_admin", email: "orgadmin@demo.io", displayName: "Olivia Owner", role: "org_admin" },
  { uid: "demo_hr_manager", email: "hr@demo.io", displayName: "Hina HR", role: "hr_manager" },
  { uid: "demo_recruiter", email: "recruiter@demo.io", displayName: "Ravi Recruiter", role: "recruiter" },
  { uid: "demo_employee", email: "employee@demo.io", displayName: "Eli Employee", role: "employee" },
];

async function createAuthUser(u) {
  try {
    // 1. Try to find the user by email
    const existingUser = await auth.getUserByEmail(u.email);
    if (existingUser.uid === u.uid) {
      // Correct UID, just update details
      await auth.updateUser(u.uid, { password: PASSWORD, displayName: u.displayName });
      console.log(`  ↻ updated auth user ${u.email}`);
      return;
    } else {
      // Wrong UID associated with this email. Delete the old user to free up the email.
      console.log(`  ⚠ deleting existing auth user ${u.email} (old UID: ${existingUser.uid})`);
      await auth.deleteUser(existingUser.uid);
    }
  } catch (err) {
    // User does not exist with this email, proceed to UID check
  }

  // 2. Try to find by UID
  try {
    const existingUserById = await auth.getUser(u.uid);
    // User exists with this UID, update details (including email)
    await auth.updateUser(u.uid, { email: u.email, password: PASSWORD, displayName: u.displayName });
    console.log(`  ↻ updated auth user ${u.email} (by UID)`);
  } catch (err) {
    // User does not exist with either email or UID, create fresh
    await auth.createUser({
      uid: u.uid,
      email: u.email,
      password: PASSWORD,
      displayName: u.displayName,
      emailVerified: true,
    });
    console.log(`  ✓ created auth user ${u.email}`);
  }
}

async function seed() {
  console.log(`Seeding demo data into emulator project "${PROJECT_ID}"…\n`);

  // 1. Tenant
  await db.collection("tenants").doc(TENANT_ID).set({
    id: TENANT_ID,
    name: "Pravaah Consulting",
    industry: "Technology",
    timezone: "GMT+5:30",
    address: "123 Demo Street, Bengaluru",
    logoURL: null,
    primaryColor: "#2563eb",
    supportEmail: "support@demo.io",
    createdAt: now,
    updatedAt: now,
  });
  console.log("✓ tenant");

  // 2. Auth users + profiles
  console.log("Users:");
  for (const u of DEMO_USERS) {
    await createAuthUser(u);
    await db.collection("users").doc(u.uid).set({
      id: u.uid,
      email: u.email,
      displayName: u.displayName,
      photoURL: null,
      createdAt: now,
      updatedAt: now,
      activeTenantId: TENANT_ID,
      tenants: {
        [TENANT_ID]: { role: u.role, status: "active", joinedAt: now },
      },
    });
  }
  console.log("✓ user profiles");

  // 3. Departments
  const departments = [
    { id: "dept_eng", name: "Engineering", code: "ENG", description: "Builds the product" },
    { id: "dept_product", name: "Product", code: "PRD", description: "Owns the roadmap" },
    { id: "dept_sales", name: "Sales", code: "SAL", description: "Drives revenue" },
  ];
  for (const d of departments) {
    await db.collection("departments").doc(d.id).set({ ...d, tenantId: TENANT_ID, createdAt: now, updatedAt: now });
  }
  console.log("✓ departments");

  // 3b. Employee directory records (so all demo users appear in the Employee Directory)
  const employees = [
    { id: "emp_super_admin", userId: "demo_super_admin", firstName: "Sasha",   lastName: "Super",    email: "superadmin@demo.io",  phone: "+1 555 0101", jobTitle: "CTO",                  departmentId: "dept_eng",     managerId: null,              status: "active", startDate: "2024-01-15", workLocation: "Remote" },
    { id: "emp_org_admin",   userId: "demo_org_admin",   firstName: "Olivia",  lastName: "Owner",    email: "orgadmin@demo.io",    phone: "+1 555 0102", jobTitle: "CEO",                  departmentId: "dept_product", managerId: null,              status: "active", startDate: "2024-01-01", workLocation: "Bengaluru HQ" },
    { id: "emp_hr_manager",  userId: "demo_hr_manager",  firstName: "Hina",    lastName: "HR",       email: "hr@demo.io",          phone: "+1 555 0103", jobTitle: "HR Manager",           departmentId: "dept_product", managerId: "emp_org_admin",   status: "active", startDate: "2024-03-01", workLocation: "Bengaluru HQ" },
    { id: "emp_recruiter",   userId: "demo_recruiter",   firstName: "Ravi",    lastName: "Recruiter", email: "recruiter@demo.io",  phone: "+1 555 0104", jobTitle: "Senior Recruiter",     departmentId: "dept_product", managerId: "emp_hr_manager",  status: "active", startDate: "2024-06-01", workLocation: "Remote" },
    { id: "emp_employee",    userId: "demo_employee",    firstName: "Eli",     lastName: "Employee", email: "employee@demo.io",    phone: "+1 555 0105", jobTitle: "Software Engineer",    departmentId: "dept_eng",     managerId: "emp_super_admin", status: "active", startDate: "2025-01-10", workLocation: "Remote" },
  ];
  for (const e of employees) {
    await db.collection("employees").doc(e.id).set({ ...e, tenantId: TENANT_ID, createdAt: now, updatedAt: now });
  }
  console.log("✓ employees");

  // 3c. Compensation records (sensitive, stored separately per SEC-002)
  const compensations = [
    { id: "emp_super_admin", employeeId: "emp_super_admin", salary: 1800000, currency: "INR" },
    { id: "emp_org_admin",   employeeId: "emp_org_admin",   salary: 2400000, currency: "INR" },
    { id: "emp_hr_manager",  employeeId: "emp_hr_manager",  salary: 1000000, currency: "INR" },
    { id: "emp_recruiter",   employeeId: "emp_recruiter",   salary: 750000,  currency: "INR" },
    { id: "emp_employee",    employeeId: "emp_employee",    salary: 850000,  currency: "INR" },
  ];
  for (const c of compensations) {
    await db.collection("employeeCompensation").doc(c.id).set({ ...c, tenantId: TENANT_ID, updatedAt: now });
  }
  console.log("✓ compensation");

  // 4. Jobs (requisitions)
  const defaultStages = ["Applied", "Screening", "Interview", "Offer", "Hired", "Rejected"];
  const noApproval = { required: false, steps: [], currentStep: 0, status: "approved" };

  const jobs = [
    {
      id: "job_demo_fe",
      title: "Senior Frontend Engineer",
      departmentId: "dept_eng",
      location: "Remote",
      workMode: "remote",
      employmentType: "full_time",
      description: "Build delightful, accessible UIs in React + TypeScript.",
      responsibilities: "Own features end to end. Mentor engineers. Improve our design system.",
      requirements: "5+ years React, strong TypeScript, an eye for UX.",
      salaryMin: 800000,
      salaryMax: 1400000,
      currency: "INR",
      openings: 2,
      status: "open",
      isPublished: true,
      pipelineStages: defaultStages,
      approval: noApproval,
      hiringManagerId: "demo_hr_manager",
      createdBy: "demo_recruiter",
    },
    {
      id: "job_demo_pm",
      title: "Product Manager",
      departmentId: "dept_product",
      location: "Bengaluru (Hybrid)",
      workMode: "hybrid",
      employmentType: "full_time",
      description: "Define the product roadmap and ship outcomes customers love.",
      responsibilities: "Discovery, prioritisation, delivery, stakeholder alignment.",
      requirements: "3+ years PM experience in B2B SaaS.",
      salaryMin: 900000,
      salaryMax: 1500000,
      currency: "INR",
      openings: 1,
      status: "pending_approval",
      isPublished: false,
      pipelineStages: defaultStages,
      approval: {
        required: true,
        currentStep: 0,
        status: "pending",
        steps: [
          { approverId: "demo_org_admin", approverEmail: "orgadmin@demo.io", approverName: "Olivia Owner", order: 0, status: "pending" },
        ],
      },
      hiringManagerId: "demo_hr_manager",
      createdBy: "demo_recruiter",
    },
    {
      id: "job_demo_sales",
      title: "Sales Executive",
      departmentId: "dept_sales",
      location: "Mumbai",
      workMode: "onsite",
      employmentType: "full_time",
      description: "Own a pipeline and close enterprise deals.",
      responsibilities: "Prospect, demo, negotiate, close.",
      requirements: "2+ years SaaS sales.",
      currency: "INR",
      openings: 3,
      status: "draft",
      isPublished: false,
      pipelineStages: defaultStages,
      approval: noApproval,
      createdBy: "demo_recruiter",
    },
  ];
  for (const j of jobs) {
    await db.collection("jobs").doc(j.id).set({ ...j, tenantId: TENANT_ID, createdAt: now, updatedAt: now });
  }
  console.log("✓ jobs");

  // 5. Candidates across the pipeline for the published FE job
  const fe = jobs[0];
  const candidateSeeds = [
    { first: "Ada", last: "Lovelace", stage: "Applied", status: "active", source: "careers", rating: 4 },
    { first: "Alan", last: "Turing", stage: "Screening", status: "active", source: "referral", rating: 5 },
    { first: "Grace", last: "Hopper", stage: "Interview", status: "active", source: "linkedin", rating: 5 },
    { first: "Linus", last: "Torvalds", stage: "Offer", status: "active", source: "agency", rating: 4 },
    { first: "Margaret", last: "Hamilton", stage: "Hired", status: "hired", source: "careers", rating: 5 },
    { first: "Dennis", last: "Ritchie", stage: "Rejected", status: "rejected", source: "manual", rating: 2 },
  ];
  const candidateIds = {};
  for (let i = 0; i < candidateSeeds.length; i++) {
    const c = candidateSeeds[i];
    const id = `cand_demo_${i + 1}`;
    candidateIds[c.first] = id;
    await db.collection("candidates").doc(id).set({
      id,
      tenantId: TENANT_ID,
      jobId: fe.id,
      jobTitle: fe.title,
      firstName: c.first,
      lastName: c.last,
      email: `${c.first.toLowerCase()}.${c.last.toLowerCase()}@example.com`,
      phone: "+1 555 0100",
      source: c.source,
      stage: c.stage,
      status: c.status,
      rating: c.rating,
      appliedAt: now - i * 86400000,
      createdAt: now - i * 86400000,
      updatedAt: now,
    });
  }
  console.log("✓ candidates");

  // 6. Notes on a couple of candidates
  await db.collection("candidateNotes").doc("note_demo_1").set({
    id: "note_demo_1",
    tenantId: TENANT_ID,
    candidateId: candidateIds["Grace"],
    authorId: "demo_recruiter",
    authorName: "Ravi Recruiter",
    body: "Excellent systems-design round. Strong communicator. Advancing to onsite.",
    createdAt: now - 3600000,
  });
  await db.collection("candidateNotes").doc("note_demo_2").set({
    id: "note_demo_2",
    tenantId: TENANT_ID,
    candidateId: candidateIds["Alan"],
    authorId: "demo_hr_manager",
    authorName: "Hina HR",
    body: "Phone screen positive. Scheduling technical interview.",
    createdAt: now - 7200000,
  });
  console.log("✓ candidate notes");

  // 7. Interview for the Interview-stage candidate
  await db.collection("interviews").doc("intv_demo_1").set({
    id: "intv_demo_1",
    tenantId: TENANT_ID,
    candidateId: candidateIds["Grace"],
    candidateName: "Grace Hopper",
    jobId: fe.id,
    stage: "Interview",
    title: "Technical Interview – System Design",
    mode: "video",
    location: "https://meet.example.com/demo",
    scheduledAt: now + 2 * 86400000,
    durationMins: 60,
    interviewerIds: ["demo_hr_manager", "demo_recruiter"],
    interviewerEmails: ["hr@demo.io", "recruiter@demo.io"],
    status: "scheduled",
    outcome: "pending",
    createdBy: "demo_recruiter",
    createdAt: now,
    updatedAt: now,
  });
  console.log("✓ interviews");

  // 8. Offer for the Offer-stage candidate
  await db.collection("offers").doc("offer_demo_1").set({
    id: "offer_demo_1",
    tenantId: TENANT_ID,
    candidateId: candidateIds["Linus"],
    candidateName: "Linus Torvalds",
    candidateEmail: "linus.torvalds@example.com",
    jobId: fe.id,
    jobTitle: fe.title,
    salary: 1200000,
    currency: "INR",
    startDate: new Date(now + 30 * 86400000).toISOString().slice(0, 10),
    expiryDate: new Date(now + 14 * 86400000).toISOString().slice(0, 10),
    status: "draft",
    notes: "Standard senior package.",
    approval: { required: false, steps: [], currentStep: 0, status: "approved" },
    createdBy: "demo_recruiter",
    createdAt: now,
    updatedAt: now,
  });
  console.log("✓ offers");

  console.log("\n✅ Demo data seeded successfully.\n");
  console.log("Login at the app with any of these (password for all: " + PASSWORD + "):");
  for (const u of DEMO_USERS) console.log(`   ${u.role.padEnd(12)}  ${u.email}`);
  console.log(`\nCareers page: /careers/${TENANT_ID}\n`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
