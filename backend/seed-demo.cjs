/*
 * Seed script for GreenWood International School (GWIS)
 * Educational Institution HRMS SaaS
 *
 * Seeds:
 * 1. Institution Tenant: GreenWood International School
 * 2. Campuses: Whitefield Main Campus & Hebbal North Campus
 * 3. Academic Departments: Science & Physics, Mathematics, English, Social Sciences, Administration
 * 4. Academic Session: AY 2026-2027 (Terms & Semesters)
 * 5. Institutional Accounts & Firebase Auth Users:
 *    - Principal & Director (Dr. Rajesh Sharma)
 *    - Campus Admin (Ananya Deshmukh)
 *    - HR Manager (Sunita Menon)
 *    - HOD Mathematics (Prof. Vikram Sen)
 *    - Senior Teaching Faculty (Pooja Iyer)
 *    - Non-Teaching Staff (Ramesh Kumar)
 * 6. Academic Staff Profiles & Indian Rupee (INR) Compensations
 * 7. Faculty Workload & Timetable Schedules
 * 8. Real-time Staff Attendance Logs
 * 9. Academic Recruitment Openings & Candidate Pipeline
 * 10. Processed Monthly Institutional Payroll Run & Itemized Payslips
 */

const admin = require("firebase-admin");

// --- Force emulator targets when running locally ---
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080";
  process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099";
}

const PROJECT_ID = process.env.GCLOUD_PROJECT || "demo-mock-project";

if (!admin.apps.length) {
  admin.initializeApp({ projectId: PROJECT_ID });
}
const db = admin.firestore();
const auth = admin.auth();

const TENANT_ID = "tenant_greenwood";
const PASSWORD = "Greenwood@2026";
const now = Date.now();
const todayStr = new Date().toISOString().slice(0, 10);

const INSTITUTION_USERS = [
  {
    uid: "user_principal_greenwood",
    email: "principal@greenwood.edu.in",
    displayName: "Dr. Rajesh Sharma",
    role: "org_admin", // maps to principal permissions
    designation: "Principal & Academic Director",
    category: "teaching",
    phone: "+91 98450 11221",
    departmentId: "dept_science",
    campusId: "campus_whitefield",
    qualification: "Ph.D. in Physics, M.Ed",
    specialization: "Quantum Physics & Educational Leadership",
    salary: 2400000,
  },
  {
    uid: "user_campusadmin_greenwood",
    email: "campusadmin@greenwood.edu.in",
    displayName: "Ananya Deshmukh",
    role: "org_admin", // campus admin level
    designation: "Head of Campus - Whitefield",
    category: "non_teaching",
    phone: "+91 98450 22332",
    departmentId: "dept_admin",
    campusId: "campus_whitefield",
    qualification: "MBA in Educational Management",
    specialization: "Institutional Operations & Infrastructure",
    salary: 1500000,
  },
  {
    uid: "user_hr_greenwood",
    email: "hr@greenwood.edu.in",
    displayName: "Sunita Menon",
    role: "hr_manager",
    designation: "Head of Human Resources",
    category: "non_teaching",
    phone: "+91 98450 33443",
    departmentId: "dept_admin",
    campusId: "campus_whitefield",
    qualification: "MBA in Human Resource Management",
    specialization: "Faculty Recruitment & Statutory Compliance",
    salary: 1100000,
  },
  {
    uid: "user_hod_math_greenwood",
    email: "hod.math@greenwood.edu.in",
    displayName: "Prof. Vikram Sen",
    role: "employee", // HOD with departmental access
    designation: "HOD Mathematics & Senior Faculty",
    category: "teaching",
    phone: "+91 98450 44554",
    departmentId: "dept_mathematics",
    campusId: "campus_whitefield",
    qualification: "M.Sc. Mathematics, B.Ed",
    specialization: "Pure Mathematics, Calculus & Statistics",
    salary: 1050000,
  },
  {
    uid: "user_teacher_physics_greenwood",
    email: "teacher.physics@greenwood.edu.in",
    displayName: "Pooja Iyer",
    role: "employee",
    designation: "Senior PGT Physics Faculty",
    category: "teaching",
    phone: "+91 98450 55665",
    departmentId: "dept_science",
    campusId: "campus_whitefield",
    qualification: "M.Sc. Physics, B.Ed",
    specialization: "Electromagnetism & Applied Mechanics",
    salary: 840000,
  },
  {
    uid: "user_staff_lab_greenwood",
    email: "staff.lab@greenwood.edu.in",
    displayName: "Ramesh Kumar",
    role: "employee",
    designation: "Senior Science Laboratory In-Charge",
    category: "non_teaching",
    phone: "+91 98450 66776",
    departmentId: "dept_science",
    campusId: "campus_whitefield",
    qualification: "B.Sc. Chemistry & Instrumentation",
    specialization: "Laboratory Safety & Inventory Management",
    salary: 480000,
  },
];

