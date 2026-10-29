/**
 * scripts/seed-complete-production.cjs
 * Comprehensive production seed script for GreenWood International School
 * Targets live Firebase Project: attendoschool-2d0fb
 *
 * Seeds:
 * 1. Institution Tenant: GreenWood International School
 * 2. Campuses: Whitefield Main Campus & Hebbal North Campus
 * 3. Academic Departments: Science & Physics, Mathematics, English, Social Sciences, Administration
 * 4. Academic Session: AY 2026-2027 (Terms & Semesters)
 * 5. Holiday Calendars: Public & Institutional Holidays (2026)
 * 6. Institutional Accounts & Firebase Auth Users:
 *    - Principal & Director (Dr. Rajesh Sharma)
 *    - Campus Admin (Ananya Deshmukh)
 *    - HR Manager (Sunita Menon)
 *    - HOD Mathematics (Prof. Vikram Sen)
 *    - Senior Teaching Faculty (Pooja Iyer)
 *    - Non-Teaching Staff (Ramesh Kumar)
 * 7. Academic Staff Profiles & Indian Rupee (INR) Compensations
 * 8. Real-time Staff Attendance Logs
 * 9. Faculty Workload & Timetable Schedules
 * 10. Committees & Teams
 * 11. Leave Types & Requests
 * 12. Academic Recruitment Openings & Candidates Pipeline
 * 13. Processed Monthly Institutional Payroll Run & Itemized Payslips
 * 14. Performance Reviews & Faculty Development Training Programs
 */
const { initializeApp } = require("firebase/app");
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require("firebase/auth");
const { getFirestore, doc, setDoc, deleteDoc } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyCXgZqRNuQ6Uxue0-1st9zt0lfZwraD3g4",
  authDomain: "attendoschool-2d0fb.firebaseapp.com",
  projectId: "attendoschool-2d0fb",
  storageBucket: "attendoschool-2d0fb.firebasestorage.app",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const TENANT_ID = "tenant_greenwood";
const PASSWORD = "Greenwood@2026";
const now = Date.now();
const todayStr = new Date().toISOString().slice(0, 10);

const USERS_TO_SEED = [
  {
    email: "principal@greenwood.edu.in",
    displayName: "Dr. Rajesh Sharma",
    role: "super_admin",
    designation: "Principal & Academic Director",
    departmentId: "dept_science",
    campusId: "campus_whitefield",
    category: "teaching",
    phone: "+91 98450 11221",
    qualification: "Ph.D. in Physics, M.Ed",
    specialization: "Quantum Physics & Educational Leadership",
    salary: 2400000,
    empId: "emp_gwis_001",
    empNum: "GWIS-FAC-001",
  },
  {
    email: "campusadmin@greenwood.edu.in",
    displayName: "Ananya Deshmukh",
    role: "org_admin",
    designation: "Head of Campus - Whitefield",
    departmentId: "dept_admin",
    campusId: "campus_whitefield",
    category: "non_teaching",
    phone: "+91 98450 22332",
    qualification: "MBA in Educational Management",
    specialization: "Institutional Operations & Infrastructure",
    salary: 1500000,
    empId: "emp_gwis_002",
    empNum: "GWIS-ADM-002",
  },
  {
    email: "hr@greenwood.edu.in",
    displayName: "Sunita Menon",
    role: "hr_manager",
    designation: "Head of Human Resources",
    departmentId: "dept_admin",
    campusId: "campus_whitefield",
    category: "non_teaching",
    phone: "+91 98450 33443",
    qualification: "MBA in Human Resource Management",
    specialization: "Faculty Recruitment & Statutory Compliance",
    salary: 1100000,
    empId: "emp_gwis_003",
    empNum: "GWIS-HR-003",
  },
  {
    email: "hod.math@greenwood.edu.in",
    displayName: "Prof. Vikram Sen",
    role: "employee",
    designation: "HOD Mathematics & Senior Faculty",
    departmentId: "dept_mathematics",
    campusId: "campus_whitefield",
    category: "teaching",
    phone: "+91 98450 44554",
    qualification: "M.Sc. Mathematics, B.Ed",
    specialization: "Pure Mathematics, Calculus & Statistics",
    salary: 1050000,
    empId: "emp_gwis_004",
    empNum: "GWIS-FAC-004",
  },
  {
    email: "teacher.physics@greenwood.edu.in",
    displayName: "Pooja Iyer",
    role: "employee",
    designation: "Senior PGT Physics Faculty",
    departmentId: "dept_science",
    campusId: "campus_whitefield",
    category: "teaching",
    phone: "+91 98450 55665",
    qualification: "M.Sc. Physics, CIDTL/B.Ed",
    specialization: "Optics, Electromagnetism & Lab Pedagogy",
    salary: 840000,
    empId: "emp_gwis_005",
    empNum: "GWIS-FAC-005",
  },
  {
    email: "staff.lab@greenwood.edu.in",
    displayName: "Ramesh Kumar",
    role: "employee",
    designation: "Senior Science Laboratory In-Charge",
    departmentId: "dept_science",
    campusId: "campus_whitefield",
    category: "non_teaching",
    phone: "+91 98450 66776",
    qualification: "B.Sc. Chemistry & Physics",
    specialization: "Chemical Safety & Laboratory Calibration",
    salary: 480000,
    empId: "emp_gwis_006",
    empNum: "GWIS-STF-006",
  },
];

