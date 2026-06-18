# Enterprise HRMS SaaS Platform

An enterprise-grade, multi-tenant Human Resource Management System (HRMS) and Applicant Tracking System (ATS) built with React, TypeScript, and Firebase. 

Designed with modern SaaS aesthetics inspired by HiBob and Rippling, featuring a sleek neutral design system, robust data-level security, and a monorepo workspace architecture.

---

## 🚀 Key Features

* **Multi-Tenant Segregation:** Absolute data isolation at the database (Firestore) and file storage levels.
* **Dynamic RBAC & Data Scoping:** Granular permissions mapping to roles, with row-level data access restrictions (`self`, `team`, `department`, `all`). Org/Super Admins can customize the permission matrices of the operational roles (**HR Manager, Recruiter, Employee**) per tenant, with live runtime + Firestore/Storage-rule enforcement and audit logging. The Super Admin and Org Admin roles stay locked to prevent self-lockout.
* **Department Hierarchy:** Support for parent-child department trees with custom loop checking to prevent circular dependency cycles.
* **Applicant Tracking System (ATS):** Public-facing careers page, custom resume uploads, candidate tracking, and a Kanban stage pipeline.
* **Leave Management:** Custom policy definitions, accrual calculation engines, multi-step approval routing, and transactional balance protections.
* **Document Vault:** Secure file uploads, inline PDF/image preview modal, and metadata-gated access rules.
* **Custom Branding:** Support for organization logo uploads, light/dark themes, and personalized brand colors.

---

## 📁 Project Architecture

The project is structured as an npm workspaces monorepo:

```
hrms-ats-saas/
├── frontend/             # React (Vite) + TS + Tailwind Client Application
├── backend/              # Node.js Firebase Cloud Functions (Emailing & triggers)
├── middleware/           # Shared TS types & RBAC config configurations
├── firestore.rules       # Strict multi-tenant Firestore security rules
├── storage.rules         # Metadata-based Firebase Storage security rules
├── README.md             # High-level overview
├── SETUP.md              # Installation and emulator setup guide
└── DOCUMENTATION.md      # Tech specs, database schema, and UAT verification details
```

---

## 📖 Quick Links

* For local development, seeding, and emulator guides, see [SETUP.md](file:///d:/Projects/hrms-ats-saas/SETUP.md).
* For detailed technical specifications, database schema definitions, and RBAC matrix, see [DOCUMENTATION.md](file:///d:/Projects/hrms-ats-saas/DOCUMENTATION.md).