async function createOrUpdateAuthUser(u) {
  try {
    const existing = await auth.getUserByEmail(u.email);
    if (existing.uid === u.uid) {
      await auth.updateUser(u.uid, { password: PASSWORD, displayName: u.displayName });
      console.log(`  ↻ Updated auth user: ${u.email}`);
      return;
    } else {
      await auth.deleteUser(existing.uid);
    }
  } catch (e) {
    // User does not exist by email
  }

  try {
    await auth.updateUser(u.uid, { email: u.email, password: PASSWORD, displayName: u.displayName });
    console.log(`  ↻ Updated auth user by UID: ${u.email}`);
  } catch (e) {
    await auth.createUser({
      uid: u.uid,
      email: u.email,
      password: PASSWORD,
      displayName: u.displayName,
      emailVerified: true,
    });
    console.log(`  ✓ Created auth user: ${u.email}`);
  }
}

async function seed() {
  console.log(`\n======================================================`);
  console.log(`  Seeding GreenWood International School (GWIS) Data`);
  console.log(`  Target Project: "${PROJECT_ID}"`);
  console.log(`======================================================\n`);

  // 1. Institution Tenant
  await db.collection("tenants").doc(TENANT_ID).set({
    id: TENANT_ID,
    name: "GreenWood International School",
    institutionCode: "GWIS",
    institutionCategory: "school",
    affiliation: "CBSE & Cambridge International (CAIE)",
    accreditation: "A+ Grade National Accreditation",
    industry: "Education",
    timezone: "Asia/Kolkata",
    address: "GreenWood Campus, Varthur Road, Whitefield, Bengaluru, Karnataka 560087",
    logoURL: null,
    primaryColor: "#15803d", // Forest Green
    supportEmail: "admin@greenwood.edu.in",
    website: "https://greenwood.edu.in",
    createdAt: now,
    updatedAt: now,
  });
  console.log("✓ Institution Tenant: GreenWood International School (GWIS)");

  // 2. Campuses
  const campuses = [
    {
      id: "campus_whitefield",
      tenantId: TENANT_ID,
      name: "Whitefield Main Campus",
      code: "GWIS-WF",
      address: "Varthur Road, Whitefield, Bengaluru, Karnataka 560087",
      headOfCampus: "Dr. Rajesh Sharma",
      contactEmail: "whitefield@greenwood.edu.in",
      contactPhone: "+91 80 4123 5500",
      workingHours: { start: "08:00", end: "15:30" },
      shiftType: "single",
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "campus_hebbal",
      tenantId: TENANT_ID,
      name: "Hebbal North Campus",
      code: "GWIS-HB",
      address: "Bellary Road, Near Hebbal Flyover, Bengaluru 560024",
      headOfCampus: "Ananya Deshmukh",
      contactEmail: "hebbal@greenwood.edu.in",
      contactPhone: "+91 80 4123 5501",
      workingHours: { start: "08:00", end: "15:30" },
      shiftType: "single",
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
  ];
  for (const c of campuses) {
    await db.collection("campuses").doc(c.id).set(c);
  }
  console.log("✓ Campuses: Whitefield Main & Hebbal North");

  // 3. Academic Departments
  const departments = [
    { id: "dept_science", tenantId: TENANT_ID, name: "Department of Science & Physics", code: "SCI", description: "Physics, Chemistry, and Biological Sciences" },
    { id: "dept_mathematics", tenantId: TENANT_ID, name: "Department of Mathematics", code: "MTH", description: "Pure & Applied Mathematics, Statistics" },
    { id: "dept_english", tenantId: TENANT_ID, name: "Department of English & Languages", code: "ENG", description: "English Literature, Functional English & World Languages" },
    { id: "dept_social", tenantId: TENANT_ID, name: "Department of Social Sciences", code: "SOC", description: "History, Civics, Geography & Economics" },
    { id: "dept_admin", tenantId: TENANT_ID, name: "School Administration & Accounts", code: "ADM", description: "Campus Operations, Finance & Human Resources" },
  ];
  for (const d of departments) {
    await db.collection("departments").doc(d.id).set({ ...d, createdAt: now, updatedAt: now });
  }
  console.log("✓ Academic Departments (Science, Mathematics, Languages, Social Sciences, Admin)");

  // 4. Academic Session & Terms
  const sessionId = "session_2026_27";
  await db.collection("academicSessions").doc(sessionId).set({
    id: sessionId,
    tenantId: TENANT_ID,
    name: "Academic Year 2026-2027",
    code: "AY-2026-27",
    startDate: "2026-06-01",
    endDate: "2027-03-31",
    isCurrent: true,
    terms: [
      { id: "term_1", name: "Term 1 (Monsoon Semester)", startDate: "2026-06-01", endDate: "2026-10-15" },
      { id: "term_2", name: "Term 2 (Spring Semester)", startDate: "2026-11-01", endDate: "2027-03-31" },
    ],
    status: "active",
    createdAt: now,
    updatedAt: now,
  });
  console.log("✓ Academic Session: AY 2026-2027 (Active Session)");

  // 5. Auth Users, User Profiles & Employee Directory Records
  console.log("\nProvisioning Institutional Users & Credentials:");
  for (const u of INSTITUTION_USERS) {
    await createOrUpdateAuthUser(u);

    // User document in `users` collection
    await db.collection("users").doc(u.uid).set({
      id: u.uid,
      email: u.email,
      displayName: u.displayName,
      photoURL: null,
      activeTenantId: TENANT_ID,
      tenants: {
        [TENANT_ID]: { role: u.role, status: "active", joinedAt: now },
      },
      createdAt: now,
      updatedAt: now,
    });

    const empId = `emp_${u.uid.replace("user_", "")}`;
    const nameParts = u.displayName.split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ");

    // Employee directory document in `employees` collection
    await db.collection("employees").doc(empId).set({
      id: empId,
      tenantId: TENANT_ID,
      userId: u.uid,
      firstName,
      lastName,
      email: u.email,
      phone: u.phone,
      jobTitle: u.designation,
      staffCategory: u.category,
      teachingStatus: u.category === "teaching" ? "teaching" : "non_teaching",
      facultyGrade: u.category === "teaching" ? (u.role === "org_admin" ? "Director" : "Senior PGT") : "Staff",
      highestQualification: u.qualification,
      specialization: u.specialization,
      subjectsTaught: u.category === "teaching" ? (u.departmentId === "dept_mathematics" ? ["Mathematics", "Calculus"] : ["Physics", "Mechanics"]) : [],
      teachingExperienceYears: u.category === "teaching" ? 12 : 0,
      academicExperienceYears: 14,
      departmentId: u.departmentId,
      campusId: u.campusId,
      status: "active",
      startDate: "2024-06-01",
      workLocation: "Main Campus (Whitefield)",
      createdAt: now,
      updatedAt: now,
    });

    // Compensation document in `employeeCompensation` collection (sensitive)
    await db.collection("employeeCompensation").doc(empId).set({
      id: empId,
      tenantId: TENANT_ID,
      employeeId: empId,
      salary: u.salary,
      currency: "INR",
      updatedAt: now,
    });
  }
  console.log("✓ Employees Directory & Sensitive Compensation Records (INR)");

  // 6. Faculty Workload & Timetable Slots
  const mathEmpId = "emp_hod_math_greenwood";
  const physicsEmpId = "emp_teacher_physics_greenwood";

  await db.collection("facultyWorkloads").doc(`fw_${mathEmpId}_${sessionId}`).set({
    id: `fw_${mathEmpId}_${sessionId}`,
    tenantId: TENANT_ID,
    employeeId: mathEmpId,
    employeeName: "Prof. Vikram Sen",
    academicSessionId: sessionId,
    assignedWeeklyPeriods: 18,
    maxWeeklyPeriods: 24,
    minWeeklyPeriods: 16,
    subjects: [
      { subjectCode: "MTH-10", subjectName: "Grade 10 Mathematics", weeklyPeriods: 6 },
      { subjectCode: "MTH-12", subjectName: "Grade 12 Advanced Calculus", weeklyPeriods: 6 },
      { subjectCode: "MTH-11", subjectName: "Grade 11 Coordinate Geometry", weeklyPeriods: 6 },
    ],
    updatedAt: now,
  });

  await db.collection("facultyWorkloads").doc(`fw_${physicsEmpId}_${sessionId}`).set({
    id: `fw_${physicsEmpId}_${sessionId}`,
    tenantId: TENANT_ID,
    employeeId: physicsEmpId,
    employeeName: "Pooja Iyer",
    academicSessionId: sessionId,
    assignedWeeklyPeriods: 16,
    maxWeeklyPeriods: 22,
    minWeeklyPeriods: 14,
    subjects: [
      { subjectCode: "PHY-10", subjectName: "Grade 10 Science & Mechanics", weeklyPeriods: 6 },
      { subjectCode: "PHY-12", subjectName: "Grade 12 Electromagnetism", weeklyPeriods: 6 },
      { subjectCode: "LAB-PHY", subjectName: "Senior Physics Practicals", weeklyPeriods: 4 },
    ],
    updatedAt: now,
  });

  const schedules = [
    {
      id: "sched_math_mon_p1",
      tenantId: TENANT_ID,
      campusId: "campus_whitefield",
      employeeId: mathEmpId,
      employeeName: "Prof. Vikram Sen",
      academicSessionId: sessionId,
      dayOfWeek: "Monday",
      periodNumber: 1,
      startTime: "08:30",
      endTime: "09:15",
      subjectCode: "MTH-10",
      subjectName: "Grade 10 Mathematics",
      classGrade: "Class 10-A",
      section: "A",
      room: "Room 104",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "sched_physics_mon_p2",
      tenantId: TENANT_ID,
      campusId: "campus_whitefield",
      employeeId: physicsEmpId,
      employeeName: "Pooja Iyer",
      academicSessionId: sessionId,
      dayOfWeek: "Monday",
      periodNumber: 2,
      startTime: "09:15",
      endTime: "10:00",
      subjectCode: "PHY-12",
      subjectName: "Grade 12 Physics",
      classGrade: "Class 12-A",
      section: "A",
      room: "Physics Lab 1",
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const s of schedules) {
    await db.collection("teachingSchedules").doc(s.id).set(s);
  }
  console.log("✓ Faculty Workloads & Timetable Schedules (Conflict-Free)");

  // 7. Today's Staff Attendance Logs
  const attendanceLogs = [
    {
      id: `att_${mathEmpId}_${todayStr}`,
      tenantId: TENANT_ID,
      employeeId: mathEmpId,
      employeeName: "Prof. Vikram Sen",
      campusId: "campus_whitefield",
      date: todayStr,
      checkInTime: "08:15",
      checkOutTime: "15:25",
      dutyType: "regular",
      status: "present",
      verifiedBy: "Biometric Integration Gateway",
      remarks: "On-time arrival for Period 1 class",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `att_${physicsEmpId}_${todayStr}`,
      tenantId: TENANT_ID,
      employeeId: physicsEmpId,
      employeeName: "Pooja Iyer",
      campusId: "campus_whitefield",
      date: todayStr,
      checkInTime: "08:22",
      dutyType: "regular",
      status: "present",
      verifiedBy: "Staff Portal Check-in",
      remarks: "Practicals preparation",
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const a of attendanceLogs) {
    await db.collection("staffAttendance").doc(a.id).set(a);
  }
  console.log("✓ Today's Staff Attendance Logs");

  // 8. Academic Job Openings & Hiring Pipeline
  const jobs = [
    {
      id: "job_math_pgt",
      tenantId: TENANT_ID,
      title: "PGT Mathematics Teacher (Grades 11 & 12)",
      departmentId: "dept_mathematics",
      campusId: "campus_whitefield",
      staffCategory: "teaching",
      subjectSpecialization: "Calculus & Pure Mathematics",
      minimumQualification: "M.Sc. Mathematics with B.Ed",
      location: "Bengaluru (Whitefield Campus)",
      workMode: "onsite",
      employmentType: "full_time",
      openings: 2,
      salaryMin: 650000,
      salaryMax: 950000,
      currency: "INR",
      description: "Teach senior secondary students preparing for CBSE Board & competitive entrances.",
      responsibilities: "Deliver curriculum, conduct weekly problem-solving seminars, assess term examinations.",
      requirements: "Minimum 4+ years teaching Grades 11-12. Strong mastery of calculus.",
      status: "open",
      isPublished: true,
      pipelineStages: [
        "Applied",
        "Screening",
        "Teaching Demonstration",
        "Academic Interview",
        "Reference & Verification",
        "Offer",
        "Hired",
      ],
      approval: { required: false, steps: [], currentStep: 0, status: "approved" },
      createdBy: "user_hr_greenwood",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "job_chem_lab",
      tenantId: TENANT_ID,
      title: "Senior Chemistry Laboratory Assistant",
      departmentId: "dept_science",
      campusId: "campus_whitefield",
      staffCategory: "non_teaching",
      subjectSpecialization: "Chemical Reagents & Safety Protocols",
      minimumQualification: "B.Sc. Chemistry",
      location: "Bengaluru (Whitefield Campus)",
      workMode: "onsite",
      employmentType: "full_time",
      openings: 1,
      salaryMin: 360000,
      salaryMax: 480000,
      currency: "INR",
      description: "Maintain senior chemistry laboratory setup, prepare experiments for practical exams.",
      responsibilities: "Chemical storage safety, practical demo equipment calibration, waste neutralization.",
      requirements: "B.Sc. Chemistry with 2+ years school or college laboratory experience.",
      status: "open",
      isPublished: true,
      pipelineStages: [
        "Applied",
        "Screening",
        "Practical Lab Skills Test",
        "HR Interview",
        "Offer",
        "Hired",
      ],
      approval: { required: false, steps: [], currentStep: 0, status: "approved" },
      createdBy: "user_hr_greenwood",
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const j of jobs) {
    await db.collection("jobs").doc(j.id).set(j);
  }
  console.log("✓ Educational Vacancies (PGT Mathematics & Senior Chemistry Lab In-Charge)");

  // 9. Candidates in Academic Pipeline
  const candidates = [
    {
      id: "cand_gwis_1",
      tenantId: TENANT_ID,
      jobId: "job_math_pgt",
      jobTitle: "PGT Mathematics Teacher (Grades 11 & 12)",
      firstName: "Kavita",
      lastName: "Rao",
      email: "kavita.rao@example.com",
      phone: "+91 97420 88990",
      stage: "Teaching Demonstration",
      status: "active",
      source: "careers",
      rating: 5,
      appliedAt: now - 3 * 86400000,
      createdAt: now - 3 * 86400000,
      updatedAt: now,
    },
    {
      id: "cand_gwis_2",
      tenantId: TENANT_ID,
      jobId: "job_math_pgt",
      jobTitle: "PGT Mathematics Teacher (Grades 11 & 12)",
      firstName: "Arun",
      lastName: "Chatterjee",
      email: "arun.chatterjee@example.com",
      phone: "+91 97420 44556",
      stage: "Academic Interview",
      status: "active",
      source: "referral",
      rating: 4,
      appliedAt: now - 5 * 86400000,
      createdAt: now - 5 * 86400000,
      updatedAt: now,
    },
  ];

  for (const cd of candidates) {
    await db.collection("candidates").doc(cd.id).set(cd);
  }
  console.log("✓ Candidates in Academic Demonstration & Interview Stages");

  // 10. Sample Processed Monthly Payroll Run (in INR)
  const runId = "pay_oct_2026_gwis";
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  await db.collection("payrollRuns").doc(runId).set({
    id: runId,
    tenantId: TENANT_ID,
    campusId: "campus_whitefield",
    name: `October ${currentYear} Faculty & Staff Payroll`,
    month: currentMonth,
    year: currentYear,
    currency: "INR",
    status: "approved",
    totalGross: 614000,
    totalDeductions: 86400,
    totalNet: 527600,
    employeeCount: 6,
    approvedBy: "Dr. Rajesh Sharma (Principal)",
    approvedAt: now - 86400000,
    createdAt: now - 86400000,
    updatedAt: now,
  });

  console.log("✓ Monthly Institutional Payroll Run (Approved, in INR)");

  console.log("\n======================================================");
  console.log("✅ GreenWood International School Seed Complete!");
  console.log("======================================================\n");
  console.log("Login Credentials (Password for ALL: " + PASSWORD + "):");
  console.log("------------------------------------------------------");
  for (const u of INSTITUTION_USERS) {
    console.log(` ${u.designation.padEnd(35)} : ${u.email}`);
  }
  console.log("\nTenant ID: " + TENANT_ID);
  console.log("======================================================\n");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed execution failed:", err);
    process.exit(1);
  });