async function getOrCreateUser(email, password, displayName) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    return cred.user.uid;
  } catch (err) {
    if (err.code === "auth/email-already-in-use") {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      return cred.user.uid;
    }
    throw err;
  }
}

async function seedAll() {
  console.log("==================================================================");
  console.log("  SEEDING COMPLETE PRODUCTION DATA: GreenWood International School");
  console.log("  Firebase Project: attendoschool-2d0fb");
  console.log("==================================================================\n");

  // Sign in as primary admin first to have write credentials
  console.log("[1/14] Authenticating master admin session...");
  await signInWithEmailAndPassword(auth, "admin@greenwood.edu.in", PASSWORD);

  // Remove duplicate tenant if exists
  console.log("[2/14] Cleaning up any duplicate tenants...");
  try {
    await deleteDoc(doc(db, "tenants", "tenant_bljsnzd"));
    console.log("       Removed duplicate tenant_bljsnzd");
  } catch (e) {
    // Ignore if not present
  }

  const memberDirectory = {};
  for (const u of USERS_TO_SEED) {
    memberDirectory[u.email.toLowerCase().trim()] = {
      displayName: u.displayName,
      designation: u.designation,
      role: u.role,
      category: u.category,
      campusId: u.campusId,
      departmentId: u.departmentId,
      lastLoginAt: Date.now() - Math.floor(Math.random() * 18000000 + 3600000), // e.g. a few hours ago
    };
  }

  // 1. Main Institution Tenant
  console.log("[3/14] Seeding Institution Tenant...");
  await setDoc(doc(db, "tenants", TENANT_ID), {
    id: TENANT_ID,
    name: "GreenWood International School",
    institutionCode: "GWIS",
    institutionCategory: "school",
    affiliation: "CBSE & Cambridge International (CAIE)",
    accreditation: "A+ Grade National Accreditation",
    industry: "Education",
    timezone: "Asia/Kolkata",
    address: "GreenWood Campus, Varthur Road, Whitefield, Bengaluru, Karnataka 560087",
    primaryColor: "#15803d",
    supportEmail: "principal@greenwood.edu.in",
    website: "https://greenwood.edu.in",
    currency: "INR",
    currencySymbol: "₹",
    logoUrl: "/greenwood-logo.png",
    logoURL: "/greenwood-logo.png",
    memberDirectory,
    status: "active",
    createdAt: now,
    updatedAt: now,
  });

  // 2. Campuses
  console.log("[4/14] Seeding Campuses...");
  const campuses = [
    {
      id: "campus_whitefield",
      tenantId: TENANT_ID,
      name: "Main Campus (Whitefield)",
      code: "GWIS-WF",
      address: "Survey No 45, Varthur Main Road, Whitefield, Bengaluru 560087",
      headOfCampus: "Dr. Rajesh Sharma",
      contactEmail: "whitefield@greenwood.edu.in",
      contactPhone: "+91 80 2845 0011",
      workingHours: { start: "08:00", end: "16:00" },
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
    await setDoc(doc(db, "campuses", c.id), c);
  }

  // 3. Academic Departments
  console.log("[5/14] Seeding Academic Departments...");
  const departments = [
    { id: "dept_science", tenantId: TENANT_ID, name: "Department of Science & Physics", code: "SCI", description: "Physics, Chemistry, and Biological Sciences", createdAt: now, updatedAt: now },
    { id: "dept_mathematics", tenantId: TENANT_ID, name: "Department of Mathematics", code: "MTH", description: "Pure & Applied Mathematics, Statistics", createdAt: now, updatedAt: now },
    { id: "dept_english", tenantId: TENANT_ID, name: "Department of English & Languages", code: "ENG", description: "English Literature, Functional English & World Languages", createdAt: now, updatedAt: now },
    { id: "dept_social", tenantId: TENANT_ID, name: "Department of Social Sciences", code: "SOC", description: "History, Civics, Geography & Economics", createdAt: now, updatedAt: now },
    { id: "dept_admin", tenantId: TENANT_ID, name: "School Administration & Accounts", code: "ADM", description: "Campus Operations, Finance & Human Resources", createdAt: now, updatedAt: now },
  ];
  for (const d of departments) {
    await setDoc(doc(db, "departments", d.id), d);
  }

  // 4. Academic Session
  console.log("[6/14] Seeding Academic Sessions & Terms...");
  await setDoc(doc(db, "academicSessions", "session_2026_27"), {
    id: "session_2026_27",
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
    createdAt: now,
    updatedAt: now,
  });

  // Holiday Calendar
  await setDoc(doc(db, "holidayCalendars", "cal_2026"), {
    id: "cal_2026",
    tenantId: TENANT_ID,
    name: "Academic Holiday Calendar 2026",
    year: 2026,
    holidays: [
      { id: "h1", name: "Independence Day", date: "2026-08-15", type: "national" },
      { id: "h2", name: "Gandhi Jayanti", date: "2026-10-02", type: "national" },
      { id: "h3", name: "Diwali Vacation", date: "2026-11-08", type: "institutional" },
      { id: "h4", name: "Christmas Break", date: "2026-12-25", type: "institutional" },
    ],
    createdAt: now,
    updatedAt: now,
  });

  // 5. Auth Users, User Profiles, Employees, and Compensations
  console.log("[7/14] Creating/Seeding Institutional Auth Users & Employee Profiles...");
  for (const u of USERS_TO_SEED) {
    const uid = await getOrCreateUser(u.email, PASSWORD, u.displayName);
    console.log(`       User: ${u.email} -> UID: ${uid}`);

    // User Profile Document
    await setDoc(doc(db, "users", uid), {
      id: uid,
      email: u.email,
      displayName: u.displayName,
      activeTenantId: TENANT_ID,
      tenants: {
        [TENANT_ID]: {
          role: u.role,
          status: "active",
          joinedAt: now,
        },
      },
      createdAt: now,
      updatedAt: now,
    });

    // Employee Document
    await setDoc(doc(db, "employees", u.empId), {
      id: u.empId,
      tenantId: TENANT_ID,
      userId: uid,
      employeeNumber: u.empNum,
      firstName: u.displayName.split(" ")[0],
      lastName: u.displayName.split(" ").slice(1).join(" ") || "Faculty",
      email: u.email,
      phone: u.phone,
      departmentId: u.departmentId,
      campusId: u.campusId,
      designation: u.designation,
      facultyCategory: u.category,
      qualification: u.qualification,
      specialization: u.specialization,
      status: "active",
      employmentType: "full-time",
      hireDate: "2021-06-01",
      createdAt: now,
      updatedAt: now,
    });

    // Compensation in INR
    await setDoc(doc(db, "employeeCompensation", u.empId), {
      employeeId: u.empId,
      tenantId: TENANT_ID,
      baseSalary: u.salary,
      currency: "INR",
      currencySymbol: "₹",
      payFrequency: "monthly",
      effectiveDate: "2026-04-01",
      createdAt: now,
      updatedAt: now,
    });
  }

  // 6. Attendance Logs
  console.log("[8/14] Seeding Today's Verified Biometric Attendance...");
  for (const u of USERS_TO_SEED) {
    await setDoc(doc(db, "staffAttendance", `att_${todayStr}_${u.empId}`), {
      id: `att_${todayStr}_${u.empId}`,
      tenantId: TENANT_ID,
      employeeId: u.empId,
      date: todayStr,
      status: "present",
      checkInTime: "07:55:00",
      checkOutTime: null,
      verificationMethod: "biometric",
      campusId: u.campusId,
      createdAt: now,
      updatedAt: now,
    });
  }

  // 7. Faculty Workload & Schedules
  console.log("[9/14] Seeding Faculty Workload & Timetable Schedules...");
  const mathEmpId = "emp_gwis_004";
  const physicsEmpId = "emp_gwis_005";

  await setDoc(doc(db, "facultyWorkloads", `fw_${mathEmpId}_session_2026_27`), {
    id: `fw_${mathEmpId}_session_2026_27`,
    tenantId: TENANT_ID,
    employeeId: mathEmpId,
    employeeName: "Prof. Vikram Sen",
    academicSessionId: "session_2026_27",
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

  await setDoc(doc(db, "facultyWorkloads", `fw_${physicsEmpId}_session_2026_27`), {
    id: `fw_${physicsEmpId}_session_2026_27`,
    tenantId: TENANT_ID,
    employeeId: physicsEmpId,
    employeeName: "Pooja Iyer",
    academicSessionId: "session_2026_27",
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

  await setDoc(doc(db, "teachingSchedules", "sched_math_mon_p1"), {
    id: "sched_math_mon_p1",
    tenantId: TENANT_ID,
    campusId: "campus_whitefield",
    employeeId: mathEmpId,
    employeeName: "Prof. Vikram Sen",
    academicSessionId: "session_2026_27",
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
  });

  await setDoc(doc(db, "teachingSchedules", "sched_physics_mon_p2"), {
    id: "sched_physics_mon_p2",
    tenantId: TENANT_ID,
    campusId: "campus_whitefield",
    employeeId: physicsEmpId,
    employeeName: "Pooja Iyer",
    academicSessionId: "session_2026_27",
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
  });

  // 8. Institutional Teams & Committees
  console.log("[10/14] Seeding Institutional Committees & Teams...");
  const teams = [
    {
      id: "team_board_exam",
      tenantId: TENANT_ID,
      name: "CBSE & CAIE Board Examination Committee",
      description: "Coordinates board registration, center invigilation, and internal moderation.",
      departmentId: "dept_admin",
      leadId: "emp_gwis_004", // Prof. Vikram Sen
      leadName: "Prof. Vikram Sen",
      members: ["emp_gwis_004", "emp_gwis_005"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "team_stem_club",
      tenantId: TENANT_ID,
      name: "STEM & Robotics Innovation Club",
      description: "Guides student science projects, Olympiads, and inter-school robotics expos.",
      departmentId: "dept_science",
      leadId: "emp_gwis_005", // Pooja Iyer
      leadName: "Pooja Iyer",
      members: ["emp_gwis_005", "emp_gwis_006"],
      createdAt: now,
      updatedAt: now,
    },
  ];
  for (const t of teams) {
    await setDoc(doc(db, "teams", t.id), t);
  }

  // 9. Leave Types & Policy
  console.log("[11/14] Seeding Leave Types & Requests...");
  const leaveTypes = [
    { id: "leave_cl", tenantId: TENANT_ID, name: "Casual Leave (CL)", code: "CL", daysPerYear: 12, requiresApproval: true, createdAt: now, updatedAt: now },
    { id: "leave_ml", tenantId: TENANT_ID, name: "Medical / Sick Leave (ML)", code: "ML", daysPerYear: 10, requiresApproval: true, createdAt: now, updatedAt: now },
    { id: "leave_dl", tenantId: TENANT_ID, name: "Academic Duty Leave (DL)", code: "DL", daysPerYear: 15, requiresApproval: true, createdAt: now, updatedAt: now },
  ];
  for (const lt of leaveTypes) {
    await setDoc(doc(db, "leaveTypes", lt.id), lt);
  }

  await setDoc(doc(db, "leaveRequests", "req_leave_demo_01"), {
    id: "req_leave_demo_01",
    tenantId: TENANT_ID,
    employeeId: "emp_gwis_005",
    employeeName: "Pooja Iyer",
    leaveTypeId: "leave_dl",
    leaveTypeName: "Academic Duty Leave (DL)",
    startDate: "2026-11-12",
    endDate: "2026-11-13",
    totalDays: 2,
    reason: "CBSE National Physics Evaluator Orientation Workshop",
    status: "approved",
    approverId: "emp_gwis_001",
    approverName: "Dr. Rajesh Sharma",
    createdAt: now,
    updatedAt: now,
  });

  // 10. Academic Recruitment Openings & Candidates
  console.log("[12/14] Seeding Academic Recruitment Openings & Candidates...");
  const jobs = [
    {
      id: "job_pgt_math",
      tenantId: TENANT_ID,
      title: "Senior PGT Mathematics Teacher",
      code: "JOB-2026-MTH",
      departmentId: "dept_mathematics",
      campusId: "campus_whitefield",
      designation: "PGT Mathematics",
      facultyCategory: "teaching",
      status: "open",
      isPublished: true,
      employmentType: "full-time",
      experienceYears: "5-8 years",
      qualification: "M.Sc. Mathematics, B.Ed",
      salaryRangeMin: 900000,
      salaryRangeMax: 1200000,
      currency: "INR",
      currencySymbol: "₹",
      vacancies: 2,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "job_caie_chemistry",
      tenantId: TENANT_ID,
      title: "Cambridge IGCSE Chemistry Specialist",
      code: "JOB-2026-CHM",
      departmentId: "dept_science",
      campusId: "campus_hebbal",
      designation: "TGT/PGT Chemistry",
      facultyCategory: "teaching",
      status: "open",
      isPublished: true,
      employmentType: "full-time",
      experienceYears: "3-5 years",
      qualification: "M.Sc. Chemistry, CIDTL/B.Ed",
      salaryRangeMin: 800000,
      salaryRangeMax: 1100000,
      currency: "INR",
      currencySymbol: "₹",
      vacancies: 1,
      createdAt: now,
      updatedAt: now,
    },
  ];
  for (const j of jobs) {
    await setDoc(doc(db, "jobs", j.id), j);
  }

  const candidates = [
    {
      id: "cand_gwis_1",
      tenantId: TENANT_ID,
      jobId: "job_pgt_math",
      jobTitle: "Senior PGT Mathematics Teacher",
      firstName: "Kavita",
      lastName: "Rao",
      email: "kavita.rao@example.com",
      phone: "+91 97420 88990",
      stage: "interview",
      status: "active",
      source: "careers",
      rating: 5,
      createdAt: now - 3 * 86400000,
      updatedAt: now,
    },
    {
      id: "cand_gwis_2",
      tenantId: TENANT_ID,
      jobId: "job_caie_chemistry",
      jobTitle: "Cambridge IGCSE Chemistry Specialist",
      firstName: "Dr. Meenakshi",
      lastName: "Sundaram",
      email: "meenakshi.s@example.com",
      phone: "+91 97420 44556",
      stage: "screening",
      status: "active",
      source: "referral",
      rating: 4,
      createdAt: now - 5 * 86400000,
      updatedAt: now,
    },
  ];
  for (const cd of candidates) {
    await setDoc(doc(db, "candidates", cd.id), cd);
  }

  // 11. Processed Monthly Payroll Run & Itemized Payslips
  console.log("[13/14] Seeding Monthly Institutional Payroll Run & Payslips (INR)...");
  const payrollRunId = "pr_2026_10";
  await setDoc(doc(db, "payrollRuns", payrollRunId), {
    id: payrollRunId,
    tenantId: TENANT_ID,
    month: "2026-10",
    name: "October 2026 Faculty & Staff Payroll",
    status: "approved",
    totalEmployees: USERS_TO_SEED.length,
    currency: "INR",
    currencySymbol: "₹",
    grossAmount: 697500,
    deductionsAmount: 83700,
    netAmount: 613800,
    processedDate: "2026-10-28",
    approvedBy: "Dr. Rajesh Sharma",
    createdAt: now,
    updatedAt: now,
  });

  for (const u of USERS_TO_SEED) {
    const monthlyGross = Math.round(u.salary / 12);
    const pfDeduction = Math.round(monthlyGross * 0.12);
    const netSalary = monthlyGross - pfDeduction;
    await setDoc(doc(db, "payslips", `slip_${payrollRunId}_${u.empId}`), {
      id: `slip_${payrollRunId}_${u.empId}`,
      tenantId: TENANT_ID,
      payrollRunId: payrollRunId,
      employeeId: u.empId,
      employeeName: u.displayName,
      designation: u.designation,
      month: "2026-10",
      currency: "INR",
      currencySymbol: "₹",
      grossSalary: monthlyGross,
      totalDeductions: pfDeduction,
      netSalary: netSalary,
      status: "paid",
      paidDate: "2026-10-29",
      createdAt: now,
      updatedAt: now,
    });
  }

  // 12. Performance Reviews & Training Programs
  console.log("[14/14] Seeding Performance Appraisals & Faculty Development...");
  await setDoc(doc(db, "performanceReviews", "rev_demo_01"), {
    id: "rev_demo_01",
    tenantId: TENANT_ID,
    academicSessionId: "session_2026_27",
    employeeId: "emp_gwis_004",
    employeeName: "Prof. Vikram Sen",
    reviewPeriod: "Term 1 (Monsoon 2026)",
    score: 4.8,
    status: "completed",
    evaluatorId: "emp_gwis_001",
    evaluatorName: "Dr. Rajesh Sharma",
    feedback: "Exceptional mastery in CBSE Board Class 12 preparation with 100% first-class mock pass rates.",
    createdAt: now,
    updatedAt: now,
  });

  await setDoc(doc(db, "trainingPrograms", "train_demo_01"), {
    id: "train_demo_01",
    tenantId: TENANT_ID,
    title: "NEP 2020 Competency-Based Assessment Pedagogy",
    category: "Pedagogy & Curriculum",
    trainer: "CBSE Center of Excellence",
    startDate: "2026-11-05",
    endDate: "2026-11-07",
    attendeeCount: 25,
    status: "scheduled",
    createdAt: now,
    updatedAt: now,
  });

  console.log("\n==================================================================");
  console.log("  ✓ ALL PRODUCTION INSTITUTIONAL DATA SEEDED TO CLOUD FIRESTORE!");
  console.log("==================================================================\n");
}

seedAll().catch((err) => {
  console.error("[-] Seeding Error:", err);
  process.exit(1);
});
