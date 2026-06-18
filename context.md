# HRMS-ATS SaaS — Full Project Context

> Auto-generated context dump for debugging. Contains every source file in the monorepo.

## `README.md`

```md
# Enterprise HRMS SaaS Platform

An enterprise-grade, multi-tenant Human Resource Management System (HRMS) and Applicant Tracking System (ATS) built with React, TypeScript, and Firebase. 

Designed with modern SaaS aesthetics inspired by HiBob and Rippling, featuring a sleek neutral design system, robust data-level security, and a monorepo workspace architecture.

---

## ðŸš€ Key Features

* **Multi-Tenant Segregation:** Absolute data isolation at the database (Firestore) and file storage levels.
* **Dynamic RBAC & Data Scoping:** Granular permissions mapping to roles, with row-level data access restrictions (`self`, `team`, `department`, `all`). Org/Super Admins can customize the permission matrices of the operational roles (**HR Manager, Recruiter, Employee**) per tenant, with live runtime + Firestore/Storage-rule enforcement and audit logging. The Super Admin and Org Admin roles stay locked to prevent self-lockout.
* **Department Hierarchy:** Support for parent-child department trees with custom loop checking to prevent circular dependency cycles.
* **Applicant Tracking System (ATS):** Public-facing careers page, custom resume uploads, candidate tracking, and a Kanban stage pipeline.
* **Leave Management:** Custom policy definitions, accrual calculation engines, multi-step approval routing, and transactional balance protections.
* **Document Vault:** Secure file uploads, inline PDF/image preview modal, and metadata-gated access rules.
* **Custom Branding:** Support for organization logo uploads, light/dark themes, and personalized brand colors.

---

## ðŸ“ Project Architecture

The project is structured as an npm workspaces monorepo:

```
hrms-ats-saas/
â”œâ”€â”€ frontend/             # React (Vite) + TS + Tailwind Client Application
â”œâ”€â”€ backend/              # Node.js Firebase Cloud Functions (Emailing & triggers)
â”œâ”€â”€ middleware/           # Shared TS types & RBAC config configurations
â”œâ”€â”€ firestore.rules       # Strict multi-tenant Firestore security rules
â”œâ”€â”€ storage.rules         # Metadata-based Firebase Storage security rules
â”œâ”€â”€ README.md             # High-level overview
â”œâ”€â”€ SETUP.md              # Installation and emulator setup guide
â””â”€â”€ DOCUMENTATION.md      # Tech specs, database schema, and UAT verification details
```

---

## ðŸ“– Quick Links

* For local development, seeding, and emulator guides, see [SETUP.md](file:///d:/Projects/hrms-ats-saas/SETUP.md).
* For detailed technical specifications, database schema definitions, and RBAC matrix, see [DOCUMENTATION.md](file:///d:/Projects/hrms-ats-saas/DOCUMENTATION.md).
```

## `SETUP.md`

```md
# Local Development & Setup Guide

Follow these steps to set up the HRMS SaaS platform locally.

---

## ðŸ› ï¸ Prerequisites

Ensure you have the following installed:
* **Node.js** (v20 or higher recommended)
* **npm** (v10 or higher)
* **Firebase CLI** (install globally via `npm install -g firebase-tools`)
* **Java Development Kit (JDK)** (required to run Firebase Emulators locally)

---

## ðŸ’» Installation

1. **Clone the Repository** and navigate to the root directory.
2. **Install Monorepo Dependencies:**
   Run the following command in the root folder to install packages for the monorepo, including `frontend`, `backend`, and `middleware`:
   ```bash
   npm install
   ```

---

## âš™ï¸ Environment Variables Config

Configure local environment variables before starting the application.

### Frontend (`frontend/.env`)
Ensure `frontend/.env` is set up with emulator targets:
```env
VITE_USE_EMULATOR=true
VITE_FIREBASE_API_KEY=mock-api-key
VITE_FIREBASE_AUTH_DOMAIN=demo-mock-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=demo-mock-project
VITE_FIREBASE_STORAGE_BUCKET=demo-mock-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=mock-sender-id
VITE_FIREBASE_APP_ID=mock-app-id
```

### Backend (`backend/.env` & `backend/.env.local`)
Create a local secret/env configuration in `backend/` if sending emails or using custom functions integrations.

---

## ðŸ”Œ Running the Firebase Emulators

The project is fully configured to run offline using Firebase Local Emulators.

Start the emulators with the pre-populated database import:
```bash
npm run emulators
```
This loads local accounts, roles, sample candidates, departments, and employees from the restored `./.firebase-emulator-data` directory and starts the following local ports:
* **Emulator Suite UI:** `http://127.0.0.1:4000/`
* **Authentication Emulator:** Port `9099`
* **Firestore Emulator:** Port `8080`
* **Functions Emulator:** Port `5001`
* **Storage Emulator:** Port `9199`

> [!NOTE]
> The database states are persistently exported back to `./.firebase-emulator-data` when the emulators shut down, ensuring your development data carries over between sessions.

---

## ðŸ–¥ï¸ Running the Frontend Client

Once emulators are ready, spin up the React (Vite) development server:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173/`.

---

## ðŸ—ƒï¸ Seeding Demo Accounts & Sample Data

To restore the database to its default demo state, run the seed script:
```bash
npm run seed
```
This registers the following standard demo profiles (Password for all: `Demo@1234`):
* **Super Admin:** `superadmin@demo.io` (System settings visibility)
* **Org Admin:** `orgadmin@demo.io` (Full organization operations controls)
* **HR Manager:** `hr@demo.io` (Employee profiles, departments, and document uploads)
* **Recruiter:** `recruiter@demo.io` (Careers page postings & Kanban pipeline)
* **Employee:** `employee@demo.io` (Scoped personal dashboard & leave requests)

---

## ðŸ§ª Running Unit Tests

Run Vitest unit/integration tests in the frontend workspace:
```bash
npm -w frontend run test
```
This executes tests checking department loop prevention algorithms, leave duration accrual counters, and RBAC privilege configuration tables.
```

## `TODO.md`

```md
# TODO - Fix â€œAdd Employeeâ€ permission issue

- [x] Add permission guards in `frontend/src/features/employees/pages/EmployeesListPage.tsx` to prevent create/edit/delete employee actions when the user lacks:
  - `employees.create`
  - `employees.update`
  - `employees.delete`
- [x] Verify UI buttons already hidden still remain unchanged; ensure direct modal submit/delete is also blocked.
```

## `package.json`

```json
{
  "name": "hrms-ats-saas",
  "private": true,
  "version": "0.0.0",
  "workspaces": [
    "frontend",
    "backend",
    "middleware"
  ],
  "scripts": {
    "lint": "npm -ws run lint",
    "typecheck": "npm -ws run typecheck",
    "build": "npm -ws run build",
    "dev": "npm -ws run dev",
    "test": "npm -ws run test",
    "test:rules": "firebase emulators:exec --only firestore \"node tests/rules/rules.test.mjs\"",
    "seed": "node backend/seed-demo.cjs",
    "emulators": "firebase emulators:start --import=./.firebase-emulator-data --export-on-exit"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.4",
    "@firebase/rules-unit-testing": "^5.0.1",
    "@typescript-eslint/parser": "^8.61.1",
    "firebase": "^12.15.0"
  }
}
```

## `tsconfig.base.json`

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true,

    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,

    "baseUrl": ".",
    "paths": {
      "@hrms/middleware/*": ["middleware/src/*"]
    }
  }
}

```

## `firebase.json`

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": [
    {
      "source": "backend",
      "codebase": "default",
      "ignore": [
        "node_modules",
        ".git",
        "firebase-debug.log",
        "firestore-debug.log"
      ],
      "predeploy": [
        "npm --prefix \"$RESOURCE_DIR\" run build"
      ]
    }
  ],
  "storage": {
    "rules": "storage.rules"
  },
  "emulators": {
    "auth": {
      "host": "127.0.0.1",
      "port": 9099
    },
    "firestore": {
      "host": "127.0.0.1",
      "port": 8080
    },
    "functions": {
      "host": "127.0.0.1",
      "port": 5001
    },
    "storage": {
      "host": "127.0.0.1",
      "port": 9199
    },
    "ui": {
      "enabled": true,
      "host": "127.0.0.1",
      "port": 4000
    },
    "singleProjectMode": true
  }
}
```

## `firestore.rules`

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function getUserData() {
      // Throw-proof: returns the caller's user document data, or an empty map
      // when unauthenticated or the user doc does not exist. This prevents
      // rules "evaluation errors" (which surface as PERMISSION_DENIED with an
      // evaluation-error message and are hard to debug) and instead yields a
      // clean allow/deny.
      return (isAuthenticated() && exists(/databases/$(database)/documents/users/$(request.auth.uid)))
        ? get(/databases/$(database)/documents/users/$(request.auth.uid)).data
        : {};
    }

    function isMemberOfTenant(tenantId) {
      let data = getUserData();
      let tenantsMap = (data != null && 'tenants' in data) ? data.tenants : null;
      let tenantInfo = (tenantsMap != null && tenantId in tenantsMap) ? tenantsMap[tenantId] : null;
      return isAuthenticated() &&
        tenantInfo != null &&
        'status' in tenantInfo &&
        tenantInfo.status == 'active';
    }

    function isOwnerOfRecord(employeeId) {
      let path = /databases/$(database)/documents/employees/$(employeeId);
      return exists(path) && get(path).data.userId == request.auth.uid;
    }

    // Effective permission list for a customizable system role within a tenant.
    // Org/Super admins may tailor the HR Manager / Recruiter / Employee matrices;
    // the customization is stored in /roleOverrides/{tenantId}_{role}. When an
    // override exists it REPLACES the built-in defaults passed in; otherwise the
    // provided defaults apply.
    function rolePermissions(tenantId, roleType, defaults) {
      let overrideId = tenantId + '_' + roleType;
      let overridePath = /databases/$(database)/documents/roleOverrides/$(overrideId);
      return exists(overridePath)
        ? get(overridePath).data.get('permissions', [])
        : defaults;
    }

    function hasPermission(tenantId, permission) {
      // Throw-proof role lookup: missing tenant membership yields '' (no match).
      let data = getUserData();
      let tenantsMap = (data != null && 'tenants' in data) ? data.tenants : null;
      let tenantInfo = (tenantsMap != null && tenantId in tenantsMap) ? tenantsMap[tenantId] : null;
      let role = (tenantInfo != null && 'role' in tenantInfo) ? tenantInfo.role : '';
      return isMemberOfTenant(tenantId) && (
        role == 'super_admin' || 
        role == 'org_admin' ||
        // HR Manager permission checks (admins may customize this matrix per-tenant)
        (role == 'hr_manager' && (permission in rolePermissions(tenantId, 'hr_manager', [
          'users.view', 'users.create', 'users.update',
          'departments.view', 'departments.create', 'departments.update', 'departments.delete',
          'teams.view', 'teams.create', 'teams.update', 'teams.delete',
          'jobs.view',
          'candidates.view',
          'employees.view', 'employees.create', 'employees.update', 'employees.delete',
          'leave.view', 'leave.create', 'leave.update', 'leave.delete', 'leave.approve',
          'documents.view', 'documents.create', 'documents.update', 'documents.delete'
        ]))) ||
        // Recruiter permission checks (admins may customize this matrix per-tenant)
        (role == 'recruiter' && (permission in rolePermissions(tenantId, 'recruiter', [
          'users.view',
          'departments.view',
          'jobs.view', 'jobs.create', 'jobs.update', 'jobs.delete',
          'candidates.view', 'candidates.create', 'candidates.update', 'candidates.delete', 'candidates.export',
          'employees.view'
        ]))) ||
        // Employee permission checks (admins may customize this matrix per-tenant)
        (role == 'employee' && (permission in rolePermissions(tenantId, 'employee', [
          'users.view',
          'departments.view',
          'teams.view',
          'jobs.view',
          'employees.view',
          'leave.view', 'leave.create',
          'documents.view'
        ]))) ||
        // Custom Role permission checks (read role document from the root collection)
        (role != 'super_admin' && role != 'org_admin' && role != 'hr_manager' && role != 'recruiter' && role != 'employee' &&
         exists(/databases/$(database)/documents/roles/$(role)) &&
         permission in get(/databases/$(database)/documents/roles/$(role)).data.get('permissions', []))
      );
    }

    // Rules for /users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.auth.uid == userId;
      // SEC-001: a user may edit their OWN profile (displayName, photoURL,
      // activeTenantId, etc.) but MUST NOT change their tenant memberships or
      // roles â€” otherwise any user could self-promote to org_admin. Role/tenant
      // grants may only be changed by a holder of users.update (admins), or by
      // the Admin SDK (invitations / provisioning), which bypasses rules.
      allow update: if isAuthenticated() && (
        hasPermission(getUserData().activeTenantId, 'users.update') ||
        (
          request.auth.uid == userId &&
          request.resource.data.tenants == resource.data.tenants
        )
      );
      allow delete: if false;
    }

    // Rules for /tenants collection
    match /tenants/{tenantId} {
      allow read: if isMemberOfTenant(tenantId);
      allow create: if isAuthenticated();
      allow update: if hasPermission(tenantId, 'roles.update'); // Admins can update tenant settings
      allow delete: if false;
    }

    // Rules for root /roles collection
    match /roles/{roleId} {
      allow read: if isAuthenticated() && (resource == null || isMemberOfTenant(resource.data.tenantId));
      allow create: if isAuthenticated() && isMemberOfTenant(request.resource.data.tenantId) && hasPermission(request.resource.data.tenantId, 'roles.create');
      allow update: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'roles.update');
      allow delete: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'roles.delete') && !resource.data.isSystemRole;
    }

    // Rules for root /roleOverrides collection
    //
    // Tenant-scoped customizations of a system role's permission matrix (e.g. the
    // Employee role). Doc id is `${tenantId}_${systemRoleType}`. Any tenant member
    // may read (the override drives their own effective permissions), but only
    // holders of roles.update (org_admin / super_admin) may create, modify, or
    // remove an override.
    match /roleOverrides/{overrideId} {
      allow read: if isAuthenticated() && (resource == null || isMemberOfTenant(resource.data.tenantId));
      allow create: if isAuthenticated() && isMemberOfTenant(request.resource.data.tenantId) && hasPermission(request.resource.data.tenantId, 'roles.update');
      allow update: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'roles.update');
      allow delete: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'roles.update');
    }

    // Rules for root /userRoles collection
    match /userRoles/{userRoleId} {
      allow read: if isAuthenticated() && (resource == null || isMemberOfTenant(resource.data.tenantId));
      allow create, update: if isAuthenticated() && isMemberOfTenant(request.resource.data.tenantId) && hasPermission(request.resource.data.tenantId, 'roles.update');
      allow delete: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'roles.delete');
    }

    // Rules for /invitations collection
    match /invitations/{inviteId} {
      allow read: if isAuthenticated() && (
        resource == null ||
        request.auth.token.email == resource.data.email ||
        isMemberOfTenant(resource.data.tenantId)
      );
      allow create: if isAuthenticated() && 
        request.resource.data.status == 'pending' && 
        hasPermission(request.resource.data.tenantId, 'users.create');
      
      allow update: if isAuthenticated() && (
        (resource.data.email == request.auth.token.email) ||
        hasPermission(resource.data.tenantId, 'users.update')
      );
      allow delete: if isAuthenticated() && hasPermission(resource.data.tenantId, 'users.delete');
    }

    // Rules for /departments collection
    match /departments/{id} {
      allow read: if isAuthenticated() && (resource == null || (isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'departments.view')));
      allow create: if isAuthenticated() && isMemberOfTenant(request.resource.data.tenantId) && hasPermission(request.resource.data.tenantId, 'departments.create');
      allow update: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'departments.update');
      allow delete: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'departments.delete');
    }

    // Rules for /teams collection
    match /teams/{id} {
      allow read: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'teams.view');
      allow create: if isAuthenticated() && isMemberOfTenant(request.resource.data.tenantId) && hasPermission(request.resource.data.tenantId, 'teams.create');
      allow update: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'teams.update');
      allow delete: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'teams.delete');
    }

    // Rules for /jobs collection
    match /jobs/{id} {
      // Authenticated tenant members with jobs.view can read; additionally,
      // anyone (incl. unauthenticated careers-page visitors) may read a job
      // that is explicitly published and open.
      allow read: if (resource.data.isPublished == true && resource.data.status == 'open') ||
        (isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'jobs.view'));
      allow create: if isAuthenticated() && isMemberOfTenant(request.resource.data.tenantId) && hasPermission(request.resource.data.tenantId, 'jobs.create');
      allow update: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'jobs.update');
      allow delete: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'jobs.delete');
    }

    // Rules for /candidates collection
    match /candidates/{id} {
      allow read: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'candidates.view');
      allow create: if isAuthenticated() && isMemberOfTenant(request.resource.data.tenantId) && hasPermission(request.resource.data.tenantId, 'candidates.create');
      allow update: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'candidates.update');
      allow delete: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'candidates.delete');
    }

    // Rules for /candidateNotes collection (notes are scoped under candidates.*)
    match /candidateNotes/{id} {
      allow read: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'candidates.view');
      allow create: if isAuthenticated() && isMemberOfTenant(request.resource.data.tenantId) && hasPermission(request.resource.data.tenantId, 'candidates.update')
        && request.resource.data.authorId == request.auth.uid;
      // Notes are immutable once written; only the author (or a candidates.delete holder) can remove them.
      allow update: if false;
      allow delete: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && (
        resource.data.authorId == request.auth.uid || hasPermission(resource.data.tenantId, 'candidates.delete')
      );
    }

    // Rules for /interviews collection (scoped under candidates.*)
    match /interviews/{id} {
      allow read: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'candidates.view');
      allow create: if isAuthenticated() && isMemberOfTenant(request.resource.data.tenantId) && hasPermission(request.resource.data.tenantId, 'candidates.update');
      allow update: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'candidates.update');
      allow delete: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'candidates.update');
    }

    // Rules for /offers collection (scoped under candidates.*)
    match /offers/{id} {
      allow read: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'candidates.view');
      allow create: if isAuthenticated() && isMemberOfTenant(request.resource.data.tenantId) && hasPermission(request.resource.data.tenantId, 'candidates.update');
      allow update: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'candidates.update');
      allow delete: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'candidates.delete');
    }

    // Rules for /employees collection
    match /employees/{id} {
      // A get() on a NON-EXISTENT doc yields resource == null; allow it so the
      // create flow's employee-ID uniqueness check (getDoc before setDoc) returns
      // cleanly instead of erroring on null.data and surfacing as permission-denied.
      // There is no data to disclose for a non-existent document.
      allow read: if isAuthenticated() && (
        resource == null ||
        (isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'employees.view'))
      );
      allow create: if isAuthenticated() && isMemberOfTenant(request.resource.data.tenantId) && hasPermission(request.resource.data.tenantId, 'employees.create');
      allow update: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'employees.update');
      allow delete: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'employees.delete');
    }

    // Employee sub-records (contracts, emergency contacts, employment history,
    // assets, lifecycle events). All scoped under the employees.* permissions.

    // SEC-002: Compensation is sensitive and must NOT be exposed via the
    // world-(tenant)-readable employees doc. Salary lives here and is readable
    // ONLY by holders of employees.update (HR/admins) or the record's owner.
    match /employeeCompensation/{employeeId} {
      allow read: if isAuthenticated() && (
        resource == null ||
        (isMemberOfTenant(resource.data.tenantId) && (
          hasPermission(resource.data.tenantId, 'employees.update') ||
          isOwnerOfRecord(employeeId)
        ))
      );
      allow create: if isAuthenticated() && isMemberOfTenant(request.resource.data.tenantId) && hasPermission(request.resource.data.tenantId, 'employees.create');
      allow update: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'employees.update');
      allow delete: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'employees.delete');
    }

    match /employeeContracts/{id} {
      allow read: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'employees.view');
      allow create: if isAuthenticated() && isMemberOfTenant(request.resource.data.tenantId) && hasPermission(request.resource.data.tenantId, 'employees.update');
      allow update: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'employees.update');
      allow delete: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'employees.delete');
    }

    match /emergencyContacts/{id} {
      allow read: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'employees.view');
      allow create: if isAuthenticated() && isMemberOfTenant(request.resource.data.tenantId) && hasPermission(request.resource.data.tenantId, 'employees.update');
      allow update: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'employees.update');
      allow delete: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'employees.update');
    }

    match /employmentHistory/{id} {
      allow read: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'employees.view');
      allow create: if isAuthenticated() && isMemberOfTenant(request.resource.data.tenantId) && hasPermission(request.resource.data.tenantId, 'employees.update');
      allow update: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'employees.update');
      allow delete: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'employees.delete');
    }

    match /employeeAssets/{id} {
      allow read: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'employees.view');
      allow create: if isAuthenticated() && isMemberOfTenant(request.resource.data.tenantId) && hasPermission(request.resource.data.tenantId, 'employees.update');
      allow update: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'employees.update');
      allow delete: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'employees.update');
    }

    match /lifecycleEvents/{id} {
      allow read: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'employees.view');
      allow create: if isAuthenticated() && isMemberOfTenant(request.resource.data.tenantId) && hasPermission(request.resource.data.tenantId, 'employees.update');
      // Lifecycle events are an immutable audit trail.
      allow update: if false;
      allow delete: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'employees.delete');
    }

    // Rules for /leaveRequests collection
    match /leaveRequests/{id} {
      allow read: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && (
        hasPermission(resource.data.tenantId, 'leave.approve') ||
        hasPermission(resource.data.tenantId, 'leave.update') ||
        isOwnerOfRecord(resource.data.employeeId)
      );
      allow create: if isAuthenticated() && isMemberOfTenant(request.resource.data.tenantId) && (
        hasPermission(request.resource.data.tenantId, 'leave.create') &&
        isOwnerOfRecord(request.resource.data.employeeId)
      );
      allow update: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && (
        hasPermission(resource.data.tenantId, 'leave.update') || 
        hasPermission(resource.data.tenantId, 'leave.approve') ||
        (isOwnerOfRecord(resource.data.employeeId) && request.resource.data.status == 'cancelled' && (resource.data.status == 'pending' || resource.data.status == 'approved'))
      );
      allow delete: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'leave.delete');
    }

    // Leave configuration: leave types, policies, holiday calendars (admin-managed).
    match /leaveTypes/{id} {
      allow read: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'leave.view');
      allow create: if isAuthenticated() && isMemberOfTenant(request.resource.data.tenantId) && hasPermission(request.resource.data.tenantId, 'leave.update');
      allow update: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'leave.update');
      allow delete: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'leave.delete');
    }

    match /leavePolicies/{id} {
      allow read: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'leave.view');
      allow create: if isAuthenticated() && isMemberOfTenant(request.resource.data.tenantId) && hasPermission(request.resource.data.tenantId, 'leave.update');
      allow update: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'leave.update');
      allow delete: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'leave.delete');
    }

    match /holidayCalendars/{id} {
      allow read: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'leave.view');
      allow create: if isAuthenticated() && isMemberOfTenant(request.resource.data.tenantId) && hasPermission(request.resource.data.tenantId, 'leave.update');
      allow update: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'leave.update');
      allow delete: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'leave.delete');
    }

    // Leave balances: updated by accrual runs and request approvals.
    match /leaveBalances/{id} {
      allow read: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && (
        hasPermission(resource.data.tenantId, 'leave.update') ||
        hasPermission(resource.data.tenantId, 'leave.approve') ||
        isOwnerOfRecord(resource.data.employeeId)
      );
      allow create: if isAuthenticated() && isMemberOfTenant(request.resource.data.tenantId) && (hasPermission(request.resource.data.tenantId, 'leave.update') || hasPermission(request.resource.data.tenantId, 'leave.approve'));
      allow update: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && (hasPermission(resource.data.tenantId, 'leave.update') || hasPermission(request.resource.data.tenantId, 'leave.approve'));
      allow delete: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && hasPermission(resource.data.tenantId, 'leave.delete');
    }

    // Rules for /documents collection
    //
    // READ keeps role/scope semantics (admins + recruiters-for-candidate docs
    // can see everything in their lane; everyone else sees shared docs and docs
    // targeted to them). CREATE/UPDATE/DELETE are permission-driven via the RBAC
    // matrix (documents.create/update/delete), so custom roles that are granted
    // those permissions can manage documents â€” same as the other collections.
    // The recruiter+candidate special case is preserved for backwards-compat.
    match /documents/{id} {
      allow read: if isAuthenticated() && isMemberOfTenant(resource.data.get('tenantId', '')) && (
        getUserData().tenants[resource.data.get('tenantId', '')].role in ['super_admin', 'org_admin', 'hr_manager'] ||
        (getUserData().tenants[resource.data.get('tenantId', '')].role == 'recruiter' && resource.data.get('type', '') == 'candidate') ||
        (resource.data.get('accessLevel', '') == 'shared') ||
        (resource.data.get('targetUserId', '') == request.auth.uid)
      );
      allow create: if isAuthenticated() && isMemberOfTenant(request.resource.data.get('tenantId', '')) && (
        hasPermission(request.resource.data.get('tenantId', ''), 'documents.create') ||
        (getUserData().tenants[request.resource.data.get('tenantId', '')].role == 'recruiter' && request.resource.data.get('type', '') == 'candidate')
      );
      allow update: if isAuthenticated() && isMemberOfTenant(resource.data.get('tenantId', '')) && (
        hasPermission(resource.data.get('tenantId', ''), 'documents.update') ||
        (getUserData().tenants[resource.data.get('tenantId', '')].role == 'recruiter' && resource.data.get('type', '') == 'candidate')
      );
      allow delete: if isAuthenticated() && isMemberOfTenant(resource.data.get('tenantId', '')) && (
        hasPermission(resource.data.get('tenantId', ''), 'documents.delete') ||
        (getUserData().tenants[resource.data.get('tenantId', '')].role == 'recruiter' && resource.data.get('type', '') == 'candidate')
      );
    }

    // Rules for /notifications collection
    //
    // In-app notifications addressed to a specific user. Created server-side
    // (Cloud Functions) on approval events, but tenant members may also create
    // them. A recipient may read, mark-read (update), or dismiss (delete) ONLY
    // their own notifications; the userId/tenantId are immutable on update.
    match /notifications/{id} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && isMemberOfTenant(request.resource.data.tenantId);
      allow update: if isAuthenticated()
        && resource.data.userId == request.auth.uid
        && request.resource.data.userId == resource.data.userId
        && request.resource.data.tenantId == resource.data.tenantId;
      allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }

    // Rules for /auditLogs collection
    match /auditLogs/{id} {
      allow read: if isAuthenticated() && isMemberOfTenant(resource.data.tenantId) && (
        getUserData().tenants[resource.data.tenantId].role == 'super_admin' || 
        getUserData().tenants[resource.data.tenantId].role == 'org_admin'
      );
      allow create: if isAuthenticated() && isMemberOfTenant(request.resource.data.tenantId);
      allow update, delete: if false; // Audit logs are immutable
    }
  }
}
```

## `storage.rules`

```rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // ---- Helpers ------------------------------------------------------------
    function fsUser() {
      return firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data;
    }
    function memberRole(tenantId) {
      return fsUser().tenants[tenantId].role;
    }
    function isActiveMember(tenantId) {
      return request.auth != null && fsUser().tenants[tenantId].status == 'active';
    }
    // A custom (non-system) role grants vault mutation if its role document
    // carries any document mutation permission. System roles are matched by
    // name below, mirroring firestore.rules.
    function customRoleCanMutateVault(tenantId) {
      let rolePath = /databases/(default)/documents/roles/$(memberRole(tenantId));
      return firestore.exists(rolePath) && (
        'documents.create' in firestore.get(rolePath).data.permissions ||
        'documents.update' in firestore.get(rolePath).data.permissions ||
        'documents.delete' in firestore.get(rolePath).data.permissions
      );
    }
    // A system role whose permission matrix has been customized for this tenant.
    // When such an override exists it is AUTHORITATIVE for that role (it replaces
    // the built-in allowance below), mirroring the /roleOverrides model and the
    // `rolePermissions` logic in firestore.rules. Override id is `${tenantId}_${role}`.
    function systemRoleOverridePath(tenantId) {
      return /databases/(default)/documents/roleOverrides/$(tenantId + '_' + memberRole(tenantId));
    }
    function hasSystemRoleOverride(tenantId) {
      return firestore.exists(systemRoleOverridePath(tenantId));
    }
    function systemRoleOverrideCanMutateVault(tenantId) {
      let perms = firestore.get(systemRoleOverridePath(tenantId)).data.get('permissions', []);
      return 'documents.create' in perms ||
        'documents.update' in perms ||
        'documents.delete' in perms;
    }
    function canMutateVault(tenantId) {
      return isActiveMember(tenantId) && (
        // A tenant override (HR Manager / Recruiter / Employee) is authoritative.
        hasSystemRoleOverride(tenantId)
          ? systemRoleOverrideCanMutateVault(tenantId)
          : (
              memberRole(tenantId) in ['super_admin', 'org_admin', 'hr_manager', 'recruiter'] ||
              customRoleCanMutateVault(tenantId)
            )
      );
    }

    match /tenants/{tenantId}/logos/{allPaths=**} {
      // Tenant logo is public to read (for login screens / headers before full auth)
      allow read: if true;
      // Writing requires authentication and admin privileges in the tenant
      allow write: if request.auth != null && 
        firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.tenants[tenantId].status == 'active' &&
        (firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.tenants[tenantId].role in ['super_admin', 'org_admin', 'hr_manager']);
    }

    // Candidate resumes.
    match /tenants/{tenantId}/resumes/{fileName} {
      // Only authenticated tenant members may read resumes.
      allow read: if request.auth != null &&
        firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.tenants[tenantId].status == 'active';

      // Create is allowed for:
      //  - authenticated tenant members (internal candidate creation), and
      //  - unauthenticated careers-page applicants (public job applications).
      // SECURITY NOTE: public create enables anonymous uploads to support the
      // careers page. It is constrained to <= 5MB and resume MIME types to
      // limit abuse. Consider adding App Check / rate limiting before launch.
      allow create: if request.resource.size < 5 * 1024 * 1024 &&
        request.resource.contentType.matches('application/pdf|application/msword|application/vnd.openxmlformats-officedocument.wordprocessingml.document');

      // Overwrite/delete restricted to authenticated tenant members.
      allow update, delete: if request.auth != null &&
        firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.tenants[tenantId].status == 'active';
    }

    // Employee documents (e.g. signed contracts). Authenticated tenant members only.
    match /tenants/{tenantId}/employee-docs/{allPaths=**} {
      allow read, write: if request.auth != null &&
        firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.tenants[tenantId].status == 'active';
    }

    // Vault documents. Secure storage scoped under tenants/{tenantId}/documents/{docId}
    match /tenants/{tenantId}/documents/{docId} {
      allow read: if request.auth != null && isActiveMember(tenantId) &&
        (
          memberRole(tenantId) in ['super_admin', 'org_admin', 'hr_manager'] ||
          // Anyone allowed to manage the vault may read it. Placed before the
          // metadata lookups so it short-circuits and also covers the moment
          // right after upload, when the Firestore metadata doc does not yet
          // exist (e.g. getDownloadURL called by the uploader).
          canMutateVault(tenantId) ||
          // Metadata-driven access. Guarded by exists() so that reading an
          // object whose metadata doc is missing (e.g. mid-upload, or an
          // orphaned file) yields a clean permission denial rather than a
          // rules evaluation error â€” the latter surfaces as an HTTP 500 that
          // the Storage SDK retries, making uploads appear to hang ("stuck").
          (
            firestore.exists(/databases/(default)/documents/documents/$(docId)) &&
            (
              firestore.get(/databases/(default)/documents/documents/$(docId)).data.accessLevel == 'shared' ||
              firestore.get(/databases/(default)/documents/documents/$(docId)).data.targetUserId == request.auth.uid ||
              (
                memberRole(tenantId) == 'recruiter' &&
                firestore.get(/databases/(default)/documents/documents/$(docId)).data.type == 'candidate'
              )
            )
          )
        );
      allow write: if canMutateVault(tenantId);
    }

  }
}
```

## `eslint.config.mjs`

```js
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    ignores: [
      "**/dist/**",
      "**/lib/**",
      "**/node_modules/**",
      "**/.firebase/**",
      "**/.emulator-data/**",
      "**/.firebase-emulator-data/**",
      "**/*.cjs",
      "**/*.config.*",
      "eslint.config.mjs",
    ],
  },
  // Plain JS gets the recommended ruleset.
  {
    ...js.configs.recommended,
    files: ["**/*.{js,jsx,mjs}"],
  },
  // TypeScript / TSX: parse with the TS parser and run React Hooks rules.
  // Type-level correctness is enforced by `tsc --noEmit`; ESLint here focuses
  // on hooks correctness and obvious JS mistakes.
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // Handled by the TypeScript compiler; disable the base rules to avoid
      // false positives on type-only constructs.
      "no-unused-vars": "off",
      "no-undef": "off",
      "no-redeclare": "off",
    },
  },
];
```

## `frontend\.env`

```env
VITE_USE_EMULATOR=true
VITE_USE_AUTH_EMULATOR=true
VITE_FIREBASE_API_KEY=mock-api-key-for-local-emulator-suite-12345
VITE_FIREBASE_AUTH_DOMAIN=demo-mock-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=demo-mock-project
VITE_FIREBASE_STORAGE_BUCKET=demo-mock-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=mock-sender-id
VITE_FIREBASE_APP_ID=mock-app-id
```

## `frontend\package.json`

```json
{
  "name": "@hrms/frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@hookform/resolvers": "^5.4.0",
    "@hrms/middleware": "*",
    "@radix-ui/react-accordion": "^1.2.1",
    "@radix-ui/react-alert-dialog": "^1.1.2",
    "@radix-ui/react-avatar": "^1.1.1",
    "@radix-ui/react-dialog": "^1.1.2",
    "@radix-ui/react-dropdown-menu": "^2.1.2",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-navigation-menu": "^1.2.0",
    "@radix-ui/react-popover": "^1.1.2",
    "@radix-ui/react-select": "^2.1.2",
    "@radix-ui/react-separator": "^1.1.0",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-tabs": "^1.1.1",
    "@radix-ui/react-toast": "^1.2.2",
    "@radix-ui/react-tooltip": "^1.1.4",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "firebase": "^12.14.0",
    "lucide-react": "^0.453.0",
    "react": "^19.2.6",
    "react-dom": "^19.2.6",
    "react-hook-form": "^7.54.2",
    "react-router-dom": "^7.17.0",
    "react-use": "^17.5.0",
    "sonner": "^1.7.1",
    "tailwind-merge": "^2.5.5",
    "tailwindcss-animate": "^1.0.7",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.3.0",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.1",
    "autoprefixer": "^10.4.20",
    "eslint": "^10.3.0",
    "eslint-plugin-react-hooks": "^7.1.1",
    "globals": "^17.6.0",
    "tailwindcss": "^4.3.0",
    "typescript": "^5.6.3",
    "vite": "^8.0.12",
    "vitest": "^4.1.9"
  }
}
```

## `frontend\tsconfig.json`

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "types": ["vite/client"],
    "jsx": "react-jsx",
    "noEmit": true,
    "incremental": true,
    "outDir": "dist"
  },
  "include": ["src"]
}

```

## `frontend\vite.config.ts`

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});

```

## `frontend\vitest.config.ts`

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    globals: false,
  },
});
```

## `frontend\tailwind.config.ts`

```ts
import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#F8FAFC",
      },
      borderRadius: {
        xl: "16px",
        lg: "12px",
      },
    },
  },
  plugins: [],
} satisfies Config;

```

## `frontend\postcss.config.js`

```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
    autoprefixer: {},
  },
};


```

## `frontend\index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>HRMS SaaS</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>

```

## `frontend\src\main.tsx`

```tsx
/**
 * main.tsx
 * --------
 * Application entry/bootstrap. Mounts the React tree into the #root element,
 * wrapping <App> with StrictMode, the router (BrowserRouter) and the global
 * AuthProvider, and importing global styles. Side-effecting by design.
 */
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./features/auth/context/AuthContext";
import "./index.css";

// Mount the app into the #root element (non-null asserted â€” present in index.html).
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
```

## `frontend\src\App.tsx`

```tsx
/**
 * App.tsx
 * -------
 * Root application component. Declares the full client-side route table:
 * public auth/careers routes plus authenticated SaaS routes that are gated by
 * `AuthGuard` (session) and `ProtectedRoute` (per-permission RBAC). Lazy route
 * loads are covered by the top-level <Suspense> fallback.
 */
import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense } from "react";
import { AppShell } from "./components/layout/AppShell";
import { AuthGuard } from "./components/auth/AuthGuard";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

// Auth pages
import { LoginPage } from "./features/auth/pages/LoginPage";
import { ForgotPasswordPage } from "./features/auth/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./features/auth/pages/ResetPasswordPage";

// Business pages
import { DashboardPage } from "./features/dashboard/pages/DashboardPage";
import { UsersListPage } from "./features/users/pages/UsersListPage";
import { UserDetailsPage } from "./features/users/pages/UserDetailsPage";
import { RbacPage } from "./features/rbac/pages/RbacPage";
import { SettingsPage } from "./features/settings/pages/SettingsPage";
import { EmployeesListPage } from "./features/employees/pages/EmployeesListPage";
import { EmployeeProfilePage } from "./features/employees/pages/EmployeeProfilePage";
import { TeamsListPage } from "./features/teams/pages/TeamsListPage";
import { JobsListPage } from "./features/recruitment/pages/JobsListPage";
import { PipelinePage } from "./features/recruitment/pages/PipelinePage";
import { CareersPage } from "./features/recruitment/pages/CareersPage";
import { LeaveManagementPage } from "./features/leave/pages/LeaveManagementPage";
import { DocumentsPage } from "./features/documents/pages/DocumentsPage";

// Common pages
import { NotFoundPage } from "./features/common/pages/NotFoundPage";
import { LoadingScreen } from "./components/ui/LoadingScreen";

/** Root component: renders the application's route tree. */
export default function App() {
  return (
    <Suspense fallback={<LoadingScreen title="Loading application..." />}>
      <Routes>
        {/* Public auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Public careers page (no authentication required) */}
        <Route path="/careers/:tenantId" element={<CareersPage />} />

        {/* Protected SaaS routes */}
        <Route
          element={
            <AuthGuard>
              <AppShell />
            </AuthGuard>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route 
            path="/employees" 
            element={
              <ProtectedRoute permission="employees.view">
                <EmployeesListPage />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/employees/:id"
            element={
              <ProtectedRoute permission="employees.view">
                <EmployeeProfilePage />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/teams" 
            element={
              <ProtectedRoute permission="teams.view">
                <TeamsListPage />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/jobs"
            element={
              <ProtectedRoute permission="jobs.view">
                <JobsListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pipeline"
            element={
              <ProtectedRoute permission="candidates.view">
                <PipelinePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leave"
            element={
              <ProtectedRoute permission="leave.view">
                <LeaveManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/documents"
            element={
              <ProtectedRoute permission="documents.view">
                <DocumentsPage />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/users" 
            element={
              <ProtectedRoute permission="users.view">
                <UsersListPage />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/users/:id" 
            element={
              <ProtectedRoute permission="users.view">
                <UserDetailsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/rbac" 
            element={
              <ProtectedRoute permission="roles.view">
                <RbacPage />
              </ProtectedRoute>
            } 
          />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

```

## `frontend\src\index.css`

```css
@import "tailwindcss";

@theme {
  --color-primary: #2563EB;
  --color-primary-hover: #1D4ED8;
  --color-success: #16A34A;
  --color-warning: #F59E0B;
  --color-danger: #DC2626;
  --color-background: #F8FAFC;
  --color-card: #FFFFFF;
  --color-border: #E2E8F0;
  --color-text-primary: #0F172A;
  --color-text-secondary: #64748B;
  
  --radius-xl: 12px;
  --radius-2xl: 16px;
}

:root {
  color-scheme: light;
}

html,
body {
  height: 100%;
}

body {
  margin: 0;
  background-color: var(--color-background);
  color: var(--color-text-primary);
  font-family: 'Outfit', 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
}
```

## `frontend\src\lib\firebase.ts`

```ts
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

// Initialize App Check
let appCheck: AppCheck | undefined = undefined;
if (typeof window !== "undefined") {
  if (import.meta.env.VITE_USE_EMULATOR === "true") {
    // Enable self debug token for local emulator development
    (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(
      import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" // Standard google test key
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
```

## `frontend\src\lib\errors.ts`

```ts
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
    /\b[a-z]+\/[a-z0-9-]+\b/.test(m) ||              // service/code style (auth/â€¦, storage/â€¦)
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
    // An app-thrown Error with a human-friendly message â€” keep it.
    return raw;
  }

  return fallback;
}
```

## `frontend\src\lib\csv.ts`

```ts
/**
 * csv.ts
 * -------
 * Client-side CSV export helper. Builds RFC-4180-style CSV text in memory and
 * streams it to the browser as a file download â€” no server round-trip and no
 * third-party dependencies. Used by list/report screens for "Export to CSV".
 */

/**
 * Minimal, dependency-free CSV export. Properly escapes quotes/commas/newlines
 * and triggers a client-side download.
 *
 * @param filename Desired file name; a ".csv" extension is appended if missing.
 * @param headers  Column header labels written as the first row.
 * @param rows     Data rows; `null`/`undefined` cells become empty strings.
 */
export function downloadCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>
): void {
  // Escape a single cell: wrap in double quotes (and double any embedded
  // quotes) only when the value contains a quote, comma, or line break.
  const esc = (v: string | number | null | undefined): string => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  // Join cells with commas and rows with CRLF, header row first.
  const csv = [headers, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
  // Prepend BOM so Excel detects UTF-8.
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  // Use a transient anchor element to trigger the browser's download flow.
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Release the blob URL so the object can be garbage-collected.
  URL.revokeObjectURL(url);
}
```

## `frontend\src\lib\utils.ts`

```ts
/**
 * utils.ts
 * --------
 * Small, shared UI utility helpers.
 */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine conditional class names and resolve conflicting Tailwind classes.
 * `clsx` flattens/filters the inputs; `twMerge` then dedupes/overrides
 * conflicting Tailwind utilities (e.g. `px-2 px-4` -> `px-4`).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## `frontend\src\components\auth\AuthGuard.tsx`

```tsx
/**
 * AuthGuard
 * ---------
 * Authentication boundary component. Wraps protected UI and ensures that only
 * authenticated users can view its children. While the auth state is still
 * resolving it shows a loading screen, and unauthenticated users are redirected
 * to the login route.
 */
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../features/auth/context/AuthContext";
import { LoadingScreen } from "../ui/LoadingScreen";

/**
 * Renders its children only for authenticated users.
 *
 * @param children - The protected content to render once authentication is confirmed.
 * @returns A loading screen while auth resolves, a redirect to `/login` when no
 *          user is present, or the children when authenticated.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  // Auth state not yet resolved â€” avoid flashing a redirect before we know.
  if (loading) {
    return <LoadingScreen title="Checking authentication..." />;
  }

  // No authenticated user â€” send them to the login page.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default AuthGuard;
```

## `frontend\src\components\auth\PermissionGate.tsx`

```tsx
/**
 * PermissionGate
 * --------------
 * Conditionally renders UI based on the current user's granular RBAC
 * permissions. Use it to hide actions/sections a user is not allowed to see
 * without changing routing. Unlike `ProtectedRoute`, it never redirects â€” it
 * simply renders a fallback (or nothing) when permission is missing.
 */
import { ReactNode } from "react";
import { useHasPermission } from "../../features/rbac/hooks/usePermissions";
import type { PermissionKey } from "@hrms/middleware";

interface PermissionGateProps {
  /** The permission key the current user must hold to see `children`. */
  permission: PermissionKey;
  /** Content shown when the user has the required permission. */
  children: ReactNode;
  /** Optional content shown when the user lacks the permission (defaults to nothing). */
  fallback?: ReactNode;
}

/**
 * Enterprise Permission Gate to conditionally render children based on user permissions.
 *
 * @param permission - The granular permission required to render `children`.
 * @param children - Content rendered when the permission check passes.
 * @param fallback - Content rendered when the permission check fails (defaults to `null`).
 * @returns The children when permitted, otherwise the fallback.
 */
export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const hasPermission = useHasPermission();

  // Render the fallback when the active user lacks the required permission.
  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default PermissionGate;
```

## `frontend\src\components\auth\ProtectedRoute.tsx`

```tsx
/**
 * ProtectedRoute
 * --------------
 * Route-level guard that combines authentication and (optionally) a granular
 * permission check. Used to wrap route elements so unauthenticated users are
 * redirected to login and authenticated-but-unauthorized users are redirected
 * to the dashboard.
 */
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../features/auth/context/AuthContext";
import { useHasPermission } from "../../features/rbac/hooks/usePermissions";
import type { PermissionKey } from "@hrms/middleware";
import { LoadingScreen } from "../ui/LoadingScreen";

interface ProtectedRouteProps {
  /** The route content to render when access checks pass. */
  children: ReactNode;
  /** Optional permission required to access the route; when omitted, only auth is checked. */
  permission?: PermissionKey;
}

/**
 * Route protection guard that checks both authentication and granular permission requirements.
 *
 * @param children - The route content to render when access is granted.
 * @param permission - Optional permission key; if provided and missing, the user is redirected to `/dashboard`.
 * @returns A loading screen while auth resolves, a redirect to `/login` (unauthenticated)
 *          or `/dashboard` (unauthorized), or the children when access is granted.
 */
export function ProtectedRoute({ children, permission }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const hasPermission = useHasPermission();

  // Auth state not yet resolved â€” wait before deciding on redirects.
  if (loading) {
    return <LoadingScreen title="Verifying authorization..." />;
  }

  // Not signed in â€” send to login.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Signed in but lacking the required permission â€” bounce to the dashboard.
  if (permission && !hasPermission(permission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
```

## `frontend\src\components\layout\AppShell.tsx`

```tsx
/**
 * AppShell
 * --------
 * Top-level authenticated application layout. Composes the persistent sidebar
 * navigation and top header around a routed content area. The nested route's
 * element is rendered into the `<Outlet />`.
 */
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopHeader } from "./TopHeader";

/**
 * Renders the main application chrome (sidebar + header) with the active child
 * route displayed in the central content region.
 *
 * @returns The application shell layout containing the routed outlet.
 */
export function AppShell() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="flex min-h-dvh">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopHeader />
          <main className="flex-1 p-4 sm:p-6 md:p-8">
            {/* Active nested route renders here. */}
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default AppShell;
```

## `frontend\src\components\layout\Sidebar.tsx`

```tsx
/**
 * Sidebar
 * -------
 * Primary left-hand navigation for the authenticated app shell. Renders the
 * tenant branding, a permission-filtered list of navigation destinations, and a
 * user/footer section with sign-out. Supports a collapsed (icon-only) mode and
 * reflects the active tenant's primary brand color.
 */
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, Shield, Settings, ChevronLeft, ChevronRight, LogOut, Briefcase, Network, KanbanSquare, FileText, CalendarDays, FolderLock } from "lucide-react";
import { useAuth } from "../../features/auth/context/AuthContext";
import { useHasPermission } from "../../features/rbac/hooks/usePermissions";
import type { PermissionKey } from "@hrms/middleware";

interface MenuItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  // The granular permission required to see this item. Items without a
  // permission are always visible (Dashboard, Org Settings). Each value mirrors
  // the corresponding route guard in App.tsx so the menu only surfaces
  // destinations the current role can actually open.
  permission?: PermissionKey;
}

/**
 * Renders the application's primary navigation sidebar.
 *
 * Builds the full menu, filters it down to destinations the current role is
 * permitted to access, and displays tenant/user branding. Includes a
 * collapse/expand toggle and a logout action.
 *
 * @returns The sidebar navigation element.
 */
export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { activeTenant, profile, logout } = useAuth();
  const hasPermission = useHasPermission();

  const allMenuItems: MenuItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Employees", href: "/employees", icon: Briefcase, permission: "employees.view" },
    { label: "Teams", href: "/teams", icon: Network, permission: "teams.view" },
    { label: "Job Requisitions", href: "/jobs", icon: FileText, permission: "jobs.view" },
    { label: "Pipeline", href: "/pipeline", icon: KanbanSquare, permission: "candidates.view" },
    { label: "Leave", href: "/leave", icon: CalendarDays, permission: "leave.view" },
    { label: "Document Vault", href: "/documents", icon: FolderLock, permission: "documents.view" },
    { label: "Users & Invites", href: "/users", icon: Users, permission: "users.view" },
    { label: "RBAC Roles", href: "/rbac", icon: Shield, permission: "roles.view" },
    { label: "Org Settings", href: "/settings", icon: Settings },
  ];

  // Hide any destination the current role lacks permission for. Items without a
  // declared permission stay visible to every authenticated member.
  const menuItems = allMenuItems.filter(
    (item) => !item.permission || hasPermission(item.permission)
  );


  // Derive up-to-two-letter initials from a display name for the avatar fallback.
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  // Active tenant brand color, falling back to the default blue when unset.
  const primaryColor = activeTenant?.primaryColor || "#2563eb";

  return (
    <aside
      className={`flex flex-col border-r border-slate-200 bg-white transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
      aria-label="Sidebar navigation"
    >
      {/* Top Header Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-100">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            {activeTenant?.logoURL ? (
              <img
                src={activeTenant.logoURL}
                alt={activeTenant.name}
                className="h-8 w-8 rounded-lg object-cover"
              />
            ) : (
              <div 
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white font-bold text-sm"
                style={{ backgroundColor: primaryColor }}
              >
                {activeTenant ? getInitials(activeTenant.name) : "HR"}
              </div>
            )}
            <div className="truncate max-w-[140px]">
              <h1 className="text-sm font-bold text-slate-900 truncate">
                {activeTenant?.name || "Acme Org"}
              </h1>
              <p 
                className="text-[10px] font-semibold tracking-wider uppercase"
                style={{ color: primaryColor }}
              >
                {profile?.activeTenantId
                  ? profile.tenants?.[profile.activeTenantId]?.role?.replace("_", " ") || "Member"
                  : "Member"}
              </p>
            </div>
          </div>
        ) : (
          <div 
            className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-white font-bold text-sm"
            style={{ backgroundColor: primaryColor }}
          >
            {activeTenant ? getInitials(activeTenant.name) : "HR"}
          </div>
        )}

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-400 hover:text-slate-900 cursor-pointer"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1.5 px-3 py-4" aria-label="Navigation">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.href}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
                    isActive
                      ? ""
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`
                }
                style={({ isActive }) => 
                  isActive ? { backgroundColor: `${primaryColor}15`, color: primaryColor } : {}
                }
              >
                <item.icon size={18} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User info & Signout */}
      <div className="border-t border-slate-100 p-3">
        <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
          {profile?.photoURL ? (
            <img src={profile.photoURL} alt={profile.displayName} className="h-9 w-9 rounded-full object-cover" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold text-sm">
              {profile ? getInitials(profile.displayName) : "U"}
            </div>
          )}

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-slate-900 truncate">{profile?.displayName}</h2>
              <p className="text-xs text-slate-500 truncate">{profile?.email}</p>
            </div>
          )}

          <button
            type="button"
            onClick={logout}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
            aria-label="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
```

## `frontend\src\components\layout\TopHeader.tsx`

```tsx
/**
 * TopHeader
 * ---------
 * Sticky top bar for the authenticated app shell. Provides a global search
 * input, an organization (tenant) switcher for users belonging to multiple
 * tenants, and the notifications bell. Tenant documents are loaded lazily from
 * Firestore based on the membership map on the user's profile.
 */
import { useState, useEffect } from "react";
import { Search, ChevronDown, Building2 } from "lucide-react";
import { useAuth } from "../../features/auth/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { NotificationBell } from "../../features/notifications/components/NotificationBell";
import type { Tenant } from "@hrms/middleware";

/**
 * Renders the application's top header bar.
 *
 * Fetches the full tenant records for every tenant the user belongs to (to
 * populate the switcher), exposes a search field, and renders the tenant
 * switcher (only interactive when the user has more than one tenant) plus the
 * notification bell.
 *
 * @returns The header element.
 */
export function TopHeader() {
  const { profile, activeTenant, switchTenant } = useAuth();
  const [tenantsList, setTenantsList] = useState<Tenant[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Load the Tenant documents for each tenant the user is a member of so the
  // switcher can display their names; re-runs whenever the membership map changes.
  useEffect(() => {
    if (!profile?.tenants) {
      setTenantsList([]);
      return;
    }

    const tenantIds = Object.keys(profile.tenants);
    if (tenantIds.length === 0) {
      setTenantsList([]);
      return;
    }

    const fetchTenants = async () => {
      try {
        // Fetch all tenant docs in parallel, then keep only the ones that exist.
        const promises = tenantIds.map((id) => getDoc(doc(db, "tenants", id)));
        const snaps = await Promise.all(promises);
        const list: Tenant[] = [];
        snaps.forEach((snap) => {
          if (snap.exists()) {
            list.push(snap.data() as Tenant);
          }
        });
        setTenantsList(list);
      } catch (err) {
        console.error("Error fetching tenants for switcher:", err);
      }
    };

    fetchTenants();
  }, [profile?.tenants]);

  // Switch the active tenant and close the dropdown on success.
  const handleTenantChange = async (tenantId: string) => {
    try {
      await switchTenant(tenantId);
      setDropdownOpen(false);
    } catch (err) {
      console.error("Failed to switch tenant:", err);
    }
  };

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
      <div className="flex h-16 items-center justify-between gap-4 px-6 md:px-8">
        {/* Search Input */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search employees, roles, tasks..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-600/60 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
            aria-label="Search"
          />
        </div>

        {/* Action Items */}
        <div className="flex items-center gap-4">
          {/* Tenant Switcher â€” interactive dropdown only when more than one tenant exists. */}
          {tenantsList.length > 1 ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                aria-haspopup="true"
                aria-expanded={dropdownOpen}
              >
                <Building2 size={16} className="text-slate-500" />
                <span>{activeTenant?.name || "Select Org"}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1 shadow-md z-20">
                  <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Switch Organization
                  </div>
                  {tenantsList.map((tenant) => {
                    const isSelected = tenant.id === activeTenant?.id;
                    const tenantPrimaryColor = tenant.primaryColor || "#2563eb";
                    return (
                      <button
                        key={tenant.id}
                        onClick={() => handleTenantChange(tenant.id)}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold cursor-pointer ${
                          isSelected
                            ? ""
                            : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                        style={isSelected ? { backgroundColor: `${tenantPrimaryColor}15`, color: tenantPrimaryColor } : {}}
                      >
                        <span>{tenant.name}</span>
                        {isSelected && (
                          <span 
                            className="h-1.5 w-1.5 rounded-full" 
                            style={{ backgroundColor: tenantPrimaryColor }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-sm font-semibold text-slate-600">
              <Building2 size={16} className="text-slate-400" />
              <span>{activeTenant?.name || "Single Org"}</span>
            </div>
          )}

          {/* Notifications */}
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}

export default TopHeader;
```

## `frontend\src\components\ui\EmptyState.tsx`

```tsx
/**
 * EmptyState
 * ----------
 * Presentational placeholder shown when a list/collection has no data. Displays
 * an icon, title, description, and an optional call-to-action button. All text
 * has sensible defaults so callers can render it with no props.
 */
import { FolderOpen } from "lucide-react";
import { ReactNode } from "react";

interface EmptyStateProps {
  /** Headline text (defaults to "No data found"). */
  title?: string;
  /** Supporting description text. */
  description?: string;
  /** Custom icon node; falls back to a folder icon when omitted. */
  icon?: ReactNode;
  /** Label for the optional action button. */
  actionLabel?: string;
  /** Click handler for the optional action button. */
  onAction?: () => void;
}

/**
 * Renders an empty-state placeholder with optional call-to-action.
 *
 * @param title - Headline text.
 * @param description - Supporting copy.
 * @param icon - Optional custom icon; defaults to a folder icon.
 * @param actionLabel - Label for the action button.
 * @param onAction - Handler invoked when the action button is clicked.
 * @returns The empty-state element. The action button only renders when both
 *          `actionLabel` and `onAction` are provided.
 */
export function EmptyState({
  title = "No data found",
  description = "There's nothing here yet. Get started by creating a new entry.",
  icon,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        {/* Use the provided icon, or a default folder icon. */}
        {icon ?? <FolderOpen className="h-6 w-6" />}
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-500 max-w-sm">{description}</p>
      {/* Only render the action button when both a label and handler are given. */}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
```

## `frontend\src\components\ui\ErrorState.tsx`

```tsx
/**
 * ErrorState
 * ----------
 * Presentational component shown when content fails to load. Displays an alert
 * icon, title, description, and an optional retry button. Text props default to
 * generic error messaging.
 */
import { AlertCircle } from "lucide-react";

interface ErrorStateProps {
  /** Headline text (defaults to "Something went wrong"). */
  title?: string;
  /** Supporting description text. */
  description?: string;
  /** Optional retry handler; when provided, a "Try Again" button is rendered. */
  onRetry?: () => void;
}

/**
 * Renders an error-state placeholder with an optional retry action.
 *
 * @param title - Headline text.
 * @param description - Supporting copy.
 * @param onRetry - Handler invoked when the retry button is clicked; the button
 *                  only renders when this is provided.
 * @returns The error-state element.
 */
export function ErrorState({
  title = "Something went wrong",
  description = "An error occurred while loading this content. Please try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-500 max-w-sm">{description}</p>
      {/* Only render the retry button when a handler is supplied. */}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export default ErrorState;
```

## `frontend\src\components\ui\LoadingScreen.tsx`

```tsx
/**
 * LoadingScreen
 * -------------
 * Full-viewport loading placeholder used while async/auth state resolves.
 * Renders animated skeleton bars inside a centered card with an optional
 * status message.
 */

/**
 * Renders a centered, full-height loading screen with skeleton placeholders.
 *
 * @param title - Optional status message shown beneath the skeletons (defaults to "Loading").
 * @returns The loading screen element.
 */
export function LoadingScreen({ title }: { title?: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="animate-pulse rounded-lg bg-background h-6 w-2/3" aria-hidden="true" />
        <div className="mt-4 animate-pulse rounded-lg bg-background h-4 w-full" aria-hidden="true" />
        <div className="mt-2 animate-pulse rounded-lg bg-background h-4 w-5/6" aria-hidden="true" />
        <p className="mt-4 text-sm text-text-secondary">{title ?? "Loading"}</p>
      </div>
    </div>
  );
}

export default LoadingScreen;
```

## `frontend\src\components\ui\Skeleton.tsx`

```tsx
/**
 * Skeleton
 * --------
 * Generic shimmering placeholder block used to indicate loading content. Merges
 * caller-provided classes (e.g. width/height) with the base pulse styling and
 * forwards all standard div attributes.
 */
import { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

/**
 * Renders an animated skeleton placeholder `<div>`.
 *
 * @param className - Additional classes merged with the base skeleton styles.
 * @param props - Any other standard `<div>` attributes, spread onto the element.
 * @returns The skeleton placeholder element.
 */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      // `cn` merges the base pulse/rounded styling with any caller overrides.
      className={cn("animate-pulse rounded-md bg-slate-200/80 dark:bg-slate-800/80", className)}
      {...props}
    />
  );
}

export default Skeleton;
```

## `frontend\src\features\auth\context\AuthContext.tsx`

```tsx
/**
 * AuthContext
 *
 * Provides application-wide authentication and authorization state for the
 * multi-tenant HRMS app. It bridges Firebase Auth and Firestore so that
 * consumers can read the current Firebase user, their Firestore user profile,
 * the active tenant, and the resolved RBAC permissions / data access level for
 * the active tenant's role.
 *
 * The provider wires up a chain of real-time Firestore listeners:
 *   1. Firebase Auth state (the signed-in user).
 *   2. The user's profile document (users/{uid}).
 *   3. The active tenant document (tenants/{activeTenantId}).
 *   4. The permissions + data access level for the active role, sourced either
 *      from a per-tenant system-role override document, a custom role document,
 *      or the hardcoded system-role defaults.
 *
 * It also exposes `switchTenant` (changes the user's active tenant) and
 * `logout` (signs out of Firebase Auth), and a `useAuth` hook for consuming
 * the context safely.
 */
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";
import type { UserProfile, Tenant, PermissionKey, DataAccessLevel, SystemRoleType } from "@hrms/middleware";
import { SYSTEM_ROLES, getSystemRoleOverrideId } from "@hrms/middleware";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  activeTenant: Tenant | null;
  permissions: PermissionKey[];
  dataAccessLevel: DataAccessLevel;
  loading: boolean;
  switchTenant: (tenantId: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider
 *
 * React context provider that establishes the authentication/authorization
 * listeners described above and supplies the resulting state to descendants.
 *
 * @param children - The subtree that should have access to the auth context.
 * @returns A context provider element wrapping `children`.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [permissions, setPermissions] = useState<PermissionKey[]>([]);
  const [dataAccessLevel, setDataAccessLevel] = useState<DataAccessLevel>("self");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Listen to Firebase Auth state
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);

      if (!firebaseUser) {
        setProfile(null);
        setActiveTenant(null);
        setPermissions([]);
        setDataAccessLevel("self");
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    setLoading(true);

    // 2. Listen to User Profile in Firestore
    const userRef = doc(db, "users", user.uid);
    const unsubscribeProfile = onSnapshot(
      userRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const profileData = docSnap.data() as UserProfile;
          setProfile(profileData);

          // If there is an active tenant, we will listen to it next (handled by separate useEffect)
          if (!profileData.activeTenantId) {
            setActiveTenant(null);
            setPermissions([]);
            setDataAccessLevel("self");
            setLoading(false);
          }
        } else {
          // Profile document doesn't exist yet (functions might be creating it)
          setProfile(null);
          setActiveTenant(null);
          setPermissions([]);
          setDataAccessLevel("self");
          setLoading(false);
        }
      },
      (error) => {
        console.error("Error listening to user profile:", error);
        setLoading(false);
      }
    );

    return () => unsubscribeProfile();
  }, [user]);

  useEffect(() => {
    if (!profile?.activeTenantId) {
      setActiveTenant(null);
      return;
    }

    setLoading(true);

    // 3. Listen to Active Tenant in Firestore
    const tenantRef = doc(db, "tenants", profile.activeTenantId);
    const unsubscribeTenant = onSnapshot(
      tenantRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setActiveTenant(docSnap.data() as Tenant);
        } else {
          setActiveTenant(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to tenant:", error);
        setLoading(false);
      }
    );

    return () => unsubscribeTenant();
  }, [profile?.activeTenantId]);

  // 4. Resolve permissions and dataAccessLevel based on active role
  useEffect(() => {
    if (!profile?.activeTenantId) {
      setPermissions([]);
      setDataAccessLevel("self");
      return;
    }

    const tenantInfo = profile.tenants[profile.activeTenantId];
    if (!tenantInfo) {
      setPermissions([]);
      setDataAccessLevel("self");
      return;
    }

    const roleId = tenantInfo.role;
    if (!roleId) {
      setPermissions([]);
      setDataAccessLevel("self");
      return;
    }

    // Check if it is a system role
    const systemRoleKeys = Object.keys(SYSTEM_ROLES);
    if (systemRoleKeys.includes(roleId)) {
      const config = SYSTEM_ROLES[roleId as SystemRoleType];
      // Data access level for system roles is fixed by the system config.
      setDataAccessLevel(config.dataAccessLevel);

      // Permissions may be customized per-tenant via a role override document.
      // Listen to it so admin edits to (e.g.) the Employee matrix take effect
      // live for every member holding that system role. When no override exists,
      // fall back to the hardcoded system defaults.
      const overrideRef = doc(
        db,
        "roleOverrides",
        getSystemRoleOverrideId(profile.activeTenantId, roleId as SystemRoleType)
      );
      const unsubscribeOverride = onSnapshot(
        overrideRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setPermissions(
              (data?.permissions as PermissionKey[]) || config.permissions
            );
          } else {
            setPermissions(config.permissions);
          }
        },
        (error) => {
          console.error("Error listening to system role override:", error);
          setPermissions(config.permissions);
        }
      );

      return () => unsubscribeOverride();
    } else {
      // It is a custom role, listen to it in the root "roles" collection
      const roleRef = doc(db, "roles", roleId);
      const unsubscribeRole = onSnapshot(
        roleRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const roleData = docSnap.data();
            if (roleData && roleData.isActive !== false) {
              setPermissions(roleData.permissions as PermissionKey[] || []);
              setDataAccessLevel(roleData.dataAccessLevel as DataAccessLevel || "self");
            } else {
              // Deactivated custom role
              setPermissions([]);
              setDataAccessLevel("self");
            }
          } else {
            setPermissions([]);
            setDataAccessLevel("self");
          }
        },
        (error) => {
          console.error("Error listening to custom role:", error);
          setPermissions([]);
          setDataAccessLevel("self");
        }
      );

      return () => unsubscribeRole();
    }
  }, [profile?.activeTenantId, profile?.tenants]);

  const switchTenant = async (tenantId: string) => {
    if (!user || !profile) return;
    if (!profile.tenants[tenantId]) {
      throw new Error("User does not have access to this tenant.");
    }

    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      activeTenantId: tenantId,
    });
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        activeTenant,
        permissions,
        dataAccessLevel,
        loading,
        switchTenant,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth
 *
 * Hook to access the authentication context. Must be called from within an
 * `AuthProvider`.
 *
 * @returns The current auth context value (user, profile, activeTenant,
 *   permissions, dataAccessLevel, loading, switchTenant, logout).
 * @throws Error if used outside of an `AuthProvider`.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

```

## `frontend\src\features\auth\hooks\useAuthState.ts`

```ts
/**
 * useAuthState
 *
 * A lightweight hook that tracks the current Firebase Auth user and whether the
 * initial auth state has resolved. Unlike the full `AuthContext`, this hook does
 * not load Firestore profile/tenant/permission data â€” it only mirrors the raw
 * Firebase Auth user, which is useful for simple "is signed in?" checks.
 */
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../../../lib/firebase";

/**
 * useAuthState
 *
 * Subscribes to Firebase Auth state changes for the lifetime of the component.
 *
 * @returns An object with `user` (the current Firebase `User` or `null`) and
 *   `loading` (true until the first auth state callback fires).
 */
export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { user, loading };
}

export default useAuthState;

```

## `frontend\src\features\auth\pages\LoginPage.tsx`

```tsx
/**
 * LoginPage
 *
 * Public entry page combining two flows in a tabbed layout:
 *   - "Sign In": email/password login (and Google SSO for already-provisioned
 *     accounts) that navigates to /dashboard on success.
 *   - "Create Organization": registers a new user with email/password and
 *     bootstraps a brand-new tenant, granting the user the `org_admin` role,
 *     then navigates to /dashboard.
 *
 * Google SSO is intentionally login-only: it never auto-creates accounts and
 * signs out any user lacking a users/{uid} profile with an active tenant.
 *
 * When running against the Firebase emulator (VITE_USE_EMULATOR === "true"),
 * a panel of seeded demo accounts is shown for quick autofill.
 *
 * Forms are validated with react-hook-form + Zod.
 */
import { getFriendlyErrorMessage } from "../../../lib/errors";
import { useState } from "react";
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
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "../../../lib/firebase";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
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
  orgName: z.string().min(2, "Company name must be at least 2 characters"),
  industry: z.string().min(2, "Please specify an industry"),
  timezone: z.string().min(2, "Please select a timezone"),
  address: z.string().min(5, "Please enter your company address"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

/**
 * Demo login accounts seeded by `npm run seed` (emulator only).
 * Keep these in sync with backend/seed-demo.cjs.
 */
const DEMO_PASSWORD = "Demo@1234";
const DEMO_ACCOUNTS: Array<{ label: string; email: string }> = [
  { label: "Super Admin", email: "superadmin@demo.io" },
  { label: "Org Admin", email: "orgadmin@demo.io" },
  { label: "HR Manager", email: "hr@demo.io" },
  { label: "Recruiter", email: "recruiter@demo.io" },
  { label: "Employee", email: "employee@demo.io" },
];
const SHOW_DEMO = import.meta.env.VITE_USE_EMULATOR === "true";

/**
 * LoginPage
 *
 * Renders the sign-in / create-organization tabbed UI, the Google SSO button,
 * and (in emulator mode) the demo-accounts panel. Manages tab, loading, and
 * error state for the auth flows.
 *
 * @returns The login page element.
 */
export function LoginPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      orgName: "",
      industry: "Technology",
      timezone: "GMT+5:30",
      address: "",
    },
  });

  const onLoginSubmit = async (data: LoginForm) => {
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyErrorMessage(err, "Failed to log in. Please check your credentials."));
    } finally {
      setLoading(false);
    }
  };

  const onRegisterSubmit = async (data: RegisterForm) => {
    setError(null);
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const uid = userCredential.user.uid;

      const tenantId = `tenant_${Math.random().toString(36).substring(2, 9)}`;

      const tenantRef = doc(db, "tenants", tenantId);
      const now = Date.now();
      await setDoc(tenantRef, {
        id: tenantId,
        name: data.orgName,
        industry: data.industry,
        timezone: data.timezone,
        address: data.address,
        logoURL: null,
        createdAt: now,
        updatedAt: now,
      });

      const userRef = doc(db, "users", uid);
      await setDoc(userRef, {
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
            status: "active",
            joinedAt: now,
          },
        },
      });

      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyErrorMessage(err, "Failed to register organization."));
    } finally {
      setLoading(false);
    }
  };

  // Google SSO: only lets in users who already have a users/{uid} doc
  // with an active tenant. No auto-account-creation. Anyone else gets
  // signed out + error.
  const onGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const uid = result.user.uid;

      const userSnap = await getDoc(doc(db, "users", uid));

      if (!userSnap.exists()) {
        await signOut(auth);
        setError(
          "Your Google account is not registered with this organization. Please contact your admin to get access."
        );
        return;
      }

      const profile = userSnap.data() as { tenants?: Record<string, { status?: string }> };
      const hasActiveTenant = Object.values(profile.tenants || {}).some(
        (t) => t?.status === "active"
      );

      if (!hasActiveTenant) {
        await signOut(auth);
        setError(
          "Your account does not have active access to any organization. Please contact your admin."
        );
        return;
      }

      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/popup-closed-by-user") {
        setError(null);
      } else {
        setError(getFriendlyErrorMessage(err, "Failed to sign in with Google."));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const loginFormSetValue = loginForm.setValue;
  const fillDemo = (email: string) => {
    setActiveTab("login");
    setError(null);
    loginFormSetValue("email", email, { shouldValidate: true });
    loginFormSetValue("password", DEMO_PASSWORD, { shouldValidate: true });
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-slate-50 p-6 md:p-10">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 font-bold text-xl">
            HR
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900 tracking-tight">Enterprise HRMS</h1>
          <p className="mt-1.5 text-sm text-slate-500">Simplify your people operations and recruitment</p>
        </div>

        <div className="mt-8 flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
            onClick={() => {
              setActiveTab("login");
              setError(null);
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "register" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
            onClick={() => {
              setActiveTab("register");
              setError(null);
            }}
          >
            Create Organization
          </button>
        </div>

        {error && (
          <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700 border border-red-100">
            {error}
          </div>
        )}

        {activeTab === "login" ? (
          <>
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="mt-6 space-y-4">
              <div>
                <label htmlFor="email-login" className="text-sm font-semibold text-slate-700">
                  Email Address
                </label>
                <input
                  id="email-login"
                  type="email"
                  placeholder="you@company.com"
                  {...loginForm.register("email")}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                {loginForm.formState.errors.email && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="password-login" className="text-sm font-semibold text-slate-700">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-xs font-semibold text-blue-600 hover:underline">
                    Forgot Password?
                  </Link>
                </div>
                <input
                  id="password-login"
                  type="password"
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  {...loginForm.register("password")}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                {loginForm.formState.errors.password && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            <div className="mt-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-semibold text-slate-400">OR</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <button
              type="button"
              onClick={onGoogleSignIn}
              disabled={googleLoading}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.616z" fill="#4285F4" />
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
                <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05" />
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" fill="#EA4335" />
              </svg>
              {googleLoading ? "Signing in..." : "Sign in with Google"}
            </button>
            <p className="mt-3 text-center text-xs text-slate-400">
              Google sign-in is only available to accounts already added by your admin.
            </p>
          </>
        ) : (
          <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="fullName" className="text-sm font-semibold text-slate-700">Your Name</label>
                <input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  {...registerForm.register("fullName")}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                {registerForm.formState.errors.fullName && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{registerForm.formState.errors.fullName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email-reg" className="text-sm font-semibold text-slate-700">Work Email</label>
                <input
                  id="email-reg"
                  type="email"
                  placeholder="john@company.com"
                  {...registerForm.register("email")}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                {registerForm.formState.errors.email && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{registerForm.formState.errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password-reg" className="text-sm font-semibold text-slate-700">Password</label>
              <input
                id="password-reg"
                type="password"
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                {...registerForm.register("password")}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
              />
              {registerForm.formState.errors.password && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{registerForm.formState.errors.password.message}</p>
              )}
            </div>

            <div className="border-t border-slate-100 my-4 pt-4" />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="orgName" className="text-sm font-semibold text-slate-700">Company Name</label>
                <input
                  id="orgName"
                  type="text"
                  placeholder="Acme Corp"
                  {...registerForm.register("orgName")}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                {registerForm.formState.errors.orgName && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{registerForm.formState.errors.orgName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="industry" className="text-sm font-semibold text-slate-700">Industry</label>
                <input
                  id="industry"
                  type="text"
                  placeholder="Technology"
                  {...registerForm.register("industry")}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                {registerForm.formState.errors.industry && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{registerForm.formState.errors.industry.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="timezone" className="text-sm font-semibold text-slate-700">Timezone</label>
                <input
                  id="timezone"
                  type="text"
                  placeholder="GMT+5:30"
                  {...registerForm.register("timezone")}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                {registerForm.formState.errors.timezone && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{registerForm.formState.errors.timezone.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="address" className="text-sm font-semibold text-slate-700">Address</label>
                <input
                  id="address"
                  type="text"
                  placeholder="123 main street"
                  {...registerForm.register("address")}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                {registerForm.formState.errors.address && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{registerForm.formState.errors.address.message}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Registering..." : "Create Account & Org"}
            </button>
          </form>
        )}
      </div>

      {SHOW_DEMO && (
        <div className="w-full max-w-lg rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700">Demo accounts</h2>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
              Emulator
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Click any account to autofill. Password for all:{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-700">{DEMO_PASSWORD}</code>
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => fillDemo(acc.email)}
                className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm hover:border-blue-300 hover:bg-blue-50/40 transition-colors cursor-pointer"
              >
                <span>
                  <span className="block font-semibold text-slate-800">{acc.label}</span>
                  <span className="block text-xs text-slate-500">{acc.email}</span>
                </span>
                <span className="shrink-0 text-xs font-semibold text-blue-600">Use</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Run <code className="rounded bg-slate-100 px-1 py-0.5 font-mono">npm run seed</code> (with emulators running) to create these accounts and demo data.
          </p>
        </div>
      )}
    </div>
  );
}

export default LoginPage;
```

## `frontend\src\features\auth\pages\ForgotPasswordPage.tsx`

```tsx
/**
 * ForgotPasswordPage
 *
 * Public auth page where a user requests a password reset link by entering
 * their email. Submission invokes the `requestPasswordReset` Firebase callable
 * function. To avoid leaking which emails are registered, the UI always shows a
 * neutral success message once the request completes. Form input is validated
 * with react-hook-form + Zod.
 */
import { getFriendlyErrorMessage } from "../../../lib/errors";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../../lib/firebase";

const forgotSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotForm = z.infer<typeof forgotSchema>;

/**
 * ForgotPasswordPage
 *
 * Renders the forgot-password form and handles submission state.
 *
 * @returns The forgot-password page element.
 */
export function ForgotPasswordPage() {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotForm) => {
    setError(null);
    setLoading(true);
    try {
      const requestReset = httpsCallable(functions, "requestPasswordReset");
      await requestReset({ email: data.email });
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyErrorMessage(err, "Failed to send password reset email."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-50 p-6 md:p-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 font-bold text-xl">
            HR
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900 tracking-tight">Forgot Password</h1>
          <p className="mt-1 text-sm text-slate-500">Enter your email to receive a password reset link</p>
        </div>

        {error && (
          <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700 border border-red-100">
            {error}
          </div>
        )}

        {success ? (
          <div className="mt-6 text-center">
            <div className="rounded-xl bg-green-50 p-4 text-sm font-medium text-green-700 border border-green-100">
              If an account exists for that email, a password reset link is on its way. Please check your inbox.
            </div>
            <Link
              to="/login"
              className="mt-6 inline-block text-sm font-semibold text-blue-600 hover:underline"
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="text-sm font-semibold text-slate-700">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@company.com"
                {...register("email")}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
              />
              {errors.email && (
                <p className="mt-1.5 text-xs font-medium text-red-600">{errors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

            <div className="text-center pt-2">
              <Link to="/login" className="text-sm font-semibold text-blue-600 hover:underline">
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
```

## `frontend\src\features\auth\pages\ResetPasswordPage.tsx`

```tsx
/**
 * ResetPasswordPage
 *
 * Public auth page that completes a password reset. It reads the `oobCode`
 * (out-of-band action code) from the URL query string and, on form submit,
 * calls Firebase `confirmPasswordReset` with the new password. On success it
 * shows a confirmation and redirects to /login after 3 seconds. If no `oobCode`
 * is present, the form is hidden and a guidance message is shown instead.
 * Input is validated with react-hook-form + Zod (including a password/confirm
 * match check).
 */
import { getFriendlyErrorMessage } from "../../../lib/errors";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { confirmPasswordReset } from "firebase/auth";
import { auth } from "../../../lib/firebase";

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Za-z]/, "Include at least one letter")
      .regex(/[0-9]/, "Include at least one number"),
    confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetForm = z.infer<typeof resetSchema>;

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const oobCode = searchParams.get("oobCode");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: ResetForm) => {
    if (!oobCode) {
      setError("Invalid or expired password reset link. Please request a new one.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, data.password);
      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyErrorMessage(err, "Failed to reset password. The link may have expired."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-50 p-6 md:p-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 font-bold text-xl">
            HR
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900 tracking-tight">Reset Password</h1>
          <p className="mt-1 text-sm text-slate-500">Enter a new secure password for your account</p>
        </div>

        {error && (
          <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700 border border-red-100">
            {error}
          </div>
        )}

        {!oobCode && (
          <div className="mt-6 rounded-xl bg-amber-50 p-4 text-sm font-medium text-amber-700 border border-amber-100 text-center">
            No password reset code found. Please check your email link or request a new one.
          </div>
        )}

        {success ? (
          <div className="mt-6 text-center">
            <div className="rounded-xl bg-green-50 p-4 text-sm font-medium text-green-700 border border-green-100">
              Password successfully reset! Redirecting to login...
            </div>
            <Link
              to="/login"
              className="mt-6 inline-block text-sm font-semibold text-blue-600 hover:underline"
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          oobCode && (
            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <div>
                <label htmlFor="password" className="text-sm font-semibold text-slate-700">
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  {...register("password")}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                {errors.password && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  {...register("confirmPassword")}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                {errors.confirmPassword && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )
        )}
      </div>
    </div>
  );
}
```

## `frontend\src\features\common\pages\NotFoundPage.tsx`

```tsx
import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col items-start justify-center gap-4 p-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-text-secondary">The requested route does not exist.</p>
        <div className="mt-4">
          <Link to="/login" className="text-sm font-medium text-primary hover:text-primary hover:underline">
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

```

## `frontend\src\features\dashboard\pages\DashboardPage.tsx`

```tsx
import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useAuth } from "../../auth/context/AuthContext";
import { useHasPermission } from "../../rbac/hooks/usePermissions";
import { Users, Shield, Building2, MapPin, Clock, Briefcase } from "lucide-react";
import { Skeleton } from "../../../components/ui/Skeleton";
import type { UserProfile } from "@hrms/middleware";

export function DashboardPage() {
  const { activeTenant, profile } = useAuth();
  const hasPermission = useHasPermission();
  // The member directory widgets surface data from the `users` collection, so
  // they're only shown to roles granted `users.view` in the permission matrix.
  const canViewUsers = hasPermission("users.view");
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.activeTenantId) return;
    // Skip the members query entirely when the role can't view users.
    if (!canViewUsers) {
      setMembers([]);
      setLoading(false);
      return;
    }

    const fetchMembers = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "users"),
          where(`tenants.${profile.activeTenantId}.status`, "in", ["active", "invited", "disabled"])
        );
        const snap = await getDocs(q);
        const list: UserProfile[] = [];
        snap.forEach((docSnap) => {
          list.push(docSnap.data() as UserProfile);
        });
        setMembers(list);
      } catch (err) {
        console.error("Error fetching tenant members:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [profile?.activeTenantId, canViewUsers]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/4" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const activeRole = profile?.tenants[profile.activeTenantId || ""]?.role || "employee";

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Hello, {profile?.displayName || "User"}!
        </h1>
        <p className="text-sm text-slate-500">
          Here's what is happening at <strong className="text-slate-700">{activeTenant?.name}</strong> today.
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {canViewUsers && (
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Users size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{members.length}</div>
              <div className="text-xs font-semibold text-slate-500">Team Members</div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600">
            <Shield size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              {Object.keys(SYSTEM_ROLES_META).length}
            </div>
            <div className="text-xs font-semibold text-slate-500">Standard Roles</div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Briefcase size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">0</div>
            <div className="text-xs font-semibold text-slate-500">Open Jobs (Phase 2)</div>
          </div>
        </div>
      </div>

      {/* Main dashboard content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Organization Details */}
        <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${canViewUsers ? "lg:col-span-1" : "lg:col-span-3"}`}>
          <h2 className="text-base font-bold text-slate-900">Organization Profile</h2>
          <div className="mt-5 space-y-4">
            <div className="flex items-start gap-3 text-sm">
              <Building2 size={18} className="mt-0.5 text-slate-400 shrink-0" />
              <div>
                <div className="font-semibold text-slate-700">Industry</div>
                <div className="text-slate-500">{activeTenant?.industry}</div>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm">
              <Clock size={18} className="mt-0.5 text-slate-400 shrink-0" />
              <div>
                <div className="font-semibold text-slate-700">Timezone</div>
                <div className="text-slate-500">{activeTenant?.timezone}</div>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm">
              <MapPin size={18} className="mt-0.5 text-slate-400 shrink-0" />
              <div>
                <div className="font-semibold text-slate-700">Address</div>
                <div className="text-slate-500">{activeTenant?.address}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Members */}
        {canViewUsers && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <h2 className="text-base font-bold text-slate-900">Team Members List</h2>
            <div className="mt-4 divide-y divide-slate-100">
              {members.slice(0, 5).map((member) => (
                <div key={member.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600 text-sm">
                      {member.displayName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{member.displayName}</div>
                      <div className="text-xs text-slate-500">{member.email}</div>
                    </div>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 capitalize">
                    {profile?.activeTenantId
                      ? member.tenants?.[profile.activeTenantId]?.role?.replace("_", " ") || "member"
                      : "member"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const SYSTEM_ROLES_META = {
  super_admin: "Super Admin",
  org_admin: "Org Admin",
  hr_manager: "HR Manager",
  recruiter: "Recruiter",
  employee: "Employee",
};
```

## `frontend\src\features\rbac\hooks\usePermissions.ts`

```ts
import { useAuth } from "../../auth/context/AuthContext";
import type { PermissionKey } from "@hrms/middleware";

/**
 * Reusable hook to check if the current user has a specific granular permission key.
 */
export function useHasPermission() {
  const { permissions } = useAuth();
  
  return (permission: PermissionKey): boolean => {
    return permissions.includes(permission);
  };
}

/**
 * Reusable hook to check if the current user can view a specific resource.
 */
export function useCanView() {
  const hasPermission = useHasPermission();
  
  return (resource: string): boolean => {
    return hasPermission(`${resource}.view` as PermissionKey);
  };
}

/**
 * Reusable hook to check if the current user can update or modify a specific resource.
 */
export function useCanEdit() {
  const hasPermission = useHasPermission();
  
  return (resource: string): boolean => {
    return (
      hasPermission(`${resource}.update` as PermissionKey) ||
      hasPermission(`${resource}.create` as PermissionKey)
    );
  };
}

/**
 * Reusable hook to check if the current user can delete a specific resource.
 */
export function useCanDelete() {
  const hasPermission = useHasPermission();
  
  return (resource: string): boolean => {
    return hasPermission(`${resource}.delete` as PermissionKey);
  };
}
```

## `frontend\src\features\rbac\pages\RbacPage.tsx`

```tsx
import { getFriendlyErrorMessage } from "../../../lib/errors";
import { useState, useEffect, useMemo } from "react";
import { collection, doc, setDoc, getDocs, deleteDoc, query, where, updateDoc, orderBy } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useAuth } from "../../auth/context/AuthContext";
import { useHasPermission } from "../hooks/usePermissions";
import { Skeleton } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/ErrorState";
import { 
  Shield, 
  Plus, 
  Check, 
  Trash2, 
  X, 
  Lock, 
  Users, 
  FileText, 
  Search, 
  Copy, 
  AlertCircle, 
  Activity, 
  Save, 
  RefreshCw,
  RotateCcw 
} from "lucide-react";
import { 
  SYSTEM_ROLES, 
  EDITABLE_SYSTEM_ROLES,
  getSystemRoleOverrideId,
  type PermissionKey, 
  type Role, 
  type DataAccessLevel, 
  type SystemRoleType, 
  type SystemRoleOverride,
  type UserProfile 
} from "@hrms/middleware";
import { logAuditTrail, type AuditLog } from "../utils/audit";
import { assignRoleToUser } from "../utils/roleAssign";

// Grid configuration for the permission matrix
const RESOURCES = [
  { key: "users", label: "Users", desc: "System directory and tenant profiles" },
  { key: "roles", label: "Roles", desc: "Access tiers and matrix configurations" },
  { key: "departments", label: "Departments", desc: "Corporate divisions and branches" },
  { key: "teams", label: "Teams", desc: "Corporate departments and sub-teams" },
  { key: "jobs", label: "Jobs", desc: "ATS postings and recruitment pipeline" },
  { key: "candidates", label: "Candidates", desc: "ATS applicants and resumes" },
  { key: "employees", label: "Employees", desc: "Core employee profiles and files" },
  { key: "leave", label: "Leave Requests", desc: "Time-off policies and requests" },
  { key: "documents", label: "Documents", desc: "Shared and private contract assets" },
];

const ACTIONS = [
  { key: "view", label: "View" },
  { key: "create", label: "Create" },
  { key: "update", label: "Edit" },
  { key: "delete", label: "Delete" },
  { key: "approve", label: "Approve" },
  { key: "export", label: "Export" },
];

// Checks if a permission combination is supported in the schema
function isPermissionValid(resource: string, action: string): boolean {
  if (resource === "candidates" && action === "export") return true;
  if (resource === "leave" && action === "approve") return true;
  return ["view", "create", "update", "delete"].includes(action);
}

export function RbacPage() {
  const { profile } = useAuth();
  const tenantId = profile?.activeTenantId || "";

  // Navigation Tab State
  const [activeTab, setActiveTab] = useState<"roles" | "users" | "audit">("roles");

  // Roles states
  const [selectedRole, setSelectedRole] = useState<string>("employee");
  const [customRoles, setCustomRoles] = useState<Role[]>([]);
  // Tenant-scoped overrides of system-role permission matrices, keyed by SystemRoleType
  const [systemOverrides, setSystemOverrides] = useState<Partial<Record<SystemRoleType, SystemRoleOverride>>>({});
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [rolesError, setRolesError] = useState<string | null>(null);

  // Search states
  const [roleSearchQuery, setRoleSearchQuery] = useState("");

  // Role Draft Editing States
  const [draftName, setDraftName] = useState("");
  const [draftDesc, setDraftDesc] = useState("");
  const [draftAccessLevel, setDraftAccessLevel] = useState<DataAccessLevel>("self");
  const [draftIsActive, setDraftIsActive] = useState(true);
  const [draftPermissions, setDraftPermissions] = useState<PermissionKey[]>([]);
  const [isSavingRole, setIsSavingRole] = useState(false);

  // User assignments states
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  // Audit Log states
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditFilterAction, setAuditFilterAction] = useState("all");

  // Create Role Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [newRoleAccess, setNewRoleAccess] = useState<DataAccessLevel>("self");
  const [newRolePerms, setNewRolePerms] = useState<PermissionKey[]>(["users.view"]);
  const [isCreatingRole, setIsCreatingRole] = useState(false);

  // Fetch Roles
  const fetchRoles = async () => {
    if (!tenantId) return;
    setLoadingRoles(true);
    setRolesError(null);
    try {
      const q = query(
        collection(db, "roles"),
        where("tenantId", "==", tenantId)
      );
      const snap = await getDocs(q);
      const list: Role[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as Role);
      });
      setCustomRoles(list);
    } catch (err: any) {
      console.error(err);
      setRolesError(getFriendlyErrorMessage(err, "Failed to load custom roles."));
    } finally {
      setLoadingRoles(false);
    }
  };

  // Fetch tenant-scoped system-role permission overrides
  const fetchSystemOverrides = async () => {
    if (!tenantId) return;
    try {
      const q = query(
        collection(db, "roleOverrides"),
        where("tenantId", "==", tenantId)
      );
      const snap = await getDocs(q);
      const map: Partial<Record<SystemRoleType, SystemRoleOverride>> = {};
      snap.forEach((docSnap) => {
        const data = docSnap.data() as SystemRoleOverride;
        if (data.systemRoleType) {
          map[data.systemRoleType] = data;
        }
      });
      setSystemOverrides(map);
    } catch (err) {
      console.error("Failed to fetch system role overrides:", err);
    }
  };

  // Fetch Tenant Members
  const fetchMembers = async () => {
    if (!tenantId) return;
    setLoadingMembers(true);
    try {
      const q = query(
        collection(db, "users"),
        where(`tenants.${tenantId}.status`, "in", ["active", "invited", "disabled"])
      );
      const snap = await getDocs(q);
      const list: UserProfile[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as UserProfile);
      });
      setMembers(list);
    } catch (err) {
      console.error("Failed to fetch tenant members:", err);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Fetch Audit Logs
  const fetchAuditLogs = async () => {
    if (!tenantId) return;
    setLoadingAudit(true);
    try {
      const q = query(
        collection(db, "auditLogs"),
        where("tenantId", "==", tenantId),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      const list: AuditLog[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as AuditLog);
      });
      setAuditLogs(list);
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setLoadingAudit(false);
    }
  };

  // Initial Fetch & Tab Sync
  useEffect(() => {
    fetchRoles();
    fetchSystemOverrides();
  }, [tenantId]);

  useEffect(() => {
    if (activeTab === "users") {
      fetchMembers();
      fetchRoles();
    } else if (activeTab === "audit") {
      fetchAuditLogs();
    }
  }, [activeTab, tenantId]);

  const hasPermission = useHasPermission();
  // Authorization: only org/super admins may mutate roles & matrices.
  const isAuthorizedToManage = hasPermission("roles.update");

  // Handle Selected Role change to initialize Draft Edit state
  const isSelectedRoleSystem = !selectedRole.startsWith("role_");

  // Is the selected role a system role whose matrix tenant admins may customize?
  const isEditableSystemRole =
    isSelectedRoleSystem &&
    EDITABLE_SYSTEM_ROLES.includes(selectedRole as SystemRoleType);

  // Whether the permission matrix is read-only for the current selection.
  const matrixLocked = isSelectedRoleSystem && !(isEditableSystemRole && isAuthorizedToManage);

  // Does a saved tenant override currently exist for the selected system role?
  const activeSystemOverride = isSelectedRoleSystem
    ? systemOverrides[selectedRole as SystemRoleType]
    : undefined;

  // Effective role data driving the UI. For system roles we start from the
  // hardcoded defaults but apply any saved permission override for this tenant.
  const activeRoleData = useMemo(() => {
    if (isSelectedRoleSystem) {
      const base = SYSTEM_ROLES[selectedRole as keyof typeof SYSTEM_ROLES];
      if (!base) return undefined;
      return activeSystemOverride
        ? { ...base, permissions: activeSystemOverride.permissions }
        : base;
    }
    return customRoles.find((r) => r.id === selectedRole);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRole, isSelectedRoleSystem, activeSystemOverride, customRoles]);

  useEffect(() => {
    if (activeRoleData) {
      setDraftName(activeRoleData.name);
      setDraftDesc((activeRoleData as any).description || "");
      setDraftAccessLevel(activeRoleData.dataAccessLevel);
      setDraftIsActive((activeRoleData as any).isActive !== false);
      setDraftPermissions(activeRoleData.permissions || []);
    }
  }, [selectedRole, activeRoleData]);

  // Check if draft has modifications compared to active saved role
  const isDraftModified = () => {
    if (!activeRoleData) return false;

    const originalPerms = activeRoleData.permissions || [];
    const permDiff =
      draftPermissions.length !== originalPerms.length ||
      !draftPermissions.every((p) => originalPerms.includes(p));

    // For system roles, only the permission matrix is editable.
    if (isSelectedRoleSystem) {
      return isEditableSystemRole && permDiff;
    }

    const original = activeRoleData as Role;
    const nameDiff = draftName !== original.name;
    const descDiff = draftDesc !== original.description;
    const accessDiff = draftAccessLevel !== original.dataAccessLevel;
    const activeDiff = draftIsActive !== (original.isActive !== false);

    return nameDiff || descDiff || accessDiff || activeDiff || permDiff;
  };

  // Toggle Matrix Permission in Draft
  const handleTogglePermission = (resource: string, action: string) => {
    if (matrixLocked) return; // Locked system roles are read-only
    const key = `${resource}.${action}` as PermissionKey;
    setDraftPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  // Save Custom Role modifications
  const handleSaveChanges = async () => {
    if (!tenantId || !activeRoleData) return;

    // System role: persist a tenant-scoped permission override.
    if (isSelectedRoleSystem) {
      if (!isEditableSystemRole || !isAuthorizedToManage) return;
      setIsSavingRole(true);

      const systemRoleType = selectedRole as SystemRoleType;
      const overrideId = getSystemRoleOverrideId(tenantId, systemRoleType);
      const override: SystemRoleOverride = {
        id: overrideId,
        tenantId,
        systemRoleType,
        permissions: draftPermissions,
        updatedAt: Date.now(),
      };

      try {
        await setDoc(doc(db, "roleOverrides", overrideId), override);

        await logAuditTrail(
          tenantId,
          profile?.id || "",
          profile?.displayName || "Admin",
          "role.update",
          overrideId,
          `Updated the ${SYSTEM_ROLES[systemRoleType].name} permission matrix for this organization`,
          profile?.email
        );

        await fetchSystemOverrides();
        alert(`${SYSTEM_ROLES[systemRoleType].name} permission matrix saved successfully!`);
      } catch (err: any) {
        console.error(err);
        alert(getFriendlyErrorMessage(err, "Failed to save permission matrix."));
      } finally {
        setIsSavingRole(false);
      }
      return;
    }

    setIsSavingRole(true);

    const roleId = selectedRole;
    const roleRef = doc(db, "roles", roleId);

    try {
      await updateDoc(roleRef, {
        name: draftName,
        description: draftDesc,
        dataAccessLevel: draftAccessLevel,
        isActive: draftIsActive,
        permissions: draftPermissions,
        updatedAt: Date.now(),
      });

      // Log Security Audit Log
      await logAuditTrail(
        tenantId,
        profile?.id || "",
        profile?.displayName || "Admin",
        "role.update",
        roleId,
        `Updated permissions and parameters for custom role "${draftName}"`,
        profile?.email
      );

      // Refresh cache
      await fetchRoles();
      alert("Role changes saved successfully!");
    } catch (err: any) {
      console.error(err);
      alert(getFriendlyErrorMessage(err, "Failed to update role details."));
    } finally {
      setIsSavingRole(false);
    }
  };

  // Reset an editable system role's matrix back to the built-in defaults by
  // removing its tenant override document.
  const handleResetSystemRole = async () => {
    if (!tenantId || !isEditableSystemRole || !isAuthorizedToManage) return;
    const systemRoleType = selectedRole as SystemRoleType;
    if (!activeSystemOverride) return; // Nothing to reset
    if (
      !confirm(
        `Reset the ${SYSTEM_ROLES[systemRoleType].name} permission matrix back to the system defaults? This removes your organization's customizations.`
      )
    )
      return;

    setIsSavingRole(true);
    const overrideId = getSystemRoleOverrideId(tenantId, systemRoleType);

    try {
      await deleteDoc(doc(db, "roleOverrides", overrideId));

      await logAuditTrail(
        tenantId,
        profile?.id || "",
        profile?.displayName || "Admin",
        "role.update",
        overrideId,
        `Reset the ${SYSTEM_ROLES[systemRoleType].name} permission matrix to system defaults`,
        profile?.email
      );

      // Reset local draft to defaults immediately for responsiveness.
      setDraftPermissions(SYSTEM_ROLES[systemRoleType].permissions);
      await fetchSystemOverrides();
      alert(`${SYSTEM_ROLES[systemRoleType].name} matrix reset to defaults.`);
    } catch (err: any) {
      console.error(err);
      alert(getFriendlyErrorMessage(err, "Failed to reset permission matrix."));
    } finally {
      setIsSavingRole(false);
    }
  };

  // Delete Custom Role
  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (isSelectedRoleSystem) return;
    if (!confirm(`Are you sure you want to delete the role "${roleName}"? This action cannot be undone.`)) return;

    try {
      await deleteDoc(doc(db, "roles", roleId));

      // Log Security Audit Log
      await logAuditTrail(
        tenantId,
        profile?.id || "",
        profile?.displayName || "Admin",
        "role.delete",
        roleId,
        `Deleted custom role "${roleName}"`,
        profile?.email
      );

      setSelectedRole("employee");
      fetchRoles();
      alert("Role deleted successfully.");
    } catch (err: any) {
      console.error(err);
      alert(getFriendlyErrorMessage(err, "Failed to delete role."));
    }
  };

  // Create Custom Role Modal Submit
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName || !tenantId) return;

    setIsCreatingRole(true);
    const roleId = `role_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    const now = Date.now();

    const roleDoc: Role = {
      id: roleId,
      tenantId,
      name: newRoleName,
      description: newRoleDesc,
      isSystemRole: false,
      permissions: newRolePerms,
      dataAccessLevel: newRoleAccess,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await setDoc(doc(db, "roles", roleId), roleDoc);

      // Log Security Audit Log
      await logAuditTrail(
        tenantId,
        profile?.id || "",
        profile?.displayName || "Admin",
        "role.create",
        roleId,
        `Created custom role "${newRoleName}"`,
        profile?.email
      );

      setNewRoleName("");
      setNewRoleDesc("");
      setNewRoleAccess("self");
      setNewRolePerms(["users.view"]);
      setCreateModalOpen(false);
      setSelectedRole(roleId);
      fetchRoles();
    } catch (err: any) {
      console.error(err);
      alert(getFriendlyErrorMessage(err, "Failed to create custom role."));
    } finally {
      setIsCreatingRole(false);
    }
  };

  // Clone current selected role
  const handleCloneRole = () => {
    if (!activeRoleData) return;
    setNewRoleName(`${activeRoleData.name} (Copy)`);
    setNewRoleDesc(`Clone of ${activeRoleData.name}. ${(activeRoleData as any).description || ""}`);
    setNewRoleAccess(activeRoleData.dataAccessLevel);
    setNewRolePerms([...activeRoleData.permissions]);
    setCreateModalOpen(true);
  };

  // Assign user a new role
  const handleUserRoleChange = async (userId: string, member: UserProfile, newRole: string) => {
    const oldRole = member.tenants?.[tenantId]?.role;
    try {
      await assignRoleToUser(
        tenantId,
        profile?.id || "",
        profile?.displayName || "Admin",
        userId,
        member.displayName,
        newRole,
        oldRole,
        profile?.email
      );
      fetchMembers();
    } catch (err: any) {
      console.error(err);
      alert(getFriendlyErrorMessage(err, "Failed to assign new role to user."));
    }
  };

  // Filtered lists
  const filteredRoles = customRoles.filter(
    (r) => r.name.toLowerCase().includes(roleSearchQuery.toLowerCase())
  );

  const filteredMembers = members.filter(
    (m) =>
      m.displayName.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(memberSearchQuery.toLowerCase())
  );

  const filteredAuditLogs = auditLogs.filter((log) => {
    if (auditFilterAction !== "all" && log.action !== auditFilterAction) return false;
    return true;
  });

  if (loadingRoles && customRoles.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/4" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Skeleton className="h-96 md:col-span-1 rounded-2xl" />
          <Skeleton className="h-96 md:col-span-2 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (rolesError) {
    return <ErrorState description={rolesError} onRetry={fetchRoles} />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Enterprise Access Control</h1>
          <p className="text-sm text-slate-500">
            Define system roles, custom permissions matrices, and monitor audit logs.
          </p>
        </div>
        {isAuthorizedToManage && (
          <button
            onClick={() => {
              setNewRoleName("");
              setNewRoleDesc("");
              setNewRoleAccess("self");
              setNewRolePerms(["users.view"]);
              setCreateModalOpen(true);
            }}
            className="self-start inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <Plus size={16} />
            <span>Create Custom Role</span>
          </button>
        )}
      </div>

      {/* HiBob Inspired Custom Sub-Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("roles")}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-bold border-b-2 cursor-pointer transition-all ${
            activeTab === "roles"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Shield size={16} />
          <span>Roles & Permission Matrix</span>
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-bold border-b-2 cursor-pointer transition-all ${
            activeTab === "users"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Users size={16} />
          <span>Member Assignments</span>
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-bold border-b-2 cursor-pointer transition-all ${
            activeTab === "audit"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Activity size={16} />
          <span>Security Audit Trail</span>
        </button>
      </div>

      {/* ==================== TAB 1: ROLES & MATRIX ==================== */}
      {activeTab === "roles" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* Left panel: Roles List */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-1 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search roles..."
                value={roleSearchQuery}
                onChange={(e) => setRoleSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-4 text-xs outline-none focus:border-blue-600/60 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            <div>
              <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1">
                System Default Roles
              </h3>
              <div className="mt-2 space-y-1">
                {(Object.keys(SYSTEM_ROLES) as SystemRoleType[])
                  .filter((roleKey) => roleKey.toLowerCase().includes(roleSearchQuery.toLowerCase()))
                  .map((roleKey) => (
                    <button
                      key={roleKey}
                      onClick={() => setSelectedRole(roleKey)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-bold cursor-pointer ${
                        selectedRole === roleKey
                          ? "bg-blue-50 text-blue-600"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className="capitalize">{roleKey.replace("_", " ")}</span>
                      {EDITABLE_SYSTEM_ROLES.includes(roleKey) && isAuthorizedToManage ? (
                        <span className="text-[8px] font-extrabold uppercase tracking-wider text-blue-500">
                          Editable
                        </span>
                      ) : (
                        <Lock size={12} className="text-slate-400" />
                      )}
                    </button>
                  ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1">
                Custom Tenant Roles
              </h3>
              <div className="mt-2 space-y-1">
                {filteredRoles.length === 0 ? (
                  <p className="text-xs text-slate-400 px-1 py-2 italic">No custom roles created.</p>
                ) : (
                  filteredRoles.map((role) => (
                    <div
                      key={role.id}
                      className={`flex items-center justify-between rounded-xl px-3 py-1 text-left text-xs font-bold ${
                        selectedRole === role.id 
                          ? "bg-blue-50 text-blue-600" 
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <button
                        onClick={() => setSelectedRole(role.id)}
                        className="flex-1 py-1.5 text-left cursor-pointer font-bold"
                      >
                        {role.name}
                        {role.isActive === false && (
                          <span className="ml-2 rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">
                            Inactive
                          </span>
                        )}
                      </button>
                      {isAuthorizedToManage && (
                        <button
                          onClick={() => handleDeleteRole(role.id, role.name)}
                          className="text-slate-400 hover:text-red-600 p-1 cursor-pointer rounded-lg hover:bg-red-50"
                          title="Delete role"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right panel: Details & Matrix */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2 space-y-6">
            
            {/* Active Role Card Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    {draftName} Permissions Matrix
                  </h2>
                  {isSelectedRoleSystem ? (
                    isEditableSystemRole && isAuthorizedToManage ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                        <Shield size={10} />
                        Editable System Role
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                        <Lock size={10} />
                        System Protected
                      </span>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                      Custom Role
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">{draftDesc || "No description provided."}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCloneRole}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                  title="Clone current role properties"
                >
                  <Copy size={12} />
                  <span>Clone</span>
                </button>
              </div>
            </div>

            {/* Config Fields for Custom Role */}
            {!isSelectedRoleSystem && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-xl bg-slate-50/50 p-4 border border-slate-100">
                <div>
                  <label htmlFor="edit-role-name" className="text-xs font-bold text-slate-600">Role Name</label>
                  <input
                    id="edit-role-name"
                    type="text"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-blue-600 transition-all font-semibold"
                  />
                </div>
                <div>
                  <label htmlFor="edit-role-desc" className="text-xs font-bold text-slate-600">Description</label>
                  <input
                    id="edit-role-desc"
                    type="text"
                    value={draftDesc}
                    onChange={(e) => setDraftDesc(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-blue-600 transition-all font-semibold"
                  />
                </div>
                <div>
                  <label htmlFor="edit-data-access" className="text-xs font-bold text-slate-600">Data Access Level</label>
                  <select
                    id="edit-data-access"
                    value={draftAccessLevel}
                    onChange={(e) => setDraftAccessLevel(e.target.value as DataAccessLevel)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold outline-none focus:border-blue-600"
                  >
                    <option value="all">All Records (Full Visibility)</option>
                    <option value="department">Department Records</option>
                    <option value="team">Team Records</option>
                    <option value="reports">Direct Reports Only</option>
                    <option value="self">Self Only</option>
                  </select>
                </div>
                <div className="flex flex-col justify-end">
                  <span className="text-xs font-bold text-slate-600 mb-1">Status</span>
                  <div className="flex items-center gap-2.5 py-1.5">
                    <button
                      type="button"
                      onClick={() => setDraftIsActive(!draftIsActive)}
                      className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                        draftIsActive ? "bg-blue-600" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          draftIsActive ? "translate-x-4.5" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <span className="text-xs font-semibold text-slate-700">
                      {draftIsActive ? "Active" : "Inactive (Members lose access)"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* System Role Data Access Display */}
            {isSelectedRoleSystem && (
              <div className="rounded-xl bg-slate-50/50 p-4 border border-slate-100 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600">Role Data Access Level:</span>
                <span className="font-bold text-slate-800 capitalize bg-slate-100 px-2.5 py-1 rounded-lg">
                  {draftAccessLevel.replace("_", " ")} Records
                </span>
              </div>
            )}

            {/* Editable system-role notice */}
            {isEditableSystemRole && isAuthorizedToManage && (
              <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>
                  You can tailor the <strong>{SYSTEM_ROLES[selectedRole as SystemRoleType].name}</strong> permission
                  matrix for this organization. Changes apply to every member with this role.
                  {activeSystemOverride ? " Customized for this organization." : " Currently using system defaults."}
                </span>
              </div>
            )}

            {/* Permission Matrix Table */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4 w-[250px]">Module / Resource</th>
                      {ACTIONS.map((act) => (
                        <th key={act.key} className="py-3 px-4 text-center">{act.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {RESOURCES.map((res) => (
                      <tr key={res.key} className="hover:bg-slate-50/20 text-xs">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{res.label}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 leading-normal">{res.desc}</div>
                        </td>
                        {ACTIONS.map((act) => {
                          const isValid = isPermissionValid(res.key, act.key);
                          const isChecked = draftPermissions.includes(`${res.key}.${act.key}` as PermissionKey);
                          
                          return (
                            <td key={act.key} className="py-3 px-4 text-center">
                              {isValid ? (
                                <button
                                  type="button"
                                  disabled={matrixLocked}
                                  onClick={() => handleTogglePermission(res.key, act.key)}
                                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150 ease-in-out outline-none ${
                                    isChecked ? "bg-blue-600" : "bg-slate-200"
                                  } ${matrixLocked ? "opacity-50 cursor-not-allowed" : ""}`}
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-150 ease-in-out ${
                                      isChecked ? "translate-x-4" : "translate-x-0"
                                    }`}
                                  />
                                </button>
                              ) : (
                                <span className="text-slate-300 font-bold">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action bar: Custom Role save */}
            {!isSelectedRoleSystem && isDraftModified() && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveChanges}
                  disabled={isSavingRole}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <Save size={16} />
                  <span>{isSavingRole ? "Saving Changes..." : "Save Role changes"}</span>
                </button>
              </div>
            )}

            {/* Action bar: Editable system role (save override / reset to defaults) */}
            {isEditableSystemRole && isAuthorizedToManage && (
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                {activeSystemOverride && (
                  <button
                    onClick={handleResetSystemRole}
                    disabled={isSavingRole}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
                    title="Remove customizations and restore the built-in defaults"
                  >
                    <RotateCcw size={16} />
                    <span>Reset to Default</span>
                  </button>
                )}
                <button
                  onClick={handleSaveChanges}
                  disabled={isSavingRole || !isDraftModified()}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Save size={16} />
                  <span>{isSavingRole ? "Saving..." : "Save Matrix"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 2: USER ROLE ASSIGNMENTS ==================== */}
      {activeTab === "users" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Member Role Assignment</h2>
              <p className="text-xs text-slate-500">
                Grant custom or default system roles to team members within this organization.
              </p>
            </div>
            
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search members by name or email..."
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-4 text-xs outline-none focus:border-blue-600/60 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>

          {loadingMembers && members.length === 0 ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-5">Name</th>
                    <th className="py-3 px-5">Email</th>
                    <th className="py-3 px-5">Current Role</th>
                    <th className="py-3 px-5">Status</th>
                    {isAuthorizedToManage && <th className="py-3 px-5 text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredMembers.map((member) => {
                    const tenantInfo = member.tenants?.[tenantId];
                    if (!tenantInfo) return null;

                    const userRole = tenantInfo.role;
                    const isSystem = Object.keys(SYSTEM_ROLES).includes(userRole);
                    const roleName = isSystem
                      ? SYSTEM_ROLES[userRole as SystemRoleType].name
                      : customRoles.find((r) => r.id === userRole)?.name || userRole;

                    return (
                      <tr key={member.id} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-5 font-bold text-slate-900 flex items-center gap-2.5">
                          <div className="flex h-7.5 w-7.5 items-center justify-center rounded-full bg-slate-100 text-slate-600 text-xs font-extrabold">
                            {member.displayName.substring(0, 2).toUpperCase()}
                          </div>
                          <span>{member.displayName}</span>
                        </td>
                        <td className="py-3.5 px-5 text-slate-500">{member.email}</td>
                        <td className="py-3.5 px-5 font-semibold">
                          <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md text-slate-700 capitalize">
                            <Shield size={12} className="text-slate-400" />
                            {roleName.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3.5 px-5">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              tenantInfo.status === "active"
                                ? "bg-green-50 text-green-700"
                                : tenantInfo.status === "invited"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {tenantInfo.status}
                          </span>
                        </td>
                        {isAuthorizedToManage && (
                          <td className="py-3.5 px-5 text-right">
                            {member.id !== profile?.id ? (
                              <select
                                value={userRole}
                                onChange={(e) => handleUserRoleChange(member.id, member, e.target.value)}
                                className="rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none focus:border-blue-600 font-semibold text-slate-700 bg-white"
                              >
                                <option value="super_admin">Super Admin</option>
                                <option value="org_admin">Org Admin</option>
                                <option value="hr_manager">HR Manager</option>
                                <option value="recruiter">Recruiter</option>
                                <option value="employee">Employee</option>
                                {customRoles.map((role) => (
                                  <option key={role.id} value={role.id}>{role.name}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Self Account</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 3: AUDIT TRAIL ==================== */}
      {activeTab === "audit" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Security Audit Trail</h2>
              <p className="text-xs text-slate-500">
                A historical log of RBAC structure edits, permission updates, and member privilege adjustments.
              </p>
            </div>
            
            <div className="flex gap-2">
              <select
                value={auditFilterAction}
                onChange={(e) => setAuditFilterAction(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-blue-600"
              >
                <option value="all">All Actions</option>
                <option value="role.create">Role Created</option>
                <option value="role.update">Role Updated</option>
                <option value="role.delete">Role Deleted</option>
                <option value="user.role_assign">Role Assigned</option>
                <option value="user.role_remove">Role Removed</option>
              </select>
              <button
                onClick={fetchAuditLogs}
                disabled={loadingAudit}
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                title="Refresh audit trails"
              >
                <RefreshCw size={14} className={loadingAudit ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {loadingAudit && auditLogs.length === 0 ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : filteredAuditLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs italic">
              No audit log entries recorded.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-5">Timestamp</th>
                      <th className="py-3 px-5">Action</th>
                      <th className="py-3 px-5">Actor</th>
                      <th className="py-3 px-5">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                    {filteredAuditLogs.map((log) => {
                      let badgeColor = "bg-slate-100 text-slate-700 border-slate-200";
                      if (log.action === "role.create") badgeColor = "bg-green-50 text-green-700 border-green-200";
                      else if (log.action === "role.update") badgeColor = "bg-blue-50 text-blue-700 border-blue-200";
                      else if (log.action === "role.delete") badgeColor = "bg-red-50 text-red-700 border-red-200";
                      else if (log.action === "user.role_assign") badgeColor = "bg-indigo-50 text-indigo-700 border-indigo-200";
                      
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/30">
                          <td className="py-3.5 px-5 font-semibold text-slate-400 w-[170px]">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-5">
                            <span className={`inline-flex px-2 py-0.5 rounded border text-[9px] font-bold uppercase ${badgeColor}`}>
                              {log.action.replace(".", " ")}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 font-bold text-slate-700">
                            {log.actorName}
                          </td>
                          <td className="py-3.5 px-5 font-medium text-slate-800">
                            {log.details}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== CREATE ROLE MODAL ==================== */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-md relative overflow-y-auto max-h-[90dvh] space-y-4">
            
            <button
              onClick={() => setCreateModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Configure Custom Role</h3>
                <p className="text-xs text-slate-500">
                  Construct a customized set of privileges and records visibility.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="modal-role-name" className="text-slate-600 font-bold block mb-1">Role Name</label>
                  <input
                    id="modal-role-name"
                    type="text"
                    required
                    placeholder="e.g. ATS Coordinator"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-600 transition-all font-semibold"
                  />
                </div>
                <div>
                  <label htmlFor="modal-role-desc" className="text-slate-600 font-bold block mb-1">Description</label>
                  <input
                    id="modal-role-desc"
                    type="text"
                    placeholder="e.g. Conducts screening and routes applications"
                    value={newRoleDesc}
                    onChange={(e) => setNewRoleDesc(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-600 transition-all font-semibold"
                  />
                </div>
                <div>
                  <label htmlFor="modal-data-access" className="text-slate-600 font-bold block mb-1">Data Access Level</label>
                  <select
                    id="modal-data-access"
                    value={newRoleAccess}
                    onChange={(e) => setNewRoleAccess(e.target.value as DataAccessLevel)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-600 font-semibold"
                  >
                    <option value="all">All Records (Full Visibility)</option>
                    <option value="department">Department Records</option>
                    <option value="team">Team Records</option>
                    <option value="reports">Direct Reports Only</option>
                    <option value="self">Self Only</option>
                  </select>
                </div>
              </div>

              {/* Mini Permission Selector Grid */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h4 className="font-bold text-slate-800 text-sm">Assign Permissions Matrix</h4>
                
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto max-h-[300px]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[9px] font-extrabold text-slate-500 uppercase tracking-wider sticky top-0">
                          <th className="py-2.5 px-3 w-[200px] bg-slate-50">Resource</th>
                          {ACTIONS.map((act) => (
                            <th key={act.key} className="py-2.5 px-3 text-center bg-slate-50">{act.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {RESOURCES.map((res) => (
                          <tr key={res.key} className="hover:bg-slate-50/25">
                            <td className="py-2 px-3 font-bold text-slate-800">{res.label}</td>
                            {ACTIONS.map((act) => {
                              const isValid = isPermissionValid(res.key, act.key);
                              const key = `${res.key}.${act.key}` as PermissionKey;
                              const isChecked = newRolePerms.includes(key);

                              const toggle = () => {
                                setNewRolePerms((prev) =>
                                  prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
                                );
                              };

                              return (
                                <td key={act.key} className="py-2 px-3 text-center">
                                  {isValid ? (
                                    <button
                                      type="button"
                                      onClick={toggle}
                                      className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-150 ease-in-out outline-none ${
                                        isChecked ? "bg-blue-600" : "bg-slate-200"
                                      }`}
                                    >
                                      <span
                                        className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-150 ease-in-out ${
                                          isChecked ? "translate-x-3" : "translate-x-0"
                                        }`}
                                      />
                                    </button>
                                  ) : (
                                    <span className="text-slate-300">-</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end border-t border-slate-100 pt-4 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingRole}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isCreatingRole ? "Creating Role..." : "Create Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
```

## `frontend\src\features\rbac\utils\rbac.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { SYSTEM_ROLES, type PermissionKey } from "@hrms/middleware";

describe("RBAC Permissions Configuration", () => {
  describe("SYSTEM_ROLES configs", () => {
    it("should grant employee role only appropriate restricted permissions", () => {
      const employee = SYSTEM_ROLES.employee;
      expect(employee.dataAccessLevel).toBe("self");
      expect(employee.permissions).toContain("leave.view");
      expect(employee.permissions).toContain("leave.create");
      expect(employee.permissions).not.toContain("leave.approve");
      expect(employee.permissions).not.toContain("roles.view");
      expect(employee.permissions).not.toContain("users.delete");
    });

    it("should grant hr_manager role wide HR and employee management permissions", () => {
      const hr = SYSTEM_ROLES.hr_manager;
      expect(hr.dataAccessLevel).toBe("all");
      expect(hr.permissions).toContain("employees.create");
      expect(hr.permissions).toContain("leave.approve");
      expect(hr.permissions).toContain("departments.delete");
      expect(hr.permissions).not.toContain("roles.update"); // HR shouldn't manage RBAC
    });

    it("should grant recruiter role candidate and job recruitment permissions", () => {
      const recruiter = SYSTEM_ROLES.recruiter;
      expect(recruiter.dataAccessLevel).toBe("all");
      expect(recruiter.permissions).toContain("jobs.create");
      expect(recruiter.permissions).toContain("candidates.export");
      expect(recruiter.permissions).toContain("employees.view");
      expect(recruiter.permissions).not.toContain("leave.approve");
    });

    it("should grant super_admin and org_admin roles full platform visibility and permissions", () => {
      const superAdmin = SYSTEM_ROLES.super_admin;
      const orgAdmin = SYSTEM_ROLES.org_admin;

      expect(superAdmin.dataAccessLevel).toBe("all");
      expect(orgAdmin.dataAccessLevel).toBe("all");

      // Verify they have key permissions
      const requiredPerms: PermissionKey[] = [
        "users.delete",
        "roles.update",
        "departments.delete",
        "leave.approve",
      ];

      requiredPerms.forEach((perm) => {
        expect(superAdmin.permissions).toContain(perm);
        expect(orgAdmin.permissions).toContain(perm);
      });
    });
  });

  describe("Permission checking logic helper simulation", () => {
    const mockHasPermission = (userPermissions: PermissionKey[], checkPerm: PermissionKey): boolean => {
      return userPermissions.includes(checkPerm);
    };

    const mockCanEdit = (userPermissions: PermissionKey[], resource: string): boolean => {
      return (
        mockHasPermission(userPermissions, `${resource}.update` as PermissionKey) ||
        mockHasPermission(userPermissions, `${resource}.create` as PermissionKey)
      );
    };

    it("should correctly verify if a user has a permission", () => {
      const userPerms: PermissionKey[] = ["leave.view", "leave.create"];
      expect(mockHasPermission(userPerms, "leave.view")).toBe(true);
      expect(mockHasPermission(userPerms, "leave.approve")).toBe(false);
    });

    it("should correctly verify edit permissions (update or create)", () => {
      const userPerms1: PermissionKey[] = ["leave.update"];
      const userPerms2: PermissionKey[] = ["leave.create"];
      const userPerms3: PermissionKey[] = ["leave.view"];

      expect(mockCanEdit(userPerms1, "leave")).toBe(true);
      expect(mockCanEdit(userPerms2, "leave")).toBe(true);
      expect(mockCanEdit(userPerms3, "leave")).toBe(false);
    });
  });
});
```

## `frontend\src\features\rbac\utils\roleAssign.ts`

```ts
import { doc, writeBatch } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { logAuditTrail } from "./audit";

/**
 * Atomically updates a user's role in both their user profile and the userRoles collection,
 * and logs the audit trail entries for role assignment changes.
 */
export async function assignRoleToUser(
  tenantId: string,
  actorId: string,
  actorName: string,
  userId: string,
  userDisplayName: string,
  newRoleId: string,
  oldRoleId?: string,
  actorEmail?: string
) {
  const batch = writeBatch(db);
  const now = Date.now();

  // 1. Update user profile tenants map
  const userRef = doc(db, "users", userId);
  batch.update(userRef, {
    [`tenants.${tenantId}.role`]: newRoleId,
    updatedAt: now,
  });

  // 2. Set/update userRoles document in the root collection
  const userRolesRef = doc(db, "userRoles", `${tenantId}_${userId}`);
  batch.set(
    userRolesRef,
    {
      id: `${tenantId}_${userId}`,
      userId,
      tenantId,
      roleIds: [newRoleId],
      updatedAt: now,
    },
    { merge: true }
  );

  await batch.commit();

  // 3. Log audit trails for changes
  if (oldRoleId && oldRoleId !== newRoleId) {
    await logAuditTrail(
      tenantId,
      actorId,
      actorName,
      "user.role_remove",
      userId,
      `Removed role "${oldRoleId}" from user ${userDisplayName}`,
      actorEmail
    );
  }
  
  await logAuditTrail(
    tenantId,
    actorId,
    actorName,
    "user.role_assign",
    userId,
    `Assigned role "${newRoleId}" to user ${userDisplayName}`,
    actorEmail
  );
}

```

## `frontend\src\features\rbac\utils\audit.ts`

```ts
import { collection, doc, setDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type { AuditLog as SharedAuditLog } from "@hrms/middleware";

export interface AuditLog {
  id: string;
  tenantId: string;
  action: string;
  actorId: string;
  actorName: string;
  targetId: string;
  details: string;
  createdAt: number;
  // Shared type compatibility
  userId: string;
  userEmail: string;
  resource: "role";
  resourceId: string;
  timestamp: number;
}

/**
 * Creates an audit log entry in the auditLogs collection.
 */
export async function logAuditTrail(
  tenantId: string,
  actorId: string,
  actorName: string,
  action: string,
  targetId: string,
  details: string,
  actorEmail?: string
) {
  try {
    const logId = `log_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
    const logRef = doc(collection(db, "auditLogs"), logId);
    
    let mappedAction: SharedAuditLog["action"] = "update";
    if (action === "role.create") mappedAction = "create";
    else if (action === "role.delete") mappedAction = "delete";
    else if (action === "user.role_assign" || action === "user.role_remove") mappedAction = "role_change";

    const auditLog: AuditLog = {
      id: logId,
      tenantId,
      action: action,
      actorId,
      actorName,
      targetId,
      details,
      createdAt: Date.now(),
      
      // Shared schema fields
      userId: actorId,
      userEmail: actorEmail || actorName || "system",
      resource: "role",
      resourceId: targetId,
      timestamp: Date.now(),
    };

    // Set action to the mapped version for the global type compatibility (cast if typescript objects)
    const dbLog = {
      ...auditLog,
      action: action, // We store the specific action string in DB for legacy compatibility
    };

    await setDoc(logRef, dbLog);
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}

```

## `frontend\src\features\users\pages\UsersListPage.tsx`

```tsx
import { getFriendlyErrorMessage } from "../../../lib/errors";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../../../lib/firebase";
import { useAuth } from "../../auth/context/AuthContext";
import { useHasPermission } from "../../rbac/hooks/usePermissions";
import { Skeleton } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/ErrorState";
import { EmptyState } from "../../../components/ui/EmptyState";
import { UserPlus, Search, Shield, ToggleLeft, ToggleRight, Mail, UserCheck, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { UserProfile } from "@hrms/middleware";
import { assignRoleToUser } from "../../rbac/utils/roleAssign";

export function UsersListPage() {
  const { profile, activeTenant } = useAuth();
  const navigate = useNavigate();
  const hasPermission = useHasPermission();

  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search, Filter, Sort, Pagination states
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name-asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Invite modal states
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("employee");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const tenantId = profile?.activeTenantId || "";

  const [customRoles, setCustomRoles] = useState<any[]>([]);

  const fetchMembers = async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch members
      const q = query(
        collection(db, "users"),
        where(`tenants.${tenantId}.status`, "in", ["active", "invited", "disabled"])
      );
      const snap = await getDocs(q);
      const list: UserProfile[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as UserProfile);
      });
      setMembers(list);

      // 2. Fetch custom roles for this tenant
      const rq = query(
        collection(db, "roles"),
        where("tenantId", "==", tenantId)
      );
      const rSnap = await getDocs(rq);
      const rList: any[] = [];
      rSnap.forEach((docSnap) => {
        rList.push(docSnap.data());
      });
      setCustomRoles(rList);
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyErrorMessage(err, "Failed to load organization members."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [tenantId]);

  // Handle Enable/Disable Status
  const toggleUserStatus = async (user: UserProfile) => {
    const currentStatus = user.tenants?.[tenantId]?.status;
    const newStatus = currentStatus === "active" ? "disabled" : "active";

    try {
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, {
        [`tenants.${tenantId}.status`]: newStatus,
        updatedAt: Date.now(),
      });
      // Refresh list
      fetchMembers();
    } catch (err: any) {
      console.error(err);
      alert(getFriendlyErrorMessage(err, "Failed to update user status."));
    }
  };

  // Handle Role Change
  const handleRoleChange = async (userId: string, member: UserProfile, newRole: string) => {
    const oldRole = member.tenants?.[tenantId]?.role;
    try {
      await assignRoleToUser(
        tenantId,
        profile?.id || "",
        profile?.displayName || "Admin",
        userId,
        member.displayName,
        newRole,
        oldRole
      );
      // Refresh list
      fetchMembers();
    } catch (err: any) {
      console.error(err);
      alert(getFriendlyErrorMessage(err, "Failed to change user role."));
    }
  };


  // Handle Invite Submit
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setInviteLoading(true);
    setInviteError(null);
    setInviteSuccess(false);

    try {
      const inviteUserFn = httpsCallable(functions, "inviteUser");
      await inviteUserFn({ email: inviteEmail, tenantId, role: inviteRole });
      setInviteSuccess(true);
      setInviteEmail("");
      fetchMembers();
    } catch (err: any) {
      console.error(err);
      setInviteError(getFriendlyErrorMessage(err, "Failed to send invitation. Make sure Firebase Functions are running."));
    } finally {
      setInviteLoading(false);
    }
  };

  // Filter and Sort Logic
  const filteredMembers = members.filter((member) => {
    const memberTenant = member.tenants?.[tenantId];
    if (!memberTenant) return false;

    // Search query match
    const matchesSearch =
      member.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());

    // Role filter match
    const matchesRole = roleFilter === "all" || memberTenant.role === roleFilter;

    // Status filter match
    const matchesStatus = statusFilter === "all" || memberTenant.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const sortedMembers = [...filteredMembers].sort((a, b) => {
    const aTenant = a.tenants?.[tenantId];
    const bTenant = b.tenants?.[tenantId];
    if (!aTenant || !bTenant) return 0;

    if (sortBy === "name-asc") {
      return a.displayName.localeCompare(b.displayName);
    } else if (sortBy === "name-desc") {
      return b.displayName.localeCompare(a.displayName);
    } else if (sortBy === "email-asc") {
      return a.email.localeCompare(b.email);
    } else if (sortBy === "role-asc") {
      return aTenant.role.localeCompare(bTenant.role);
    }
    return 0;
  });

  // Pagination Logic
  const totalPages = Math.ceil(sortedMembers.length / itemsPerPage);
  const paginatedMembers = sortedMembers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );



  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return <ErrorState description={error} onRetry={fetchMembers} />;
  }

  return (
    <div className="space-y-6">
      {/* Top Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Users & Team Members</h1>
          <p className="text-sm text-slate-500">Manage access and organization roles.</p>
        </div>
        {hasPermission("users.create") && (
          <button
            onClick={() => {
              setInviteModalOpen(true);
              setInviteSuccess(false);
              setInviteError(null);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <UserPlus size={16} />
            <span>Invite Member</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by name or email..."
            className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-600/60 focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-semibold text-slate-700"
        >
          <option value="all">All Roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="org_admin">Org Admin</option>
          <option value="hr_manager">HR Manager</option>
          <option value="recruiter">Recruiter</option>
          <option value="employee">Employee</option>
          {customRoles.map((role) => (
            <option key={role.id} value={role.id}>{role.name}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-semibold text-slate-700"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="invited">Invited</option>
          <option value="disabled">Disabled</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-semibold text-slate-700"
        >
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
          <option value="email-asc">Email (A-Z)</option>
          <option value="role-asc">Role</option>
        </select>
      </div>

      {/* Member Table */}
      {paginatedMembers.length === 0 ? (
        <EmptyState
          title="No users match your filters"
          description="Try modifying your search query or reset filters to see your organization members."
          actionLabel="Clear Search"
          onAction={() => {
            setSearchQuery("");
            setRoleFilter("all");
            setStatusFilter("all");
          }}
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Email</th>
                  <th className="py-4 px-6">Role</th>
                  <th className="py-4 px-6">Status</th>
                  {hasPermission("users.update") && <th className="py-4 px-6 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedMembers.map((member) => {
                  const memberTenant = member.tenants?.[tenantId];
                  if (!memberTenant) return null;

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <button
                          onClick={() => navigate(`/users/${member.id}`)}
                          className="flex items-center gap-3 text-left font-semibold text-slate-900 hover:text-blue-600 cursor-pointer"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 text-sm font-bold">
                            {member.displayName.substring(0, 2).toUpperCase()}
                          </div>
                          <span>{member.displayName}</span>
                        </button>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-500">{member.email}</td>
                      <td className="py-4 px-6">
                        {hasPermission("users.update") && member.id !== profile?.id ? (
                          <select
                            value={memberTenant.role}
                            onChange={(e) => handleRoleChange(member.id, member, e.target.value)}
                            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold outline-none focus:border-blue-600"
                          >
                            <option value="super_admin">Super Admin</option>
                            <option value="org_admin">Org Admin</option>
                            <option value="hr_manager">HR Manager</option>
                            <option value="recruiter">Recruiter</option>
                            <option value="employee">Employee</option>
                            {customRoles.map((role) => (
                              <option key={role.id} value={role.id}>{role.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                            <Shield size={14} className="text-slate-400" />
                            {customRoles.find((r) => r.id === memberTenant.role)?.name || memberTenant.role.replace("_", " ")}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            memberTenant.status === "active"
                              ? "bg-green-50 text-green-700"
                              : memberTenant.status === "invited"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {memberTenant.status}
                        </span>
                      </td>
                      {hasPermission("users.update") && (
                        <td className="py-4 px-6 text-right">
                          {member.id !== profile?.id && (
                            <button
                              type="button"
                              onClick={() => toggleUserStatus(member)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                              title={memberTenant.status === "active" ? "Disable User" : "Activate User"}
                            >
                              {memberTenant.status === "active" ? (
                                <ToggleRight size={20} className="text-blue-600" />
                              ) : (
                                <ToggleLeft size={20} className="text-slate-400" />
                              )}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
              <span className="text-sm text-slate-500">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((c) => Math.max(c - 1, 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage((c) => Math.min(c + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invite Member Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-md relative">
            <button
              onClick={() => setInviteModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Mail size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Invite new member</h3>
                <p className="text-xs text-slate-500">They will receive an email to activate their account.</p>
              </div>
            </div>

            {inviteError && (
              <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-100">
                {inviteError}
              </div>
            )}

            {inviteSuccess ? (
              <div className="mt-4 space-y-4 text-center">
                <div className="rounded-xl bg-green-50 p-3 text-xs font-medium text-green-700 border border-green-100 flex items-center justify-center gap-2">
                  <UserCheck size={16} />
                  <span>Invitation successfully sent!</span>
                </div>
                <button
                  onClick={() => setInviteModalOpen(false)}
                  className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleInviteSubmit} className="mt-4 space-y-4">
                <div>
                  <label htmlFor="invite-email" className="text-sm font-semibold text-slate-700">
                    Email Address
                  </label>
                  <input
                    id="invite-email"
                    type="email"
                    required
                    placeholder="teammate@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="invite-role" className="text-sm font-semibold text-slate-700">
                    Organization Role
                  </label>
                  <select
                    id="invite-role"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-semibold text-slate-700"
                  >
                    <option value="org_admin">Org Admin</option>
                    <option value="hr_manager">HR Manager</option>
                    <option value="recruiter">Recruiter</option>
                    <option value="employee">Employee</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="mt-6 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {inviteLoading ? "Sending Invite..." : "Send Invite"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

## `frontend\src\features\users\pages\UserDetailsPage.tsx`

```tsx
/**
 * UserDetailsPage
 * -----------------------------------------------------------------------------
 * Read-only profile view for a single user, resolved from the `:id` route
 * param. Fetches the user document from Firestore and displays identity,
 * status, role (scoped to the active tenant), and account metadata. Renders
 * loading skeletons and an error/retry state as appropriate.
 */
import { getFriendlyErrorMessage } from "../../../lib/errors";
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../../lib/firebase";
import { useAuth } from "../../auth/context/AuthContext";
import { Skeleton } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/ErrorState";
import { ChevronLeft, Mail, Calendar, Shield, Info, Landmark } from "lucide-react";
import type { UserProfile } from "@hrms/middleware";

/**
 * Renders the detail view for the user identified by the `id` route param,
 * loading the profile from Firestore on mount and showing the tenant-scoped
 * role/status alongside core account information.
 */
export function UserDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchUser = async () => {
      setLoading(true);
      setError(null);
      try {
        const snap = await getDoc(doc(db, "users", id));
        if (snap.exists()) {
          setUser(snap.data() as UserProfile);
        } else {
          setError("User not found.");
        }
      } catch (err: any) {
        console.error(err);
        setError(getFriendlyErrorMessage(err, "Failed to load user profile."));
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  if (error || !user) {
    return <ErrorState description={error || "User details could not be loaded."} onRetry={() => navigate("/users")} />;
  }

  const tenantId = profile?.activeTenantId || "";
  const memberTenant = user.tenants?.[tenantId];

  return (
    <div className="space-y-6">
      {/* Back button and page title */}
      <div>
        <button
          onClick={() => navigate("/users")}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
        >
          <ChevronLeft size={16} />
          <span>Back to Users</span>
        </button>
        <h1 className="mt-3 text-xl font-bold text-slate-900">User Profile Details</h1>
      </div>

      {/* Main details card */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Left Card: Avatar and quick details */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center md:col-span-1">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-3xl font-bold">
            {user.displayName.substring(0, 2).toUpperCase()}
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-900">{user.displayName}</h2>
          <p className="text-sm text-slate-500">{user.email}</p>

          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                memberTenant?.status === "active"
                  ? "bg-green-50 text-green-700"
                  : memberTenant?.status === "invited"
                  ? "bg-blue-50 text-blue-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {memberTenant?.status || "unknown"}
            </span>

            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              <Shield size={12} />
              {memberTenant?.role.replace("_", " ") || "employee"}
            </span>
          </div>
        </div>

        {/* Right Card: Full properties list */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2 space-y-6">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Info size={18} className="text-slate-400" />
            <span>Information</span>
          </h3>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 text-sm">
            <div className="flex items-start gap-2.5">
              <Mail size={16} className="text-slate-400 mt-0.5" />
              <div>
                <div className="font-semibold text-slate-500">Email Address</div>
                <div className="text-slate-900 mt-0.5">{user.email}</div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Calendar size={16} className="text-slate-400 mt-0.5" />
              <div>
                <div className="font-semibold text-slate-500">Profile Created</div>
                <div className="text-slate-900 mt-0.5">
                  {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Landmark size={16} className="text-slate-400 mt-0.5" />
              <div>
                <div className="font-semibold text-slate-500">Active Tenant ID</div>
                <div className="text-slate-900 mt-0.5">{user.activeTenantId || "None"}</div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Shield size={16} className="text-slate-400 mt-0.5" />
              <div>
                <div className="font-semibold text-slate-500">Associated Tenants count</div>
                <div className="text-slate-900 mt-0.5">
                  {Object.keys(user.tenants).length} tenant(s)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## `frontend\src\features\employees\hooks\useEmployeeData.ts`

```ts
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../auth/context/AuthContext";
import { EmployeeService } from "../services/employeeService";
import { getFriendlyErrorMessage } from "../../../lib/errors";
import type { Employee, Department } from "@hrms/middleware";

/**
 * Custom hook to load and manage tenant employee directory and departments data,
 * honoring strict data-level access rules.
 */
export function useEmployeeData() {
  const { profile, dataAccessLevel } = useAuth();
  const tenantId = profile?.activeTenantId || "";
  const userId = profile?.id || "";

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [callerEmployee, setCallerEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch departments (including archived ones so the UI can manage/view them)
      const depts = await EmployeeService.getDepartments(tenantId, true);
      setDepartments(depts);

      // 2. Fetch the caller's employee profile
      let resolvedCallerEmp: Employee | null = null;
      if (userId) {
        resolvedCallerEmp = await EmployeeService.getCallerEmployee(tenantId, userId);
        setCallerEmployee(resolvedCallerEmp);
      }

      // 3. Fetch filtered employees list based on active dataAccessLevel
      const list = await EmployeeService.getEmployees(tenantId, dataAccessLevel, resolvedCallerEmp);
      setEmployees(list);
    } catch (err: any) {
      console.error("Error loading employee dashboard data:", err);
      setError(getFriendlyErrorMessage(err, "Failed to load directory details."));
    } finally {
      setLoading(false);
    }
  }, [tenantId, userId, dataAccessLevel]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    employees,
    departments,
    callerEmployee,
    loading,
    error,
    refetch: fetchData,
  };
}
```

## `frontend\src\features\employees\pages\EmployeesListPage.tsx`

```tsx
import { getFriendlyErrorMessage } from "../../../lib/errors";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { useNavigate } from "react-router-dom";
import { db, functions } from "../../../lib/firebase";
import { useAuth } from "../../auth/context/AuthContext";
import { useEmployeeData } from "../hooks/useEmployeeData";
import { EmployeeService } from "../services/employeeService";
import { useHasPermission } from "../../rbac/hooks/usePermissions";
import { hasCircularDependency, buildDepartmentTree, type DepartmentNode } from "../utils/departments";
import { Skeleton } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/ErrorState";
import { EmptyState } from "../../../components/ui/EmptyState";
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit2, 
  X, 
  Briefcase, 
  MapPin, 
  Calendar, 
  DollarSign, 
  FolderTree, 
  Search, 
  Eye, 
  EyeOff, 
  ShieldAlert,
  Network,
  Mail,
  Copy,
  Check,
  KeyRound
} from "lucide-react";
import type { Employee, Department, UserProfile, EmployeeStatus } from "@hrms/middleware";

interface OrgNodeProps {
  employee: Employee;
  allEmployees: Employee[];
  departments: Department[];
  expandedNodes: Record<string, boolean>;
  toggleExpand: (id: string) => void;
  primaryColor: string;
}

function OrgNode({
  employee,
  allEmployees,
  departments,
  expandedNodes,
  toggleExpand,
  primaryColor,
}: OrgNodeProps) {
  const reports = allEmployees.filter((e) => e.managerId === employee.id);
  const isExpanded = expandedNodes[employee.id] !== false; // default expanded
  const deptName = departments.find((d) => d.id === employee.departmentId)?.name || "Unassigned";

  return (
    <div className="flex flex-col items-center">
      {/* Employee Card */}
      <div className="relative flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all w-52 text-center z-10">
        <div 
          className="flex h-10 w-10 items-center justify-center rounded-full text-white font-extrabold text-xs mb-2 border-2 border-white ring-4 ring-slate-100/70"
          style={{ backgroundColor: primaryColor }}
        >
          {employee.firstName.substring(0, 1)}
          {employee.lastName.substring(0, 1)}
        </div>
        <h4 className="font-bold text-slate-900 text-[11px] truncate max-w-[180px]">
          {employee.firstName} {employee.lastName}
        </h4>
        <p className="text-[10px] text-slate-400 font-semibold truncate max-w-[180px]">
          {employee.jobTitle}
        </p>
        <span 
          className="mt-1.5 rounded-md px-1.5 py-0.5 text-[8px] font-extrabold tracking-wide uppercase"
          style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}
        >
          {deptName}
        </span>

        {reports.length > 0 && (
          <button
            type="button"
            onClick={() => toggleExpand(employee.id)}
            className="absolute -bottom-3 bg-white border border-slate-200 rounded-full h-6 px-2 text-[8px] font-bold text-slate-500 hover:text-slate-800 hover:border-slate-400 shadow-sm flex items-center gap-1 cursor-pointer transition-colors z-20 outline-none"
          >
            <span>
              {reports.length} {reports.length === 1 ? "report" : "reports"}
            </span>
            <span className="text-[7px]">{isExpanded ? "â–²" : "â–¼"}</span>
          </button>
        )}
      </div>

      {/* Children rendering */}
      {reports.length > 0 && isExpanded && (
        <div className="flex flex-col items-center w-full mt-6 relative">
          {/* Vertical parent connector */}
          <div className="w-px h-6 bg-slate-200" />

          {/* Children container */}
          <div className="flex gap-x-6 pt-0 relative">
            {reports.map((report, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === reports.length - 1;
              const isSingle = reports.length === 1;

              return (
                <div key={report.id} className="relative flex flex-col items-center">
                  {/* Horizontal line logic */}
                  {!isSingle && (
                    <div
                      className="absolute top-0 h-px bg-slate-200"
                      style={{
                        left: isFirst ? "50%" : "0",
                        right: isLast ? "50%" : "0",
                      }}
                    />
                  )}
                  {/* Vertical child connector */}
                  <div className="w-px h-6 bg-slate-200 mb-2" />

                  <OrgNode
                    employee={report}
                    allEmployees={allEmployees}
                    departments={departments}
                    expandedNodes={expandedNodes}
                    toggleExpand={toggleExpand}
                    primaryColor={primaryColor}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface TreeNodeProps {
  node: DepartmentNode;
  allDepartments: Department[];
  employees: Employee[];
  canManage: boolean;
  onEdit: (dept: Department) => void;
  onDelete: (deptId: string, name: string) => void;
  onArchive: (dept: Department, archive: boolean) => void;
  primaryColor: string;
}

function DepartmentTreeNode({
  node,
  allDepartments,
  employees,
  canManage,
  onEdit,
  onDelete,
  onArchive,
  primaryColor
}: TreeNodeProps) {
  const manager = employees.find(e => e.id === node.department.managerId);
  const managerName = manager ? `${manager.firstName} ${manager.lastName}` : "No manager assigned";
  const headCount = employees.filter(e => e.departmentId === node.department.id).length;

  return (
    <div className="ml-6 border-l-2 border-slate-100 pl-4 mt-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-blue-50 px-2.5 py-0.5 text-[9px] font-extrabold text-blue-600 tracking-wider">
            {node.department.code}
          </span>
          <span className="font-bold text-slate-800 text-sm">
            {node.department.name}
          </span>
          {node.department.isArchived && (
            <span className="rounded bg-rose-50 border border-rose-200 px-1.5 py-0.5 text-[8px] font-bold text-rose-600 uppercase">
              Archived
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-4 text-xs">
          <div className="text-slate-500 font-semibold">
            Headcount: <span className="font-bold text-blue-600">{headCount}</span>
          </div>
          <div className="text-slate-500 font-semibold">
            Manager: <span className="font-bold text-slate-700">{managerName}</span>
          </div>
          
          {canManage && (
            <div className="flex items-center gap-1 border border-slate-200 bg-slate-50 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => onEdit(node.department)}
                className="p-1 hover:bg-white text-slate-400 hover:text-slate-750 rounded cursor-pointer"
                title="Edit Department"
              >
                <Edit2 size={12} />
              </button>
              <button
                type="button"
                onClick={() => onArchive(node.department, !node.department.isArchived)}
                className="p-1 hover:bg-white text-slate-400 hover:text-slate-750 rounded cursor-pointer font-extrabold text-[10px] px-1.5"
                title={node.department.isArchived ? "Restore Department" : "Archive Department"}
              >
                {node.department.isArchived ? "Restore" : "Archive"}
              </button>
              <button
                type="button"
                onClick={() => onDelete(node.department.id, node.department.name)}
                className="p-1 hover:bg-white text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                title="Delete Department"
              >
                <Trash2 size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
      
      {node.children.length > 0 && (
        <div className="mt-2 space-y-2">
          {node.children.map(child => (
            <DepartmentTreeNode
              key={child.department.id}
              node={child}
              allDepartments={allDepartments}
              employees={employees}
              canManage={canManage}
              onEdit={onEdit}
              onDelete={onDelete}
              onArchive={onArchive}
              primaryColor={primaryColor}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function EmployeesListPage() {
  const { profile, user, activeTenant } = useAuth();
  const tenantId = profile?.activeTenantId || "";
  const navigate = useNavigate();

  // Permissions checks
  const hasPerm = useHasPermission();
  const canCreateEmployee = hasPerm("employees.create");
  const canEditEmployee = hasPerm("employees.update");
  const canDeleteEmployee = hasPerm("employees.delete");
  const canViewDepartments = hasPerm("departments.view");
  const canManageDepartments = hasPerm("departments.create") || hasPerm("departments.update");

  const callerInfo = user ? { uid: user.uid, email: user.email || "" } : undefined;

  // Tab State: "directory" vs "departments" vs "orgchart"
  const [activeTab, setActiveTab] = useState<"directory" | "departments" | "orgchart">("directory");

  // Org Chart expanded state
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: prev[nodeId] === false ? true : false,
    }));
  };

  const primaryColor = activeTenant?.primaryColor || "#2563eb";

  // Load core employee & department data through custom hook
  const { 
    employees, 
    departments, 
    callerEmployee, 
    loading, 
    error, 
    refetch 
  } = useEmployeeData();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Show/Hide salary state (privacy toggling)
  const [showSalaries, setShowSalaries] = useState(false);

  // Tenant users state (for linking employees to auth users)
  const [tenantUsers, setTenantUsers] = useState<UserProfile[]>([]);

  // Modal / Drawer state for Employee creation/editing
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  // Form inputs state
  const [empId, setEmpId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<EmployeeStatus>("active");
  const [startDate, setStartDate] = useState("");
  const [salary, setSalary] = useState<number>(0);
  // SEC-002: compensation is stored in a separate access-controlled collection
  // and only loaded for privileged roles (employees.update).
  const [compMap, setCompMap] = useState<Record<string, { salary: number; currency: string }>>({});
  const [workLocation, setWorkLocation] = useState("Remote");
  const [linkedUserId, setLinkedUserId] = useState("");
  // When creating a new employee: also provision a login account and email a
  // set-password link so the employee can sign in.
  const [createLogin, setCreateLogin] = useState(true);
  // Result of provisioning, surfaced in a confirmation modal (incl. the
  // set-password link, handy when email delivery isn't configured locally).
  const [provisionInfo, setProvisionInfo] = useState<{ email: string; url: string } | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Modal / Drawer state for Department configuration
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptCode, setNewDeptCode] = useState("");
  const [newDeptDesc, setNewDeptDesc] = useState("");
  const [newDeptManager, setNewDeptManager] = useState("");
  const [deptParentId, setDeptParentId] = useState("");
  const [deptError, setDeptError] = useState("");

  // Custom toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Department Search, Filtering & Pagination
  const [deptSearchQuery, setDeptSearchQuery] = useState("");
  const [deptStatusFilter, setDeptStatusFilter] = useState<"active" | "archived" | "all">("active");
  const [deptLayoutMode, setDeptLayoutMode] = useState<"tree" | "list">("tree");
  const [deptCurrentPage, setDeptCurrentPage] = useState(1);
  const DEPT_PAGE_SIZE = 6;

  // Fetch users within tenant to link their profiles
  const fetchTenantUsers = async () => {
    if (!tenantId) return;
    try {
      const q = query(
        collection(db, "users"),
        where(`tenants.${tenantId}.status`, "in", ["active", "invited"])
      );
      const snap = await getDocs(q);
      const list: UserProfile[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as UserProfile);
      });
      setTenantUsers(list);
    } catch (err) {
      console.error("Failed to load tenant users:", err);
    }
  };

  useEffect(() => {
    if (employeeModalOpen) {
      fetchTenantUsers();
    }
  }, [employeeModalOpen, tenantId]);

  // SEC-002: load compensation only for roles allowed to see it (employees.update).
  useEffect(() => {
    if (!tenantId || !canEditEmployee) {
      setCompMap({});
      return;
    }
    EmployeeService.getCompensations(tenantId).then(setCompMap).catch(() => setCompMap({}));
  }, [tenantId, canEditEmployee, employees]);

  // Open creation modal
  const handleOpenCreateModal = () => {
    if (!canCreateEmployee) {
      showToast("You don't have permission to add employees.");
      return;
    }
    setEditingEmployee(null);
    setEmpId("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setJobTitle("");
    const firstDept = departments[0];
    setSelectedDeptId(firstDept ? firstDept.id : "");
    setSelectedManagerId("");
    setSelectedStatus("active");
    setStartDate(new Date().toISOString().substring(0, 10));
    setSalary(50000);
    setWorkLocation("Remote");
    setLinkedUserId("");
    setCreateLogin(true);
    setEmployeeModalOpen(true);
  };

  // Open edit modal
  const handleOpenEditModal = (emp: Employee) => {
    if (!canEditEmployee) {
      showToast("You don't have permission to edit employees.");
      return;
    }
    setEditingEmployee(emp);
    setFirstName(emp.firstName);
    setLastName(emp.lastName);
    setEmail(emp.email);
    setPhone(emp.phone);
    setJobTitle(emp.jobTitle);
    setSelectedDeptId(emp.departmentId);
    setSelectedManagerId(emp.managerId || "");
    setSelectedStatus(emp.status);
    setStartDate(emp.startDate);
    setSalary(compMap[emp.id]?.salary ?? 0);
    setWorkLocation(emp.workLocation);
    setLinkedUserId(emp.userId || "");
    setEmployeeModalOpen(true);
  };

  // Submit Employee form (create or update)
  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;

    // Permission enforcement for direct submits (e.g. modal opened via state/keyboard)
    if (editingEmployee) {
      if (!canEditEmployee) {
        showToast("You don't have permission to update employees.");
        return;
      }
    } else {
      if (!canCreateEmployee) {
        showToast("You don't have permission to create employees.");
        return;
      }
    }

    setSaveLoading(true);

    const employeeData: Omit<Employee, "id" | "tenantId" | "createdAt" | "updatedAt"> = {
      firstName,
      lastName,
      email,
      phone,
      jobTitle,
      departmentId: selectedDeptId,
      status: selectedStatus,
      startDate,
      workLocation,
    };

    if (selectedManagerId) {
      employeeData.managerId = selectedManagerId;
    }
    if (linkedUserId) {
      employeeData.userId = linkedUserId;
    }

    try {
      if (editingEmployee) {
        await EmployeeService.updateEmployee(editingEmployee.id, employeeData, callerInfo);
        await EmployeeService.setCompensation(editingEmployee.id, tenantId, Number(salary), "USD", callerInfo);
        alert("Employee updated successfully!");
        setEmployeeModalOpen(false);
        refetch();
      } else {
        // Create the employee profile first.
        const created = await EmployeeService.createEmployee(tenantId, empId, employeeData, callerInfo);
        // SEC-002: store salary in the access-controlled compensation collection.
        await EmployeeService.setCompensation(created.id, tenantId, Number(salary), "USD", callerInfo);

        // Optionally provision a login account + email a set-password link.
        if (createLogin && email.trim()) {
          try {
            const provisionFn = httpsCallable(functions, "provisionEmployeeAccount");
            const res = await provisionFn({
              email: email.trim(),
              displayName: `${firstName} ${lastName}`.trim(),
              tenantId,
            });
            const d = (res.data || {}) as { uid?: string; oobCode?: string; setPasswordUrl?: string };

            // Link the new auth uid to the employee record.
            if (d.uid) {
              await EmployeeService.updateEmployee(created.id, { userId: d.uid }, callerInfo);
            }

            // Prefer a link against the current origin (works in local dev where
            // the configured APP_URL may differ from where the app is running).
            const localUrl = d.oobCode
              ? `${window.location.origin}/reset-password?oobCode=${encodeURIComponent(d.oobCode)}`
              : d.setPasswordUrl || "";

            setEmployeeModalOpen(false);
            refetch();
            setLinkCopied(false);
            setProvisionInfo({ email: email.trim(), url: localUrl });
          } catch (provErr: any) {
            console.error(provErr);
            // The profile was created; only the login provisioning failed.
            setEmployeeModalOpen(false);
            refetch();
            showToast(
              getFriendlyErrorMessage(
                provErr,
                "Employee added, but the login account could not be created. Make sure Firebase Functions are running, then try again."
              )
            );
          }
        } else {
          alert("Employee created successfully!");
          setEmployeeModalOpen(false);
          refetch();
        }
      }
    } catch (err: any) {
      console.error(err);
      alert(getFriendlyErrorMessage(err, "Failed to save employee profile."));
    } finally {
      setSaveLoading(false);
    }
  };

  // Provision (or re-send) a login for an employee: creates/reuses their auth
  // account, links it, and emails a fresh set-password link. Works for both
  // offline profiles (no login yet) and re-sending to existing accounts.
  const handleSendLoginEmail = async (emp: Employee) => {
    if (!tenantId) return;
    if (!emp.email) {
      showToast("This employee has no email address to send a login to.");
      return;
    }
    try {
      const provisionFn = httpsCallable(functions, "provisionEmployeeAccount");
      const res = await provisionFn({
        email: emp.email,
        displayName: `${emp.firstName} ${emp.lastName}`.trim(),
        tenantId,
      });
      const d = (res.data || {}) as { uid?: string; oobCode?: string; setPasswordUrl?: string };

      // Link the auth uid if the profile wasn't linked yet.
      if (d.uid && !emp.userId) {
        await EmployeeService.updateEmployee(emp.id, { userId: d.uid }, callerInfo);
      }

      const localUrl = d.oobCode
        ? `${window.location.origin}/reset-password?oobCode=${encodeURIComponent(d.oobCode)}`
        : d.setPasswordUrl || "";

      refetch();
      setLinkCopied(false);
      setProvisionInfo({ email: emp.email, url: localUrl });
    } catch (err: any) {
      console.error(err);
      showToast(
        getFriendlyErrorMessage(
          err,
          "Could not send the login email. Make sure Firebase Functions are running, then try again."
        )
      );
    }
  };

  // Delete employee record
  const handleDeleteEmployee = async (empId: string, name: string) => {
    if (!canDeleteEmployee) {
      showToast("You don't have permission to delete employees.");
      return;
    }
    if (!confirm(`Are you sure you want to remove ${name} from the directory?`)) return;
    try {
      await EmployeeService.deleteEmployee(empId, callerInfo);
      alert("Employee deleted successfully.");
      refetch();
    } catch (err: any) {
      console.error(err);
      alert(getFriendlyErrorMessage(err, "Failed to delete employee."));
    }
  };

  // Open Create Department Modal
  const handleOpenCreateDeptModal = () => {
    setEditingDept(null);
    setNewDeptName("");
    setNewDeptCode("");
    setNewDeptDesc("");
    setNewDeptManager("");
    setDeptParentId("");
    setDeptError("");
    setDeptModalOpen(true);
  };

  // Open Edit Department Modal
  const handleOpenEditDeptModal = (dept: Department) => {
    setEditingDept(dept);
    setNewDeptName(dept.name);
    setNewDeptCode(dept.code);
    setNewDeptDesc(dept.description);
    setNewDeptManager(dept.managerId || "");
    setDeptParentId(dept.parentId || "");
    setDeptError("");
    setDeptModalOpen(true);
  };

  // Create or Update Department
  const handleCreateOrUpdateDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;

    // Validate circular dependency
    if (editingDept && deptParentId) {
      if (hasCircularDependency(departments, editingDept.id, deptParentId)) {
        setDeptError("Setting this parent creates a circular hierarchy loop!");
        return;
      }
    }

    const deptData: Omit<Department, "id" | "tenantId" | "createdAt" | "updatedAt"> & { parentId?: string; isArchived?: boolean } = {
      name: newDeptName.trim(),
      code: newDeptCode.trim().toUpperCase(),
      description: newDeptDesc.trim(),
      parentId: deptParentId,
    };

    if (newDeptManager) {
      deptData.managerId = newDeptManager;
    } else {
      deptData.managerId = ""; // Clear manager
    }

    try {
      if (editingDept) {
        await EmployeeService.updateDepartment(editingDept.id, deptData, callerInfo);
        showToast(`Department "${editingDept.name}" updated successfully!`);
      } else {
        await EmployeeService.createDepartment(tenantId, deptData, callerInfo);
        showToast(`Department "${newDeptName}" created successfully!`);
      }
      setDeptModalOpen(false);
      refetch();
    } catch (err: any) {
      console.error(err);
      setDeptError(getFriendlyErrorMessage(err, "Failed to save department."));
    }
  };

  // Archive / Unarchive Department
  const handleArchiveDepartment = async (dept: Department, archive: boolean) => {
    try {
      await EmployeeService.updateDepartment(dept.id, { isArchived: archive }, callerInfo);
      showToast(`Department "${dept.name}" ${archive ? "archived" : "restored"} successfully!`);
      refetch();
    } catch (err: any) {
      console.error(err);
      showToast(getFriendlyErrorMessage(err, "Failed to update department status."));
    }
  };

  // Delete department submit
  const handleDeleteDepartment = async (deptId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the department "${name}"?`)) return;
    try {
      await EmployeeService.deleteDepartment(deptId, callerInfo);
      showToast("Department deleted.");
      refetch();
    } catch (err: any) {
      console.error(err);
      showToast(getFriendlyErrorMessage(err, "Failed to delete department."));
    }
  };

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = 
      `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = deptFilter === "all" || emp.departmentId === deptFilter;
    const matchesStatus = statusFilter === "all" || emp.status === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return <ErrorState description={error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Employee Directory</h1>
          <p className="text-sm text-slate-500">
            Manage corporate positions, departments, time structures, and records.
          </p>
        </div>
        
        {activeTab === "directory" && canCreateEmployee && (
          <button
            onClick={handleOpenCreateModal}
            className="self-start inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity cursor-pointer"
            style={{ backgroundColor: primaryColor }}
          >
            <Plus size={16} />
            <span>Add Employee</span>
          </button>
        )}

        {activeTab === "departments" && canManageDepartments && (
          <button
            onClick={handleOpenCreateDeptModal}
            className="self-start inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity cursor-pointer"
            style={{ backgroundColor: primaryColor }}
          >
            <Plus size={16} />
            <span>Add Department</span>
          </button>
        )}
      </div>

      {/* HiBob Inspired tab buttons */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("directory")}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-bold border-b-2 cursor-pointer transition-all ${
            activeTab === "directory"
              ? "text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
          style={activeTab === "directory" ? { borderColor: primaryColor, color: primaryColor } : {}}
        >
          <Users size={16} />
          <span>People Directory</span>
        </button>
        {canViewDepartments && (
          <button
            onClick={() => setActiveTab("departments")}
            className={`flex items-center gap-2 py-3 px-5 text-sm font-bold border-b-2 cursor-pointer transition-all ${
              activeTab === "departments"
                ? "text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
            style={activeTab === "departments" ? { borderColor: primaryColor, color: primaryColor } : {}}
          >
            <FolderTree size={16} />
            <span>Departments ({departments.length})</span>
          </button>
        )}
        <button
          onClick={() => setActiveTab("orgchart")}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-bold border-b-2 cursor-pointer transition-all ${
            activeTab === "orgchart"
              ? "text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
          style={activeTab === "orgchart" ? { borderColor: primaryColor, color: primaryColor } : {}}
        >
          <Network size={16} />
          <span>Org Chart</span>
        </button>
      </div>

      {/* ==================== TAB 1: DIRECTORY ==================== */}
      {activeTab === "directory" && (
        <div className="space-y-4">
          
          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email or job title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-4 text-xs outline-none focus:border-blue-600/60 focus:ring-2 focus:ring-blue-100 transition-all font-semibold"
              />
            </div>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-blue-600 text-slate-700"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-blue-600 text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="onboarding">Onboarding</option>
              <option value="terminated">Terminated</option>
              <option value="suspended">Suspended</option>
            </select>

            {/* Toggle sensitive salary info display (available only for privileged roles) */}
            {(hasPerm("employees.update") || hasPerm("employees.create")) && (
              <button
                type="button"
                onClick={() => setShowSalaries(!showSalaries)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                {showSalaries ? <EyeOff size={14} /> : <Eye size={14} />}
                <span>{showSalaries ? "Hide Salary" : "Show Salary"}</span>
              </button>
            )}
          </div>

          {/* Directory Table */}
          {filteredEmployees.length === 0 ? (
            <EmptyState 
              title="No employees found" 
              description="No employee profiles match your search criteria. Add a new employee or modify filters." 
            />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-5">Name</th>
                      <th className="py-3 px-5">Job Details</th>
                      <th className="py-3 px-5">Location</th>
                      <th className="py-3 px-5">Manager</th>
                      <th className="py-3 px-5">Start Date</th>
                      <th className="py-3 px-5">Status</th>
                      {showSalaries && <th className="py-3 px-5">Salary</th>}
                      {(canEditEmployee || canDeleteEmployee) && <th className="py-3 px-5 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredEmployees.map((emp) => {
                      const deptName = departments.find(d => d.id === emp.departmentId)?.name || "Unassigned";
                      const managerName = employees.find(e => e.id === emp.managerId);
                      const displayManager = managerName ? `${managerName.firstName} ${managerName.lastName}` : "Direct Report to CEO";

                      return (
                        <tr key={emp.id} className="hover:bg-slate-50/40">
                          {/* Name Block */}
                          <td className="py-3 px-5 font-bold text-slate-900 flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-xs font-extrabold">
                              {emp.firstName.substring(0, 1)}{emp.lastName.substring(0, 1)}
                            </div>
                            <div>
                              <button
                                type="button"
                                onClick={() => navigate(`/employees/${emp.id}`)}
                                className="text-left hover:text-blue-600 hover:underline cursor-pointer"
                              >
                                {emp.firstName} {emp.lastName}
                              </button>
                              <div className="text-[10px] text-slate-400 font-medium">{emp.email}</div>
                            </div>
                          </td>

                          {/* Job Details */}
                          <td className="py-3 px-5">
                            <div className="font-semibold text-slate-800 flex items-center gap-1">
                              <Briefcase size={12} className="text-slate-400" />
                              {emp.jobTitle}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{deptName} Department</div>
                          </td>

                          {/* Work Location */}
                          <td className="py-3 px-5">
                            <div className="text-slate-600 font-semibold flex items-center gap-1">
                              <MapPin size={12} className="text-slate-400" />
                              {emp.workLocation}
                            </div>
                          </td>

                          {/* Reporting Line */}
                          <td className="py-3 px-5">
                            <span className="font-semibold text-slate-600">{displayManager}</span>
                          </td>

                          {/* Start Date */}
                          <td className="py-3 px-5">
                            <div className="text-slate-500 font-semibold flex items-center gap-1">
                              <Calendar size={12} className="text-slate-400" />
                              {emp.startDate}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-5">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase ${
                                emp.status === "active"
                                  ? "bg-green-50 text-green-700 border border-green-150"
                                  : emp.status === "onboarding"
                                  ? "bg-blue-50 text-blue-700 border border-blue-150"
                                  : emp.status === "terminated"
                                  ? "bg-red-50 text-red-700 border border-red-150"
                                  : "bg-amber-50 text-amber-700 border border-amber-150"
                              }`}
                            >
                              {emp.status}
                            </span>
                          </td>

                          {/* Salary Column (Conditional Render) */}
                          {showSalaries && (
                            <td className="py-3 px-5 font-bold text-slate-800">
                              <div className="flex items-center gap-0.5">
                                <DollarSign size={12} className="text-slate-400" />
                                {(compMap[emp.id]?.salary ?? 0).toLocaleString()}
                              </div>
                            </td>
                          )}

                          {/* Actions */}
                          {(canEditEmployee || canDeleteEmployee) && (
                            <td className="py-3 px-5 text-right space-x-1.5">
                              {canEditEmployee && emp.email && (
                                <button
                                  onClick={() => handleSendLoginEmail(emp)}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
                                  title={emp.userId ? "Resend set-password email" : "Create login & email set-password link"}
                                >
                                  <KeyRound size={13} />
                                </button>
                              )}
                              {canEditEmployee && (
                                <button
                                  onClick={() => handleOpenEditModal(emp)}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                                  title="Edit Profile"
                                >
                                  <Edit2 size={13} />
                                </button>
                              )}
                              {canDeleteEmployee && emp.id !== callerEmployee?.id && (
                                <button
                                  onClick={() => handleDeleteEmployee(emp.id, `${emp.firstName} ${emp.lastName}`)}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                                  title="Remove Employee"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 2: DEPARTMENTS ==================== */}
      {/* ==================== TAB 2: DEPARTMENTS ==================== */}
      {activeTab === "departments" && (
        <div className="space-y-6">
          {/* Controls: Search, Filter, Layout Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap flex-1 items-center gap-3 min-w-[280px]">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search departments by name or code..."
                  value={deptSearchQuery}
                  onChange={(e) => {
                    setDeptSearchQuery(e.target.value);
                    setDeptCurrentPage(1);
                  }}
                  className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-4 text-xs outline-none focus:border-blue-600/60 focus:ring-2 focus:ring-blue-100 transition-all font-semibold"
                />
              </div>

              <select
                value={deptStatusFilter}
                onChange={(e) => {
                  setDeptStatusFilter(e.target.value as "active" | "archived" | "all");
                  setDeptCurrentPage(1);
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-blue-600 text-slate-700"
              >
                <option value="active">Active Departments</option>
                <option value="archived">Archived Departments</option>
                <option value="all">All Departments</option>
              </select>
            </div>

            <div className="flex items-center gap-1 border border-slate-200 bg-slate-50 rounded-xl p-1 shrink-0">
              <button
                type="button"
                onClick={() => setDeptLayoutMode("tree")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  deptLayoutMode === "tree"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <FolderTree size={14} />
                <span>Hierarchy Tree</span>
              </button>
              <button
                type="button"
                onClick={() => setDeptLayoutMode("list")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  deptLayoutMode === "list"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Network size={14} />
                <span>Grid List</span>
              </button>
            </div>
          </div>

          {/* Department Content Display */}
          {deptLayoutMode === "tree" ? (
            (() => {
              // 1. Filter departments by archive status
              const statusFiltered = departments.filter((dept) => {
                return deptStatusFilter === "all" ||
                  (deptStatusFilter === "active" && !dept.isArchived) ||
                  (deptStatusFilter === "archived" && dept.isArchived);
              });

              const deptIds = new Set(statusFiltered.map(d => d.id));
              
              // 2. Find roots (no parentId, or parentId is not in statusFiltered)
              const roots = statusFiltered.filter(d => !d.parentId || !deptIds.has(d.parentId));

              // 3. Build subtrees
              const buildSubtree = (dept: Department, level: number = 0): DepartmentNode => {
                return {
                  department: dept,
                  children: statusFiltered
                    .filter(d => d.parentId === dept.id)
                    .map(d => buildSubtree(d, level + 1)),
                  level
                };
              };

              let treeNodes: DepartmentNode[] = roots.map(root => buildSubtree(root, 0));

              // 4. Recursively filter tree nodes by search query
              const filterTreeNodes = (nodes: DepartmentNode[], queryStr: string): DepartmentNode[] => {
                if (!queryStr) return nodes;
                const lowercaseQuery = queryStr.toLowerCase();
                
                return nodes
                  .map(node => {
                    const filteredChildren = filterTreeNodes(node.children, queryStr);
                    const matches = 
                      node.department.name.toLowerCase().includes(lowercaseQuery) ||
                      node.department.code.toLowerCase().includes(lowercaseQuery);
                      
                    if (matches || filteredChildren.length > 0) {
                      return {
                        ...node,
                        children: filteredChildren
                      };
                    }
                    return null;
                  })
                  .filter((node): node is DepartmentNode => node !== null);
              };

              treeNodes = filterTreeNodes(treeNodes, deptSearchQuery);

              if (treeNodes.length === 0) {
                return (
                  <EmptyState 
                    title="No departments found" 
                    description="No organizational departments match your search criteria. Expand filters or add a new department." 
                  />
                );
              }

              return (
                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-6 space-y-4">
                  {treeNodes.map((node) => (
                    <DepartmentTreeNode
                      key={node.department.id}
                      node={node}
                      allDepartments={departments}
                      employees={employees}
                      canManage={canManageDepartments}
                      onEdit={handleOpenEditDeptModal}
                      onDelete={handleDeleteDepartment}
                      onArchive={handleArchiveDepartment}
                      primaryColor={primaryColor}
                    />
                  ))}
                </div>
              );
            })()
          ) : (
            (() => {
              // Grid List layout with pagination
              const filteredList = departments.filter((dept) => {
                const matchesStatus = 
                  deptStatusFilter === "all" ||
                  (deptStatusFilter === "active" && !dept.isArchived) ||
                  (deptStatusFilter === "archived" && dept.isArchived);
                  
                const matchesSearch = 
                  dept.name.toLowerCase().includes(deptSearchQuery.toLowerCase()) ||
                  dept.code.toLowerCase().includes(deptSearchQuery.toLowerCase());
                  
                return matchesStatus && matchesSearch;
              });

              if (filteredList.length === 0) {
                return (
                  <EmptyState 
                    title="No departments found" 
                    description="No organizational departments match your search criteria. Expand filters or add a new department." 
                  />
                );
              }

              const totalDepts = filteredList.length;
              const totalPages = Math.ceil(totalDepts / DEPT_PAGE_SIZE);
              const activePage = Math.min(deptCurrentPage, totalPages || 1);
              const startIndex = (activePage - 1) * DEPT_PAGE_SIZE;
              const paginatedDepts = filteredList.slice(startIndex, startIndex + DEPT_PAGE_SIZE);

              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {paginatedDepts.map((dept) => {
                      const manager = employees.find(e => e.id === dept.managerId);
                      const managerName = manager ? `${manager.firstName} ${manager.lastName}` : "No manager assigned";
                      const headCount = employees.filter(e => e.departmentId === dept.id).length;

                      return (
                        <div key={dept.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow relative">
                          {canManageDepartments && (
                            <div className="absolute right-4 top-4 flex items-center gap-1.5 border border-slate-100 bg-slate-50 rounded-lg p-0.5 z-10">
                              <button
                                onClick={() => handleOpenEditDeptModal(dept)}
                                className="p-1 hover:bg-white text-slate-400 hover:text-slate-800 rounded cursor-pointer"
                                title="Edit Department"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={() => handleArchiveDepartment(dept, !dept.isArchived)}
                                className="p-1 hover:bg-white text-slate-400 hover:text-slate-800 rounded cursor-pointer font-extrabold text-[9px] px-1.5"
                                title={dept.isArchived ? "Restore Department" : "Archive Department"}
                              >
                                {dept.isArchived ? "Restore" : "Archive"}
                              </button>
                              <button
                                onClick={() => handleDeleteDepartment(dept.id, dept.name)}
                                className="p-1 hover:bg-white text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                title="Delete Department"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="rounded-lg bg-blue-50 px-2.5 py-0.5 text-[10px] font-extrabold text-blue-600 tracking-wider">
                                {dept.code}
                              </span>
                              <h3 className="font-bold text-slate-900 text-sm truncate max-w-[150px]">{dept.name}</h3>
                              {dept.isArchived && (
                                <span className="rounded bg-rose-50 border border-rose-200 px-1.5 py-0.5 text-[8px] font-bold text-rose-600 uppercase">
                                  Archived
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 leading-normal pt-1 line-clamp-2 min-h-[32px]">{dept.description || "No description provided."}</p>
                          </div>

                          <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
                            <div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department Manager</div>
                              <div className="font-semibold text-slate-700 mt-0.5 truncate max-w-[130px]">{managerName}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Headcount</div>
                              <div className="font-extrabold text-blue-600 text-sm mt-0.5">{headCount} Members</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-150 pt-4">
                      <span className="text-xs text-slate-500 font-semibold">
                        Showing <span className="font-bold text-slate-800">{startIndex + 1}</span> to{" "}
                        <span className="font-bold text-slate-800">
                          {Math.min(startIndex + DEPT_PAGE_SIZE, totalDepts)}
                        </span>{" "}
                        of <span className="font-bold text-slate-800">{totalDepts}</span> departments
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDeptCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={activePage === 1}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-650 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setDeptCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={activePage === totalPages}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-650 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* ==================== TAB 3: ORG CHART ==================== */}
      {activeTab === "orgchart" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Reporting Hierarchy Tree</h2>
              <p className="text-xs text-slate-500">Visual corporate organizational chart showing manager reporting lines.</p>
            </div>
            <button 
              onClick={() => setExpandedNodes({})}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Reset Chart
            </button>
          </div>
          
          {(() => {
            const roots = employees.filter(emp => !emp.managerId || !employees.some(e => e.id === emp.managerId));
            if (roots.length === 0) {
              return (
                <div className="text-center py-12 text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-slate-200/60">
                  No hierarchy links found. Please assign managers to employees.
                </div>
              );
            }
            return (
              <div className="overflow-auto py-8 px-4 bg-slate-50 rounded-xl border border-slate-200/60 flex justify-center min-h-[500px]">
                <div className="inline-flex flex-col items-center min-w-max">
                  <div className="flex gap-x-8">
                    {roots.map((root) => (
                      <OrgNode
                        key={root.id}
                        employee={root}
                        allEmployees={employees}
                        departments={departments}
                        expandedNodes={expandedNodes}
                        toggleExpand={toggleExpand}
                        primaryColor={primaryColor}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ==================== CREATE / EDIT EMPLOYEE MODAL ==================== */}
      {employeeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-md relative overflow-y-auto max-h-[90dvh] space-y-4">
            
            <button
              onClick={() => setEmployeeModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Users size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{editingEmployee ? "Edit Employee Profile" : "Add New Employee"}</h3>
                <p className="text-xs text-slate-500">Configure corporate identity and access structures.</p>
              </div>
            </div>

            <form onSubmit={handleEmployeeSubmit} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {!editingEmployee && (
                  <div className="sm:col-span-2">
                    <label htmlFor="emp-id" className="text-slate-600 font-bold block mb-1">
                      Employee ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="emp-id"
                      type="text"
                      required
                      placeholder="e.g. EMP001"
                      value={empId}
                      onChange={(e) => setEmpId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-600 transition-all font-semibold"
                    />
                    <p className="mt-1 text-[10px] font-medium text-slate-400">
                      Manually assigned. Letters, numbers, '.', '-' and '_' only. Must be unique.
                    </p>
                  </div>
                )}
                <div>
                  <label htmlFor="first-name" className="text-slate-600 font-bold block mb-1">First Name</label>
                  <input
                    id="first-name"
                    type="text"
                    required
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-600 transition-all font-semibold"
                  />
                </div>
                <div>
                  <label htmlFor="last-name" className="text-slate-600 font-bold block mb-1">Last Name</label>
                  <input
                    id="last-name"
                    type="text"
                    required
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-600 transition-all font-semibold"
                  />
                </div>
                <div>
                  <label htmlFor="emp-email" className="text-slate-600 font-bold block mb-1">Work Email</label>
                  <input
                    id="emp-email"
                    type="email"
                    required
                    placeholder="john.doe@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-600 transition-all font-semibold"
                  />
                </div>
                <div>
                  <label htmlFor="emp-phone" className="text-slate-600 font-bold block mb-1">Contact Phone</label>
                  <input
                    id="emp-phone"
                    type="tel"
                    required
                    placeholder="+1 (555) 123-4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-600 transition-all font-semibold"
                  />
                </div>
                <div>
                  <label htmlFor="job-title" className="text-slate-600 font-bold block mb-1">Job Title</label>
                  <input
                    id="job-title"
                    type="text"
                    required
                    placeholder="Software Engineer"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-600 transition-all font-semibold"
                  />
                </div>
                <div>
                  <label htmlFor="emp-dept" className="text-slate-600 font-bold block mb-1">Department</label>
                  <select
                    id="emp-dept"
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-600 font-semibold"
                  >
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="emp-manager" className="text-slate-600 font-bold block mb-1">Direct Manager</label>
                  <select
                    id="emp-manager"
                    value={selectedManagerId}
                    onChange={(e) => setSelectedManagerId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-600 font-semibold"
                  >
                    <option value="">Direct Report to CEO (No Manager)</option>
                    {employees
                      .filter((emp) => emp.id !== editingEmployee?.id) // Prevent selecting self as manager
                      .map((emp) => (
                        <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                      ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="emp-location" className="text-slate-600 font-bold block mb-1">Work Location</label>
                  <input
                    id="emp-location"
                    type="text"
                    required
                    placeholder="Remote / Office - NYC"
                    value={workLocation}
                    onChange={(e) => setWorkLocation(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-600 transition-all font-semibold"
                  />
                </div>
                <div>
                  <label htmlFor="emp-status" className="text-slate-600 block font-bold mb-1">Status</label>
                  <select
                    id="emp-status"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as EmployeeStatus)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-600 font-semibold"
                  >
                    <option value="active">Active</option>
                    <option value="onboarding">Onboarding</option>
                    <option value="terminated">Terminated</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="start-date" className="text-slate-600 font-bold block mb-1">Start Date</label>
                  <input
                    id="start-date"
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-600 transition-all font-semibold"
                  />
                </div>
                <div>
                  <label htmlFor="salary" className="text-slate-600 font-bold block mb-1">Annual Salary ($)</label>
                  <input
                    id="salary"
                    type="number"
                    required
                    value={salary}
                    onChange={(e) => setSalary(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-600 transition-all font-semibold"
                  />
                </div>
                
                {/* Login provisioning (create mode) */}
                {!editingEmployee && (
                  <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createLogin}
                        onChange={(e) => setCreateLogin(e.target.checked)}
                        className="mt-0.5 rounded"
                      />
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <KeyRound size={13} className="text-blue-600" />
                        <span className="font-bold">Create a login account and email a set-password link</span>
                      </span>
                    </label>
                    <p className="mt-1.5 ml-6 text-[10px] font-medium text-slate-400 leading-normal">
                      Registers the employee with the email above so they can sign in. They'll receive an
                      email with a link to set their password, then log in. Requires a work email.
                    </p>
                  </div>
                )}

                {/* Link to an existing Auth Account (manual) â€” only when not auto-provisioning */}
                {(editingEmployee || !createLogin) && (
                  <div>
                    <label htmlFor="link-user" className="text-slate-600 font-bold block mb-1">Link to Auth Account</label>
                    <select
                      id="link-user"
                      value={linkedUserId}
                      onChange={(e) => setLinkedUserId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-600 font-semibold"
                    >
                      <option value="">No Active login link (Offline profile)</option>
                      {tenantUsers
                        .filter((u) => {
                          // Allow current linked user in edit mode
                          if (editingEmployee && editingEmployee.userId === u.id) return true;
                          // Otherwise, check if user is already linked elsewhere
                          return !employees.some(e => e.userId === u.id);
                        })
                        .map((u) => (
                          <option key={u.id} value={u.id}>{u.displayName} ({u.email})</option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end border-t border-slate-100 pt-4 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setEmployeeModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {saveLoading ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== CREATE DEPARTMENT MODAL ==================== */}
      {/* ==================== CREATE / EDIT DEPARTMENT MODAL ==================== */}
      {deptModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-md relative space-y-4">
            
            <button
              onClick={() => setDeptModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FolderTree size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{editingDept ? "Edit Department" : "Add Department"}</h3>
                <p className="text-xs text-slate-500">
                  {editingDept ? "Modify department details and hierarchy structure." : "Create a new organizational business unit."}
                </p>
              </div>
            </div>

            {deptError && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-red-650 text-[11px] font-bold flex items-center gap-2">
                <ShieldAlert size={14} className="shrink-0" />
                <span>{deptError}</span>
              </div>
            )}

            <form onSubmit={handleCreateOrUpdateDeptSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
              <div>
                <label htmlFor="dept-name" className="text-slate-650 font-bold block mb-1">Department Name</label>
                <input
                  id="dept-name"
                  type="text"
                  required
                  placeholder="e.g. Engineering"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-blue-600 transition-all font-semibold"
                />
              </div>

              <div>
                <label htmlFor="dept-code" className="text-slate-650 font-bold block mb-1">Department Code</label>
                <input
                  id="dept-code"
                  type="text"
                  required
                  placeholder="e.g. ENG"
                  value={newDeptCode}
                  onChange={(e) => setNewDeptCode(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-blue-600 transition-all font-semibold"
                />
              </div>

              <div>
                <label htmlFor="dept-desc" className="text-slate-650 font-bold block mb-1">Description</label>
                <input
                  id="dept-desc"
                  type="text"
                  placeholder="e.g. Product design and development team"
                  value={newDeptDesc}
                  onChange={(e) => setNewDeptDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-blue-600 transition-all font-semibold"
                />
              </div>

              <div>
                <label htmlFor="dept-manager" className="text-slate-650 font-bold block mb-1">Department Manager</label>
                <select
                  id="dept-manager"
                  value={newDeptManager}
                  onChange={(e) => setNewDeptManager(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 outline-none focus:border-blue-600 font-semibold text-slate-700"
                >
                  <option value="">No Manager Assigned</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="dept-parent" className="text-slate-650 font-bold block mb-1">Parent Department</label>
                <select
                  id="dept-parent"
                  value={deptParentId}
                  onChange={(e) => setDeptParentId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 outline-none focus:border-blue-600 font-semibold text-slate-700"
                >
                  <option value="">None (Root Department)</option>
                  {departments
                    .filter((dept) => {
                      if (editingDept && dept.id === editingDept.id) return false;
                      if (dept.isArchived) return false;
                      return true;
                    })
                    .map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name} ({dept.code})</option>
                    ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-3 text-white hover:bg-blue-700 transition-colors cursor-pointer text-xs font-bold"
              >
                {editingDept ? "Save Changes" : "Create Department"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================== EMPLOYEE LOGIN PROVISIONED MODAL ==================== */}
      {provisionInfo && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-md relative space-y-4">
            <button
              onClick={() => setProvisionInfo(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <Mail size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Set-password email sent</h3>
                <p className="text-xs text-slate-500">The employee can now set their password and sign in.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              We emailed <span className="font-bold text-slate-800">{provisionInfo.email}</span> a link to set
              their password. After setting it, they can sign in with their email address.
            </p>

            {provisionInfo.url && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  <KeyRound size={12} />
                  <span>Set-password link</span>
                </div>
                <div className="break-all rounded-lg bg-white border border-slate-200 px-2.5 py-2 text-[11px] font-medium text-slate-700">
                  {provisionInfo.url}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(provisionInfo.url);
                        setLinkCopied(true);
                        setTimeout(() => setLinkCopied(false), 2000);
                      } catch {
                        /* clipboard may be unavailable */
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    {linkCopied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                    <span>{linkCopied ? "Copied" : "Copy link"}</span>
                  </button>
                  <a
                    href={provisionInfo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 cursor-pointer"
                  >
                    Open reset page
                  </a>
                </div>
                <p className="text-[10px] font-medium text-slate-400 leading-normal">
                  Shown here for convenience (useful when email delivery isn't configured locally). The same link
                  was emailed to the employee.
                </p>
              </div>
            )}

            <div className="flex justify-end border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setProvisionInfo(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TOAST NOTIFICATION ==================== */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom duration-300">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold max-w-sm">
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
```

## `frontend\src\features\employees\pages\EmployeeProfilePage.tsx`

```tsx
import { getFriendlyErrorMessage } from "../../../lib/errors";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../../lib/firebase";
import { useAuth } from "../../auth/context/AuthContext";
import { useHasPermission } from "../../rbac/hooks/usePermissions";
import { EmployeeService } from "../services/employeeService";
import {
  ContractService,
  EmergencyContactService,
  EmploymentHistoryService,
  AssetService,
  LifecycleService,
} from "../services/employeeRecordsService";
import {
  deriveContractStatus,
  getActiveContract,
  getPrimaryContact,
  sortHistory,
  activeAssets,
  sortLifecycle,
  deriveCurrentStage,
} from "../utils/employeeRecords";
import { Skeleton } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/ErrorState";
import { EmptyState } from "../../../components/ui/EmptyState";
import type {
  Employee,
  Department,
  EmployeeContract,
  EmergencyContact,
  EmploymentHistoryEntry,
  EmployeeAsset,
  LifecycleEvent,
  ContractType,
  ContractStatus,
  ContactRelationship,
  EmploymentChangeType,
  AssetType,
  AssetStatus,
  LifecycleStage,
} from "@hrms/middleware";
import {
  ArrowLeft, Mail, Phone, MapPin, Calendar, Briefcase, FileText, Users, History,
  Package, Activity, Plus, Trash2, Upload, X, Star, KeyRound, Copy, Check,
} from "lucide-react";

const TABS = ["overview", "contracts", "contacts", "history", "assets", "lifecycle"] as const;
type Tab = (typeof TABS)[number];
const TAB_LABELS: Record<Tab, string> = {
  overview: "Overview",
  contracts: "Contracts",
  contacts: "Emergency Contacts",
  history: "Employment History",
  assets: "Assets",
  lifecycle: "Lifecycle",
};

const CONTRACT_TYPES: ContractType[] = ["full_time", "part_time", "contract", "internship", "temporary", "probation"];
const CONTRACT_STATUSES: ContractStatus[] = ["draft", "active", "expired", "terminated"];
const RELATIONSHIPS: ContactRelationship[] = ["spouse", "parent", "sibling", "child", "friend", "other"];
const CHANGE_TYPES: EmploymentChangeType[] = ["hired", "promotion", "transfer", "title_change", "compensation_change", "department_change", "manager_change", "offboarded"];
const ASSET_TYPES: AssetType[] = ["laptop", "desktop", "monitor", "phone", "tablet", "access_card", "vehicle", "other"];
const ASSET_STATUSES: AssetStatus[] = ["assigned", "returned", "lost", "damaged"];
const LIFECYCLE_STAGES: LifecycleStage[] = ["applicant", "onboarding", "active", "on_leave", "offboarding", "terminated"];

function tc(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function today() {
  return new Date().toISOString().slice(0, 10);
}

export function EmployeeProfilePage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const tenantId = profile?.activeTenantId || "";
  const hasPerm = useHasPermission();
  const canEdit = hasPerm("employees.update");
  const caller = user ? { uid: user.uid, email: user.email || "" } : undefined;

  const [tab, setTab] = useState<Tab>("overview");
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [manager, setManager] = useState<Employee | null>(null);
  const [contracts, setContracts] = useState<EmployeeContract[]>([]);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [history, setHistory] = useState<EmploymentHistoryEntry[]>([]);
  const [assets, setAssets] = useState<EmployeeAsset[]>([]);
  const [lifecycle, setLifecycle] = useState<LifecycleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Login provisioning UI state
  const [provisionInfo, setProvisionInfo] = useState<{ email: string; url: string } | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [sendingLogin, setSendingLogin] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Provision (or re-send) a login for this employee and email a set-password link.
  const handleSendLoginEmail = async () => {
    if (!employee || !tenantId) return;
    if (!employee.email) {
      setToast("This employee has no email address to send a login to.");
      setTimeout(() => setToast(null), 3000);
      return;
    }
    setSendingLogin(true);
    try {
      const provisionFn = httpsCallable(functions, "provisionEmployeeAccount");
      const res = await provisionFn({
        email: employee.email,
        displayName: `${employee.firstName} ${employee.lastName}`.trim(),
        tenantId,
      });
      const d = (res.data || {}) as { uid?: string; oobCode?: string; setPasswordUrl?: string };
      if (d.uid && !employee.userId) {
        await EmployeeService.updateEmployee(employee.id, { userId: d.uid }, caller);
      }
      const localUrl = d.oobCode
        ? `${window.location.origin}/reset-password?oobCode=${encodeURIComponent(d.oobCode)}`
        : d.setPasswordUrl || "";
      await load();
      setLinkCopied(false);
      setProvisionInfo({ email: employee.email, url: localUrl });
    } catch (err: any) {
      console.error(err);
      setToast(
        getFriendlyErrorMessage(
          err,
          "Could not send the login email. Make sure Firebase Functions are running, then try again."
        )
      );
      setTimeout(() => setToast(null), 4000);
    } finally {
      setSendingLogin(false);
    }
  };

  const loadRecords = useCallback(async () => {
    const [c, ec, h, a, l] = await Promise.all([
      ContractService.list(tenantId, id),
      EmergencyContactService.list(tenantId, id),
      EmploymentHistoryService.list(tenantId, id),
      AssetService.list(tenantId, id),
      LifecycleService.list(tenantId, id),
    ]);
    setContracts(c);
    setContacts(ec);
    setHistory(h);
    setAssets(a);
    setLifecycle(l);
  }, [id, tenantId]);

  const load = useCallback(async () => {
    if (!tenantId || !id) return;
    setLoading(true);
    setError(null);
    try {
      const emp = await EmployeeService.getEmployeeById(id);
      if (!emp) {
        setError("Employee not found.");
        return;
      }
      setEmployee(emp);
      const [depts] = await Promise.all([EmployeeService.getDepartments(tenantId), loadRecords()]);
      setDepartments(depts);
      if (emp.managerId) setManager(await EmployeeService.getEmployeeById(emp.managerId));
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "Failed to load employee profile."));
    } finally {
      setLoading(false);
    }
  }, [tenantId, id, loadRecords]);

  useEffect(() => {
    load();
  }, [load]);

  const deptName = useMemo(
    () => departments.find((d) => d.id === employee?.departmentId)?.name ?? "Unassigned",
    [departments, employee]
  );
  const currentStage = useMemo(() => deriveCurrentStage(lifecycle), [lifecycle]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (error || !employee) {
    return <ErrorState title="Profile unavailable" description={error ?? "Not found"} onRetry={load} />;
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate("/employees")} className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800 cursor-pointer">
        <ArrowLeft size={16} /> Back to directory
      </button>

      {/* Header card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 text-xl font-extrabold">
            {employee.firstName[0]}{employee.lastName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-slate-900">{employee.firstName} {employee.lastName}</h1>
            <p className="text-slate-500 flex items-center gap-1.5 mt-0.5"><Briefcase size={14} /> {employee.jobTitle} Â· {deptName}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">Status: {tc(employee.status)}</span>
              {currentStage && <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">Lifecycle: {tc(currentStage)}</span>}
              {employee.userId ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700"><KeyRound size={11} /> Login active</span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">No login</span>
              )}
            </div>
          </div>

          {canEdit && employee.email && (
            <button
              onClick={handleSendLoginEmail}
              disabled={sendingLogin}
              className="inline-flex items-center gap-1.5 self-start rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
              title={employee.userId ? "Resend set-password email" : "Create a login and email a set-password link"}
            >
              <KeyRound size={15} className="text-blue-600" />
              <span>{sendingLogin ? "Sending..." : employee.userId ? "Resend login email" : "Send login email"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px cursor-pointer ${
              tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {error && <div className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {tab === "overview" && (
        <OverviewTab employee={employee} deptName={deptName} manager={manager} contracts={contracts} contacts={contacts} assets={assets} />
      )}
      {tab === "contracts" && (
        <ContractsTab tenantId={tenantId} employeeId={id} canEdit={canEdit} caller={caller} contracts={contracts} reload={loadRecords} setError={setError} />
      )}
      {tab === "contacts" && (
        <ContactsTab tenantId={tenantId} employeeId={id} canEdit={canEdit} caller={caller} contacts={contacts} reload={loadRecords} setError={setError} />
      )}
      {tab === "history" && (
        <HistoryTab tenantId={tenantId} employeeId={id} canEdit={canEdit} caller={caller} entries={history} departments={departments} reload={loadRecords} setError={setError} />
      )}
      {tab === "assets" && (
        <AssetsTab tenantId={tenantId} employeeId={id} canEdit={canEdit} caller={caller} assets={assets} reload={loadRecords} setError={setError} />
      )}
      {tab === "lifecycle" && (
        <LifecycleTab tenantId={tenantId} employeeId={id} canEdit={canEdit} caller={caller} events={lifecycle} reload={loadRecords} setError={setError} />
      )}

      {/* Set-password email sent modal */}
      {provisionInfo && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-md relative space-y-4">
            <button onClick={() => setProvisionInfo(null)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer">
              <X size={18} />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <Mail size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Set-password email sent</h3>
                <p className="text-xs text-slate-500">The employee can now set their password and sign in.</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              We emailed <span className="font-bold text-slate-800">{provisionInfo.email}</span> a link to set their
              password. After setting it, they can sign in with their email address.
            </p>
            {provisionInfo.url && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  <KeyRound size={12} />
                  <span>Set-password link</span>
                </div>
                <div className="break-all rounded-lg bg-white border border-slate-200 px-2.5 py-2 text-[11px] font-medium text-slate-700">
                  {provisionInfo.url}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(provisionInfo.url);
                        setLinkCopied(true);
                        setTimeout(() => setLinkCopied(false), 2000);
                      } catch { /* clipboard unavailable */ }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    {linkCopied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                    <span>{linkCopied ? "Copied" : "Copy link"}</span>
                  </button>
                  <a href={provisionInfo.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 cursor-pointer">
                    Open reset page
                  </a>
                </div>
                <p className="text-[10px] font-medium text-slate-400 leading-normal">
                  Shown here for convenience (useful when email delivery isn't configured locally). The same link was emailed to the employee.
                </p>
              </div>
            )}
            <div className="flex justify-end border-t border-slate-100 pt-3">
              <button type="button" onClick={() => setProvisionInfo(null)} className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-5 right-5 z-50">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-semibold max-w-sm">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared bits                                                        */
/* ------------------------------------------------------------------ */

type Caller = { uid: string; email: string } | undefined;
type SetErr = (s: string | null) => void;

function SectionHeader({ title, count, onAdd, addLabel }: { title: string; count: number; onAdd: (() => void) | undefined; addLabel: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-bold text-slate-900">{title} <span className="text-slate-400 font-normal">({count})</span></h2>
      {onAdd && (
        <button onClick={onAdd} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer">
          <Plus size={16} /> {addLabel}
        </button>
      )}
    </div>
  );
}

function Field({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-slate-800">{icon}{value}</div>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

/* ------------------------------ Overview ------------------------------ */

function OverviewTab({
  employee, deptName, manager, contracts, contacts, assets,
}: {
  employee: Employee; deptName: string; manager: Employee | null;
  contracts: EmployeeContract[]; contacts: EmergencyContact[]; assets: EmployeeAsset[];
}) {
  const active = getActiveContract(contracts);
  const primary = getPrimaryContact(contacts);
  const held = activeAssets(assets);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <h3 className="font-bold text-slate-900">Personal & Job</h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email" value={employee.email} icon={<Mail size={14} className="text-slate-400" />} />
          <Field label="Phone" value={employee.phone || "â€”"} icon={<Phone size={14} className="text-slate-400" />} />
          <Field label="Department" value={deptName} />
          <Field label="Manager" value={manager ? `${manager.firstName} ${manager.lastName}` : "â€”"} />
          <Field label="Work Location" value={employee.workLocation} icon={<MapPin size={14} className="text-slate-400" />} />
          <Field label="Start Date" value={employee.startDate} icon={<Calendar size={14} className="text-slate-400" />} />
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <h3 className="font-bold text-slate-900">Summary</h3>
        <Field label="Active Contract" value={active ? `${active.title} (${tc(active.type)})` : "None on file"} icon={<FileText size={14} className="text-slate-400" />} />
        <Field label="Primary Emergency Contact" value={primary ? `${primary.name} Â· ${primary.phone}` : "None on file"} icon={<Users size={14} className="text-slate-400" />} />
        <Field label="Assets Held" value={`${held.length} assigned`} icon={<Package size={14} className="text-slate-400" />} />
      </div>
    </div>
  );
}

/* ------------------------------ Contracts ------------------------------ */

function ContractsTab({
  tenantId, employeeId, canEdit, caller, contracts, reload, setError,
}: {
  tenantId: string; employeeId: string; canEdit: boolean; caller: Caller;
  contracts: EmployeeContract[]; reload: () => Promise<void>; setError: SetErr;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ title: "", type: "full_time" as ContractType, startDate: today(), endDate: "", salary: "", currency: "USD", status: "active" as ContractStatus, notes: "" });
  const [file, setFile] = useState<File | null>(null);

  const save = async () => {
    if (!f.title.trim()) { setError("Contract title is required."); return; }
    setSaving(true); setError(null);
    try {
      let docFields: { documentUrl?: string; documentPath?: string } = {};
      if (file) docFields = await ContractService.uploadDocument(tenantId, file);
      await ContractService.create(tenantId, {
        employeeId,
        title: f.title.trim(),
        type: f.type,
        startDate: f.startDate,
        ...(f.endDate ? { endDate: f.endDate } : {}),
        salary: Number(f.salary) || 0,
        currency: f.currency,
        status: f.status,
        ...(f.notes ? { notes: f.notes } : {}),
        ...docFields,
      }, caller);
      setOpen(false); setFile(null);
      setF({ title: "", type: "full_time", startDate: today(), endDate: "", salary: "", currency: "USD", status: "active", notes: "" });
      await reload();
    } catch (e) { setError(getFriendlyErrorMessage(e, "Failed to save contract.")); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <SectionHeader title="Contracts" count={contracts.length} addLabel="Add Contract" onAdd={canEdit ? () => setOpen(true) : undefined} />
      {contracts.length === 0 ? (
        <EmptyState title="No contracts" description="No contracts have been added for this employee." icon={<FileText className="h-6 w-6" />} />
      ) : (
        <div className="space-y-2">
          {contracts.map((c) => {
            const status = deriveContractStatus(c);
            return (
              <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-4 flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-900">{c.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{tc(c.type)} Â· {c.currency} {c.salary.toLocaleString()} Â· {c.startDate}{c.endDate ? ` â†’ ${c.endDate}` : ""}</div>
                  <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${status === "active" ? "bg-emerald-100 text-emerald-700" : status === "expired" ? "bg-amber-100 text-amber-700" : status === "terminated" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"}`}>{tc(status)}</span>
                  {c.documentUrl && <a href={c.documentUrl} target="_blank" rel="noreferrer" className="ml-2 text-xs font-medium text-blue-600 hover:underline">Document</a>}
                </div>
                {canEdit && (
                  <button onClick={async () => { await ContractService.remove(c.id, caller); await reload(); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"><Trash2 size={16} /></button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {open && (
        <Modal title="Add Contract" onClose={() => setOpen(false)} onSave={save} saving={saving}>
          <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Contract title *" className={inputCls} />
          <div className="grid grid-cols-2 gap-3">
            <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as ContractType })} className={inputCls}>{CONTRACT_TYPES.map((t) => <option key={t} value={t}>{tc(t)}</option>)}</select>
            <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as ContractStatus })} className={inputCls}>{CONTRACT_STATUSES.map((s) => <option key={s} value={s}>{tc(s)}</option>)}</select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-semibold text-slate-600">Start<input type="date" value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} className={inputCls} /></label>
            <label className="text-xs font-semibold text-slate-600">End<input type="date" value={f.endDate} onChange={(e) => setF({ ...f, endDate: e.target.value })} className={inputCls} /></label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" value={f.salary} onChange={(e) => setF({ ...f, salary: e.target.value })} placeholder="Salary" className={inputCls} />
            <input value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value })} placeholder="Currency" className={inputCls} />
          </div>
          <textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="Notes" rows={2} className={inputCls} />
          <label className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-2.5 text-sm text-slate-600 cursor-pointer hover:bg-slate-50">
            <Upload size={16} />{file ? file.name : "Attach signed document (optional)"}
            <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
        </Modal>
      )}
    </div>
  );
}

/* --------------------------- Emergency contacts --------------------------- */

function ContactsTab({
  tenantId, employeeId, canEdit, caller, contacts, reload, setError,
}: {
  tenantId: string; employeeId: string; canEdit: boolean; caller: Caller;
  contacts: EmergencyContact[]; reload: () => Promise<void>; setError: SetErr;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ name: "", relationship: "spouse" as ContactRelationship, phone: "", email: "", address: "", isPrimary: false });

  const save = async () => {
    if (!f.name.trim() || !f.phone.trim()) { setError("Name and phone are required."); return; }
    setSaving(true); setError(null);
    try {
      await EmergencyContactService.create(tenantId, {
        employeeId, name: f.name.trim(), relationship: f.relationship, phone: f.phone.trim(),
        ...(f.email ? { email: f.email.trim() } : {}),
        ...(f.address ? { address: f.address.trim() } : {}),
        isPrimary: f.isPrimary || contacts.length === 0,
      }, caller);
      setOpen(false);
      setF({ name: "", relationship: "spouse", phone: "", email: "", address: "", isPrimary: false });
      await reload();
    } catch (e) { setError(getFriendlyErrorMessage(e, "Failed to save contact.")); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <SectionHeader title="Emergency Contacts" count={contacts.length} addLabel="Add Contact" onAdd={canEdit ? () => setOpen(true) : undefined} />
      {contacts.length === 0 ? (
        <EmptyState title="No emergency contacts" description="Add a contact in case of emergency." icon={<Users className="h-6 w-6" />} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {contacts.map((c) => (
            <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-4 flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-slate-900 flex items-center gap-1.5">{c.name}{c.isPrimary && <Star size={13} className="text-amber-500 fill-amber-400" />}</div>
                <div className="text-xs text-slate-500 mt-0.5">{tc(c.relationship)}</div>
                <div className="text-sm text-slate-700 mt-1 flex items-center gap-1.5"><Phone size={13} className="text-slate-400" />{c.phone}</div>
                {c.email && <div className="text-sm text-slate-600 flex items-center gap-1.5"><Mail size={13} className="text-slate-400" />{c.email}</div>}
              </div>
              {canEdit && (
                <button onClick={async () => { await EmergencyContactService.remove(c.id, caller); await reload(); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"><Trash2 size={16} /></button>
              )}
            </div>
          ))}
        </div>
      )}
      {open && (
        <Modal title="Add Emergency Contact" onClose={() => setOpen(false)} onSave={save} saving={saving}>
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Full name *" className={inputCls} />
          <select value={f.relationship} onChange={(e) => setF({ ...f, relationship: e.target.value as ContactRelationship })} className={inputCls}>{RELATIONSHIPS.map((r) => <option key={r} value={r}>{tc(r)}</option>)}</select>
          <input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="Phone *" className={inputCls} />
          <input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="Email" className={inputCls} />
          <input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} placeholder="Address" className={inputCls} />
          <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={f.isPrimary} onChange={(e) => setF({ ...f, isPrimary: e.target.checked })} className="rounded" /> Mark as primary contact</label>
        </Modal>
      )}
    </div>
  );
}

/* --------------------------- Employment history --------------------------- */

function HistoryTab({
  tenantId, employeeId, canEdit, caller, entries, departments, reload, setError,
}: {
  tenantId: string; employeeId: string; canEdit: boolean; caller: Caller;
  entries: EmploymentHistoryEntry[]; departments: Department[]; reload: () => Promise<void>; setError: SetErr;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ changeType: "promotion" as EmploymentChangeType, title: "", departmentId: "", salary: "", effectiveDate: today(), note: "" });
  const sorted = sortHistory(entries);

  const save = async () => {
    if (!f.title.trim()) { setError("Title is required."); return; }
    setSaving(true); setError(null);
    try {
      await EmploymentHistoryService.create(tenantId, {
        employeeId, changeType: f.changeType, title: f.title.trim(), effectiveDate: f.effectiveDate,
        ...(f.departmentId ? { departmentId: f.departmentId } : {}),
        ...(f.salary ? { salary: Number(f.salary) } : {}),
        ...(f.note ? { note: f.note.trim() } : {}),
      }, caller);
      setOpen(false);
      setF({ changeType: "promotion", title: "", departmentId: "", salary: "", effectiveDate: today(), note: "" });
      await reload();
    } catch (e) { setError(getFriendlyErrorMessage(e, "Failed to save history entry.")); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <SectionHeader title="Employment History" count={entries.length} addLabel="Add Entry" onAdd={canEdit ? () => setOpen(true) : undefined} />
      {entries.length === 0 ? (
        <EmptyState title="No history" description="Record promotions, transfers and compensation changes." icon={<History className="h-6 w-6" />} />
      ) : (
        <div className="relative border-l-2 border-slate-100 ml-2 space-y-4">
          {sorted.map((e) => (
            <div key={e.id} className="relative pl-6">
              <div className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-blue-600" />
              <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-900">{tc(e.changeType)} â€” {e.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{e.effectiveDate}{e.departmentId ? ` Â· ${departments.find((d) => d.id === e.departmentId)?.name ?? ""}` : ""}{e.salary ? ` Â· ${e.salary.toLocaleString()}` : ""}</div>
                  {e.note && <div className="text-sm text-slate-600 mt-1">{e.note}</div>}
                </div>
                {canEdit && (
                  <button onClick={async () => { await EmploymentHistoryService.remove(e.id, caller); await reload(); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"><Trash2 size={16} /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {open && (
        <Modal title="Add History Entry" onClose={() => setOpen(false)} onSave={save} saving={saving}>
          <select value={f.changeType} onChange={(e) => setF({ ...f, changeType: e.target.value as EmploymentChangeType })} className={inputCls}>{CHANGE_TYPES.map((t) => <option key={t} value={t}>{tc(t)}</option>)}</select>
          <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Resulting job title *" className={inputCls} />
          <select value={f.departmentId} onChange={(e) => setF({ ...f, departmentId: e.target.value })} className={inputCls}><option value="">Department (optional)</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" value={f.salary} onChange={(e) => setF({ ...f, salary: e.target.value })} placeholder="New salary" className={inputCls} />
            <label className="text-xs font-semibold text-slate-600">Effective<input type="date" value={f.effectiveDate} onChange={(e) => setF({ ...f, effectiveDate: e.target.value })} className={inputCls} /></label>
          </div>
          <textarea value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="Note" rows={2} className={inputCls} />
        </Modal>
      )}
    </div>
  );
}

/* ------------------------------- Assets ------------------------------- */

function AssetsTab({
  tenantId, employeeId, canEdit, caller, assets, reload, setError,
}: {
  tenantId: string; employeeId: string; canEdit: boolean; caller: Caller;
  assets: EmployeeAsset[]; reload: () => Promise<void>; setError: SetErr;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ name: "", assetType: "laptop" as AssetType, serialNumber: "", assignedDate: today(), status: "assigned" as AssetStatus, notes: "" });

  const save = async () => {
    if (!f.name.trim()) { setError("Asset name is required."); return; }
    setSaving(true); setError(null);
    try {
      await AssetService.create(tenantId, {
        employeeId, name: f.name.trim(), assetType: f.assetType, assignedDate: f.assignedDate, status: f.status,
        ...(f.serialNumber ? { serialNumber: f.serialNumber.trim() } : {}),
        ...(f.notes ? { notes: f.notes.trim() } : {}),
      }, caller);
      setOpen(false);
      setF({ name: "", assetType: "laptop", serialNumber: "", assignedDate: today(), status: "assigned", notes: "" });
      await reload();
    } catch (e) { setError(getFriendlyErrorMessage(e, "Failed to save asset.")); }
    finally { setSaving(false); }
  };

  const markReturned = async (a: EmployeeAsset) => {
    await AssetService.update(a.id, { status: "returned", returnedDate: today() }, caller);
    await reload();
  };

  return (
    <div className="space-y-4">
      <SectionHeader title="Assets" count={assets.length} addLabel="Assign Asset" onAdd={canEdit ? () => setOpen(true) : undefined} />
      {assets.length === 0 ? (
        <EmptyState title="No assets" description="Assign company equipment to this employee." icon={<Package className="h-6 w-6" />} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {assets.map((a) => (
            <div key={a.id} className="rounded-xl border border-slate-200 bg-white p-4 flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-slate-900">{a.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{tc(a.assetType)}{a.serialNumber ? ` Â· SN ${a.serialNumber}` : ""}</div>
                <div className="text-xs text-slate-500">Assigned {a.assignedDate}{a.returnedDate ? ` Â· Returned ${a.returnedDate}` : ""}</div>
                <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${a.status === "assigned" ? "bg-emerald-100 text-emerald-700" : a.status === "returned" ? "bg-slate-100 text-slate-600" : "bg-rose-100 text-rose-700"}`}>{tc(a.status)}</span>
              </div>
              {canEdit && (
                <div className="flex flex-col items-end gap-1">
                  {a.status === "assigned" && <button onClick={() => markReturned(a)} className="text-xs font-medium text-blue-600 hover:underline cursor-pointer">Mark returned</button>}
                  <button onClick={async () => { await AssetService.remove(a.id, caller); await reload(); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"><Trash2 size={16} /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {open && (
        <Modal title="Assign Asset" onClose={() => setOpen(false)} onSave={save} saving={saving}>
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Asset name *" className={inputCls} />
          <div className="grid grid-cols-2 gap-3">
            <select value={f.assetType} onChange={(e) => setF({ ...f, assetType: e.target.value as AssetType })} className={inputCls}>{ASSET_TYPES.map((t) => <option key={t} value={t}>{tc(t)}</option>)}</select>
            <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as AssetStatus })} className={inputCls}>{ASSET_STATUSES.map((s) => <option key={s} value={s}>{tc(s)}</option>)}</select>
          </div>
          <input value={f.serialNumber} onChange={(e) => setF({ ...f, serialNumber: e.target.value })} placeholder="Serial number" className={inputCls} />
          <label className="text-xs font-semibold text-slate-600">Assigned date<input type="date" value={f.assignedDate} onChange={(e) => setF({ ...f, assignedDate: e.target.value })} className={inputCls} /></label>
          <textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="Notes" rows={2} className={inputCls} />
        </Modal>
      )}
    </div>
  );
}

/* ------------------------------ Lifecycle ------------------------------ */

function LifecycleTab({
  tenantId, employeeId, canEdit, caller, events, reload, setError,
}: {
  tenantId: string; employeeId: string; canEdit: boolean; caller: Caller;
  events: LifecycleEvent[]; reload: () => Promise<void>; setError: SetErr;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ stage: "onboarding" as LifecycleStage, effectiveDate: today(), note: "" });
  const sorted = sortLifecycle(events);

  const save = async () => {
    if (!caller) return;
    setSaving(true); setError(null);
    try {
      await LifecycleService.add(tenantId, {
        employeeId, stage: f.stage, effectiveDate: f.effectiveDate, createdBy: caller.uid,
        ...(f.note ? { note: f.note.trim() } : {}),
      }, caller);
      setOpen(false);
      setF({ stage: "onboarding", effectiveDate: today(), note: "" });
      await reload();
    } catch (e) { setError(getFriendlyErrorMessage(e, "Failed to record event.")); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <SectionHeader title="Lifecycle" count={events.length} addLabel="Record Event" onAdd={canEdit ? () => setOpen(true) : undefined} />
      {events.length === 0 ? (
        <EmptyState title="No lifecycle events" description="Track onboarding, leave, offboarding and termination." icon={<Activity className="h-6 w-6" />} />
      ) : (
        <div className="relative border-l-2 border-slate-100 ml-2 space-y-4">
          {sorted.map((e, i) => (
            <div key={e.id} className="relative pl-6">
              <div className={`absolute -left-[7px] top-1.5 h-3 w-3 rounded-full ${i === 0 ? "bg-blue-600 ring-4 ring-blue-100" : "bg-slate-300"}`} />
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="font-semibold text-slate-900">{tc(e.stage)}{i === 0 && <span className="ml-2 text-xs font-medium text-blue-600">Current</span>}</div>
                <div className="text-xs text-slate-500 mt-0.5">Effective {e.effectiveDate}</div>
                {e.note && <div className="text-sm text-slate-600 mt-1">{e.note}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
      {open && (
        <Modal title="Record Lifecycle Event" onClose={() => setOpen(false)} onSave={save} saving={saving}>
          <select value={f.stage} onChange={(e) => setF({ ...f, stage: e.target.value as LifecycleStage })} className={inputCls}>{LIFECYCLE_STAGES.map((s) => <option key={s} value={s}>{tc(s)}</option>)}</select>
          <label className="text-xs font-semibold text-slate-600">Effective date<input type="date" value={f.effectiveDate} onChange={(e) => setF({ ...f, effectiveDate: e.target.value })} className={inputCls} /></label>
          <textarea value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="Note" rows={2} className={inputCls} />
        </Modal>
      )}
    </div>
  );
}

/* ------------------------------- Modal shell ------------------------------- */

function Modal({ title, onClose, onSave, saving, children }: { title: string; onClose: () => void; onSave: () => void; saving: boolean; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 cursor-pointer"><X size={18} /></button>
        </div>
        <div className="space-y-3">{children}</div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer">Cancel</button>
          <button onClick={onSave} disabled={saving} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 cursor-pointer">{saving ? "Savingâ€¦" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}
```

## `frontend\src\features\employees\services\employeeService.ts`

```ts
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc,
  deleteDoc, 
  query, 
  where, 
  updateDoc,
  limit 
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type { Employee, Department, DataAccessLevel, EmployeeCompensation } from "@hrms/middleware";
import { AuditLogService } from "../../settings/services/auditLogService";

/**
 * Service to manage departments and employees, implementing strict data access level security.
 */
export const EmployeeService = {
  // ==================== DEPARTMENTS ====================

  /**
   * Fetches all departments for a tenant, optionally including archived ones.
   */
  async getDepartments(tenantId: string, includeArchived: boolean = false): Promise<Department[]> {
    const q = query(collection(db, "departments"), where("tenantId", "==", tenantId));
    const snap = await getDocs(q);
    const list: Department[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data() as Department;
      if (includeArchived || !data.isArchived) {
        list.push(data);
      }
    });
    return list;
  },

  /**
   * Creates a new department.
   */
  async createDepartment(
    tenantId: string, 
    data: Omit<Department, "id" | "tenantId" | "createdAt" | "updatedAt">,
    callerInfo?: { uid: string; email: string }
  ): Promise<Department> {
    const id = `dept_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    const now = Date.now();
    const dept: Department = {
      ...data,
      id,
      tenantId,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db, "departments", id), dept);

    if (callerInfo) {
      await AuditLogService.createAuditLog(tenantId, {
        userId: callerInfo.uid,
        userEmail: callerInfo.email,
        action: "create",
        resource: "department",
        resourceId: id,
        details: `Created department "${dept.name}" with code "${dept.code}"`,
      });
    }

    return dept;
  },

  /**
   * Updates an existing department.
   */
  async updateDepartment(
    departmentId: string, 
    data: Partial<Omit<Department, "id" | "tenantId" | "createdAt" | "updatedAt">>,
    callerInfo?: { uid: string; email: string }
  ): Promise<void> {
    const ref = doc(db, "departments", departmentId);
    
    if (callerInfo) {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const oldDept = snap.data() as Department;
        await AuditLogService.createAuditLog(oldDept.tenantId, {
          userId: callerInfo.uid,
          userEmail: callerInfo.email,
          action: "update",
          resource: "department",
          resourceId: departmentId,
          details: `Updated department "${oldDept.name}" details. Changes: ${JSON.stringify(data)}`,
        });
      }
    }

    await updateDoc(ref, {
      ...data,
      updatedAt: Date.now(),
    });
  },

  /**
   * Deletes a department.
   */
  async deleteDepartment(
    departmentId: string,
    callerInfo?: { uid: string; email: string }
  ): Promise<void> {
    if (callerInfo) {
      const snap = await getDoc(doc(db, "departments", departmentId));
      if (snap.exists()) {
        const dept = snap.data() as Department;
        await AuditLogService.createAuditLog(dept.tenantId, {
          userId: callerInfo.uid,
          userEmail: callerInfo.email,
          action: "delete",
          resource: "department",
          resourceId: departmentId,
          details: `Deleted department "${dept.name}" (${dept.code})`,
        });
      }
    }
    await deleteDoc(doc(db, "departments", departmentId));
  },


  // ==================== EMPLOYEES ====================

  /**
   * Resolves the caller's employee profile by matching Firebase Auth userId.
   */
  async getCallerEmployee(tenantId: string, userId: string): Promise<Employee | null> {
    const q = query(
      collection(db, "employees"), 
      where("tenantId", "==", tenantId),
      where("userId", "==", userId)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const firstDoc = snap.docs[0];
    if (!firstDoc) return null;
    return firstDoc.data() as Employee;
  },

  /**
   * Fetches employees for a tenant, applying granular data level access checks on the client.
   * Scopes include: "all", "department", "team", "reports", "self".
   */
  async getEmployees(
    tenantId: string, 
    dataAccessLevel: DataAccessLevel, 
    callerEmployee: Employee | null
  ): Promise<Employee[]> {
    // 1. Fetch all employees in tenant first (to apply filter locally based on relations)
    // This is safe since we query by tenantId first, satisfying tenant isolation.
    const q = query(collection(db, "employees"), where("tenantId", "==", tenantId), limit(5000));
    const snap = await getDocs(q);
    const allEmployees: Employee[] = [];
    snap.forEach((docSnap) => {
      allEmployees.push(docSnap.data() as Employee);
    });

    // 2. If access level is "all", return everything
    if (dataAccessLevel === "all") {
      return allEmployees;
    }

    // If there's no matching caller employee record but access level requires relations,
    // fallback to returning empty list (except if they can see themselves, but there is no self record).
    if (!callerEmployee) {
      return [];
    }

    // 3. Filter employees based on access tier relations
    switch (dataAccessLevel) {
      case "self":
        // Can only see their own profile
        return allEmployees.filter(e => e.id === callerEmployee.id);

      case "reports":
        // Can see themselves + anyone reporting directly to them
        return allEmployees.filter(e => e.id === callerEmployee.id || e.managerId === callerEmployee.id);

      case "team":
        // Can see themselves + peers sharing their manager + direct reports
        return allEmployees.filter(e => 
          e.id === callerEmployee.id || 
          e.managerId === callerEmployee.id ||
          (callerEmployee.managerId && e.managerId === callerEmployee.managerId)
        );

      case "department":
        // Can see anyone inside the same department
        return allEmployees.filter(e => e.departmentId === callerEmployee.departmentId);

      default:
        return [];
    }
  },

  /**
   * Fetches a single employee record.
   */
  async getEmployeeById(employeeId: string): Promise<Employee | null> {
    const snap = await getDoc(doc(db, "employees", employeeId));
    if (!snap.exists()) return null;
    return snap.data() as Employee;
  },

  /**
   * Creates a new employee using a caller-supplied (manual) employee ID.
   * The ID becomes the Firestore document id and must be unique within the tenant.
   */
  async createEmployee(
    tenantId: string,
    employeeId: string,
    data: Omit<Employee, "id" | "tenantId" | "createdAt" | "updatedAt">,
    callerInfo?: { uid: string; email: string }
  ): Promise<Employee> {
    const id = (employeeId || "").trim();
    if (!id) {
      throw new Error("Employee ID is required.");
    }
    // Allow letters, numbers, dot, dash, underscore (safe as a Firestore doc id).
    if (!/^[A-Za-z0-9._-]+$/.test(id)) {
      throw new Error("Employee ID may only contain letters, numbers, '.', '-' and '_'.");
    }

    const ref = doc(db, "employees", id);
    const existing = await getDoc(ref);
    if (existing.exists()) {
      throw new Error(`Employee ID "${id}" already exists.`);
    }

    const now = Date.now();
    const emp: Employee = {
      ...data,
      id,
      tenantId,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(ref, emp);

    if (callerInfo) {
      await AuditLogService.createAuditLog(tenantId, {
        userId: callerInfo.uid,
        userEmail: callerInfo.email,
        action: "create",
        resource: "employee",
        resourceId: id,
        details: `Created employee profile for "${emp.firstName} ${emp.lastName}" as "${emp.jobTitle}" (ID: ${id})`,
      });
    }

    return emp;
  },

  /**
   * Updates an existing employee.
   */
  async updateEmployee(
    employeeId: string, 
    data: Partial<Omit<Employee, "id" | "tenantId" | "createdAt" | "updatedAt">>,
    callerInfo?: { uid: string; email: string }
  ): Promise<void> {
    const ref = doc(db, "employees", employeeId);

    if (callerInfo) {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const oldEmp = snap.data() as Employee;
        await AuditLogService.createAuditLog(oldEmp.tenantId, {
          userId: callerInfo.uid,
          userEmail: callerInfo.email,
          action: "update",
          resource: "employee",
          resourceId: employeeId,
          details: `Updated employee profile for "${oldEmp.firstName} ${oldEmp.lastName}". Changes: ${JSON.stringify(data)}`,
        });
      }
    }

    await updateDoc(ref, {
      ...data,
      updatedAt: Date.now(),
    });
  },

  /**
   * SEC-002: read all compensation records for a tenant as a map
   * employeeId -> { salary, currency }. Only succeeds for callers with
   * employees.update (HR/admins); returns {} on permission denial so the
   * directory still renders for everyone else.
   */
  async getCompensations(
    tenantId: string
  ): Promise<Record<string, { salary: number; currency: string }>> {
    try {
      const q = query(collection(db, "employeeCompensation"), where("tenantId", "==", tenantId));
      const snap = await getDocs(q);
      const map: Record<string, { salary: number; currency: string }> = {};
      snap.forEach((d) => {
        const c = d.data() as EmployeeCompensation;
        map[c.employeeId] = { salary: c.salary, currency: c.currency || "USD" };
      });
      return map;
    } catch {
      // Caller lacks employees.update â€” no compensation visibility.
      return {};
    }
  },

  /** Read a single employee's compensation (owner or employees.update holder). */
  async getCompensation(employeeId: string): Promise<EmployeeCompensation | null> {
    try {
      const snap = await getDoc(doc(db, "employeeCompensation", employeeId));
      return snap.exists() ? (snap.data() as EmployeeCompensation) : null;
    } catch {
      return null;
    }
  },

  /**
   * Create/update an employee's compensation record (employees.create on first
   * write, employees.update thereafter â€” enforced by rules).
   */
  async setCompensation(
    employeeId: string,
    tenantId: string,
    salary: number,
    currency: string = "USD",
    callerInfo?: { uid: string; email: string }
  ): Promise<void> {
    const comp: EmployeeCompensation = {
      id: employeeId,
      tenantId,
      employeeId,
      salary: Number(salary) || 0,
      currency,
      updatedAt: Date.now(),
    };
    await setDoc(doc(db, "employeeCompensation", employeeId), comp, { merge: true });

    if (callerInfo) {
      await AuditLogService.createAuditLog(tenantId, {
        userId: callerInfo.uid,
        userEmail: callerInfo.email,
        action: "update",
        resource: "employee",
        resourceId: employeeId,
        details: `Updated compensation for employee ${employeeId}`,
      });
    }
  },

  /**
   * Terminate or change employee status.
   */
  async updateEmployeeStatus(
    employeeId: string, 
    status: Employee["status"],
    callerInfo?: { uid: string; email: string }
  ): Promise<void> {
    const ref = doc(db, "employees", employeeId);

    if (callerInfo) {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const oldEmp = snap.data() as Employee;
        await AuditLogService.createAuditLog(oldEmp.tenantId, {
          userId: callerInfo.uid,
          userEmail: callerInfo.email,
          action: "update",
          resource: "employee",
          resourceId: employeeId,
          details: `Changed employee status for "${oldEmp.firstName} ${oldEmp.lastName}" from "${oldEmp.status}" to "${status}"`,
        });
      }
    }

    await updateDoc(ref, {
      status,
      updatedAt: Date.now(),
    });
  },

  /**
   * Deletes an employee.
   */
  async deleteEmployee(
    employeeId: string,
    callerInfo?: { uid: string; email: string }
  ): Promise<void> {
    if (callerInfo) {
      const snap = await getDoc(doc(db, "employees", employeeId));
      if (snap.exists()) {
        const emp = snap.data() as Employee;
        await AuditLogService.createAuditLog(emp.tenantId, {
          userId: callerInfo.uid,
          userEmail: callerInfo.email,
          action: "delete",
          resource: "employee",
          resourceId: employeeId,
          details: `Deleted employee profile for "${emp.firstName} ${emp.lastName}"`,
        });
      }
    }
    await deleteDoc(doc(db, "employees", employeeId));
  }
};
```

## `frontend\src\features\employees\services\employeeRecordsService.ts`

```ts
import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "../../../lib/firebase";
import type {
  EmployeeContract,
  EmergencyContact,
  EmploymentHistoryEntry,
  EmployeeAsset,
  LifecycleEvent,
} from "@hrms/middleware";
import { AuditLogService } from "../../settings/services/auditLogService";

type CallerInfo = { uid: string; email: string };

function rid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
}

async function logEmployee(
  tenantId: string,
  caller: CallerInfo | undefined,
  action: "create" | "update" | "delete" | "status_change",
  employeeId: string,
  details: string
) {
  if (!caller) return;
  await AuditLogService.createAuditLog(tenantId, {
    userId: caller.uid,
    userEmail: caller.email,
    action,
    resource: "employee",
    resourceId: employeeId,
    details,
  });
}

async function listByEmployee<T>(
  collectionName: string,
  tenantId: string,
  employeeId: string
): Promise<T[]> {
  // NOTE: filter by tenantId AND employeeId. The tenantId filter is required so
  // the read rule (which checks resource.data.tenantId) can authorise the query;
  // two equality filters need no composite index.
  const q = query(
    collection(db, collectionName),
    where("tenantId", "==", tenantId),
    where("employeeId", "==", employeeId)
  );
  const snap = await getDocs(q);
  const list: T[] = [];
  snap.forEach((d) => list.push(d.data() as T));
  return list;
}

/* ------------------------------------------------------------------ */
/*  Contracts                                                          */
/* ------------------------------------------------------------------ */

export const ContractService = {
  list: (tenantId: string, employeeId: string) => listByEmployee<EmployeeContract>("employeeContracts", tenantId, employeeId),

  async uploadDocument(tenantId: string, file: File): Promise<{ documentUrl: string; documentPath: string }> {
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const documentPath = `tenants/${tenantId}/employee-docs/${Date.now()}_${safe}`;
    const r = ref(storage, documentPath);
    await uploadBytes(r, file, { contentType: file.type });
    const documentUrl = await getDownloadURL(r);
    return { documentUrl, documentPath };
  },

  async create(
    tenantId: string,
    data: Omit<EmployeeContract, "id" | "tenantId" | "createdAt" | "updatedAt">,
    caller?: CallerInfo
  ): Promise<EmployeeContract> {
    const id = rid("contract");
    const now = Date.now();
    const contract: EmployeeContract = { ...data, id, tenantId, createdAt: now, updatedAt: now };
    await setDoc(doc(db, "employeeContracts", id), contract);
    await logEmployee(tenantId, caller, "create", data.employeeId, `Added contract "${contract.title}"`);
    return contract;
  },

  async update(
    id: string,
    data: Partial<Omit<EmployeeContract, "id" | "tenantId" | "createdAt" | "updatedAt">>,
    caller?: CallerInfo
  ): Promise<void> {
    const snap = await getDoc(doc(db, "employeeContracts", id));
    if (!snap.exists()) return;
    const old = snap.data() as EmployeeContract;
    await updateDoc(doc(db, "employeeContracts", id), { ...data, updatedAt: Date.now() });
    await logEmployee(old.tenantId, caller, "update", old.employeeId, `Updated contract "${old.title}"`);
  },

  async remove(id: string, caller?: CallerInfo): Promise<void> {
    const snap = await getDoc(doc(db, "employeeContracts", id));
    if (snap.exists()) {
      const c = snap.data() as EmployeeContract;
      if (c.documentPath) {
        try {
          await deleteObject(ref(storage, c.documentPath));
        } catch {
          /* ignore missing file */
        }
      }
      await logEmployee(c.tenantId, caller, "delete", c.employeeId, `Removed contract "${c.title}"`);
    }
    await deleteDoc(doc(db, "employeeContracts", id));
  },
};

/* ------------------------------------------------------------------ */
/*  Emergency contacts                                                 */
/* ------------------------------------------------------------------ */

export const EmergencyContactService = {
  list: (tenantId: string, employeeId: string) => listByEmployee<EmergencyContact>("emergencyContacts", tenantId, employeeId),

  async create(
    tenantId: string,
    data: Omit<EmergencyContact, "id" | "tenantId" | "createdAt" | "updatedAt">,
    caller?: CallerInfo
  ): Promise<EmergencyContact> {
    const id = rid("ec");
    const now = Date.now();
    const contact: EmergencyContact = { ...data, id, tenantId, createdAt: now, updatedAt: now };
    await setDoc(doc(db, "emergencyContacts", id), contact);
    await logEmployee(tenantId, caller, "create", data.employeeId, `Added emergency contact "${contact.name}"`);
    return contact;
  },

  async update(
    id: string,
    data: Partial<Omit<EmergencyContact, "id" | "tenantId" | "createdAt" | "updatedAt">>,
    caller?: CallerInfo
  ): Promise<void> {
    const snap = await getDoc(doc(db, "emergencyContacts", id));
    if (!snap.exists()) return;
    const old = snap.data() as EmergencyContact;
    await updateDoc(doc(db, "emergencyContacts", id), { ...data, updatedAt: Date.now() });
    await logEmployee(old.tenantId, caller, "update", old.employeeId, `Updated emergency contact "${old.name}"`);
  },

  async remove(id: string, caller?: CallerInfo): Promise<void> {
    const snap = await getDoc(doc(db, "emergencyContacts", id));
    if (snap.exists()) {
      const c = snap.data() as EmergencyContact;
      await logEmployee(c.tenantId, caller, "delete", c.employeeId, `Removed emergency contact "${c.name}"`);
    }
    await deleteDoc(doc(db, "emergencyContacts", id));
  },
};

/* ------------------------------------------------------------------ */
/*  Employment history                                                 */
/* ------------------------------------------------------------------ */

export const EmploymentHistoryService = {
  list: (tenantId: string, employeeId: string) => listByEmployee<EmploymentHistoryEntry>("employmentHistory", tenantId, employeeId),

  async create(
    tenantId: string,
    data: Omit<EmploymentHistoryEntry, "id" | "tenantId" | "createdAt" | "updatedAt">,
    caller?: CallerInfo
  ): Promise<EmploymentHistoryEntry> {
    const id = rid("hist");
    const now = Date.now();
    const entry: EmploymentHistoryEntry = { ...data, id, tenantId, createdAt: now, updatedAt: now };
    await setDoc(doc(db, "employmentHistory", id), entry);
    await logEmployee(tenantId, caller, "update", data.employeeId, `Added "${entry.changeType}" history entry`);
    return entry;
  },

  async remove(id: string, caller?: CallerInfo): Promise<void> {
    const snap = await getDoc(doc(db, "employmentHistory", id));
    if (snap.exists()) {
      const e = snap.data() as EmploymentHistoryEntry;
      await logEmployee(e.tenantId, caller, "delete", e.employeeId, `Removed history entry "${e.changeType}"`);
    }
    await deleteDoc(doc(db, "employmentHistory", id));
  },
};

/* ------------------------------------------------------------------ */
/*  Assets                                                             */
/* ------------------------------------------------------------------ */

export const AssetService = {
  list: (tenantId: string, employeeId: string) => listByEmployee<EmployeeAsset>("employeeAssets", tenantId, employeeId),

  async create(
    tenantId: string,
    data: Omit<EmployeeAsset, "id" | "tenantId" | "createdAt" | "updatedAt">,
    caller?: CallerInfo
  ): Promise<EmployeeAsset> {
    const id = rid("asset");
    const now = Date.now();
    const asset: EmployeeAsset = { ...data, id, tenantId, createdAt: now, updatedAt: now };
    await setDoc(doc(db, "employeeAssets", id), asset);
    await logEmployee(tenantId, caller, "create", data.employeeId, `Assigned asset "${asset.name}"`);
    return asset;
  },

  async update(
    id: string,
    data: Partial<Omit<EmployeeAsset, "id" | "tenantId" | "createdAt" | "updatedAt">>,
    caller?: CallerInfo
  ): Promise<void> {
    const snap = await getDoc(doc(db, "employeeAssets", id));
    if (!snap.exists()) return;
    const old = snap.data() as EmployeeAsset;
    await updateDoc(doc(db, "employeeAssets", id), { ...data, updatedAt: Date.now() });
    await logEmployee(old.tenantId, caller, "update", old.employeeId, `Updated asset "${old.name}"`);
  },

  async remove(id: string, caller?: CallerInfo): Promise<void> {
    const snap = await getDoc(doc(db, "employeeAssets", id));
    if (snap.exists()) {
      const a = snap.data() as EmployeeAsset;
      await logEmployee(a.tenantId, caller, "delete", a.employeeId, `Removed asset "${a.name}"`);
    }
    await deleteDoc(doc(db, "employeeAssets", id));
  },
};

/* ------------------------------------------------------------------ */
/*  Lifecycle events                                                   */
/* ------------------------------------------------------------------ */

export const LifecycleService = {
  list: (tenantId: string, employeeId: string) => listByEmployee<LifecycleEvent>("lifecycleEvents", tenantId, employeeId),

  async add(
    tenantId: string,
    data: Omit<LifecycleEvent, "id" | "tenantId" | "createdAt">,
    caller?: CallerInfo
  ): Promise<LifecycleEvent> {
    const id = rid("life");
    const event: LifecycleEvent = { ...data, id, tenantId, createdAt: Date.now() };
    await setDoc(doc(db, "lifecycleEvents", id), event);
    await logEmployee(tenantId, caller, "status_change", data.employeeId, `Lifecycle â†’ "${event.stage}"`);
    return event;
  },

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(db, "lifecycleEvents", id));
  },
};
```

## `frontend\src\features\employees\utils\departments.ts`

```ts
import type { Department } from "@hrms/middleware";

export interface DepartmentNode {
  department: Department;
  children: DepartmentNode[];
  level: number;
}

/**
 * Checks if setting a department's parent to proposedParentId would create a circular dependency.
 * A circular dependency exists if proposedParentId is the department itself, or any of its descendants.
 */
export function hasCircularDependency(
  departments: Department[],
  deptId: string,
  proposedParentId: string | undefined
): boolean {
  if (!proposedParentId) return false;
  if (deptId === proposedParentId) return true;

  // Build an adjacency map (deptId -> parentId)
  const parentMap = new Map<string, string>();
  departments.forEach((d) => {
    if (d.parentId) {
      parentMap.set(d.id, d.parentId);
    }
  });

  // Temporarily set the proposed relationship to model the future state
  parentMap.set(deptId, proposedParentId);

  // Traverse upwards from proposedParentId to see if we ever reach deptId
  let current: string | undefined = proposedParentId;
  const visited = new Set<string>();

  while (current) {
    if (current === deptId) return true;
    if (visited.has(current)) {
      // Loop detected
      return true;
    }
    visited.add(current);
    current = parentMap.get(current);
  }

  return false;
}

/**
 * Builds a nested tree of departments.
 */
export function buildDepartmentTree(
  departments: Department[],
  parentId: string | undefined = undefined,
  level: number = 0
): DepartmentNode[] {
  return departments
    .filter((d) => {
      if (parentId === undefined) {
        return !d.parentId;
      }
      return d.parentId === parentId;
    })
    .map((d) => ({
      department: d,
      children: buildDepartmentTree(departments, d.id, level + 1),
      level,
    }));
}
```

## `frontend\src\features\employees\utils\departments.test.ts`

```ts
import { describe, it, expect } from "vitest";
import type { Department } from "@hrms/middleware";
import { hasCircularDependency, buildDepartmentTree } from "./departments";

const mockDepartment = (id: string, parentId?: string, isArchived?: boolean): Department => {
  const dept: Department = {
    id,
    tenantId: "tenant_1",
    name: `Dept ${id}`,
    code: id.toUpperCase(),
    description: `Description for ${id}`,
    managerId: "mgr_1",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  if (parentId !== undefined) {
    dept.parentId = parentId;
  }
  if (isArchived !== undefined) {
    dept.isArchived = isArchived;
  }
  return dept;
};

describe("Department Hierarchy Utilities", () => {
  describe("hasCircularDependency", () => {
    it("should return false if proposedParentId is undefined", () => {
      const depts = [
        mockDepartment("dept_a"),
        mockDepartment("dept_b", "dept_a"),
      ];
      expect(hasCircularDependency(depts, "dept_b", undefined)).toBe(false);
    });

    it("should return true if proposedParentId is the department itself", () => {
      const depts = [mockDepartment("dept_a")];
      expect(hasCircularDependency(depts, "dept_a", "dept_a")).toBe(true);
    });

    it("should return true if proposedParentId is a direct descendant", () => {
      // Structure: A -> B
      // Proposed: set A's parent to B
      const depts = [
        mockDepartment("dept_a"),
        mockDepartment("dept_b", "dept_a"),
      ];
      expect(hasCircularDependency(depts, "dept_a", "dept_b")).toBe(true);
    });

    it("should return true if proposedParentId is a nested descendant", () => {
      // Structure: A -> B -> C -> D
      // Proposed: set A's parent to D
      const depts = [
        mockDepartment("dept_a"),
        mockDepartment("dept_b", "dept_a"),
        mockDepartment("dept_c", "dept_b"),
        mockDepartment("dept_d", "dept_c"),
      ];
      expect(hasCircularDependency(depts, "dept_a", "dept_d")).toBe(true);
    });

    it("should return false if setting parent to an independent department", () => {
      // Structure: A -> B, C -> D
      // Proposed: set B's parent to D
      const depts = [
        mockDepartment("dept_a"),
        mockDepartment("dept_b", "dept_a"),
        mockDepartment("dept_c"),
        mockDepartment("dept_d", "dept_c"),
      ];
      expect(hasCircularDependency(depts, "dept_b", "dept_d")).toBe(false);
    });
  });

  describe("buildDepartmentTree", () => {
    it("should build a nested tree structure for departments", () => {
      // Structure:
      // - A (Root)
      //   - B (Child of A)
      //     - C (Child of B)
      // - D (Root)
      const depts = [
        mockDepartment("dept_a"),
        mockDepartment("dept_b", "dept_a"),
        mockDepartment("dept_c", "dept_b"),
        mockDepartment("dept_d"),
      ];

      const tree = buildDepartmentTree(depts);

      expect(tree.length).toBe(2);
      
      const nodeA = tree.find(n => n.department.id === "dept_a");
      const nodeD = tree.find(n => n.department.id === "dept_d");

      expect(nodeA).toBeDefined();
      expect(nodeD).toBeDefined();

      expect(nodeA!.children.length).toBe(1);
      const childB = nodeA!.children[0]!;
      expect(childB.department.id).toBe("dept_b");
      expect(childB.level).toBe(1);

      expect(childB.children.length).toBe(1);
      const grandchildC = childB.children[0]!;
      expect(grandchildC.department.id).toBe("dept_c");
      expect(grandchildC.level).toBe(2);

      expect(nodeD!.children.length).toBe(0);
      expect(nodeD!.level).toBe(0);
    });

    it("should build subtrees starting from a specific parent ID", () => {
      const depts = [
        mockDepartment("dept_a"),
        mockDepartment("dept_b", "dept_a"),
        mockDepartment("dept_c", "dept_b"),
      ];

      const tree = buildDepartmentTree(depts, "dept_a");
      expect(tree.length).toBe(1);
      const firstNode = tree[0]!;
      expect(firstNode.department.id).toBe("dept_b");
      expect(firstNode.children.length).toBe(1);
      expect(firstNode.children[0]!.department.id).toBe("dept_c");
    });
  });
});
```

## `frontend\src\features\employees\utils\employeeRecords.ts`

```ts
import type {
  EmployeeContract,
  ContractStatus,
  EmergencyContact,
  EmploymentHistoryEntry,
  EmployeeAsset,
  LifecycleEvent,
  LifecycleStage,
} from "@hrms/middleware";

/* ------------------------------------------------------------------ */
/*  Date helpers                                                       */
/* ------------------------------------------------------------------ */

/**
 * Parses an ISO date string (YYYY-MM-DD) into epoch milliseconds.
 * Returns NaN if empty or invalid.
 */
export function isoToMs(iso?: string): number {
  if (!iso) return NaN;
  const ms = new Date(iso).getTime();
  return Number.isNaN(ms) ? NaN : ms;
}

/* ------------------------------------------------------------------ */
/*  Contracts                                                          */
/* ------------------------------------------------------------------ */

/**
 * Derives the contract status based on current date boundaries
 * unless explicitly set to a static state like draft or terminated.
 */
export function deriveContractStatus(
  contract: Pick<EmployeeContract, "status" | "startDate" | "endDate">,
  now: number = Date.now()
): ContractStatus {
  if (contract.status === "draft" || contract.status === "terminated") {
    return contract.status;
  }
  const start = isoToMs(contract.startDate);
  const end = isoToMs(contract.endDate);
  
  if (!Number.isNaN(end) && end < now) return "expired";
  if (!Number.isNaN(start) && start > now) return "draft"; // not yet started
  return "active";
}

/**
 * Checks if the given contract is currently active.
 */
export function isContractActive(
  contract: Pick<EmployeeContract, "status" | "startDate" | "endDate">,
  now: number = Date.now()
): boolean {
  return deriveContractStatus(contract, now) === "active";
}

/**
 * Returns the single active contract with the most recent start date, or null.
 */
export function getActiveContract(
  contracts: EmployeeContract[],
  now: number = Date.now()
): EmployeeContract | null {
  const active = contracts
    .filter((c) => isContractActive(c, now))
    .sort((a, b) => isoToMs(b.startDate) - isoToMs(a.startDate));
  return active[0] ?? null;
}

/* ------------------------------------------------------------------ */
/*  Emergency contacts                                                 */
/* ------------------------------------------------------------------ */

/**
 * Returns the primary contact if flagged, otherwise falls back to the first contact or null.
 */
export function getPrimaryContact(contacts: EmergencyContact[]): EmergencyContact | null {
  return contacts.find((c) => c.isPrimary) ?? contacts[0] ?? null;
}

/**
 * Sets a single contact as the primary contact, clearing the primary flag on all others.
 * Pure function returning a new array.
 */
export function applyPrimarySelection(
  contacts: EmergencyContact[],
  primaryId: string
): EmergencyContact[] {
  return contacts.map((c) => ({ ...c, isPrimary: c.id === primaryId }));
}

/* ------------------------------------------------------------------ */
/*  Employment history                                                 */
/* ------------------------------------------------------------------ */

/**
 * Sorts employment history entries newest-effective first.
 */
export function sortHistory(entries: EmploymentHistoryEntry[]): EmploymentHistoryEntry[] {
  return [...entries].sort((a, b) => isoToMs(b.effectiveDate) - isoToMs(a.effectiveDate));
}

/**
 * Returns the job title from the most recent employment history entry, or null.
 */
export function latestTitle(entries: EmploymentHistoryEntry[]): string | null {
  const sorted = sortHistory(entries);
  return sorted[0]?.title ?? null;
}

/* ------------------------------------------------------------------ */
/*  Assets                                                             */
/* ------------------------------------------------------------------ */

/**
 * Filters assets currently assigned to the employee.
 */
export function activeAssets(assets: EmployeeAsset[]): EmployeeAsset[] {
  return assets.filter((a) => a.status === "assigned");
}

/**
 * Counts assets flagged as lost or damaged.
 */
export function flaggedAssetCount(assets: EmployeeAsset[]): number {
  return assets.filter((a) => a.status === "lost" || a.status === "damaged").length;
}

/* ------------------------------------------------------------------ */
/*  Lifecycle                                                          */
/* ------------------------------------------------------------------ */

/**
 * Sorts employee lifecycle events newest-effective first (falls back to createdAt).
 */
export function sortLifecycle(events: LifecycleEvent[]): LifecycleEvent[] {
  return [...events].sort((a, b) => {
    const d = isoToMs(b.effectiveDate) - isoToMs(a.effectiveDate);
    if (d !== 0) return d;
    return b.createdAt - a.createdAt;
  });
}

/**
 * Derives the current lifecycle stage from the most recent lifecycle event.
 */
export function deriveCurrentStage(events: LifecycleEvent[]): LifecycleStage | null {
  return sortLifecycle(events)[0]?.stage ?? null;
}

/**
 * Canonical order of stages in an employee's lifecycle.
 */
export const LIFECYCLE_ORDER: LifecycleStage[] = [
  "applicant",
  "onboarding",
  "active",
  "on_leave",
  "offboarding",
  "terminated",
];

/**
 * Checks if a state transition is a forward (progressive) transition.
 * Allows active <-> on_leave in both directions.
 */
const isForwardTransition = (from: LifecycleStage, to: LifecycleStage): boolean => {
  if (from === to) return false;
  // on_leave <-> active is reversible
  if (
    (from === "active" && to === "on_leave") ||
    (from === "on_leave" && to === "active")
  ) {
    return true;
  }
  return LIFECYCLE_ORDER.indexOf(to) > LIFECYCLE_ORDER.indexOf(from);
};

export { isForwardTransition };
export default isForwardTransition;
```

## `frontend\src\features\employees\utils\employeeRecords.test.ts`

```ts
import { describe, it, expect } from "vitest";
import {
  isoToMs,
  deriveContractStatus,
  isContractActive,
  getActiveContract,
  getPrimaryContact,
  applyPrimarySelection,
  sortHistory,
  latestTitle,
  activeAssets,
  flaggedAssetCount,
  sortLifecycle,
  deriveCurrentStage,
  isForwardTransition,
} from "./employeeRecords";
import type {
  EmployeeContract,
  EmergencyContact,
  EmploymentHistoryEntry,
  EmployeeAsset,
  LifecycleEvent,
} from "@hrms/middleware";

const NOW = Date.parse("2026-06-16T00:00:00Z");

function contract(o: Partial<EmployeeContract> = {}): EmployeeContract {
  return {
    id: "c1", tenantId: "t1", employeeId: "e1",
    title: "Permanent Agreement", type: "full_time",
    startDate: "2025-01-01", salary: 100000, currency: "USD", status: "active",
    createdAt: 1, updatedAt: 1, ...o,
  };
}
function ec(o: Partial<EmergencyContact> = {}): EmergencyContact {
  return { id: "ec1", tenantId: "t1", employeeId: "e1", name: "Jo", relationship: "spouse", phone: "123", isPrimary: false, createdAt: 1, updatedAt: 1, ...o };
}
function hist(o: Partial<EmploymentHistoryEntry> = {}): EmploymentHistoryEntry {
  return { id: "h1", tenantId: "t1", employeeId: "e1", changeType: "hired", title: "Engineer", effectiveDate: "2025-01-01", createdAt: 1, updatedAt: 1, ...o };
}
function asset(o: Partial<EmployeeAsset> = {}): EmployeeAsset {
  return { id: "a1", tenantId: "t1", employeeId: "e1", name: "Laptop", assetType: "laptop", assignedDate: "2025-01-01", status: "assigned", createdAt: 1, updatedAt: 1, ...o };
}
function life(o: Partial<LifecycleEvent> = {}): LifecycleEvent {
  return { id: "l1", tenantId: "t1", employeeId: "e1", stage: "onboarding", effectiveDate: "2025-01-01", createdBy: "u1", createdAt: 1, ...o };
}

describe("isoToMs", () => {
  it("parses ISO dates and returns NaN for empty", () => {
    expect(isoToMs("2025-01-01")).toBe(Date.parse("2025-01-01"));
    expect(Number.isNaN(isoToMs(undefined))).toBe(true);
    expect(Number.isNaN(isoToMs(""))).toBe(true);
  });
});

describe("deriveContractStatus", () => {
  it("keeps manual draft/terminated statuses", () => {
    expect(deriveContractStatus(contract({ status: "draft" }), NOW)).toBe("draft");
    expect(deriveContractStatus(contract({ status: "terminated" }), NOW)).toBe("terminated");
  });
  it("marks expired when endDate has passed", () => {
    expect(deriveContractStatus(contract({ status: "active", endDate: "2025-12-31" }), NOW)).toBe("expired");
  });
  it("treats a future start as draft (not yet started)", () => {
    expect(deriveContractStatus(contract({ status: "active", startDate: "2099-01-01" }), NOW)).toBe("draft");
  });
  it("is active when started and not expired", () => {
    expect(deriveContractStatus(contract({ status: "active", startDate: "2025-01-01", endDate: "2099-01-01" }), NOW)).toBe("active");
  });
});

describe("isContractActive / getActiveContract", () => {
  it("isContractActive reflects derived status", () => {
    expect(isContractActive(contract({ endDate: "2099-01-01" }), NOW)).toBe(true);
    expect(isContractActive(contract({ endDate: "2024-01-01" }), NOW)).toBe(false);
  });
  it("returns the most recently started active contract", () => {
    const a = contract({ id: "a", startDate: "2025-01-01", endDate: "2099-01-01" });
    const b = contract({ id: "b", startDate: "2026-01-01", endDate: "2099-01-01" });
    const expired = contract({ id: "x", startDate: "2020-01-01", endDate: "2021-01-01" });
    expect(getActiveContract([a, expired, b], NOW)?.id).toBe("b");
  });
  it("returns null when none active", () => {
    expect(getActiveContract([contract({ status: "terminated" })], NOW)).toBeNull();
  });
});

describe("emergency contacts", () => {
  it("getPrimaryContact prefers the flagged primary", () => {
    const list = [ec({ id: "1" }), ec({ id: "2", isPrimary: true })];
    expect(getPrimaryContact(list)?.id).toBe("2");
  });
  it("getPrimaryContact falls back to first then null", () => {
    expect(getPrimaryContact([ec({ id: "1" })])?.id).toBe("1");
    expect(getPrimaryContact([])).toBeNull();
  });
  it("applyPrimarySelection flips a single primary", () => {
    const list = [ec({ id: "1", isPrimary: true }), ec({ id: "2" })];
    const next = applyPrimarySelection(list, "2");
    expect(next.find((c) => c.id === "1")!.isPrimary).toBe(false);
    expect(next.find((c) => c.id === "2")!.isPrimary).toBe(true);
    // does not mutate input
    expect(list.find((c) => c.id === "1")!.isPrimary).toBe(true);
  });
});

describe("employment history", () => {
  it("sorts newest effective first and returns latest title", () => {
    const a = hist({ id: "a", title: "Engineer", effectiveDate: "2024-01-01" });
    const b = hist({ id: "b", title: "Senior Engineer", effectiveDate: "2025-06-01" });
    const c = hist({ id: "c", title: "Lead", effectiveDate: "2026-01-01" });
    const sorted = sortHistory([a, c, b]);
    expect(sorted.map((x) => x.id)).toEqual(["c", "b", "a"]);
    expect(latestTitle([a, c, b])).toBe("Lead");
  });
  it("latestTitle is null for empty", () => {
    expect(latestTitle([])).toBeNull();
  });
});

describe("assets", () => {
  it("activeAssets returns only assigned", () => {
    const list = [asset({ id: "1" }), asset({ id: "2", status: "returned" }), asset({ id: "3", status: "lost" })];
    expect(activeAssets(list).map((a) => a.id)).toEqual(["1"]);
  });
  it("flaggedAssetCount counts lost/damaged", () => {
    const list = [asset({ status: "lost" }), asset({ status: "damaged" }), asset({ status: "assigned" })];
    expect(flaggedAssetCount(list)).toBe(2);
  });
});

describe("lifecycle", () => {
  it("sorts newest first using effectiveDate then createdAt", () => {
    const a = life({ id: "a", stage: "onboarding", effectiveDate: "2025-01-01", createdAt: 1 });
    const b = life({ id: "b", stage: "active", effectiveDate: "2025-06-01", createdAt: 2 });
    const c = life({ id: "c", stage: "active", effectiveDate: "2025-06-01", createdAt: 5 });
    const sorted = sortLifecycle([a, b, c]);
    expect(sorted[0]!.id).toBe("c"); // same date, higher createdAt first
    expect(sorted[sorted.length - 1]!.id).toBe("a");
  });
  it("deriveCurrentStage returns the latest stage", () => {
    const events = [
      life({ id: "a", stage: "onboarding", effectiveDate: "2025-01-01" }),
      life({ id: "b", stage: "active", effectiveDate: "2025-03-01" }),
    ];
    expect(deriveCurrentStage(events)).toBe("active");
    expect(deriveCurrentStage([])).toBeNull();
  });
  it("isForwardTransition respects canonical order with reversible on_leave", () => {
    expect(isForwardTransition("onboarding", "active")).toBe(true);
    expect(isForwardTransition("active", "onboarding")).toBe(false);
    expect(isForwardTransition("active", "on_leave")).toBe(true);
    expect(isForwardTransition("on_leave", "active")).toBe(true);
    expect(isForwardTransition("active", "active")).toBe(false);
    expect(isForwardTransition("offboarding", "terminated")).toBe(true);
  });
});
```

## `frontend\src\features\recruitment\pages\JobsListPage.tsx`

```tsx
import { getFriendlyErrorMessage } from "../../../lib/errors";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../auth/context/AuthContext";
import { useHasPermission } from "../../rbac/hooks/usePermissions";
import { JobService, type JobCreateInput } from "../services/jobService";
import { EmployeeService } from "../../employees/services/employeeService";
import { Skeleton } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/ErrorState";
import { EmptyState } from "../../../components/ui/EmptyState";
import { filterJobs, isCurrentApprover, getCurrentApprover, type JobFilters } from "../utils/recruitment";
import { fetchTenantMembers, jobStatusClass, titleCase, formatDate } from "../components/recruitmentUi";
import type {
  Job,
  JobStatus,
  Department,
  UserProfile,
  EmploymentType,
  WorkMode,
} from "@hrms/middleware";
import { DEFAULT_PIPELINE_STAGES } from "@hrms/middleware";
import {
  Briefcase,
  Plus,
  Trash2,
  Edit2,
  X,
  Search,
  Send,
  Check,
  Ban,
  Globe,
  EyeOff,
} from "lucide-react";

const EMPLOYMENT_TYPES: EmploymentType[] = ["full_time", "part_time", "contract", "internship", "temporary"];
const WORK_MODES: WorkMode[] = ["remote", "onsite", "hybrid"];
const JOB_STATUSES: JobStatus[] = ["draft", "pending_approval", "approved", "rejected", "open", "on_hold", "closed"];

export function JobsListPage() {
  const { profile, user } = useAuth();
  const tenantId = profile?.activeTenantId || "";
  const hasPerm = useHasPermission();
  const canCreate = hasPerm("jobs.create");
  const canEdit = hasPerm("jobs.update");
  const canDelete = hasPerm("jobs.delete");
  const caller = user ? { uid: user.uid, email: user.email || "" } : undefined;

  const [jobs, setJobs] = useState<Job[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<JobFilters>({ search: "", status: "all", departmentId: "all" });
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);
  const [saving, setSaving] = useState(false);

  // form fields
  const [form, setForm] = useState({
    title: "",
    departmentId: "",
    location: "",
    workMode: "remote" as WorkMode,
    employmentType: "full_time" as EmploymentType,
    openings: 1,
    salaryMin: "",
    salaryMax: "",
    currency: "USD",
    description: "",
    responsibilities: "",
    requirements: "",
    requireApproval: false,
    approverIds: [] as string[],
    stages: [...DEFAULT_PIPELINE_STAGES] as string[],
  });

  const fetchData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      // Core job + member data. `users` reads are open to any authed member and
      // jobs require jobs.view (which any role reaching this page has).
      const [jobsData, mem] = await Promise.all([
        JobService.getJobs(tenantId),
        fetchTenantMembers(tenantId),
      ]);

      // Departments are auxiliary metadata (names + the requisition's department
      // picker). A role with jobs.view but without departments.view should still
      // be able to use this page, so a denied departments read is non-fatal.
      let depts: Department[] = [];
      try {
        depts = await EmployeeService.getDepartments(tenantId);
      } catch (deptErr) {
        console.warn("[JobsListPage] departments unavailable (missing departments.view?)", deptErr);
      }

      setJobs(jobsData);
      setDepartments(depts);
      setMembers(mem);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "Failed to load jobs."));
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => filterJobs(jobs, filters), [jobs, filters]);
  const deptName = (id: string) => departments.find((d) => d.id === id)?.name ?? "â€”";

  const resetForm = () => {
    setForm({
      title: "", departmentId: departments[0]?.id || "", location: "", workMode: "remote",
      employmentType: "full_time", openings: 1, salaryMin: "", salaryMax: "", currency: "USD",
      description: "", responsibilities: "", requirements: "", requireApproval: false, approverIds: [],
      stages: [...DEFAULT_PIPELINE_STAGES],
    });
  };

  const openCreate = () => {
    setEditing(null);
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (job: Job) => {
    setEditing(job);
    setForm({
      title: job.title,
      departmentId: job.departmentId,
      location: job.location,
      workMode: job.workMode,
      employmentType: job.employmentType,
      openings: job.openings,
      salaryMin: job.salaryMin?.toString() ?? "",
      salaryMax: job.salaryMax?.toString() ?? "",
      currency: job.currency,
      description: job.description,
      responsibilities: job.responsibilities,
      requirements: job.requirements,
      requireApproval: job.approval?.required ?? false,
      approverIds: job.approval?.steps.map((s) => s.approverId) ?? [],
      stages: job.pipelineStages?.length ? [...job.pipelineStages] : [...DEFAULT_PIPELINE_STAGES],
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!tenantId || !form.title.trim()) {
      setError("Job title is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const base = {
        title: form.title.trim(),
        departmentId: form.departmentId,
        location: form.location.trim(),
        workMode: form.workMode,
        employmentType: form.employmentType,
        openings: Number(form.openings) || 1,
        currency: form.currency,
        description: form.description,
        responsibilities: form.responsibilities,
        requirements: form.requirements,
      };
      const salaryMin = form.salaryMin ? Number(form.salaryMin) : undefined;
      const salaryMax = form.salaryMax ? Number(form.salaryMax) : undefined;

      const cleanedStages = form.stages.map((s) => s.trim()).filter(Boolean);
      if (editing) {
        const patch: Partial<Job> = { ...base };
        if (salaryMin !== undefined) patch.salaryMin = salaryMin;
        if (salaryMax !== undefined) patch.salaryMax = salaryMax;
        if (cleanedStages.length) patch.pipelineStages = cleanedStages;
        await JobService.updateJob(editing.id, patch, caller);
      } else {
        const approvers = form.requireApproval
          ? form.approverIds
              .map((id) => members.find((m) => m.id === id))
              .filter((m): m is UserProfile => !!m)
              .map((m) => ({ approverId: m.id, approverEmail: m.email, approverName: m.displayName }))
          : [];
        const input: JobCreateInput = {
          ...base,
          isPublished: false,
          createdBy: user?.uid || "",
          approvers,
        };
        if (user?.uid) input.hiringManagerId = user.uid;
        if (salaryMin !== undefined) input.salaryMin = salaryMin;
        if (salaryMax !== undefined) input.salaryMax = salaryMax;
        if (cleanedStages.length) input.pipelineStages = cleanedStages;
        await JobService.createJob(tenantId, input, caller);
      }
      setModalOpen(false);
      await fetchData();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "Failed to save job."));
    } finally {
      setSaving(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    setSelected((prev) =>
      prev.size === filtered.length ? new Set() : new Set(filtered.map((j) => j.id))
    );
  };

  const bulkStatus = async (status: JobStatus) => {
    await JobService.bulkUpdateStatus([...selected], status, caller);
    setSelected(new Set());
    await fetchData();
  };
  const bulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} job(s)? This cannot be undone.`)) return;
    await JobService.bulkDelete([...selected], caller);
    setSelected(new Set());
    await fetchData();
  };

  const act = async (fn: () => Promise<void>) => {
    try {
      await fn();
      await fetchData();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "Action failed."));
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (error && jobs.length === 0) {
    return <ErrorState description={error} onRetry={fetchData} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-blue-600" /> Job Requisitions
          </h1>
          <p className="text-sm text-slate-500 mt-1">Create, approve and publish job openings.</p>
        </div>
        {canCreate && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer"
          >
            <Plus size={18} /> New Requisition
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            placeholder="Search jobs by title, locationâ€¦"
            className="w-full rounded-xl border border-slate-200 pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as JobStatus | "all" }))}
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white"
        >
          <option value="all">All statuses</option>
          {JOB_STATUSES.map((s) => (
            <option key={s} value={s}>{titleCase(s)}</option>
          ))}
        </select>
        <select
          value={filters.departmentId}
          onChange={(e) => setFilters((f) => ({ ...f, departmentId: e.target.value }))}
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white"
        >
          <option value="all">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
          <span className="text-sm font-semibold text-blue-900">{selected.size} selected</span>
          {canEdit && (
            <>
              <button onClick={() => bulkStatus("open")} className="text-sm font-medium text-emerald-700 hover:underline cursor-pointer">Set Open</button>
              <button onClick={() => bulkStatus("closed")} className="text-sm font-medium text-slate-700 hover:underline cursor-pointer">Set Closed</button>
              <button onClick={() => bulkStatus("on_hold")} className="text-sm font-medium text-orange-700 hover:underline cursor-pointer">Hold</button>
            </>
          )}
          {canDelete && (
            <button onClick={bulkDelete} className="text-sm font-medium text-rose-700 hover:underline cursor-pointer">Delete</button>
          )}
        </div>
      )}

      {error && <div className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No job requisitions"
          description="Create your first requisition to start hiring."
          icon={<Briefcase className="h-6 w-6" />}
          {...(canCreate ? { actionLabel: "New Requisition", onAction: openCreate } : {})}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} className="rounded" />
                </th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Openings</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((job) => {
                const amApprover = !!user && isCurrentApprover(job.approval, user.uid);
                return (
                  <tr key={job.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(job.id)} onChange={() => toggleSelect(job.id)} className="rounded" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{job.title}</div>
                      <div className="text-xs text-slate-500">{job.location} Â· {titleCase(job.workMode)}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{deptName(job.departmentId)}</td>
                    <td className="px-4 py-3 text-slate-600">{titleCase(job.employmentType)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${jobStatusClass(job.status)}`}>
                        {titleCase(job.status)}
                      </span>
                      {job.isPublished && <span className="ml-1 inline-flex items-center gap-1 text-xs text-emerald-600"><Globe size={12} /></span>}
                      {job.status === "pending_approval" && (() => {
                        const approver = getCurrentApprover(job.approval);
                        if (!approver) return null;
                        const who = approver.approverName || approver.approverEmail;
                        const total = job.approval.steps.length;
                        return (
                          <div className="mt-1 text-xs text-slate-500">
                            Awaiting: <span className="font-medium text-slate-700">{who}</span>
                            {total > 1 && (
                              <span className="text-slate-400"> Â· step {job.approval.currentStep + 1} of {total}</span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{job.openings}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(job.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {amApprover && (
                          <>
                            <button title="Approve" onClick={() => act(() => JobService.decideApproval(job.id, "approved", caller!))} className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 cursor-pointer"><Check size={16} /></button>
                            <button title="Reject" onClick={() => act(() => JobService.decideApproval(job.id, "rejected", caller!))} className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 cursor-pointer"><Ban size={16} /></button>
                          </>
                        )}
                        {canEdit && job.status === "draft" && (
                          <button title="Submit for approval" onClick={() => act(() => JobService.submitForApproval(job.id, caller))} className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-50 cursor-pointer"><Send size={16} /></button>
                        )}
                        {canEdit && (job.status === "approved" || job.status === "open") && (
                          <button
                            title={job.isPublished ? "Unpublish" : "Publish to careers"}
                            onClick={() => act(() => JobService.setPublished(job.id, !job.isPublished, caller))}
                            className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 cursor-pointer"
                          >
                            {job.isPublished ? <EyeOff size={16} /> : <Globe size={16} />}
                          </button>
                        )}
                        {canEdit && (
                          <button title="Edit" onClick={() => openEdit(job)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 cursor-pointer"><Edit2 size={16} /></button>
                        )}
                        {canDelete && (
                          <button title="Delete" onClick={() => act(() => JobService.deleteJob(job.id, caller))} className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 cursor-pointer"><Trash2 size={16} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">{editing ? "Edit Requisition" : "New Requisition"}</h2>
              <button onClick={() => setModalOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 cursor-pointer"><X size={18} /></button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Job Title *</label>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Department</label>
                <select value={form.departmentId} onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white">
                  <option value="">â€”</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Location</label>
                <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Work Mode</label>
                <select value={form.workMode} onChange={(e) => setForm((f) => ({ ...f, workMode: e.target.value as WorkMode }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white">
                  {WORK_MODES.map((m) => <option key={m} value={m}>{titleCase(m)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Employment Type</label>
                <select value={form.employmentType} onChange={(e) => setForm((f) => ({ ...f, employmentType: e.target.value as EmploymentType }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white">
                  {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Openings</label>
                <input type="number" min={1} value={form.openings} onChange={(e) => setForm((f) => ({ ...f, openings: Number(e.target.value) }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Currency</label>
                <input value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Salary Min</label>
                <input type="number" value={form.salaryMin} onChange={(e) => setForm((f) => ({ ...f, salaryMin: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Salary Max</label>
                <input type="number" value={form.salaryMax} onChange={(e) => setForm((f) => ({ ...f, salaryMax: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Responsibilities</label>
                <textarea value={form.responsibilities} onChange={(e) => setForm((f) => ({ ...f, responsibilities: e.target.value }))} rows={2} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Requirements</label>
                <textarea value={form.requirements} onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))} rows={2} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>

              <div className="sm:col-span-2 rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-slate-700">Pipeline Stages</label>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, stages: [...f.stages, ""] }))}
                    className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                  >
                    + Add stage
                  </button>
                </div>
                <div className="space-y-2">
                  {form.stages.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 w-5 text-right">{i + 1}</span>
                      <input
                        value={s}
                        onChange={(e) =>
                          setForm((f) => {
                            const stages = [...f.stages];
                            stages[i] = e.target.value;
                            return { ...f, stages };
                          })
                        }
                        placeholder={`Stage ${i + 1}`}
                        className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, stages: f.stages.filter((_, j) => j !== i) }))}
                        disabled={form.stages.length <= 1}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40 cursor-pointer"
                        title="Remove stage"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  These stages define the Kanban columns for this job's candidates.
                </p>
              </div>

              {!editing && (
                <div className="sm:col-span-2 rounded-xl border border-slate-200 p-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input type="checkbox" checked={form.requireApproval} onChange={(e) => setForm((f) => ({ ...f, requireApproval: e.target.checked }))} className="rounded" />
                    Require approval before publishing
                  </label>
                  {form.requireApproval && (
                    <div className="mt-3 max-h-40 overflow-y-auto space-y-1.5">
                      <p className="text-xs text-slate-500 mb-1">Select approvers (in order):</p>
                      {members.map((m) => (
                        <label key={m.id} className="flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={form.approverIds.includes(m.id)}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                approverIds: e.target.checked
                                  ? [...f.approverIds, m.id]
                                  : f.approverIds.filter((x) => x !== m.id),
                              }))
                            }
                            className="rounded"
                          />
                          {m.displayName} <span className="text-slate-400">({m.email})</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 cursor-pointer">
                {saving ? "Savingâ€¦" : editing ? "Save Changes" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

## `frontend\src\features\recruitment\pages\PipelinePage.tsx`

```tsx
import { getFriendlyErrorMessage } from "../../../lib/errors";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../auth/context/AuthContext";
import { useHasPermission } from "../../rbac/hooks/usePermissions";
import { JobService } from "../services/jobService";
import { CandidateService } from "../services/candidateService";
import { Skeleton } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/ErrorState";
import { EmptyState } from "../../../components/ui/EmptyState";
import { CandidateDrawer } from "../components/CandidateDrawer";
import {
  groupCandidatesByStage,
  searchCandidates,
} from "../utils/recruitment";
import { candidateStatusClass, titleCase } from "../components/recruitmentUi";
import { downloadCsv } from "../../../lib/csv";
import { DEFAULT_PIPELINE_STAGES } from "@hrms/middleware";
import type { Job, Candidate, CandidateSource } from "@hrms/middleware";
import { KanbanSquare, Search, Plus, X, Upload, Download } from "lucide-react";

const SOURCES: CandidateSource[] = ["careers", "referral", "manual", "agency", "linkedin"];

export function PipelinePage() {
  const { profile, user } = useAuth();
  const tenantId = profile?.activeTenantId || "";
  const hasPerm = useHasPermission();
  const canCreate = hasPerm("candidates.create");
  const canEdit = hasPerm("candidates.update");
  const canExport = hasPerm("candidates.export");
  const caller = user ? { uid: user.uid, email: user.email || "" } : undefined;

  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [active, setActive] = useState<Candidate | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const [jobsData, cands] = await Promise.all([
        JobService.getJobs(tenantId),
        CandidateService.getCandidates(tenantId),
      ]);
      setJobs(jobsData);
      setCandidates(cands);
      setSelectedJobId((prev) => prev || jobsData[0]?.id || "");
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "Failed to load pipeline."));
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const selectedJob = useMemo(() => jobs.find((j) => j.id === selectedJobId), [jobs, selectedJobId]);
  const stages = selectedJob?.pipelineStages ?? [...DEFAULT_PIPELINE_STAGES];

  const jobCandidates = useMemo(() => {
    let list = candidates.filter((c) => c.jobId === selectedJobId);
    if (search) list = searchCandidates(list, search);
    return list;
  }, [candidates, selectedJobId, search]);

  const grouped = useMemo(() => groupCandidatesByStage(jobCandidates, stages), [jobCandidates, stages]);

  const handleDrop = async (stage: string) => {
    setDragOverStage(null);
    const id = dragId;
    setDragId(null);
    if (!id) return;
    const cand = candidates.find((c) => c.id === id);
    if (!cand || cand.stage === stage) return;

    // optimistic update
    setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, stage } : c)));
    try {
      await CandidateService.moveToStage(id, stage, caller);
      await fetchAll();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "Failed to move candidate."));
      await fetchAll();
    }
  };

  const handleExportCsv = () => {
    const rows = jobCandidates.map((c) => [
      `${c.firstName} ${c.lastName}`,
      c.email,
      c.phone ?? "",
      c.stage,
      c.status,
      c.source,
      new Date(c.appliedAt).toISOString().slice(0, 10),
      c.jobTitle,
    ]);
    downloadCsv(
      `candidates_${(selectedJob?.title || "job").replace(/[^a-z0-9]+/gi, "_")}_${new Date().toISOString().slice(0, 10)}`,
      ["Name", "Email", "Phone", "Stage", "Status", "Source", "Applied", "Job"],
      rows
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="flex gap-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-80 w-64" />)}
        </div>
      </div>
    );
  }
  if (error && candidates.length === 0 && jobs.length === 0) {
    return <ErrorState description={error} onRetry={fetchAll} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <KanbanSquare className="h-6 w-6 text-blue-600" /> Candidate Pipeline
          </h1>
          <p className="text-sm text-slate-500 mt-1">Drag candidates across stages to update their progress.</p>
        </div>
        {canCreate && selectedJob && (
          <button onClick={() => setAddOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer">
            <Plus size={18} /> Add Candidate
          </button>
        )}
        {canExport && selectedJob && jobCandidates.length > 0 && (
          <button onClick={handleExportCsv} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
            <Download size={18} /> Export CSV
          </button>
        )}
      </div>

      {jobs.length === 0 ? (
        <EmptyState title="No jobs yet" description="Create and publish a job requisition to start adding candidates." icon={<KanbanSquare className="h-6 w-6" />} />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <select value={selectedJobId} onChange={(e) => setSelectedJobId(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white min-w-[220px]">
              {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search candidatesâ€¦" className="w-full rounded-xl border border-slate-200 pl-10 pr-3 py-2.5 text-sm" />
            </div>
          </div>

          {error && <div className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700">{error}</div>}

          {/* Kanban */}
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stages.map((stage) => {
              const items = grouped[stage] ?? [];
              return (
                <div
                  key={stage}
                  onDragOver={(e) => { if (canEdit) { e.preventDefault(); setDragOverStage(stage); } }}
                  onDragLeave={() => setDragOverStage((s) => (s === stage ? null : s))}
                  onDrop={() => canEdit && handleDrop(stage)}
                  className={`flex w-72 shrink-0 flex-col rounded-2xl border bg-slate-50/70 ${
                    dragOverStage === stage ? "border-blue-400 ring-2 ring-blue-200" : "border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                    <span className="text-sm font-semibold text-slate-700">{stage}</span>
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">{items.length}</span>
                  </div>
                  <div className="flex-1 space-y-2 p-3 min-h-[120px]">
                    {items.map((c) => (
                      <div
                        key={c.id}
                        draggable={canEdit}
                        onDragStart={() => setDragId(c.id)}
                        onDragEnd={() => setDragId(null)}
                        onClick={() => setActive(c)}
                        className={`cursor-pointer rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:shadow transition-shadow ${
                          dragId === c.id ? "opacity-50" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800 text-sm">{c.firstName} {c.lastName}</span>
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${candidateStatusClass(c.status)}`}>{titleCase(c.status)}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1 truncate">{c.email}</div>
                        <div className="text-[11px] text-slate-400 mt-1">{titleCase(c.source)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {active && (
        <CandidateDrawer
          candidate={candidates.find((c) => c.id === active.id) ?? active}
          stages={stages}
          onClose={() => setActive(null)}
          onChanged={fetchAll}
        />
      )}

      {addOpen && selectedJob && (
        <AddCandidateModal
          job={selectedJob}
          tenantId={tenantId}
          caller={caller}
          onClose={() => setAddOpen(false)}
          onAdded={async () => { setAddOpen(false); await fetchAll(); }}
        />
      )}
    </div>
  );
}

function AddCandidateModal({
  job,
  tenantId,
  caller,
  onClose,
  onAdded,
}: {
  job: Job;
  tenantId: string;
  caller: { uid: string; email: string } | undefined;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [source, setSource] = useState<CandidateSource>("manual");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setErr("First name, last name and email are required.");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      let resume: { resumeUrl: string; resumePath: string } | undefined;
      if (file) resume = await CandidateService.uploadResume(tenantId, file);
      await CandidateService.createCandidate(
        tenantId,
        {
          jobId: job.id,
          jobTitle: job.title,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          ...(phone ? { phone: phone.trim() } : {}),
          source,
          stage: job.pipelineStages[0] ?? "Applied",
          status: "active",
          ...(resume ? { resumeUrl: resume.resumeUrl, resumePath: resume.resumePath } : {}),
        },
        caller
      );
      onAdded();
    } catch (e) {
      setErr(getFriendlyErrorMessage(e, "Failed to add candidate."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-900">Add Candidate Â· {job.title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 cursor-pointer"><X size={18} /></button>
        </div>
        {err && <div className="mb-3 rounded-xl bg-rose-50 border border-rose-100 px-3 py-2 text-sm text-rose-700">{err}</div>}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <select value={source} onChange={(e) => setSource(e.target.value as CandidateSource)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white">
            {SOURCES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
          </select>
          <label className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-2.5 text-sm text-slate-600 cursor-pointer hover:bg-slate-50">
            <Upload size={16} />
            {file ? file.name : "Upload rÃ©sumÃ© (PDF/DOC)"}
            <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer">Cancel</button>
          <button onClick={save} disabled={saving} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 cursor-pointer">{saving ? "Savingâ€¦" : "Add"}</button>
        </div>
      </div>
    </div>
  );
}
```

## `frontend\src\features\recruitment\pages\CareersPage.tsx`

```tsx
import { getFriendlyErrorMessage } from "../../../lib/errors";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { CareersService, type ApplicationInput } from "../services/careersService";
import { titleCase } from "../components/recruitmentUi";
import type { Job } from "@hrms/middleware";
import { Briefcase, MapPin, Clock, Upload, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

export function CareersPage() {
  const { tenantId = "" } = useParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Job | null>(null);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await CareersService.listPublishedJobs(tenantId);
      setJobs(data);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "Failed to load openings."));
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    load();
  }, [load]);

  // SEO: set document title + meta/OG tags per page (list vs. selected job).
  // Note: this is client-rendered; for crawlers that don't execute JS, add SSR
  // or prerendering at the hosting layer for full coverage.
  useEffect(() => {
    const setMeta = (name: string, content: string, attr: "name" | "property" = "name") => {
      let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const title = selected
      ? `${selected.title} â€” Careers`
      : "Careers â€” Open Positions";
    const description = selected
      ? (selected.description?.slice(0, 155) || `Apply for ${selected.title}. ${titleCase(selected.employmentType)}, ${titleCase(selected.workMode)}.`)
      : "Explore our open roles and join the team.";

    const prevTitle = document.title;
    document.title = title;
    setMeta("description", description);
    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    setMeta("og:type", "website", "property");

    return () => {
      document.title = prevTitle;
    };
  }, [selected, jobs, loading]);

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="h-7 w-7 text-blue-600" /> Careers
          </h1>
          <p className="text-slate-500 mt-2">Explore open roles and join our team.</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        {loading ? (
          <p className="text-slate-500 flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading openingsâ€¦</p>
        ) : error ? (
          <div className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : selected ? (
          <JobApplication tenantId={tenantId} job={selected} onBack={() => setSelected(null)} />
        ) : jobs.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
            <p className="text-slate-500">There are no open positions right now. Please check back later.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <button
                key={job.id}
                onClick={() => setSelected(job)}
                className="block w-full text-left rounded-2xl border border-slate-200 bg-white p-5 hover:border-blue-300 hover:shadow-sm transition cursor-pointer"
              >
                <h2 className="text-lg font-semibold text-slate-900">{job.title}</h2>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><MapPin size={14} /> {job.location || "â€”"}</span>
                  <span className="flex items-center gap-1"><Clock size={14} /> {titleCase(job.employmentType)}</span>
                  <span>{titleCase(job.workMode)}</span>
                </div>
                {job.description && <p className="mt-3 text-sm text-slate-600 line-clamp-2">{job.description}</p>}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function JobApplication({ tenantId, job, onBack }: { tenantId: string; job: Job; onBack: () => void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setErr("Please fill in your name and email.");
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      let resume: { resumeUrl: string; resumePath: string } | undefined;
      if (file) resume = await CareersService.uploadResume(tenantId, file);
      const input: ApplicationInput = {
        tenantId,
        jobId: job.id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        ...(phone ? { phone: phone.trim() } : {}),
        ...(linkedinUrl ? { linkedinUrl: linkedinUrl.trim() } : {}),
        ...(coverLetter ? { coverLetter: coverLetter.trim() } : {}),
        ...(resume ? { resumeUrl: resume.resumeUrl, resumePath: resume.resumePath } : {}),
      };
      await CareersService.submitApplication(input);
      setDone(true);
    } catch (e) {
      setErr(getFriendlyErrorMessage(e, "Failed to submit application."));
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
        <h2 className="mt-4 text-xl font-bold text-slate-900">Application submitted</h2>
        <p className="mt-2 text-slate-500">Thank you for applying to {job.title}. We've emailed you a confirmation and will be in touch.</p>
        <button onClick={onBack} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer">
          Back to openings
        </button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={onBack} className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800 cursor-pointer">
        <ArrowLeft size={16} /> All openings
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-2xl font-bold text-slate-900">{job.title}</h2>
        <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1"><MapPin size={14} /> {job.location || "â€”"}</span>
          <span className="flex items-center gap-1"><Clock size={14} /> {titleCase(job.employmentType)}</span>
          <span>{titleCase(job.workMode)}</span>
        </div>

        {job.description && <Section title="About the role" body={job.description} />}
        {job.responsibilities && <Section title="Responsibilities" body={job.responsibilities} />}
        {job.requirements && <Section title="Requirements" body={job.requirements} />}

        <hr className="my-6 border-slate-100" />

        <h3 className="text-lg font-semibold text-slate-900 mb-4">Apply for this position</h3>
        {err && <div className="mb-4 rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700">{err}</div>}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name *" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name *" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          </div>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email *" type="email" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          <input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="LinkedIn URL" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          <textarea value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} placeholder="Cover letter (optional)" rows={4} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          <label className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-3 text-sm text-slate-600 cursor-pointer hover:bg-slate-50">
            <Upload size={16} />
            {file ? file.name : "Upload your rÃ©sumÃ© (PDF/DOC, max 5MB)"}
            <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <button onClick={submit} disabled={submitting} className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 cursor-pointer">
            {submitting ? "Submittingâ€¦" : "Submit Application"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">{body}</p>
    </div>
  );
}
```

## `frontend\src\features\recruitment\components\CandidateDrawer.tsx`

```tsx
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../auth/context/AuthContext";
import { useHasPermission } from "../../rbac/hooks/usePermissions";
import { CandidateService } from "../services/candidateService";
import { InterviewService } from "../services/interviewService";
import { OfferService } from "../services/offerService";
import { candidateStatusClass, offerStatusClass, titleCase, formatDate } from "./recruitmentUi";
import type {
  Candidate,
  CandidateNote,
  CandidateStatus,
  Interview,
  Offer,
  InterviewMode,
} from "@hrms/middleware";
import {
  X,
  FileText,
  MessageSquare,
  CalendarClock,
  BadgeDollarSign,
  Trash2,
  Mail,
  Phone,
  Linkedin,
} from "lucide-react";

interface Props {
  candidate: Candidate;
  stages: string[];
  onClose: () => void;
  onChanged: () => void;
}

const STATUSES: CandidateStatus[] = ["active", "hired", "rejected", "withdrawn"];

export function CandidateDrawer({ candidate, stages, onClose, onChanged }: Props) {
  const { user, profile } = useAuth();
  const tenantId = profile?.activeTenantId || "";
  const hasPerm = useHasPermission();
  const canEdit = hasPerm("candidates.update");
  const caller = user ? { uid: user.uid, email: user.email || "" } : undefined;

  const [tab, setTab] = useState<"profile" | "notes" | "interviews" | "offer">("profile");
  const [notes, setNotes] = useState<CandidateNote[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [noteBody, setNoteBody] = useState("");

  const loadRelated = useCallback(async () => {
    const [n, iv, of] = await Promise.all([
      CandidateService.getNotes(tenantId, candidate.id),
      InterviewService.getByCandidate(tenantId, candidate.id),
      OfferService.getByCandidate(tenantId, candidate.id),
    ]);
    setNotes(n);
    setInterviews(iv);
    setOffers(of);
  }, [candidate.id, tenantId]);

  useEffect(() => {
    loadRelated();
  }, [loadRelated]);

  const changeStage = async (stage: string) => {
    await CandidateService.moveToStage(candidate.id, stage, caller);
    onChanged();
  };
  const changeStatus = async (status: CandidateStatus) => {
    await CandidateService.setStatus(candidate.id, status, caller);
    onChanged();
  };

  const addNote = async () => {
    if (!noteBody.trim() || !user) return;
    await CandidateService.addNote(tenantId, candidate.id, noteBody.trim(), {
      uid: user.uid,
      name: profile?.displayName || user.email || "User",
    });
    setNoteBody("");
    await loadRelated();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40">
      <div className="h-full w-full max-w-md overflow-y-auto bg-white shadow-xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white p-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {candidate.firstName} {candidate.lastName}
            </h2>
            <p className="text-sm text-slate-500">{candidate.jobTitle}</p>
            <span className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${candidateStatusClass(candidate.status)}`}>
              {titleCase(candidate.status)}
            </span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 cursor-pointer"><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-5">
          {([
            ["profile", "Profile"],
            ["notes", "Notes"],
            ["interviews", "Interviews"],
            ["offer", "Offer"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-3 py-2.5 text-sm font-semibold border-b-2 -mb-px cursor-pointer ${
                tab === key ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-5">
          {tab === "profile" && (
            <>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600"><Mail size={15} /> {candidate.email}</div>
                {candidate.phone && <div className="flex items-center gap-2 text-slate-600"><Phone size={15} /> {candidate.phone}</div>}
                {candidate.linkedinUrl && (
                  <a href={candidate.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline"><Linkedin size={15} /> LinkedIn</a>
                )}
                <div className="text-slate-500">Source: {titleCase(candidate.source)} Â· Applied {formatDate(candidate.appliedAt)}</div>
              </div>

              {candidate.resumeUrl ? (
                <a href={candidate.resumeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  <FileText size={16} /> View RÃ©sumÃ©
                </a>
              ) : (
                <div className="text-sm text-slate-400 flex items-center gap-2"><FileText size={16} /> No rÃ©sumÃ© uploaded</div>
              )}

              {candidate.coverLetter && (
                <div>
                  <h4 className="text-xs font-semibold uppercase text-slate-500 mb-1">Cover Letter</h4>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{candidate.coverLetter}</p>
                </div>
              )}

              {canEdit && (
                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Pipeline Stage</label>
                    <select value={candidate.stage} onChange={(e) => changeStage(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white">
                      {stages.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                    <select value={candidate.status} onChange={(e) => changeStatus(e.target.value as CandidateStatus)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white">
                      {STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </>
          )}

          {tab === "notes" && (
            <div className="space-y-4">
              {canEdit && (
                <div className="flex gap-2">
                  <input value={noteBody} onChange={(e) => setNoteBody(e.target.value)} placeholder="Add a noteâ€¦" className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm" onKeyDown={(e) => e.key === "Enter" && addNote()} />
                  <button onClick={addNote} className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer">Add</button>
                </div>
              )}
              {notes.length === 0 ? (
                <p className="text-sm text-slate-400 flex items-center gap-2"><MessageSquare size={16} /> No notes yet.</p>
              ) : (
                notes.map((n) => (
                  <div key={n.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">{n.authorName}</span>
                      <span className="text-xs text-slate-400">{formatDate(n.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">{n.body}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "interviews" && (
            <InterviewsTab
              candidate={candidate}
              interviews={interviews}
              canEdit={canEdit}
              tenantId={tenantId}
              caller={caller}
              onChanged={loadRelated}
            />
          )}

          {tab === "offer" && (
            <OfferTab
              candidate={candidate}
              offers={offers}
              canEdit={canEdit}
              tenantId={tenantId}
              caller={caller}
              onChanged={loadRelated}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Interviews tab ----------------------------- */

const MODES: InterviewMode[] = ["video", "phone", "onsite"];

function InterviewsTab({
  candidate,
  interviews,
  canEdit,
  tenantId,
  caller,
  onChanged,
}: {
  candidate: Candidate;
  interviews: Interview[];
  canEdit: boolean;
  tenantId: string;
  caller: { uid: string; email: string } | undefined;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState("");
  const [mode, setMode] = useState<InterviewMode>("video");
  const [location, setLocation] = useState("");
  const [duration, setDuration] = useState(60);

  const schedule = async () => {
    if (!title.trim() || !when) return;
    await InterviewService.schedule(
      tenantId,
      {
        candidateId: candidate.id,
        candidateName: `${candidate.firstName} ${candidate.lastName}`,
        jobId: candidate.jobId,
        stage: candidate.stage,
        title: title.trim(),
        mode,
        location: location.trim(),
        scheduledAt: new Date(when).getTime(),
        durationMins: Number(duration) || 60,
        interviewerIds: caller ? [caller.uid] : [],
        interviewerEmails: caller ? [caller.email] : [],
        createdBy: caller?.uid || "",
      },
      caller
    );
    setOpen(false);
    setTitle("");
    setWhen("");
    setLocation("");
    onChanged();
  };

  return (
    <div className="space-y-4">
      {canEdit && !open && (
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer">
          <CalendarClock size={16} /> Schedule Interview
        </button>
      )}
      {open && (
        <div className="rounded-xl border border-slate-200 p-3 space-y-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Interview title" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <select value={mode} onChange={(e) => setMode(e.target.value as InterviewMode)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white">
              {MODES.map((m) => <option key={m} value={m}>{titleCase(m)}</option>)}
            </select>
            <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location or meeting link" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <div className="flex justify-end gap-2">
            <button onClick={() => setOpen(false)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm cursor-pointer">Cancel</button>
            <button onClick={schedule} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white cursor-pointer">Schedule</button>
          </div>
        </div>
      )}
      {interviews.length === 0 ? (
        <p className="text-sm text-slate-400">No interviews scheduled.</p>
      ) : (
        interviews.map((iv) => (
          <div key={iv.id} className="rounded-xl border border-slate-100 p-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-sm">{iv.title}</span>
              <span className="text-xs text-slate-500">{titleCase(iv.status)}</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">{new Date(iv.scheduledAt).toLocaleString()} Â· {iv.durationMins}m Â· {titleCase(iv.mode)}</div>
            {iv.location && <div className="text-xs text-slate-500">{iv.location}</div>}
            {canEdit && iv.status === "scheduled" && (
              <button onClick={async () => { await InterviewService.cancel(iv.id, caller); onChanged(); }} className="mt-2 text-xs text-rose-600 hover:underline cursor-pointer">Cancel</button>
            )}
          </div>
        ))
      )}
    </div>
  );
}

/* ------------------------------- Offer tab ------------------------------- */

function OfferTab({
  candidate,
  offers,
  canEdit,
  tenantId,
  caller,
  onChanged,
}: {
  candidate: Candidate;
  offers: Offer[];
  canEdit: boolean;
  tenantId: string;
  caller: { uid: string; email: string } | undefined;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [salary, setSalary] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [startDate, setStartDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const create = async () => {
    if (!salary || !startDate) return;
    await OfferService.create(
      tenantId,
      {
        candidateId: candidate.id,
        candidateName: `${candidate.firstName} ${candidate.lastName}`,
        candidateEmail: candidate.email,
        jobId: candidate.jobId,
        jobTitle: candidate.jobTitle,
        salary: Number(salary),
        currency,
        startDate,
        expiryDate: expiryDate || startDate,
        createdBy: caller?.uid || "",
      },
      caller
    );
    setOpen(false);
    setSalary("");
    onChanged();
  };

  return (
    <div className="space-y-4">
      {canEdit && !open && (
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer">
          <BadgeDollarSign size={16} /> Create Offer
        </button>
      )}
      {open && (
        <div className="rounded-xl border border-slate-200 p-3 space-y-2">
          <div className="flex gap-2">
            <input type="number" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="Annual salary" className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            <input value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <label className="block text-xs font-semibold text-slate-600">Start date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <label className="block text-xs font-semibold text-slate-600">Expiry date</label>
          <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <div className="flex justify-end gap-2">
            <button onClick={() => setOpen(false)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm cursor-pointer">Cancel</button>
            <button onClick={create} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white cursor-pointer">Create</button>
          </div>
        </div>
      )}
      {offers.length === 0 ? (
        <p className="text-sm text-slate-400">No offers yet.</p>
      ) : (
        offers.map((of) => (
          <div key={of.id} className="rounded-xl border border-slate-100 p-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-sm">{of.currency} {of.salary.toLocaleString()}</span>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${offerStatusClass(of.status)}`}>{titleCase(of.status)}</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">Start {of.startDate} Â· Expires {of.expiryDate}</div>
            {canEdit && (
              <div className="mt-2 flex flex-wrap gap-2">
                {(of.status === "draft" || of.status === "approved") && (
                  <button onClick={async () => { await OfferService.send(of.id, caller); onChanged(); }} className="text-xs font-medium text-indigo-600 hover:underline cursor-pointer">Send to candidate</button>
                )}
                {of.status === "sent" && (
                  <>
                    <button onClick={async () => { await OfferService.setOutcome(of.id, "accepted", caller); onChanged(); }} className="text-xs font-medium text-emerald-600 hover:underline cursor-pointer">Mark accepted</button>
                    <button onClick={async () => { await OfferService.setOutcome(of.id, "declined", caller); onChanged(); }} className="text-xs font-medium text-rose-600 hover:underline cursor-pointer">Mark declined</button>
                  </>
                )}
                <button onClick={async () => { await OfferService.remove(of.id); onChanged(); }} className="text-xs font-medium text-slate-500 hover:underline cursor-pointer inline-flex items-center gap-1"><Trash2 size={12} /> Remove</button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
```

## `frontend\src\features\recruitment\components\recruitmentUi.ts`

```ts
/**
 * Recruitment UI helpers: shared presentational utilities used across the
 * jobs, careers, pipeline and candidate-drawer views.
 *
 * Provides:
 *   - `fetchTenantMembers`: the one Firestore read in this module (approver /
 *     interviewer pickers).
 *   - Tailwind status â†’ badge-class maps for jobs, candidates and offers.
 *   - `titleCase` / `formatDate` display formatters.
 */
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type { UserProfile, JobStatus, CandidateStatus, OfferStatus } from "@hrms/middleware";

/** Fetch the tenant's members (used for approver / interviewer pickers). */
export async function fetchTenantMembers(tenantId: string): Promise<UserProfile[]> {
  const q = query(
    collection(db, "users"),
    where(`tenants.${tenantId}.status`, "in", ["active", "invited", "disabled"])
  );
  const snap = await getDocs(q);
  const list: UserProfile[] = [];
  snap.forEach((d) => list.push(d.data() as UserProfile));
  return list;
}

/** Convert a snake_case / lower-case token into Title Case (e.g. "full_time" â†’ "Full Time"). */
export function titleCase(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const JOB_STATUS_STYLES: Record<JobStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  pending_approval: "bg-amber-100 text-amber-700",
  approved: "bg-sky-100 text-sky-700",
  rejected: "bg-rose-100 text-rose-700",
  open: "bg-emerald-100 text-emerald-700",
  on_hold: "bg-orange-100 text-orange-700",
  closed: "bg-slate-200 text-slate-600",
};

/** Tailwind badge classes for a job status (falls back to neutral slate). */
export function jobStatusClass(status: JobStatus): string {
  return JOB_STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600";
}

const CANDIDATE_STATUS_STYLES: Record<CandidateStatus, string> = {
  active: "bg-blue-100 text-blue-700",
  hired: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
  withdrawn: "bg-slate-200 text-slate-600",
};

/** Tailwind badge classes for a candidate status (falls back to neutral slate). */
export function candidateStatusClass(status: CandidateStatus): string {
  return CANDIDATE_STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600";
}

const OFFER_STATUS_STYLES: Record<OfferStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  pending_approval: "bg-amber-100 text-amber-700",
  approved: "bg-sky-100 text-sky-700",
  sent: "bg-indigo-100 text-indigo-700",
  accepted: "bg-emerald-100 text-emerald-700",
  declined: "bg-rose-100 text-rose-700",
  rescinded: "bg-rose-100 text-rose-700",
  expired: "bg-slate-200 text-slate-600",
};

/** Tailwind badge classes for an offer status (falls back to neutral slate). */
export function offerStatusClass(status: OfferStatus): string {
  return OFFER_STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600";
}

/** Format an epoch-millis timestamp as a short US date (e.g. "Jun 18, 2026"); returns "â€”" if invalid. */
export function formatDate(ms: number): string {
  try {
    return new Date(ms).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "â€”";
  }
}
```

## `frontend\src\features\recruitment\services\jobService.ts`

```ts
import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  where,
  updateDoc,
  writeBatch,
  limit,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type { Job, JobStatus, ApprovalWorkflow } from "@hrms/middleware";
import { DEFAULT_PIPELINE_STAGES } from "@hrms/middleware";
import { AuditLogService } from "../../settings/services/auditLogService";
import {
  applyApprovalDecision,
  jobStatusAfterApproval,
  buildApprovalWorkflow,
} from "../utils/recruitment";

type CallerInfo = { uid: string; email: string };

function newId() {
  return `job_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
}

export type JobCreateInput = Omit<
  Job,
  "id" | "tenantId" | "createdAt" | "updatedAt" | "approval" | "pipelineStages" | "status"
> & {
  status?: JobStatus;
  pipelineStages?: string[];
  approvers?: Array<{ approverId: string; approverEmail: string; approverName?: string }>;
};

export const JobService = {
  async getJobs(tenantId: string): Promise<Job[]> {
    const q = query(collection(db, "jobs"), where("tenantId", "==", tenantId), limit(2000));
    const snap = await getDocs(q);
    const list: Job[] = [];
    snap.forEach((d) => list.push(d.data() as Job));
    return list.sort((a, b) => b.createdAt - a.createdAt);
  },

  async getJobById(jobId: string): Promise<Job | null> {
    const snap = await getDoc(doc(db, "jobs", jobId));
    return snap.exists() ? (snap.data() as Job) : null;
  },

  async createJob(tenantId: string, input: JobCreateInput, caller?: CallerInfo): Promise<Job> {
    const id = newId();
    const now = Date.now();
    const approval: ApprovalWorkflow = buildApprovalWorkflow(input.approvers ?? []);
    const { approvers, ...rest } = input;
    void approvers;

    const job: Job = {
      ...rest,
      id,
      tenantId,
      status: input.status ?? (approval.required ? "pending_approval" : "draft"),
      pipelineStages: input.pipelineStages ?? [...DEFAULT_PIPELINE_STAGES],
      approval,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db, "jobs", id), job);

    if (caller) {
      await AuditLogService.createAuditLog(tenantId, {
        userId: caller.uid,
        userEmail: caller.email,
        action: "create",
        resource: "job",
        resourceId: id,
        details: `Created job requisition "${job.title}"`,
      });
    }
    return job;
  },

  async updateJob(
    jobId: string,
    data: Partial<Omit<Job, "id" | "tenantId" | "createdAt" | "updatedAt">>,
    caller?: CallerInfo
  ): Promise<void> {
    const ref = doc(db, "jobs", jobId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const old = snap.data() as Job;

    await updateDoc(ref, { ...data, updatedAt: Date.now() });

    if (caller) {
      await AuditLogService.createAuditLog(old.tenantId, {
        userId: caller.uid,
        userEmail: caller.email,
        action: "update",
        resource: "job",
        resourceId: jobId,
        details: `Updated job "${old.title}"`,
      });
    }
  },

  /** Submit a draft requisition into the approval workflow (or straight to approved if none). */
  async submitForApproval(jobId: string, caller?: CallerInfo): Promise<void> {
    const ref = doc(db, "jobs", jobId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const job = snap.data() as Job;

    const required = job.approval?.required && job.approval.steps.length > 0;
    const status: JobStatus = required ? "pending_approval" : "approved";
    await updateDoc(ref, { status, updatedAt: Date.now() });

    if (caller) {
      await AuditLogService.createAuditLog(job.tenantId, {
        userId: caller.uid,
        userEmail: caller.email,
        action: "status_change",
        resource: "job",
        resourceId: jobId,
        details: `Submitted "${job.title}" for approval`,
      });
    }
  },

  /** Record an approve/reject decision for the current approval step. */
  async decideApproval(
    jobId: string,
    decision: "approved" | "rejected",
    caller: CallerInfo,
    comment?: string
  ): Promise<void> {
    const ref = doc(db, "jobs", jobId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const job = snap.data() as Job;

    const nextWorkflow = applyApprovalDecision(job.approval, decision, caller.uid, comment);
    const nextStatus = jobStatusAfterApproval(nextWorkflow.status);

    await updateDoc(ref, {
      approval: nextWorkflow,
      status: nextStatus,
      updatedAt: Date.now(),
    });

    await AuditLogService.createAuditLog(job.tenantId, {
      userId: caller.uid,
      userEmail: caller.email,
      action: decision === "approved" ? "approve" : "reject",
      resource: "job",
      resourceId: jobId,
      details: `${decision === "approved" ? "Approved" : "Rejected"} job "${job.title}"${comment ? `: ${comment}` : ""}`,
    });
  },

  /** Open + publish an approved requisition to the careers page. */
  async setPublished(jobId: string, isPublished: boolean, caller?: CallerInfo): Promise<void> {
    const ref = doc(db, "jobs", jobId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const job = snap.data() as Job;

    const status: JobStatus = isPublished ? "open" : job.status === "open" ? "approved" : job.status;
    await updateDoc(ref, { isPublished, status, updatedAt: Date.now() });

    if (caller) {
      await AuditLogService.createAuditLog(job.tenantId, {
        userId: caller.uid,
        userEmail: caller.email,
        action: "status_change",
        resource: "job",
        resourceId: jobId,
        details: `${isPublished ? "Published" : "Unpublished"} job "${job.title}"`,
      });
    }
  },

  async deleteJob(jobId: string, caller?: CallerInfo): Promise<void> {
    const snap = await getDoc(doc(db, "jobs", jobId));
    if (snap.exists() && caller) {
      const job = snap.data() as Job;
      await AuditLogService.createAuditLog(job.tenantId, {
        userId: caller.uid,
        userEmail: caller.email,
        action: "delete",
        resource: "job",
        resourceId: jobId,
        details: `Deleted job "${job.title}"`,
      });
    }
    await deleteDoc(doc(db, "jobs", jobId));
  },

  /* ----------------------------- Bulk actions ----------------------------- */

  async bulkUpdateStatus(jobIds: string[], status: JobStatus, caller?: CallerInfo): Promise<void> {
    if (jobIds.length === 0) return;
    const batch = writeBatch(db);
    const now = Date.now();
    for (const id of jobIds) {
      batch.update(doc(db, "jobs", id), { status, updatedAt: now });
    }
    await batch.commit();

    if (caller && jobIds[0]) {
      const first = await getDoc(doc(db, "jobs", jobIds[0]));
      const tenantId = first.exists() ? (first.data() as Job).tenantId : undefined;
      if (tenantId) {
        await AuditLogService.createAuditLog(tenantId, {
          userId: caller.uid,
          userEmail: caller.email,
          action: "status_change",
          resource: "job",
          resourceId: jobIds.join(","),
          details: `Bulk set status "${status}" on ${jobIds.length} job(s)`,
        });
      }
    }
  },

  async bulkDelete(jobIds: string[], caller?: CallerInfo): Promise<void> {
    if (jobIds.length === 0) return;
    let tenantId: string | undefined;
    if (jobIds[0]) {
      const first = await getDoc(doc(db, "jobs", jobIds[0]));
      tenantId = first.exists() ? (first.data() as Job).tenantId : undefined;
    }
    const batch = writeBatch(db);
    for (const id of jobIds) batch.delete(doc(db, "jobs", id));
    await batch.commit();

    if (caller && tenantId) {
      await AuditLogService.createAuditLog(tenantId, {
        userId: caller.uid,
        userEmail: caller.email,
        action: "delete",
        resource: "job",
        resourceId: jobIds.join(","),
        details: `Bulk deleted ${jobIds.length} job(s)`,
      });
    }
  },
};
```

## `frontend\src\features\recruitment\services\candidateService.ts`

```ts
/**
 * CandidateService â€” Firestore data-access layer for candidates and their
 * notes (collections: `candidates`, `candidateNotes`).
 *
 * Responsibilities:
 *   - CRUD + stage/status transitions for candidates (with audit logging).
 *   - RÃ©sumÃ© upload to Cloud Storage.
 *   - Candidate notes and tenant-scoped bulk operations.
 *
 * All reads/writes are tenant-scoped; mutations optionally accept a `caller`
 * so the action can be recorded via AuditLogService.
 */
import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  where,
  updateDoc,
  writeBatch,
  limit,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "../../../lib/firebase";
import type { Candidate, CandidateNote, CandidateStatus } from "@hrms/middleware";
import { AuditLogService } from "../../settings/services/auditLogService";
import { deriveStatusForStage } from "../utils/recruitment";

type CallerInfo = { uid: string; email: string };

/** Generate a collision-resistant client-side candidate document id. */
function newCandidateId() {
  return `cand_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
}
/** Generate a collision-resistant client-side note document id. */
function newNoteId() {
  return `note_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
}

/** Input for creating a candidate; server-managed fields are omitted, `appliedAt` is optional. */
export type CandidateCreateInput = Omit<
  Candidate,
  "id" | "tenantId" | "createdAt" | "updatedAt" | "appliedAt"
> & { appliedAt?: number };

/** Tenant-scoped data-access object for candidates and candidate notes. */
export const CandidateService = {
  /** List all candidates for a tenant, newest application first (bounded to 2000 docs). */
  async getCandidates(tenantId: string): Promise<Candidate[]> {
    // Scale guardrail: bound worst-case reads. For very large tenants, prefer
    // per-job loading (getCandidatesByJob) / server-side pagination.
    const q = query(collection(db, "candidates"), where("tenantId", "==", tenantId), limit(2000));
    const snap = await getDocs(q);
    const list: Candidate[] = [];
    snap.forEach((d) => list.push(d.data() as Candidate));
    return list.sort((a, b) => b.appliedAt - a.appliedAt);
  },

  /** Fetch candidates for a single job within a tenant, newest application first. */
  async getCandidatesByJob(tenantId: string, jobId: string): Promise<Candidate[]> {
    const q = query(
      collection(db, "candidates"),
      where("tenantId", "==", tenantId),
      where("jobId", "==", jobId)
    );
    const snap = await getDocs(q);
    const list: Candidate[] = [];
    snap.forEach((d) => list.push(d.data() as Candidate));
    return list.sort((a, b) => b.appliedAt - a.appliedAt);
  },

  async getCandidateById(id: string): Promise<Candidate | null> {
    const snap = await getDoc(doc(db, "candidates", id));
    return snap.exists() ? (snap.data() as Candidate) : null;
  },

  /** Upload a resume file to storage; returns the public URL + storage path. */
  async uploadResume(
    tenantId: string,
    file: File
  ): Promise<{ resumeUrl: string; resumePath: string }> {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const resumePath = `tenants/${tenantId}/resumes/${Date.now()}_${safeName}`;
    const storageRef = ref(storage, resumePath);
    await uploadBytes(storageRef, file, { contentType: file.type });
    const resumeUrl = await getDownloadURL(storageRef);
    return { resumeUrl, resumePath };
  },

  async createCandidate(
    tenantId: string,
    input: CandidateCreateInput,
    caller?: CallerInfo
  ): Promise<Candidate> {
    // Duplicate detection: one candidate per email per job within a tenant.
    const email = (input.email || "").trim().toLowerCase();
    if (email && input.jobId) {
      const dup = await getDocs(
        query(
          collection(db, "candidates"),
          where("tenantId", "==", tenantId),
          where("jobId", "==", input.jobId),
          where("email", "==", email)
        )
      );
      if (!dup.empty) {
        throw new Error("A candidate with this email already exists for this job.");
      }
    }

    const id = newCandidateId();
    const now = Date.now();
    const candidate: Candidate = {
      ...input,
      email,
      id,
      tenantId,
      appliedAt: input.appliedAt ?? now,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db, "candidates", id), candidate);

    if (caller) {
      await AuditLogService.createAuditLog(tenantId, {
        userId: caller.uid,
        userEmail: caller.email,
        action: "create",
        resource: "candidate",
        resourceId: id,
        details: `Added candidate "${candidate.firstName} ${candidate.lastName}" for "${candidate.jobTitle}"`,
      });
    }
    return candidate;
  },

  async updateCandidate(
    id: string,
    data: Partial<Omit<Candidate, "id" | "tenantId" | "createdAt" | "updatedAt">>,
    caller?: CallerInfo
  ): Promise<void> {
    const ref2 = doc(db, "candidates", id);
    const snap = await getDoc(ref2);
    if (!snap.exists()) return;
    const old = snap.data() as Candidate;
    await updateDoc(ref2, { ...data, updatedAt: Date.now() });

    if (caller) {
      await AuditLogService.createAuditLog(old.tenantId, {
        userId: caller.uid,
        userEmail: caller.email,
        action: "update",
        resource: "candidate",
        resourceId: id,
        details: `Updated candidate "${old.firstName} ${old.lastName}"`,
      });
    }
  },

  /** Move a candidate to a new pipeline stage; derives status for terminal stages. */
  async moveToStage(id: string, stage: string, caller?: CallerInfo): Promise<void> {
    const ref2 = doc(db, "candidates", id);
    const snap = await getDoc(ref2);
    if (!snap.exists()) return;
    const old = snap.data() as Candidate;
    const status: CandidateStatus = deriveStatusForStage(stage);

    await updateDoc(ref2, { stage, status, updatedAt: Date.now() });

    if (caller) {
      await AuditLogService.createAuditLog(old.tenantId, {
        userId: caller.uid,
        userEmail: caller.email,
        action: "stage_change",
        resource: "candidate",
        resourceId: id,
        details: `Moved "${old.firstName} ${old.lastName}" from "${old.stage}" to "${stage}"`,
      });
    }
  },

  async setStatus(id: string, status: CandidateStatus, caller?: CallerInfo): Promise<void> {
    const ref2 = doc(db, "candidates", id);
    const snap = await getDoc(ref2);
    if (!snap.exists()) return;
    const old = snap.data() as Candidate;
    await updateDoc(ref2, { status, updatedAt: Date.now() });

    if (caller) {
      await AuditLogService.createAuditLog(old.tenantId, {
        userId: caller.uid,
        userEmail: caller.email,
        action: "status_change",
        resource: "candidate",
        resourceId: id,
        details: `Set status "${status}" for "${old.firstName} ${old.lastName}"`,
      });
    }
  },

  async deleteCandidate(id: string, caller?: CallerInfo): Promise<void> {
    const snap = await getDoc(doc(db, "candidates", id));
    if (snap.exists()) {
      const c = snap.data() as Candidate;
      if (c.resumePath) {
        try {
          await deleteObject(ref(storage, c.resumePath));
        } catch {
          /* resume may already be gone; ignore */
        }
      }
      if (caller) {
        await AuditLogService.createAuditLog(c.tenantId, {
          userId: caller.uid,
          userEmail: caller.email,
          action: "delete",
          resource: "candidate",
          resourceId: id,
          details: `Deleted candidate "${c.firstName} ${c.lastName}"`,
        });
      }
    }
    await deleteDoc(doc(db, "candidates", id));
  },

  /* ------------------------------- Notes ------------------------------- */

  async getNotes(tenantId: string, candidateId: string): Promise<CandidateNote[]> {
    // tenantId + candidateId equality filters (no composite index needed); the
    // tenantId filter lets the read rule authorise the query. Sorted client-side.
    const q = query(
      collection(db, "candidateNotes"),
      where("tenantId", "==", tenantId),
      where("candidateId", "==", candidateId)
    );
    const snap = await getDocs(q);
    const list: CandidateNote[] = [];
    snap.forEach((d) => list.push(d.data() as CandidateNote));
    return list.sort((a, b) => b.createdAt - a.createdAt);
  },

  async addNote(
    tenantId: string,
    candidateId: string,
    body: string,
    author: { uid: string; name: string }
  ): Promise<CandidateNote> {
    const id = newNoteId();
    const note: CandidateNote = {
      id,
      tenantId,
      candidateId,
      authorId: author.uid,
      authorName: author.name,
      body,
      createdAt: Date.now(),
    };
    await setDoc(doc(db, "candidateNotes", id), note);
    return note;
  },

  async deleteNote(noteId: string): Promise<void> {
    await deleteDoc(doc(db, "candidateNotes", noteId));
  },

  /* ----------------------------- Bulk actions ----------------------------- */

  async bulkMoveToStage(ids: string[], stage: string): Promise<void> {
    if (ids.length === 0) return;
    const status = deriveStatusForStage(stage);
    const batch = writeBatch(db);
    const now = Date.now();
    for (const id of ids) {
      batch.update(doc(db, "candidates", id), { stage, status, updatedAt: now });
    }
    await batch.commit();
  },

  async bulkSetStatus(ids: string[], status: CandidateStatus): Promise<void> {
    if (ids.length === 0) return;
    const batch = writeBatch(db);
    const now = Date.now();
    for (const id of ids) {
      batch.update(doc(db, "candidates", id), { status, updatedAt: now });
    }
    await batch.commit();
  },

  async bulkDelete(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const batch = writeBatch(db);
    for (const id of ids) batch.delete(doc(db, "candidates", id));
    await batch.commit();
  },
};
```

## `frontend\src\features\recruitment\services\interviewService.ts`

```ts
import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type { Interview, InterviewStatus, InterviewOutcome } from "@hrms/middleware";
import { AuditLogService } from "../../settings/services/auditLogService";

type CallerInfo = { uid: string; email: string };

function newId() {
  return `intv_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
}

export type InterviewCreateInput = Omit<
  Interview,
  "id" | "tenantId" | "createdAt" | "updatedAt" | "status" | "outcome"
> & { status?: InterviewStatus; outcome?: InterviewOutcome };

export const InterviewService = {
  async getByCandidate(tenantId: string, candidateId: string): Promise<Interview[]> {
    const q = query(
      collection(db, "interviews"),
      where("tenantId", "==", tenantId),
      where("candidateId", "==", candidateId)
    );
    const snap = await getDocs(q);
    const list: Interview[] = [];
    snap.forEach((d) => list.push(d.data() as Interview));
    return list.sort((a, b) => a.scheduledAt - b.scheduledAt);
  },

  async getByTenant(tenantId: string): Promise<Interview[]> {
    const q = query(collection(db, "interviews"), where("tenantId", "==", tenantId));
    const snap = await getDocs(q);
    const list: Interview[] = [];
    snap.forEach((d) => list.push(d.data() as Interview));
    return list.sort((a, b) => a.scheduledAt - b.scheduledAt);
  },

  async schedule(
    tenantId: string,
    input: InterviewCreateInput,
    caller?: CallerInfo
  ): Promise<Interview> {
    const id = newId();
    const now = Date.now();
    const interview: Interview = {
      ...input,
      id,
      tenantId,
      status: input.status ?? "scheduled",
      outcome: input.outcome ?? "pending",
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db, "interviews", id), interview);

    if (caller) {
      await AuditLogService.createAuditLog(tenantId, {
        userId: caller.uid,
        userEmail: caller.email,
        action: "create",
        resource: "interview",
        resourceId: id,
        details: `Scheduled "${interview.title}" for ${interview.candidateName}`,
      });
    }
    return interview;
  },

  async update(
    id: string,
    data: Partial<Omit<Interview, "id" | "tenantId" | "createdAt" | "updatedAt">>,
    caller?: CallerInfo
  ): Promise<void> {
    const ref2 = doc(db, "interviews", id);
    const snap = await getDoc(ref2);
    if (!snap.exists()) return;
    const old = snap.data() as Interview;
    await updateDoc(ref2, { ...data, updatedAt: Date.now() });

    if (caller) {
      await AuditLogService.createAuditLog(old.tenantId, {
        userId: caller.uid,
        userEmail: caller.email,
        action: "update",
        resource: "interview",
        resourceId: id,
        details: `Updated interview "${old.title}" for ${old.candidateName}`,
      });
    }
  },

  async submitFeedback(
    id: string,
    outcome: InterviewOutcome,
    feedback: string,
    caller?: CallerInfo
  ): Promise<void> {
    await this.update(id, { outcome, feedback, status: "completed" }, caller);
  },

  async cancel(id: string, caller?: CallerInfo): Promise<void> {
    await this.update(id, { status: "cancelled" }, caller);
  },

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(db, "interviews", id));
  },
};
```

## `frontend\src\features\recruitment\services\offerService.ts`

```ts
import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type { Offer, OfferStatus, ApprovalWorkflow } from "@hrms/middleware";
import { AuditLogService } from "../../settings/services/auditLogService";
import { applyApprovalDecision, buildApprovalWorkflow } from "../utils/recruitment";

type CallerInfo = { uid: string; email: string };

function newId() {
  return `offer_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
}

export type OfferCreateInput = Omit<
  Offer,
  "id" | "tenantId" | "createdAt" | "updatedAt" | "status" | "approval"
> & {
  status?: OfferStatus;
  approvers?: Array<{ approverId: string; approverEmail: string; approverName?: string }>;
};

export const OfferService = {
  async getByCandidate(tenantId: string, candidateId: string): Promise<Offer[]> {
    const q = query(
      collection(db, "offers"),
      where("tenantId", "==", tenantId),
      where("candidateId", "==", candidateId)
    );
    const snap = await getDocs(q);
    const list: Offer[] = [];
    snap.forEach((d) => list.push(d.data() as Offer));
    return list.sort((a, b) => b.createdAt - a.createdAt);
  },

  async getByTenant(tenantId: string): Promise<Offer[]> {
    const q = query(collection(db, "offers"), where("tenantId", "==", tenantId));
    const snap = await getDocs(q);
    const list: Offer[] = [];
    snap.forEach((d) => list.push(d.data() as Offer));
    return list.sort((a, b) => b.createdAt - a.createdAt);
  },

  async create(tenantId: string, input: OfferCreateInput, caller?: CallerInfo): Promise<Offer> {
    const id = newId();
    const now = Date.now();
    const approval: ApprovalWorkflow = buildApprovalWorkflow(input.approvers ?? []);
    const { approvers, ...rest } = input;
    void approvers;

    const offer: Offer = {
      ...rest,
      id,
      tenantId,
      status: input.status ?? (approval.required ? "pending_approval" : "draft"),
      approval,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db, "offers", id), offer);

    if (caller) {
      await AuditLogService.createAuditLog(tenantId, {
        userId: caller.uid,
        userEmail: caller.email,
        action: "create",
        resource: "offer",
        resourceId: id,
        details: `Created offer for ${offer.candidateName} (${offer.jobTitle})`,
      });
    }
    return offer;
  },

  async update(
    id: string,
    data: Partial<Omit<Offer, "id" | "tenantId" | "createdAt" | "updatedAt">>,
    caller?: CallerInfo
  ): Promise<void> {
    const ref2 = doc(db, "offers", id);
    const snap = await getDoc(ref2);
    if (!snap.exists()) return;
    const old = snap.data() as Offer;
    await updateDoc(ref2, { ...data, updatedAt: Date.now() });

    if (caller) {
      await AuditLogService.createAuditLog(old.tenantId, {
        userId: caller.uid,
        userEmail: caller.email,
        action: "update",
        resource: "offer",
        resourceId: id,
        details: `Updated offer for ${old.candidateName}`,
      });
    }
  },

  async decideApproval(
    id: string,
    decision: "approved" | "rejected",
    caller: CallerInfo,
    comment?: string
  ): Promise<void> {
    const ref2 = doc(db, "offers", id);
    const snap = await getDoc(ref2);
    if (!snap.exists()) return;
    const offer = snap.data() as Offer;
    const nextWorkflow = applyApprovalDecision(offer.approval, decision, caller.uid, comment);
    const status: OfferStatus =
      nextWorkflow.status === "approved"
        ? "approved"
        : nextWorkflow.status === "rejected"
          ? "rescinded"
          : "pending_approval";

    await updateDoc(ref2, { approval: nextWorkflow, status, updatedAt: Date.now() });

    await AuditLogService.createAuditLog(offer.tenantId, {
      userId: caller.uid,
      userEmail: caller.email,
      action: decision === "approved" ? "approve" : "reject",
      resource: "offer",
      resourceId: id,
      details: `${decision === "approved" ? "Approved" : "Rejected"} offer for ${offer.candidateName}`,
    });
  },

  /** Transition the offer to `sent` (a backend trigger emails the candidate). */
  async send(id: string, caller?: CallerInfo): Promise<void> {
    const ref2 = doc(db, "offers", id);
    const snap = await getDoc(ref2);
    if (!snap.exists()) return;
    const offer = snap.data() as Offer;
    await updateDoc(ref2, { status: "sent", sentAt: Date.now(), updatedAt: Date.now() });

    if (caller) {
      await AuditLogService.createAuditLog(offer.tenantId, {
        userId: caller.uid,
        userEmail: caller.email,
        action: "status_change",
        resource: "offer",
        resourceId: id,
        details: `Sent offer to ${offer.candidateName}`,
      });
    }
  },

  async setOutcome(id: string, status: "accepted" | "declined", caller?: CallerInfo): Promise<void> {
    const ref2 = doc(db, "offers", id);
    const snap = await getDoc(ref2);
    if (!snap.exists()) return;
    const offer = snap.data() as Offer;
    await updateDoc(ref2, { status, respondedAt: Date.now(), updatedAt: Date.now() });

    if (caller) {
      await AuditLogService.createAuditLog(offer.tenantId, {
        userId: caller.uid,
        userEmail: caller.email,
        action: "status_change",
        resource: "offer",
        resourceId: id,
        details: `Offer ${status} by ${offer.candidateName}`,
      });
    }
  },

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(db, "offers", id));
  },
};
```

## `frontend\src\features\recruitment\services\careersService.ts`

```ts
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { httpsCallable } from "firebase/functions";
import { db, storage, functions } from "../../../lib/firebase";
import type { Job } from "@hrms/middleware";

export interface ApplicationInput {
  tenantId: string;
  jobId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  linkedinUrl?: string;
  coverLetter?: string;
  resumeUrl?: string;
  resumePath?: string;
}

export const CareersService = {
  /** List published & open jobs for a tenant (readable by unauthenticated visitors). */
  async listPublishedJobs(tenantId: string): Promise<Job[]> {
    const q = query(
      collection(db, "jobs"),
      where("tenantId", "==", tenantId),
      where("isPublished", "==", true),
      where("status", "==", "open")
    );
    const snap = await getDocs(q);
    const list: Job[] = [];
    snap.forEach((d) => list.push(d.data() as Job));
    return list.sort((a, b) => b.createdAt - a.createdAt);
  },

  async getPublishedJob(jobId: string): Promise<Job | null> {
    const snap = await getDoc(doc(db, "jobs", jobId));
    if (!snap.exists()) return null;
    const job = snap.data() as Job;
    if (!job.isPublished || job.status !== "open") return null;
    return job;
  },

  /** Upload an applicant's resume (allowed for unauthenticated visitors by storage rules). */
  async uploadResume(
    tenantId: string,
    file: File
  ): Promise<{ resumeUrl: string; resumePath: string }> {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const resumePath = `tenants/${tenantId}/resumes/${Date.now()}_${safeName}`;
    const storageRef = ref(storage, resumePath);
    await uploadBytes(storageRef, file, { contentType: file.type });
    const resumeUrl = await getDownloadURL(storageRef);
    return { resumeUrl, resumePath };
  },

  /**
   * Submit an application via the public `submitApplication` Cloud Function.
   * The function validates the job is published and creates the candidate
   * server-side (bypassing the authenticated-only candidates rules).
   */
  async submitApplication(input: ApplicationInput): Promise<{ success: boolean; candidateId: string }> {
    const fn = httpsCallable<ApplicationInput, { success: boolean; candidateId: string }>(
      functions,
      "submitApplication"
    );
    const res = await fn(input);
    return res.data;
  },
};
```

## `frontend\src\features\recruitment\utils\recruitment.ts`

```ts
/**
 * Recruitment domain logic â€” pure, side-effect-free helpers shared by the
 * jobs, careers and pipeline UIs and their services.
 *
 * Contains three groups of functions:
 *   1. Search & filter helpers for jobs and candidates.
 *   2. Pipeline stage transition logic (next/prev/validity + status derivation).
 *   3. Multi-step approval workflow construction and decision application.
 *
 * Every function here is deterministic and free of I/O so it can be unit tested
 * in isolation (see recruitment.test.ts).
 */
import type {
  Job,
  JobStatus,
  Candidate,
  CandidateStatus,
  ApprovalWorkflow,
  ApprovalStep,
} from "@hrms/middleware";

/* ------------------------------------------------------------------ */
/*  Search & filter helpers (pure)                                     */
/* ------------------------------------------------------------------ */

/** Optional facets used to narrow a list of jobs ("all" / undefined = no filter). */
export interface JobFilters {
  search?: string;
  status?: JobStatus | "all";
  departmentId?: string | "all";
  employmentType?: string | "all";
  workMode?: string | "all";
}

/** Case-insensitive search of a job's title, location and description. */
export function searchJobs(jobs: Job[], term: string): Job[] {
  const q = term.trim().toLowerCase();
  if (!q) return jobs;
  return jobs.filter((j) =>
    [j.title, j.location, j.description, j.requirements]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(q))
  );
}

/** Apply the full set of job filters (search + facets). */
export function filterJobs(jobs: Job[], filters: JobFilters): Job[] {
  let result = jobs;
  if (filters.search) result = searchJobs(result, filters.search);
  if (filters.status && filters.status !== "all") {
    result = result.filter((j) => j.status === filters.status);
  }
  if (filters.departmentId && filters.departmentId !== "all") {
    result = result.filter((j) => j.departmentId === filters.departmentId);
  }
  if (filters.employmentType && filters.employmentType !== "all") {
    result = result.filter((j) => j.employmentType === filters.employmentType);
  }
  if (filters.workMode && filters.workMode !== "all") {
    result = result.filter((j) => j.workMode === filters.workMode);
  }
  return result;
}

/** Optional facets used to narrow a list of candidates ("all" / undefined = no filter). */
export interface CandidateFilters {
  search?: string;
  status?: CandidateStatus | "all";
  stage?: string | "all";
  jobId?: string | "all";
  source?: string | "all";
  minRating?: number;
}

/** Case-insensitive search across a candidate's name and email. */
export function searchCandidates(candidates: Candidate[], term: string): Candidate[] {
  const q = term.trim().toLowerCase();
  if (!q) return candidates;
  return candidates.filter((c) =>
    [`${c.firstName} ${c.lastName}`, c.email, c.jobTitle]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(q))
  );
}

/** Apply the full set of candidate filters (search + facets). */
export function filterCandidates(candidates: Candidate[], filters: CandidateFilters): Candidate[] {
  let result = candidates;
  if (filters.search) result = searchCandidates(result, filters.search);
  if (filters.status && filters.status !== "all") {
    result = result.filter((c) => c.status === filters.status);
  }
  if (filters.stage && filters.stage !== "all") {
    result = result.filter((c) => c.stage === filters.stage);
  }
  if (filters.jobId && filters.jobId !== "all") {
    result = result.filter((c) => c.jobId === filters.jobId);
  }
  if (filters.source && filters.source !== "all") {
    result = result.filter((c) => c.source === filters.source);
  }
  if (typeof filters.minRating === "number") {
    result = result.filter((c) => (c.rating ?? 0) >= filters.minRating!);
  }
  return result;
}

/** Group candidates by their current pipeline stage. */
export function groupCandidatesByStage(
  candidates: Candidate[],
  stages: string[]
): Record<string, Candidate[]> {
  const grouped: Record<string, Candidate[]> = {};
  for (const stage of stages) grouped[stage] = [];
  for (const c of candidates) {
    if (!grouped[c.stage]) grouped[c.stage] = [];
    grouped[c.stage]!.push(c);
  }
  return grouped;
}

/* ------------------------------------------------------------------ */
/*  Pipeline stage transition logic (pure)                             */
/* ------------------------------------------------------------------ */

/** Returns the stage after `current`, or null if `current` is last/unknown. */
export function getNextStage(stages: string[], current: string): string | null {
  const idx = stages.indexOf(current);
  if (idx === -1 || idx >= stages.length - 1) return null;
  return stages[idx + 1] ?? null;
}

/** Returns the stage before `current`, or null if `current` is first/unknown. */
export function getPrevStage(stages: string[], current: string): string | null {
  const idx = stages.indexOf(current);
  if (idx <= 0) return null;
  return stages[idx - 1] ?? null;
}

/** A move is valid only when the target stage exists in the pipeline and differs from the current one. */
export function canMoveToStage(stages: string[], current: string, target: string): boolean {
  if (current === target) return false;
  return stages.includes(target);
}

/**
 * Derive the candidate status implied by moving to a given stage.
 * "Hired"/"Rejected" terminal stages flip the candidate status accordingly.
 */
export function deriveStatusForStage(stage: string): CandidateStatus {
  const normalized = stage.toLowerCase();
  if (normalized === "hired") return "hired";
  if (normalized === "rejected") return "rejected";
  return "active";
}

/* ------------------------------------------------------------------ */
/*  Approval workflow logic (pure)                                     */
/* ------------------------------------------------------------------ */

/** Build a fresh approval workflow from an ordered list of approvers. */
export function buildApprovalWorkflow(
  approvers: Array<{ approverId: string; approverEmail: string; approverName?: string }>
): ApprovalWorkflow {
  const steps: ApprovalStep[] = approvers.map((a, i) => {
    const step: ApprovalStep = {
      approverId: a.approverId,
      approverEmail: a.approverEmail,
      order: i,
      status: "pending",
    };
    if (a.approverName !== undefined) step.approverName = a.approverName;
    return step;
  });
  return {
    required: steps.length > 0,
    steps,
    currentStep: 0,
    status: steps.length > 0 ? "pending" : "approved",
  };
}

/**
 * Apply a decision to the current step of a workflow, returning a NEW workflow
 * (does not mutate the input).
 * - An approval advances to the next step; approving the last step approves the workflow.
 * - A rejection immediately rejects the whole workflow.
 */
export function applyApprovalDecision(
  workflow: ApprovalWorkflow,
  decision: "approved" | "rejected",
  approverId: string,
  comment?: string,
  now: number = Date.now()
): ApprovalWorkflow {
  if (!workflow.required || workflow.status !== "pending") return workflow;

  const steps = workflow.steps.map((s) => ({ ...s }));
  const step = steps[workflow.currentStep];
  if (!step) return workflow;

  // Only the designated approver for the current step may decide it.
  if (step.approverId !== approverId) return workflow;

  step.status = decision;
  if (comment !== undefined) step.comment = comment;
  step.decidedAt = now;

  if (decision === "rejected") {
    return { ...workflow, steps, status: "rejected" };
  }

  const isLast = workflow.currentStep >= steps.length - 1;
  return {
    ...workflow,
    steps,
    currentStep: isLast ? workflow.currentStep : workflow.currentStep + 1,
    status: isLast ? "approved" : "pending",
  };
}

/** Is the given user the approver responsible for the current pending step? */
export function isCurrentApprover(workflow: ApprovalWorkflow, userId: string): boolean {
  if (!workflow.required || workflow.status !== "pending") return false;
  const step = workflow.steps[workflow.currentStep];
  return !!step && step.approverId === userId && step.status === "pending";
}

/**
 * The approval step currently awaiting a decision (i.e. whose approver the
 * requisition is "pending approval from"), or null when nothing is pending.
 */
export function getCurrentApprover(workflow?: ApprovalWorkflow): ApprovalStep | null {
  if (!workflow || !workflow.required || workflow.status !== "pending") return null;
  const step = workflow.steps[workflow.currentStep];
  return step && step.status === "pending" ? step : null;
}

/** The job status that should follow an approval workflow result. */
export function jobStatusAfterApproval(result: ApprovalWorkflow["status"]): JobStatus {
  if (result === "approved") return "approved";
  if (result === "rejected") return "rejected";
  return "pending_approval";
}
```

## `frontend\src\features\recruitment\utils\recruitment.test.ts`

```ts
/**
 * Unit tests for the pure recruitment helpers in ./recruitment.
 *
 * Covers search/filter, pipeline stage transitions and the multi-step approval
 * workflow engine. Local `makeJob` / `makeCandidate` factories build valid
 * fixtures so individual tests only override the fields under test.
 */
import { describe, it, expect } from "vitest";
import {
  searchJobs,
  filterJobs,
  searchCandidates,
  filterCandidates,
  groupCandidatesByStage,
  getNextStage,
  getPrevStage,
  canMoveToStage,
  deriveStatusForStage,
  buildApprovalWorkflow,
  applyApprovalDecision,
  isCurrentApprover,
  jobStatusAfterApproval,
} from "./recruitment";
import type { Job, Candidate } from "@hrms/middleware";

/* ----------------------------- fixtures ----------------------------- */

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: "job_1",
    tenantId: "t1",
    title: "Senior Engineer",
    departmentId: "dept_eng",
    location: "Remote",
    workMode: "remote",
    employmentType: "full_time",
    description: "Build great things",
    responsibilities: "Code",
    requirements: "5 years React",
    currency: "USD",
    openings: 1,
    status: "open",
    isPublished: true,
    pipelineStages: ["Applied", "Screening", "Interview", "Offer", "Hired", "Rejected"],
    approval: { required: false, steps: [], currentStep: 0, status: "approved" },
    createdBy: "u1",
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

function makeCandidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    id: "cand_1",
    tenantId: "t1",
    jobId: "job_1",
    jobTitle: "Senior Engineer",
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    source: "careers",
    stage: "Applied",
    status: "active",
    appliedAt: 1000,
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

const STAGES = ["Applied", "Screening", "Interview", "Offer", "Hired", "Rejected"];

/* ----------------------------- search/filter ----------------------------- */

describe("searchJobs", () => {
  const jobs = [
    makeJob({ id: "a", title: "Backend Engineer", location: "Berlin" }),
    makeJob({ id: "b", title: "Product Designer", location: "Remote" }),
  ];
  it("matches by title case-insensitively", () => {
    expect(searchJobs(jobs, "backend").map((j) => j.id)).toEqual(["a"]);
  });
  it("matches by location", () => {
    expect(searchJobs(jobs, "remote").map((j) => j.id)).toEqual(["b"]);
  });
  it("returns all on empty query", () => {
    expect(searchJobs(jobs, "  ")).toHaveLength(2);
  });
});

describe("filterJobs", () => {
  const jobs = [
    makeJob({ id: "a", status: "open", departmentId: "d1", employmentType: "full_time" }),
    makeJob({ id: "b", status: "draft", departmentId: "d2", employmentType: "contract" }),
    makeJob({ id: "c", status: "open", departmentId: "d2", employmentType: "full_time" }),
  ];
  it("filters by status", () => {
    expect(filterJobs(jobs, { status: "open" }).map((j) => j.id)).toEqual(["a", "c"]);
  });
  it("filters by department", () => {
    expect(filterJobs(jobs, { departmentId: "d2" }).map((j) => j.id)).toEqual(["b", "c"]);
  });
  it("combines facets", () => {
    expect(filterJobs(jobs, { status: "open", departmentId: "d2" }).map((j) => j.id)).toEqual(["c"]);
  });
  it("treats 'all' as no filter", () => {
    expect(filterJobs(jobs, { status: "all", departmentId: "all" })).toHaveLength(3);
  });
});

describe("searchCandidates / filterCandidates", () => {
  const cands = [
    makeCandidate({ id: "1", firstName: "Ada", lastName: "Lovelace", stage: "Applied", status: "active", rating: 4 }),
    makeCandidate({ id: "2", firstName: "Alan", lastName: "Turing", email: "alan@x.com", stage: "Interview", status: "active", rating: 5 }),
    makeCandidate({ id: "3", firstName: "Grace", lastName: "Hopper", stage: "Hired", status: "hired", rating: 2 }),
  ];
  it("searches by full name", () => {
    expect(searchCandidates(cands, "turing").map((c) => c.id)).toEqual(["2"]);
  });
  it("filters by stage", () => {
    expect(filterCandidates(cands, { stage: "Interview" }).map((c) => c.id)).toEqual(["2"]);
  });
  it("filters by status", () => {
    expect(filterCandidates(cands, { status: "hired" }).map((c) => c.id)).toEqual(["3"]);
  });
  it("filters by minimum rating", () => {
    expect(filterCandidates(cands, { minRating: 4 }).map((c) => c.id)).toEqual(["1", "2"]);
  });
});

describe("groupCandidatesByStage", () => {
  it("buckets candidates by stage and includes empty stages", () => {
    const cands = [
      makeCandidate({ id: "1", stage: "Applied" }),
      makeCandidate({ id: "2", stage: "Applied" }),
      makeCandidate({ id: "3", stage: "Interview" }),
    ];
    const grouped = groupCandidatesByStage(cands, STAGES);
    expect(grouped.Applied).toHaveLength(2);
    expect(grouped.Interview).toHaveLength(1);
    expect(grouped.Offer).toEqual([]);
  });
});

/* ----------------------------- stage transitions ----------------------------- */

describe("stage transition helpers", () => {
  it("getNextStage returns the following stage", () => {
    expect(getNextStage(STAGES, "Applied")).toBe("Screening");
  });
  it("getNextStage returns null at the end", () => {
    expect(getNextStage(STAGES, "Rejected")).toBeNull();
  });
  it("getNextStage returns null for unknown stage", () => {
    expect(getNextStage(STAGES, "Nope")).toBeNull();
  });
  it("getPrevStage returns the preceding stage", () => {
    expect(getPrevStage(STAGES, "Interview")).toBe("Screening");
  });
  it("getPrevStage returns null at the start", () => {
    expect(getPrevStage(STAGES, "Applied")).toBeNull();
  });
  it("canMoveToStage rejects same stage and unknown targets", () => {
    expect(canMoveToStage(STAGES, "Applied", "Applied")).toBe(false);
    expect(canMoveToStage(STAGES, "Applied", "Mars")).toBe(false);
    expect(canMoveToStage(STAGES, "Applied", "Offer")).toBe(true);
  });
  it("deriveStatusForStage flips terminal stages", () => {
    expect(deriveStatusForStage("Hired")).toBe("hired");
    expect(deriveStatusForStage("Rejected")).toBe("rejected");
    expect(deriveStatusForStage("Interview")).toBe("active");
  });
});

/* ----------------------------- approval workflow ----------------------------- */

describe("buildApprovalWorkflow", () => {
  it("creates a pending workflow from approvers", () => {
    const wf = buildApprovalWorkflow([
      { approverId: "u1", approverEmail: "u1@x.com" },
      { approverId: "u2", approverEmail: "u2@x.com", approverName: "Two" },
    ]);
    expect(wf.required).toBe(true);
    expect(wf.steps).toHaveLength(2);
    expect(wf.currentStep).toBe(0);
    expect(wf.status).toBe("pending");
    expect(wf.steps[0]!.order).toBe(0);
  });
  it("is auto-approved with no approvers", () => {
    const wf = buildApprovalWorkflow([]);
    expect(wf.required).toBe(false);
    expect(wf.status).toBe("approved");
  });
});

describe("applyApprovalDecision", () => {
  const base = buildApprovalWorkflow([
    { approverId: "u1", approverEmail: "u1@x.com" },
    { approverId: "u2", approverEmail: "u2@x.com" },
  ]);

  it("advances to the next step on approval", () => {
    const next = applyApprovalDecision(base, "approved", "u1", undefined, 5000);
    expect(next.currentStep).toBe(1);
    expect(next.status).toBe("pending");
    expect(next.steps[0]!.status).toBe("approved");
    expect(next.steps[0]!.decidedAt).toBe(5000);
  });

  it("approving the final step approves the workflow", () => {
    const afterFirst = applyApprovalDecision(base, "approved", "u1");
    const afterSecond = applyApprovalDecision(afterFirst, "approved", "u2");
    expect(afterSecond.status).toBe("approved");
  });

  it("rejection immediately rejects the workflow", () => {
    const next = applyApprovalDecision(base, "rejected", "u1", "not now");
    expect(next.status).toBe("rejected");
    expect(next.steps[0]!.comment).toBe("not now");
  });

  it("ignores decisions from the wrong approver", () => {
    const next = applyApprovalDecision(base, "approved", "intruder");
    expect(next).toBe(base); // unchanged
  });

  it("does not mutate the input workflow", () => {
    const snapshot = JSON.stringify(base);
    applyApprovalDecision(base, "approved", "u1");
    expect(JSON.stringify(base)).toBe(snapshot);
  });
});

describe("isCurrentApprover", () => {
  const wf = buildApprovalWorkflow([
    { approverId: "u1", approverEmail: "u1@x.com" },
    { approverId: "u2", approverEmail: "u2@x.com" },
  ]);
  it("is true for the current step's approver", () => {
    expect(isCurrentApprover(wf, "u1")).toBe(true);
  });
  it("is false for a later approver", () => {
    expect(isCurrentApprover(wf, "u2")).toBe(false);
  });
  it("is false once resolved", () => {
    const approved = applyApprovalDecision(applyApprovalDecision(wf, "approved", "u1"), "approved", "u2");
    expect(isCurrentApprover(approved, "u2")).toBe(false);
  });
});

describe("jobStatusAfterApproval", () => {
  it("maps workflow status to job status", () => {
    expect(jobStatusAfterApproval("approved")).toBe("approved");
    expect(jobStatusAfterApproval("rejected")).toBe("rejected");
    expect(jobStatusAfterApproval("pending")).toBe("pending_approval");
  });
});
```

## `frontend\src\features\leave\pages\LeaveManagementPage.tsx`

```tsx
/**
 * LeaveManagementPage
 * -------------------
 * Top-level page for the Leave module. Renders a tabbed interface for leave
 * requests, approvals (an inbox of items awaiting the current user), leave
 * types, accrual policies, holiday calendars, and balances.
 *
 * Data is loaded per active tenant and scoped by the caller's permissions and
 * data-access level: approvers/managers see all tenant data, while regular
 * employees only see their own requests/balances. All mutations route through
 * the service layer (which also writes audit logs); balance settlement is
 * performed server-side by Cloud Functions.
 *
 * This file also contains several module-private presentational sub-components
 * (tables, tabs, modal, shared widgets) used only by this page.
 */
import { getFriendlyErrorMessage } from "../../../lib/errors";
import { useState, useEffect, useCallback, useMemo } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useAuth } from "../../auth/context/AuthContext";
import { useHasPermission } from "../../rbac/hooks/usePermissions";
import { EmployeeService } from "../../employees/services/employeeService";
import {
  LeaveTypeService,
  LeavePolicyService,
  HolidayService,
  LeaveBalanceService,
  LeaveRequestService,
  type LeaveRequestInput,
} from "../services/leaveService";
import {
  workingDaysBetween,
  isCurrentApprover,
  availableBalance,
} from "../utils/leave";
import { Skeleton } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/ErrorState";
import { EmptyState } from "../../../components/ui/EmptyState";
import type {
  LeaveType,
  LeavePolicy,
  LeaveRequest,
  LeaveBalance,
  HolidayCalendar,
  Holiday,
  Employee,
  UserProfile,
  AccrualMethod,
} from "@hrms/middleware";
import {
  CalendarDays, Plus, X, Check, Ban, Trash2, Inbox, ListChecks, Settings2, CalendarRange, Wallet, RefreshCw,
} from "lucide-react";

const TABS = ["requests", "approvals", "types", "policies", "holidays", "balances"] as const;
type Tab = (typeof TABS)[number];
const TAB_LABELS: Record<Tab, string> = {
  requests: "Requests", approvals: "Approvals", types: "Leave Types",
  policies: "Policies", holidays: "Holidays", balances: "Balances",
};
const TAB_ICONS: Record<Tab, React.ReactNode> = {
  requests: <ListChecks size={15} />, approvals: <Inbox size={15} />, types: <Settings2 size={15} />,
  policies: <Settings2 size={15} />, holidays: <CalendarRange size={15} />, balances: <Wallet size={15} />,
};
const ACCRUAL_METHODS: AccrualMethod[] = ["annual_lump", "monthly", "per_pay_period", "none"];
const input = "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const tc = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const today = () => new Date().toISOString().slice(0, 10);

/**
 * Main Leave Management page component. Manages all tab state, loads tenant
 * leave data (scoped by permissions/data-access), and wires approval/cancel
 * actions back through the service layer with a reload-on-success pattern.
 */
export function LeaveManagementPage() {
  const { profile, user, dataAccessLevel } = useAuth();
  const tenantId = profile?.activeTenantId || "";
  const hasPerm = useHasPermission();
  const canApprove = hasPerm("leave.approve");
  const canManage = hasPerm("leave.update");
  const canCreate = hasPerm("leave.create");
  const caller = user ? { uid: user.uid, email: user.email || "" } : undefined;

  const [tab, setTab] = useState<Tab>("requests");
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [calendars, setCalendars] = useState<HolidayCalendar[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [callerEmployee, setCallerEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      let resolvedCallerEmp: Employee | null = null;
      if (user?.uid) {
        resolvedCallerEmp = await EmployeeService.getCallerEmployee(tenantId, user.uid);
      }
      setCallerEmployee(resolvedCallerEmp);

      const isAuditorOrAdmin = canApprove || canManage;

      const [t, p, c, r, b, emps, memSnap] = await Promise.all([
        LeaveTypeService.list(tenantId),
        LeavePolicyService.list(tenantId),
        HolidayService.list(tenantId),
        isAuditorOrAdmin
          ? LeaveRequestService.list(tenantId)
          : (resolvedCallerEmp ? LeaveRequestService.listForEmployee(tenantId, resolvedCallerEmp.id) : Promise.resolve([])),
        isAuditorOrAdmin
          ? LeaveBalanceService.list(tenantId)
          : (resolvedCallerEmp ? LeaveBalanceService.listForEmployee(tenantId, resolvedCallerEmp.id) : Promise.resolve([])),
        EmployeeService.getEmployees(tenantId, dataAccessLevel, resolvedCallerEmp),
        getDocs(query(collection(db, "users"), where(`tenants.${tenantId}.status`, "in", ["active", "invited"]))),
      ]);
      setTypes(t); setPolicies(p); setCalendars(c); setRequests(r); setBalances(b); setEmployees(emps);
      const mem: UserProfile[] = [];
      memSnap.forEach((d) => mem.push(d.data() as UserProfile));
      setMembers(mem);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, "Failed to load leave data."));
    } finally {
      setLoading(false);
    }
  }, [tenantId, user, dataAccessLevel, canApprove, canManage]);

  useEffect(() => { load(); }, [load]);

  const allowedEmployeeIds = useMemo(() => new Set(employees.map((e) => e.id)), [employees]);

  const visibleRequests = useMemo(() => {
    return requests.filter((req) => allowedEmployeeIds.has(req.employeeId));
  }, [requests, allowedEmployeeIds]);

  const visibleBalances = useMemo(() => {
    return balances.filter((bal) => allowedEmployeeIds.has(bal.employeeId));
  }, [balances, allowedEmployeeIds]);

  const inbox = useMemo(
    () => visibleRequests.filter((r) => user && isCurrentApprover(r.approval, user.uid)),
    [visibleRequests, user]
  );

  const act = async (fn: () => Promise<void>) => {
    try { await fn(); await load(); }
    catch (err) { setError(getFriendlyErrorMessage(err, "Action failed.")); }
  };

  const runAccrual = async () => {
    const applied = await LeaveBalanceService.runAccrualForTenant(tenantId, policies, Date.now(), caller);
    setError(null);
    alert(`Accrual run complete. ${applied} balance(s) updated.`);
    await load();
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-64 w-full" /></div>;
  if (error && requests.length === 0 && types.length === 0) return <ErrorState description={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><CalendarDays className="h-6 w-6 text-blue-600" /> Leave Management</h1>
          <p className="text-sm text-slate-500 mt-1">Requests, approvals, policies, holidays and balances.</p>
        </div>
        {canCreate && (
          <button onClick={() => setRequestOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer">
            <Plus size={18} /> New Request
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-3.5 py-2.5 text-sm font-semibold border-b-2 -mb-px cursor-pointer inline-flex items-center gap-1.5 ${tab === t ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
            {TAB_ICONS[t]}{TAB_LABELS[t]}{t === "approvals" && inbox.length > 0 && <span className="ml-1 rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">{inbox.length}</span>}
          </button>
        ))}
      </div>

      {error && <div className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {(tab === "requests" || tab === "approvals") && (
        <RequestsTable
          requests={tab === "approvals" ? inbox : visibleRequests}
          types={types}
          user={user?.uid || ""}
          canApprove={canApprove}
          caller={caller}
          emptyApprovals={tab === "approvals"}
          onApprove={(id) => act(() => LeaveRequestService.decide(id, "approved", caller!))}
          onReject={(id) => act(() => LeaveRequestService.decide(id, "rejected", caller!))}
          onCancel={(id) => act(() => LeaveRequestService.cancel(id, caller))}
        />
      )}

      {tab === "types" && <TypesTab tenantId={tenantId} types={types} canManage={canManage} caller={caller} reload={load} setError={setError} />}
      {tab === "policies" && <PoliciesTab tenantId={tenantId} policies={policies} types={types} canManage={canManage} caller={caller} reload={load} setError={setError} />}
      {tab === "holidays" && <HolidaysTab tenantId={tenantId} calendars={calendars} canManage={canManage} caller={caller} reload={load} setError={setError} />}
      {tab === "balances" && <BalancesTab balances={visibleBalances} types={types} employees={employees} canManage={canManage} onRunAccrual={runAccrual} />}

      {requestOpen && (
        <RequestModal
          tenantId={tenantId} types={types} employees={employees} members={members} calendars={calendars} caller={caller}
          onClose={() => setRequestOpen(false)}
          onCreated={async () => { setRequestOpen(false); await load(); }}
          setError={setError}
        />
      )}
    </div>
  );
}

type Caller = { uid: string; email: string } | undefined;
type SetErr = (s: string | null) => void;

function StatusBadge({ status }: { status: string }) {
  const cls = status === "approved" ? "bg-emerald-100 text-emerald-700" : status === "rejected" ? "bg-rose-100 text-rose-700" : status === "cancelled" ? "bg-slate-200 text-slate-600" : "bg-amber-100 text-amber-700";
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>{tc(status)}</span>;
}

/* ------------------------------ Requests table ------------------------------ */

function RequestsTable({
  requests, user, canApprove, caller, emptyApprovals, onApprove, onReject, onCancel,
}: {
  requests: LeaveRequest[]; types: LeaveType[]; user: string; canApprove: boolean; caller: Caller;
  emptyApprovals: boolean; onApprove: (id: string) => void; onReject: (id: string) => void; onCancel: (id: string) => void;
}) {
  if (requests.length === 0) {
    return <EmptyState title={emptyApprovals ? "Nothing to approve" : "No leave requests"} description={emptyApprovals ? "Requests awaiting your approval will appear here." : "Submit a leave request to get started."} icon={<CalendarDays className="h-6 w-6" />} />;
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-slate-500">
            <th className="px-4 py-3">Employee</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Dates</th>
            <th className="px-4 py-3">Days</th><th className="px-4 py-3">Approvals</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => {
            const amApprover = canApprove && isCurrentApprover(r.approval, user);
            const step = r.approval.steps[r.approval.currentStep];
            return (
              <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                <td className="px-4 py-3 font-semibold text-slate-900">{r.employeeName}</td>
                <td className="px-4 py-3 text-slate-600">{r.leaveTypeName}</td>
                <td className="px-4 py-3 text-slate-600">{r.startDate} â†’ {r.endDate}</td>
                <td className="px-4 py-3 text-slate-600">{r.days}{r.halfDay ? " (Â½)" : ""}</td>
                <td className="px-4 py-3 text-slate-500">
                  {r.approval.required ? (
                    <span>{r.approval.steps.filter((s) => s.status === "approved").length}/{r.approval.steps.length}{step && r.status === "pending" ? ` Â· awaiting ${step.approverName || step.approverEmail}` : ""}</span>
                  ) : <span className="text-slate-400">No approval</span>}
                </td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    {amApprover && (
                      <>
                        <button title="Approve" onClick={() => onApprove(r.id)} className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 cursor-pointer"><Check size={16} /></button>
                        <button title="Reject" onClick={() => onReject(r.id)} className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 cursor-pointer"><Ban size={16} /></button>
                      </>
                    )}
                    {(r.status === "pending" || r.status === "approved") && (r.createdBy === caller?.uid || canApprove) && (
                      <button title="Cancel" onClick={() => onCancel(r.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 cursor-pointer"><X size={16} /></button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------ Request modal ------------------------------ */

function RequestModal({
  tenantId, types, employees, members, calendars, caller, onClose, onCreated, setError,
}: {
  tenantId: string; types: LeaveType[]; employees: Employee[]; members: UserProfile[]; calendars: HolidayCalendar[];
  caller: Caller; onClose: () => void; onCreated: () => void; setError: SetErr;
}) {
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "");
  const [leaveTypeId, setLeaveTypeId] = useState(types[0]?.id ?? "");
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState(today());
  const [halfDay, setHalfDay] = useState(false);
  const [reason, setReason] = useState("");
  const [approverIds, setApproverIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const year = new Date(`${startDate}T00:00:00Z`).getUTCFullYear();
  const holidays = useMemo(() => calendars.filter((c) => c.year === year).flatMap((c) => c.holidays.map((h) => h.date)), [calendars, year]);
  const rawDays = workingDaysBetween(startDate, endDate, holidays);
  const days = halfDay ? Math.max(0.5, rawDays - 0.5) : rawDays;

  const save = async () => {
    const emp = employees.find((e) => e.id === employeeId);
    const type = types.find((t) => t.id === leaveTypeId);
    if (!emp || !type) { setError("Select an employee and leave type."); return; }
    if (days <= 0) { setError("Selected dates contain no working days."); return; }
    setSaving(true); setError(null);
    try {
      const approvers = type.requiresApproval
        ? approverIds.map((id) => members.find((m) => m.id === id)).filter((m): m is UserProfile => !!m)
            .map((m) => ({ approverId: m.id, approverEmail: m.email, approverName: m.displayName }))
        : [];
      const inputData: LeaveRequestInput = {
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        leaveTypeId: type.id,
        leaveTypeName: type.name,
        startDate, endDate, days, halfDay, reason,
        approvers,
      };
      await LeaveRequestService.submit(tenantId, inputData, caller);
      onCreated();
    } catch (e) { setError(getFriendlyErrorMessage(e, "Failed to submit request.")); }
    finally { setSaving(false); }
  };

  return (
    <Modal title="New Leave Request" onClose={onClose} onSave={save} saving={saving}>
      <label className="block text-xs font-semibold text-slate-600">Employee
        <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className={input}>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
        </select>
      </label>
      <label className="block text-xs font-semibold text-slate-600">Leave Type
        <select value={leaveTypeId} onChange={(e) => setLeaveTypeId(e.target.value)} className={input}>
          {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-xs font-semibold text-slate-600">Start<input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={input} /></label>
        <label className="block text-xs font-semibold text-slate-600">End<input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={input} /></label>
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={halfDay} onChange={(e) => setHalfDay(e.target.checked)} className="rounded" /> Half day</label>
      <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 text-sm text-slate-600">Working days requested: <strong>{days}</strong> (weekends &amp; holidays excluded)</div>
      <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" rows={2} className={input} />
      <div className="rounded-xl border border-slate-200 p-3">
        <p className="text-xs font-semibold text-slate-600 mb-2">Approvers (in order, for multi-level approval)</p>
        <div className="max-h-32 overflow-y-auto space-y-1.5">
          {members.map((m) => (
            <label key={m.id} className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={approverIds.includes(m.id)} onChange={(e) => setApproverIds((prev) => e.target.checked ? [...prev, m.id] : prev.filter((x) => x !== m.id))} className="rounded" />
              {m.displayName} <span className="text-slate-400">({m.email})</span>
            </label>
          ))}
        </div>
        <p className="mt-1 text-[11px] text-slate-400">Leave empty to auto-approve (if the leave type doesn't require approval).</p>
      </div>
    </Modal>
  );
}

/* ------------------------------ Types tab ------------------------------ */

function TypesTab({ tenantId, types, canManage, caller, reload, setError }: { tenantId: string; types: LeaveType[]; canManage: boolean; caller: Caller; reload: () => Promise<void>; setError: SetErr }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ name: "", code: "", colorHex: "#2563eb", paid: true, requiresApproval: true, defaultAllowanceDays: 20 });
  const save = async () => {
    if (!f.name.trim() || !f.code.trim()) { setError("Name and code are required."); return; }
    setSaving(true); setError(null);
    try {
      await LeaveTypeService.create(tenantId, { ...f, name: f.name.trim(), code: f.code.trim().toUpperCase(), isActive: true }, caller);
      setOpen(false); setF({ name: "", code: "", colorHex: "#2563eb", paid: true, requiresApproval: true, defaultAllowanceDays: 20 });
      await reload();
    } catch (e) { setError(getFriendlyErrorMessage(e, "Failed.")); } finally { setSaving(false); }
  };
  return (
    <div className="space-y-4">
      <Header title="Leave Types" count={types.length} onAdd={canManage ? () => setOpen(true) : undefined} addLabel="Add Type" />
      {types.length === 0 ? <EmptyState title="No leave types" description="Define the kinds of leave employees can take." icon={<Settings2 className="h-6 w-6" />} /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {types.map((t) => (
            <div key={t.id} className="rounded-xl border border-slate-200 bg-white p-4 flex items-start justify-between">
              <div>
                <div className="font-semibold text-slate-900 flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: t.colorHex }} />{t.name} <span className="text-xs text-slate-400">{t.code}</span></div>
                <div className="text-xs text-slate-500 mt-1">{t.paid ? "Paid" : "Unpaid"} Â· {t.defaultAllowanceDays} days/yr Â· {t.requiresApproval ? "Approval required" : "Auto-approve"}</div>
              </div>
              {canManage && <button onClick={async () => { await LeaveTypeService.remove(t.id, caller); await reload(); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"><Trash2 size={16} /></button>}
            </div>
          ))}
        </div>
      )}
      {open && (
        <Modal title="Add Leave Type" onClose={() => setOpen(false)} onSave={save} saving={saving}>
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Name (e.g. Annual Leave)" className={input} />
          <input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} placeholder="Code (e.g. AL)" className={input} />
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-semibold text-slate-600">Color<input type="color" value={f.colorHex} onChange={(e) => setF({ ...f, colorHex: e.target.value })} className="w-full h-9 rounded-lg border border-slate-200" /></label>
            <label className="text-xs font-semibold text-slate-600">Allowance (days/yr)<input type="number" value={f.defaultAllowanceDays} onChange={(e) => setF({ ...f, defaultAllowanceDays: Number(e.target.value) })} className={input} /></label>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={f.paid} onChange={(e) => setF({ ...f, paid: e.target.checked })} className="rounded" /> Paid leave</label>
          <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={f.requiresApproval} onChange={(e) => setF({ ...f, requiresApproval: e.target.checked })} className="rounded" /> Requires approval</label>
        </Modal>
      )}
    </div>
  );
}

/* ------------------------------ Policies tab ------------------------------ */

function PoliciesTab({ tenantId, policies, types, canManage, caller, reload, setError }: { tenantId: string; policies: LeavePolicy[]; types: LeaveType[]; canManage: boolean; caller: Caller; reload: () => Promise<void>; setError: SetErr }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ name: "", leaveTypeId: types[0]?.id ?? "", accrualMethod: "monthly" as AccrualMethod, accrualRateDays: 1.5, annualCapDays: 18, carryOverCapDays: 5, allowNegativeBalance: false, waitingPeriodDays: 0, effectiveFrom: today() });
  const typeName = (id: string) => types.find((t) => t.id === id)?.name ?? "â€”";
  const save = async () => {
    if (!f.name.trim() || !f.leaveTypeId) { setError("Name and leave type are required."); return; }
    setSaving(true); setError(null);
    try {
      await LeavePolicyService.create(tenantId, { ...f, name: f.name.trim(), isActive: true }, caller);
      setOpen(false);
      await reload();
    } catch (e) { setError(getFriendlyErrorMessage(e, "Failed.")); } finally { setSaving(false); }
  };
  return (
    <div className="space-y-4">
      <Header title="Leave Policies" count={policies.length} onAdd={canManage ? () => setOpen(true) : undefined} addLabel="Add Policy" />
      {policies.length === 0 ? <EmptyState title="No policies" description="Define accrual rules for leave types." icon={<Settings2 className="h-6 w-6" />} /> : (
        <div className="space-y-2">
          {policies.map((p) => (
            <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-4 flex items-start justify-between">
              <div>
                <div className="font-semibold text-slate-900">{p.name} <span className="text-xs text-slate-400">Â· {typeName(p.leaveTypeId)}</span></div>
                <div className="text-xs text-slate-500 mt-1">{tc(p.accrualMethod)} Â· {p.accrualRateDays} days/period Â· cap {p.annualCapDays || "âˆž"} Â· carryover {p.carryOverCapDays} Â· {p.allowNegativeBalance ? "negative ok" : "no negative"}</div>
              </div>
              {canManage && <button onClick={async () => { await LeavePolicyService.remove(p.id, caller); await reload(); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"><Trash2 size={16} /></button>}
            </div>
          ))}
        </div>
      )}
      {open && (
        <Modal title="Add Leave Policy" onClose={() => setOpen(false)} onSave={save} saving={saving}>
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Policy name" className={input} />
          <label className="block text-xs font-semibold text-slate-600">Leave Type<select value={f.leaveTypeId} onChange={(e) => setF({ ...f, leaveTypeId: e.target.value })} className={input}>{types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
          <label className="block text-xs font-semibold text-slate-600">Accrual Method<select value={f.accrualMethod} onChange={(e) => setF({ ...f, accrualMethod: e.target.value as AccrualMethod })} className={input}>{ACCRUAL_METHODS.map((m) => <option key={m} value={m}>{tc(m)}</option>)}</select></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-semibold text-slate-600">Rate (days/period)<input type="number" step="0.1" value={f.accrualRateDays} onChange={(e) => setF({ ...f, accrualRateDays: Number(e.target.value) })} className={input} /></label>
            <label className="text-xs font-semibold text-slate-600">Annual cap (0=âˆž)<input type="number" value={f.annualCapDays} onChange={(e) => setF({ ...f, annualCapDays: Number(e.target.value) })} className={input} /></label>
            <label className="text-xs font-semibold text-slate-600">Carryover cap<input type="number" value={f.carryOverCapDays} onChange={(e) => setF({ ...f, carryOverCapDays: Number(e.target.value) })} className={input} /></label>
            <label className="text-xs font-semibold text-slate-600">Waiting period (days)<input type="number" value={f.waitingPeriodDays} onChange={(e) => setF({ ...f, waitingPeriodDays: Number(e.target.value) })} className={input} /></label>
          </div>
          <label className="text-xs font-semibold text-slate-600">Effective from<input type="date" value={f.effectiveFrom} onChange={(e) => setF({ ...f, effectiveFrom: e.target.value })} className={input} /></label>
          <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={f.allowNegativeBalance} onChange={(e) => setF({ ...f, allowNegativeBalance: e.target.checked })} className="rounded" /> Allow negative balance</label>
        </Modal>
      )}
    </div>
  );
}

/* ------------------------------ Holidays tab ------------------------------ */

function HolidaysTab({ tenantId, calendars, canManage, caller, reload, setError }: { tenantId: string; calendars: HolidayCalendar[]; canManage: boolean; caller: Caller; reload: () => Promise<void>; setError: SetErr }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [rows, setRows] = useState<Holiday[]>([{ date: today(), name: "" }]);

  const save = async () => {
    if (!name.trim()) { setError("Calendar name is required."); return; }
    const holidays = rows.filter((r) => r.date && r.name.trim());
    setSaving(true); setError(null);
    try {
      await HolidayService.create(tenantId, { name: name.trim(), year, holidays, isDefault: calendars.length === 0 }, caller);
      setOpen(false); setName(""); setRows([{ date: today(), name: "" }]);
      await reload();
    } catch (e) { setError(getFriendlyErrorMessage(e, "Failed.")); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <Header title="Holiday Calendars" count={calendars.length} onAdd={canManage ? () => setOpen(true) : undefined} addLabel="Add Calendar" />
      {calendars.length === 0 ? <EmptyState title="No holiday calendars" description="Holidays are excluded from leave day counts." icon={<CalendarRange className="h-6 w-6" />} /> : (
        <div className="space-y-3">
          {calendars.map((c) => (
            <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-slate-900">{c.name} <span className="text-xs text-slate-400">Â· {c.year} Â· {c.holidays.length} holidays</span></div>
                {canManage && <button onClick={async () => { await HolidayService.remove(c.id, caller); await reload(); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"><Trash2 size={16} /></button>}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {c.holidays.map((h, i) => <span key={i} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{h.date} Â· {h.name}</span>)}
              </div>
            </div>
          ))}
        </div>
      )}
      {open && (
        <Modal title="Add Holiday Calendar" onClose={() => setOpen(false)} onSave={save} saving={saving}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Calendar name (e.g. India 2026)" className={input} />
          <label className="block text-xs font-semibold text-slate-600">Year<input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className={input} /></label>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-600">Holidays</p>
            {rows.map((r, i) => (
              <div key={i} className="flex gap-2">
                <input type="date" value={r.date} onChange={(e) => setRows((p) => p.map((x, j) => j === i ? { ...x, date: e.target.value } : x))} className={input} />
                <input value={r.name} onChange={(e) => setRows((p) => p.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="Name" className={input} />
                <button onClick={() => setRows((p) => p.filter((_, j) => j !== i))} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 cursor-pointer"><X size={16} /></button>
              </div>
            ))}
            <button onClick={() => setRows((p) => [...p, { date: today(), name: "" }])} className="text-sm font-medium text-blue-600 hover:underline cursor-pointer">+ Add holiday</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ------------------------------ Balances tab ------------------------------ */

function BalancesTab({ balances, types, employees, canManage, onRunAccrual }: { balances: LeaveBalance[]; types: LeaveType[]; employees: Employee[]; canManage: boolean; onRunAccrual: () => void }) {
  const typeName = (id: string) => types.find((t) => t.id === id)?.name ?? id;
  const empName = (id: string) => { const e = employees.find((x) => x.id === id); return e ? `${e.firstName} ${e.lastName}` : id; };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Leave Balances <span className="text-slate-400 font-normal">({balances.length})</span></h2>
        {canManage && <button onClick={onRunAccrual} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer"><RefreshCw size={16} /> Run Accrual</button>}
      </div>
      {balances.length === 0 ? <EmptyState title="No balances yet" description="Balances are created when leave is requested, or seeded by accrual." icon={<Wallet className="h-6 w-6" />} /> : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">Employee</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Year</th>
              <th className="px-4 py-3">Accrued</th><th className="px-4 py-3">Carried</th><th className="px-4 py-3">Used</th><th className="px-4 py-3">Pending</th><th className="px-4 py-3">Available</th>
            </tr></thead>
            <tbody>
              {balances.map((b) => (
                <tr key={b.id} className="border-b border-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-900">{empName(b.employeeId)}</td>
                  <td className="px-4 py-3 text-slate-600">{typeName(b.leaveTypeId)}</td>
                  <td className="px-4 py-3 text-slate-600">{b.year}</td>
                  <td className="px-4 py-3 text-slate-600">{b.accruedDays}</td>
                  <td className="px-4 py-3 text-slate-600">{b.carriedOverDays}</td>
                  <td className="px-4 py-3 text-slate-600">{b.usedDays}</td>
                  <td className="px-4 py-3 text-amber-600">{b.pendingDays}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">{availableBalance(b)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ shared ------------------------------ */

function Header({ title, count, onAdd, addLabel }: { title: string; count: number; onAdd: (() => void) | undefined; addLabel: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-bold text-slate-900">{title} <span className="text-slate-400 font-normal">({count})</span></h2>
      {onAdd && <button onClick={onAdd} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer"><Plus size={16} /> {addLabel}</button>}
    </div>
  );
}

function Modal({ title, onClose, onSave, saving, children }: { title: string; onClose: () => void; onSave: () => void; saving: boolean; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold text-slate-900">{title}</h2><button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 cursor-pointer"><X size={18} /></button></div>
        <div className="space-y-3">{children}</div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer">Cancel</button>
          <button onClick={onSave} disabled={saving} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 cursor-pointer">{saving ? "Savingâ€¦" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}

// Default export mirrors the named LeaveManagementPage export (additive; the
// named export is preserved for existing import sites).
export default LeaveManagementPage;
```

## `frontend\src\features\leave\services\leaveService.ts`

```ts
/**
 * leaveService
 * ------------
 * Firestore data-access layer for the Leave module. Exposes service objects for
 * leave types, policies, holiday calendars, balances, and requests. Each
 * mutating operation also writes an audit-log entry (when a caller is supplied)
 * and, where relevant, defers balance settlement to server-side Cloud Functions.
 *
 * Collections used: `leaveTypes`, `leavePolicies`, `holidayCalendars`,
 * `leaveBalances`, `leaveRequests`. All reads are tenant-scoped via a
 * `tenantId == <id>` query filter.
 */
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type {
  LeaveType,
  LeavePolicy,
  LeaveRequest,
  LeaveBalance,
  HolidayCalendar,
  LeaveRequestStatus,
} from "@hrms/middleware";
import { AuditLogService } from "../../settings/services/auditLogService";
import {
  buildApprovalWorkflow,
  applyApprovalDecision,
  requestStatusFromApproval,
  computeAccrual,
} from "../utils/leave";

type CallerInfo = { uid: string; email: string };

/** Generate a collision-resistant document id with a human-readable prefix. */
function rid(p: string) {
  return `${p}_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
}

/** Fetch all documents in `name` belonging to a tenant (`tenantId` filter). */
async function listByTenant<T>(name: string, tenantId: string): Promise<T[]> {
  const snap = await getDocs(query(collection(db, name), where("tenantId", "==", tenantId)));
  const list: T[] = [];
  snap.forEach((d) => list.push(d.data() as T));
  return list;
}

/* ------------------------------------------------------------------ */
/*  Leave types                                                        */
/* ------------------------------------------------------------------ */

/** CRUD service for leave types (e.g. Annual, Sick), with audit logging. */
export const LeaveTypeService = {
  list: (tenantId: string) => listByTenant<LeaveType>("leaveTypes", tenantId),

  async create(tenantId: string, data: Omit<LeaveType, "id" | "tenantId" | "createdAt" | "updatedAt">, caller?: CallerInfo) {
    const id = rid("ltype");
    const now = Date.now();
    const lt: LeaveType = { ...data, id, tenantId, createdAt: now, updatedAt: now };
    await setDoc(doc(db, "leaveTypes", id), lt);
    if (caller) await AuditLogService.createAuditLog(tenantId, { userId: caller.uid, userEmail: caller.email, action: "create", resource: "leave_type", resourceId: id, details: `Created leave type "${lt.name}"` });
    return lt;
  },

  async update(id: string, data: Partial<LeaveType>, caller?: CallerInfo) {
    const snap = await getDoc(doc(db, "leaveTypes", id));
    if (!snap.exists()) return;
    const old = snap.data() as LeaveType;
    await updateDoc(doc(db, "leaveTypes", id), { ...data, updatedAt: Date.now() });
    if (caller) await AuditLogService.createAuditLog(old.tenantId, { userId: caller.uid, userEmail: caller.email, action: "update", resource: "leave_type", resourceId: id, details: `Updated leave type "${old.name}"` });
  },

  async remove(id: string, caller?: CallerInfo) {
    const snap = await getDoc(doc(db, "leaveTypes", id));
    if (snap.exists() && caller) {
      const lt = snap.data() as LeaveType;
      await AuditLogService.createAuditLog(lt.tenantId, { userId: caller.uid, userEmail: caller.email, action: "delete", resource: "leave_type", resourceId: id, details: `Deleted leave type "${lt.name}"` });
    }
    await deleteDoc(doc(db, "leaveTypes", id));
  },
};

/* ------------------------------------------------------------------ */
/*  Leave policies                                                     */
/* ------------------------------------------------------------------ */

/** CRUD service for leave accrual policies, with audit logging. */
export const LeavePolicyService = {
  list: (tenantId: string) => listByTenant<LeavePolicy>("leavePolicies", tenantId),

  async create(tenantId: string, data: Omit<LeavePolicy, "id" | "tenantId" | "createdAt" | "updatedAt">, caller?: CallerInfo) {
    const id = rid("lpol");
    const now = Date.now();
    const p: LeavePolicy = { ...data, id, tenantId, createdAt: now, updatedAt: now };
    await setDoc(doc(db, "leavePolicies", id), p);
    if (caller) await AuditLogService.createAuditLog(tenantId, { userId: caller.uid, userEmail: caller.email, action: "create", resource: "leave_policy", resourceId: id, details: `Created leave policy "${p.name}"` });
    return p;
  },

  async update(id: string, data: Partial<LeavePolicy>, caller?: CallerInfo) {
    const snap = await getDoc(doc(db, "leavePolicies", id));
    if (!snap.exists()) return;
    const old = snap.data() as LeavePolicy;
    await updateDoc(doc(db, "leavePolicies", id), { ...data, updatedAt: Date.now() });
    if (caller) await AuditLogService.createAuditLog(old.tenantId, { userId: caller.uid, userEmail: caller.email, action: "update", resource: "leave_policy", resourceId: id, details: `Updated leave policy "${old.name}"` });
  },

  async remove(id: string, caller?: CallerInfo) {
    const snap = await getDoc(doc(db, "leavePolicies", id));
    if (snap.exists() && caller) {
      const p = snap.data() as LeavePolicy;
      await AuditLogService.createAuditLog(p.tenantId, { userId: caller.uid, userEmail: caller.email, action: "delete", resource: "leave_policy", resourceId: id, details: `Deleted leave policy "${p.name}"` });
    }
    await deleteDoc(doc(db, "leavePolicies", id));
  },
};

/* ------------------------------------------------------------------ */
/*  Holiday calendars                                                  */
/* ------------------------------------------------------------------ */

/** CRUD service for holiday calendars, plus a helper to flatten holiday dates. */
export const HolidayService = {
  list: (tenantId: string) => listByTenant<HolidayCalendar>("holidayCalendars", tenantId),

  async create(tenantId: string, data: Omit<HolidayCalendar, "id" | "tenantId" | "createdAt" | "updatedAt">, caller?: CallerInfo) {
    const id = rid("hcal");
    const now = Date.now();
    const c: HolidayCalendar = { ...data, id, tenantId, createdAt: now, updatedAt: now };
    await setDoc(doc(db, "holidayCalendars", id), c);
    if (caller) await AuditLogService.createAuditLog(tenantId, { userId: caller.uid, userEmail: caller.email, action: "create", resource: "holiday_calendar", resourceId: id, details: `Created holiday calendar "${c.name}" (${c.year})` });
    return c;
  },

  async update(id: string, data: Partial<HolidayCalendar>, caller?: CallerInfo) {
    const snap = await getDoc(doc(db, "holidayCalendars", id));
    if (!snap.exists()) return;
    const old = snap.data() as HolidayCalendar;
    await updateDoc(doc(db, "holidayCalendars", id), { ...data, updatedAt: Date.now() });
    if (caller) await AuditLogService.createAuditLog(old.tenantId, { userId: caller.uid, userEmail: caller.email, action: "update", resource: "holiday_calendar", resourceId: id, details: `Updated holiday calendar "${old.name}"` });
  },

  async remove(id: string, caller?: CallerInfo) {
    const snap = await getDoc(doc(db, "holidayCalendars", id));
    if (snap.exists() && caller) {
      const c = snap.data() as HolidayCalendar;
      await AuditLogService.createAuditLog(c.tenantId, { userId: caller.uid, userEmail: caller.email, action: "delete", resource: "holiday_calendar", resourceId: id, details: `Deleted holiday calendar "${c.name}"` });
    }
    await deleteDoc(doc(db, "holidayCalendars", id));
  },

  /** Flatten holiday dates for a year from the tenant's calendars. */
  async holidayDatesForYear(tenantId: string, year: number): Promise<string[]> {
    const calendars = await this.list(tenantId);
    return calendars
      .filter((c) => c.year === year)
      .flatMap((c) => c.holidays.map((h) => h.date));
  },
};

/* ------------------------------------------------------------------ */
/*  Leave balances                                                     */
/* ------------------------------------------------------------------ */

/** Deterministic balance document id (one balance per employee/type/year). */
function balanceId(tenantId: string, employeeId: string, leaveTypeId: string, year: number) {
  return `${tenantId}_${employeeId}_${leaveTypeId}_${year}`;
}

/** Service for reading, seeding, and accruing per-employee leave balances. */
export const LeaveBalanceService = {
  list: (tenantId: string) => listByTenant<LeaveBalance>("leaveBalances", tenantId),

  async listForEmployee(tenantId: string, employeeId: string): Promise<LeaveBalance[]> {
    const snap = await getDocs(
      query(collection(db, "leaveBalances"), where("tenantId", "==", tenantId), where("employeeId", "==", employeeId))
    );
    const list: LeaveBalance[] = [];
    snap.forEach((d) => list.push(d.data() as LeaveBalance));
    return list;
  },

  async ensure(tenantId: string, employeeId: string, leaveTypeId: string, year: number, seedDays = 0): Promise<LeaveBalance> {
    const id = balanceId(tenantId, employeeId, leaveTypeId, year);
    const ref = doc(db, "leaveBalances", id);
    const snap = await getDoc(ref);
    if (snap.exists()) return snap.data() as LeaveBalance;
    const now = Date.now();
    const bal: LeaveBalance = {
      id, tenantId, employeeId, leaveTypeId, year,
      accruedDays: seedDays, usedDays: 0, pendingDays: 0, carriedOverDays: 0,
      lastAccruedAt: 0, createdAt: now, updatedAt: now,
    };
    await setDoc(ref, bal);
    return bal;
  },

  async save(bal: LeaveBalance): Promise<void> {
    await setDoc(doc(db, "leaveBalances", bal.id), { ...bal, updatedAt: Date.now() });
  },

  /** Run accrual for a single balance against its policy, as of `asOfMs`. */
  async runAccrual(bal: LeaveBalance, policy: LeavePolicy, asOfMs: number, caller?: CallerInfo): Promise<LeaveBalance> {
    const result = computeAccrual(policy, bal.lastAccruedAt, bal.accruedDays, asOfMs);
    if (result.periods <= 0) return bal;
    const updated: LeaveBalance = {
      ...bal,
      accruedDays: result.newAccruedDays,
      lastAccruedAt: result.newLastAccruedAt,
      updatedAt: Date.now(),
    };
    await this.save(updated);
    if (caller) {
      await AuditLogService.createAuditLog(bal.tenantId, {
        userId: caller.uid, userEmail: caller.email, action: "update", resource: "leave_balance",
        resourceId: bal.id, details: `Accrued ${result.accruedDelta} day(s) for employee ${bal.employeeId}`,
      });
    }
    return updated;
  },

  /** Run accrual across all balances of a tenant for the given leave types' policies. */
  async runAccrualForTenant(tenantId: string, policies: LeavePolicy[], asOfMs: number, caller?: CallerInfo): Promise<number> {
    const balances = await this.list(tenantId);
    const policyByType = new Map(policies.filter((p) => p.isActive).map((p) => [p.leaveTypeId, p]));
    let applied = 0;
    for (const bal of balances) {
      const policy = policyByType.get(bal.leaveTypeId);
      if (!policy) continue;
      const before = bal.accruedDays;
      const updated = await this.runAccrual(bal, policy, asOfMs, caller);
      if (updated.accruedDays !== before) applied++;
    }
    return applied;
  },
};

/* ------------------------------------------------------------------ */
/*  Leave requests (multi-level approval + balance reservation)        */
/* ------------------------------------------------------------------ */

/** Input payload for creating a leave request (pre-workflow construction). */
export interface LeaveRequestInput {
  employeeId: string;
  employeeName: string;
  leaveTypeId: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  days: number;
  halfDay: boolean;
  reason: string;
  approvers: Array<{ approverId: string; approverEmail: string; approverName?: string }>;
}

/**
 * Service for the leave-request lifecycle: list/submit/decide/cancel. Builds the
 * multi-level approval workflow on submit; balance reservation/settlement is
 * handled server-side by the onLeaveRequestUpdated Cloud Function.
 */
export const LeaveRequestService = {
  list: (tenantId: string) => listByTenant<LeaveRequest>("leaveRequests", tenantId),

  async listForEmployee(tenantId: string, employeeId: string): Promise<LeaveRequest[]> {
    const snap = await getDocs(
      query(collection(db, "leaveRequests"), where("tenantId", "==", tenantId), where("employeeId", "==", employeeId))
    );
    const list: LeaveRequest[] = [];
    snap.forEach((d) => list.push(d.data() as LeaveRequest));
    return list.sort((a, b) => b.createdAt - a.createdAt);
  },

  /** Submit a request: creates the multi-level workflow and reserves pending balance. */
  async submit(tenantId: string, input: LeaveRequestInput, caller?: CallerInfo): Promise<LeaveRequest> {
    const id = rid("leave");
    const now = Date.now();
    const approval = buildApprovalWorkflow(input.approvers);
    const { approvers, ...rest } = input;
    void approvers;
    const req: LeaveRequest = {
      ...rest,
      id,
      tenantId,
      status: approval.required ? "pending" : "approved",
      approval,
      createdBy: caller?.uid || "",
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db, "leaveRequests", id), req);

    // Balance reservation/settlement is handled server-side by the
    // onLeaveRequestUpdated Cloud Function (Admin SDK), so the requester does
    // not need elevated leaveBalances write permission.

    if (caller) {
      await AuditLogService.createAuditLog(tenantId, {
        userId: caller.uid, userEmail: caller.email, action: "create", resource: "leave_request",
        resourceId: id, details: `Requested ${input.days} day(s) ${input.leaveTypeName} (${input.startDate}â†’${input.endDate})`,
      });
    }
    return req;
  },

  /** Approve/reject the current step of a request's multi-level workflow. */
  async decide(id: string, decision: "approved" | "rejected", caller: CallerInfo, comment?: string): Promise<void> {
    const ref = doc(db, "leaveRequests", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const req = snap.data() as LeaveRequest;

    const nextApproval = applyApprovalDecision(req.approval, decision, caller.uid, comment);
    const nextStatus: LeaveRequestStatus = requestStatusFromApproval(nextApproval.status);
    await updateDoc(ref, { approval: nextApproval, status: nextStatus, updatedAt: Date.now() });

    // Balance is settled server-side by onLeaveRequestUpdated (Admin SDK).

    await AuditLogService.createAuditLog(req.tenantId, {
      userId: caller.uid, userEmail: caller.email,
      action: decision === "approved" ? "approve" : "reject",
      resource: "leave_request", resourceId: id,
      details: `${decision === "approved" ? "Approved" : "Rejected"} leave for ${req.employeeName}${comment ? `: ${comment}` : ""}`,
    });
  },

  /** Cancel a request and release any reserved/used balance. */
  async cancel(id: string, caller?: CallerInfo): Promise<void> {
    const ref = doc(db, "leaveRequests", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const req = snap.data() as LeaveRequest;
    if (req.status === "cancelled") return;

    // Balance release is handled server-side by onLeaveRequestUpdated (Admin SDK).
    await updateDoc(ref, { status: "cancelled", updatedAt: Date.now() });

    if (caller) {
      await AuditLogService.createAuditLog(req.tenantId, {
        userId: caller.uid, userEmail: caller.email, action: "status_change", resource: "leave_request",
        resourceId: id, details: `Cancelled leave for ${req.employeeName}`,
      });
    }
  },
};
```

## `frontend\src\features\leave\utils\leave.ts`

```ts
/**
 * leave (utils)
 * -------------
 * Pure, side-effect-free helpers for the Leave module, shared by the UI and the
 * service layer. Includes: ISO-date/working-day math (UTC based), the accrual
 * engine (periodsElapsed/computeAccrual), balance math
 * (availableBalance/canBook/computeCarryOver), and the generic multi-level
 * approval workflow progression. Keeping these pure makes them directly unit
 * testable.
 */
import type {
  LeavePolicy,
  LeaveBalance,
  ApprovalWorkflow,
  ApprovalStep,
} from "@hrms/middleware";

const DAY_MS = 86400000;

/* ------------------------------------------------------------------ */
/*  Date / working-day helpers                                         */
/* ------------------------------------------------------------------ */

/**
 * Parses an ISO date (YYYY-MM-DD) to its UTC-midnight epoch milliseconds.
 */
export function isoToMs(iso: string): number {
  return new Date(`${iso}T00:00:00Z`).getTime();
}

/**
 * Formats epoch milliseconds back to an ISO date string (YYYY-MM-DD, UTC).
 */
export function msToIso(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * Checks if a given date is a Saturday (6) or Sunday (0) in UTC.
 */
export function isWeekend(iso: string): boolean {
  const d = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return d === 0 || d === 6;
}

/**
 * Inclusive count of working days between two ISO dates, excluding weekends
 * and any dates present in `holidays`. Returns 0 if end < start.
 */
export function workingDaysBetween(startIso: string, endIso: string, holidays: string[] = []): number {
  const start = isoToMs(startIso);
  const end = isoToMs(endIso);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 0;
  
  const holidaySet = new Set(holidays);
  let count = 0;
  for (let t = start; t <= end; t += DAY_MS) {
    const iso = msToIso(t);
    if (!isWeekend(iso) && !holidaySet.has(iso)) {
      count++;
    }
  }
  return count;
}

/* ------------------------------------------------------------------ */
/*  Accrual engine                                                     */
/* ------------------------------------------------------------------ */

function utcYear(ms: number): number {
  return new Date(ms).getUTCFullYear();
}

function monthIndex(ms: number): number {
  const d = new Date(ms);
  return d.getUTCFullYear() * 12 + d.getUTCMonth();
}

/**
 * Calculates completed accrual periods between `fromMs` and `asOfMs` for a method.
 * Pure and deterministic (UTC based).
 */
export function periodsElapsed(method: LeavePolicy["accrualMethod"], fromMs: number, asOfMs: number): number {
  if (asOfMs <= fromMs) return 0;
  switch (method) {
    case "monthly":
      return Math.max(0, monthIndex(asOfMs) - monthIndex(fromMs));
    case "per_pay_period":
      return Math.floor((asOfMs - fromMs) / (14 * DAY_MS));
    case "annual_lump":
      return Math.max(0, utcYear(asOfMs) - utcYear(fromMs));
    case "none":
    default:
      return 0;
  }
}

export interface AccrualResult {
  periods: number;
  accruedDelta: number;
  newAccruedDays: number;
  newLastAccruedAt: number;
}

/**
 * Computes the accrual to apply to a balance as of `asOfMs`.
 * - Uses lastAccruedAt as the baseline (or the policy effectiveFrom on first run).
 * - For annual_lump with no prior accrual, grants one full period immediately.
 * - Caps total accrued at policy.annualCapDays (0 = uncapped).
 */
export function computeAccrual(
  policy: Pick<LeavePolicy, "accrualMethod" | "accrualRateDays" | "annualCapDays" | "effectiveFrom">,
  lastAccruedAtMs: number,
  currentAccruedDays: number,
  asOfMs: number
): AccrualResult {
  const noChange: AccrualResult = {
    periods: 0,
    accruedDelta: 0,
    newAccruedDays: currentAccruedDays,
    newLastAccruedAt: lastAccruedAtMs,
  };
  if (policy.accrualMethod === "none") return noChange;

  const effectiveFromMs = isoToMs(policy.effectiveFrom);
  const base = lastAccruedAtMs > 0 ? lastAccruedAtMs : effectiveFromMs;
  if (Number.isNaN(base) || asOfMs < base) return noChange;

  let periods = periodsElapsed(policy.accrualMethod, base, asOfMs);
  // First annual_lump run grants the current year's allotment immediately.
  if (policy.accrualMethod === "annual_lump" && lastAccruedAtMs === 0 && periods === 0) {
    periods = 1;
  }
  if (periods <= 0) return noChange;

  let newAccrued = currentAccruedDays + periods * policy.accrualRateDays;
  if (policy.annualCapDays > 0) {
    newAccrued = Math.min(newAccrued, policy.annualCapDays);
  }
  const accruedDelta = newAccrued - currentAccruedDays;
  return {
    periods,
    accruedDelta,
    newAccruedDays: newAccrued,
    newLastAccruedAt: asOfMs,
  };
}

/* ------------------------------------------------------------------ */
/*  Balance math                                                       */
/* ------------------------------------------------------------------ */

/**
 * Calculates days currently available to book: accrued + carried over âˆ’ used âˆ’ pending.
 */
export function availableBalance(
  b: Pick<LeaveBalance, "accruedDays" | "carriedOverDays" | "usedDays" | "pendingDays">
): number {
  return b.accruedDays + b.carriedOverDays - b.usedDays - b.pendingDays;
}

/**
 * Checks if a given number of days can be booked based on negative-balance rules.
 */
export function canBook(
  b: Pick<LeaveBalance, "accruedDays" | "carriedOverDays" | "usedDays" | "pendingDays">,
  days: number,
  allowNegative: boolean
): boolean {
  if (days <= 0) return false;
  if (allowNegative) return true;
  return availableBalance(b) >= days;
}

/**
 * Computes carry over days: min(remaining available, carryOverCap).
 */
export function computeCarryOver(
  b: Pick<LeaveBalance, "accruedDays" | "carriedOverDays" | "usedDays" | "pendingDays">,
  carryOverCapDays: number
): number {
  const remaining = Math.max(0, availableBalance(b));
  if (carryOverCapDays <= 0) return 0;
  return Math.min(remaining, carryOverCapDays);
}

/* ------------------------------------------------------------------ */
/*  Multi-level approval progression (generic, pure)                   */
/* ------------------------------------------------------------------ */

/**
 * Builds approval workflow states from assigned approver listings.
 */
export function buildApprovalWorkflow(
  approvers: Array<{ approverId: string; approverEmail: string; approverName?: string }>
): ApprovalWorkflow {
  const steps: ApprovalStep[] = approvers.map((a, i) => {
    const step: ApprovalStep = {
      approverId: a.approverId,
      approverEmail: a.approverEmail,
      order: i,
      status: "pending",
    };
    if (a.approverName !== undefined) step.approverName = a.approverName;
    return step;
  });
  return {
    required: steps.length > 0,
    steps,
    currentStep: 0,
    status: steps.length > 0 ? "pending" : "approved",
  };
}

/**
 * Applies approval/rejection decisions to active steps.
 * Rejections reject the workflow immediately; approvals advance steps until final clearance.
 */
export function applyApprovalDecision(
  workflow: ApprovalWorkflow,
  decision: "approved" | "rejected",
  approverId: string,
  comment?: string,
  now: number = Date.now()
): ApprovalWorkflow {
  if (!workflow.required || workflow.status !== "pending") return workflow;
  
  const steps = workflow.steps.map((s) => ({ ...s }));
  const step = steps[workflow.currentStep];
  if (!step || step.approverId !== approverId) return workflow;

  step.status = decision;
  if (comment !== undefined) step.comment = comment;
  step.decidedAt = now;

  if (decision === "rejected") {
    return { ...workflow, steps, status: "rejected" };
  }
  const isLast = workflow.currentStep >= steps.length - 1;
  return {
    ...workflow,
    steps,
    currentStep: isLast ? workflow.currentStep : workflow.currentStep + 1,
    status: isLast ? "approved" : "pending",
  };
}

/**
 * Checks if a user is the active designated approver.
 */
export function isCurrentApprover(workflow: ApprovalWorkflow, userId: string): boolean {
  if (!workflow.required || workflow.status !== "pending") return false;
  const step = workflow.steps[workflow.currentStep];
  return !!step && step.approverId === userId && step.status === "pending";
}

/**
 * Maps leave workflow state back into status states.
 */
const requestStatusFromApproval = (
  approvalStatus: ApprovalWorkflow["status"]
): "pending" | "approved" | "rejected" => {
  if (approvalStatus === "approved") return "approved";
  if (approvalStatus === "rejected") return "rejected";
  return "pending";
};

export { requestStatusFromApproval };
export default requestStatusFromApproval;
```

## `frontend\src\features\leave\utils\leave.test.ts`

```ts
/**
 * Unit tests for the pure leave utilities in ./leave: working-day counting,
 * the accrual engine (periodsElapsed/computeAccrual), balance math
 * (availableBalance/canBook/computeCarryOver), and the multi-level approval
 * workflow helpers. All functions under test are deterministic and UTC-based.
 */
import { describe, it, expect } from "vitest";
import {
  isoToMs,
  isWeekend,
  workingDaysBetween,
  periodsElapsed,
  computeAccrual,
  availableBalance,
  canBook,
  computeCarryOver,
  buildApprovalWorkflow,
  applyApprovalDecision,
  isCurrentApprover,
  requestStatusFromApproval,
} from "./leave";

/* ----------------------------- working days ----------------------------- */

describe("isWeekend / workingDaysBetween", () => {
  it("identifies weekends (UTC)", () => {
    expect(isWeekend("2026-06-13")).toBe(true); // Saturday
    expect(isWeekend("2026-06-14")).toBe(true); // Sunday
    expect(isWeekend("2026-06-15")).toBe(false); // Monday
  });

  it("counts inclusive working days excluding weekends", () => {
    // Mon 2026-06-15 .. Fri 2026-06-19 = 5 working days
    expect(workingDaysBetween("2026-06-15", "2026-06-19")).toBe(5);
    // includes a weekend: Fri..next Mon = Fri, Mon = 2
    expect(workingDaysBetween("2026-06-19", "2026-06-22")).toBe(2);
  });

  it("excludes holidays", () => {
    // Mon..Fri with Wed holiday => 4
    expect(workingDaysBetween("2026-06-15", "2026-06-19", ["2026-06-17"])).toBe(4);
  });

  it("returns 0 when end before start", () => {
    expect(workingDaysBetween("2026-06-19", "2026-06-15")).toBe(0);
  });
});

/* ----------------------------- accrual engine ----------------------------- */

describe("periodsElapsed", () => {
  const jan1 = isoToMs("2026-01-01");
  it("monthly counts month boundaries", () => {
    expect(periodsElapsed("monthly", jan1, isoToMs("2026-04-01"))).toBe(3);
    expect(periodsElapsed("monthly", jan1, isoToMs("2026-01-15"))).toBe(0);
  });
  it("per_pay_period counts 14-day blocks", () => {
    expect(periodsElapsed("per_pay_period", jan1, isoToMs("2026-01-29"))).toBe(2);
  });
  it("annual_lump counts year boundaries", () => {
    expect(periodsElapsed("annual_lump", jan1, isoToMs("2028-06-01"))).toBe(2);
  });
  it("none is always 0", () => {
    expect(periodsElapsed("none", jan1, isoToMs("2030-01-01"))).toBe(0);
  });
});

describe("computeAccrual", () => {
  const monthly = { accrualMethod: "monthly" as const, accrualRateDays: 1.5, annualCapDays: 18, effectiveFrom: "2026-01-01" };

  it("accrues per elapsed month from effectiveFrom on first run", () => {
    const r = computeAccrual(monthly, 0, 0, isoToMs("2026-04-01"));
    expect(r.periods).toBe(3);
    expect(r.accruedDelta).toBe(4.5);
    expect(r.newAccruedDays).toBe(4.5);
    expect(r.newLastAccruedAt).toBe(isoToMs("2026-04-01"));
  });

  it("caps at annualCapDays", () => {
    const r = computeAccrual(monthly, 0, 0, isoToMs("2027-01-01")); // 12 months * 1.5 = 18, capped 18
    expect(r.newAccruedDays).toBe(18);
    // beyond cap, no further accrual
    const r2 = computeAccrual(monthly, isoToMs("2027-01-01"), 18, isoToMs("2027-06-01"));
    expect(r2.newAccruedDays).toBe(18);
    expect(r2.accruedDelta).toBe(0);
  });

  it("annual_lump grants full amount on first run even within the same year", () => {
    const annual = { accrualMethod: "annual_lump" as const, accrualRateDays: 20, annualCapDays: 0, effectiveFrom: "2026-01-01" };
    const r = computeAccrual(annual, 0, 0, isoToMs("2026-03-01"));
    expect(r.periods).toBe(1);
    expect(r.newAccruedDays).toBe(20);
  });

  it("none method never accrues", () => {
    const none = { accrualMethod: "none" as const, accrualRateDays: 5, annualCapDays: 0, effectiveFrom: "2026-01-01" };
    const r = computeAccrual(none, 0, 3, isoToMs("2030-01-01"));
    expect(r.accruedDelta).toBe(0);
    expect(r.newAccruedDays).toBe(3);
  });
});

/* ----------------------------- balance math ----------------------------- */

describe("balance math", () => {
  const bal = { accruedDays: 15, carriedOverDays: 5, usedDays: 4, pendingDays: 2 };
  it("availableBalance = accrued + carried - used - pending", () => {
    expect(availableBalance(bal)).toBe(14);
  });
  it("canBook respects availability and negative rule", () => {
    expect(canBook(bal, 10, false)).toBe(true);
    expect(canBook(bal, 20, false)).toBe(false);
    expect(canBook(bal, 20, true)).toBe(true);
    expect(canBook(bal, 0, true)).toBe(false);
  });
  it("computeCarryOver caps at carryOverCap", () => {
    expect(computeCarryOver(bal, 10)).toBe(10); // available 14 capped at 10
    expect(computeCarryOver(bal, 0)).toBe(0); // no carryover
    expect(computeCarryOver({ accruedDays: 3, carriedOverDays: 0, usedDays: 0, pendingDays: 0 }, 10)).toBe(3);
  });
});

/* ----------------------------- approvals ----------------------------- */

describe("multi-level approval", () => {
  const wf = buildApprovalWorkflow([
    { approverId: "mgr", approverEmail: "mgr@x.com" },
    { approverId: "hr", approverEmail: "hr@x.com" },
  ]);

  it("builds a pending 2-step workflow", () => {
    expect(wf.required).toBe(true);
    expect(wf.steps).toHaveLength(2);
    expect(wf.status).toBe("pending");
  });

  it("requires all levels to approve sequentially", () => {
    const afterMgr = applyApprovalDecision(wf, "approved", "mgr");
    expect(afterMgr.status).toBe("pending");
    expect(afterMgr.currentStep).toBe(1);
    const afterHr = applyApprovalDecision(afterMgr, "approved", "hr");
    expect(afterHr.status).toBe("approved");
  });

  it("any level rejection rejects the request", () => {
    const rejected = applyApprovalDecision(wf, "rejected", "mgr", "no");
    expect(rejected.status).toBe("rejected");
  });

  it("only the current approver can act", () => {
    expect(applyApprovalDecision(wf, "approved", "hr")).toBe(wf); // hr is level 2, not current
    expect(isCurrentApprover(wf, "mgr")).toBe(true);
    expect(isCurrentApprover(wf, "hr")).toBe(false);
  });

  it("maps workflow status to request status", () => {
    expect(requestStatusFromApproval("approved")).toBe("approved");
    expect(requestStatusFromApproval("rejected")).toBe("rejected");
    expect(requestStatusFromApproval("pending")).toBe("pending");
  });

  it("auto-approves when there are no approvers", () => {
    const none = buildApprovalWorkflow([]);
    expect(none.required).toBe(false);
    expect(none.status).toBe("approved");
  });
});
```

## `frontend\src\features\documents\pages\DocumentsPage.tsx`

```tsx
/**
 * DocumentsPage
 * -------------
 * Document Vault screen: lists tenant documents the caller may read, with
 * sidebar category filters, search, scope tabs (org/employee/candidate), and
 * upload / preview / delete flows. Permissions gate the upload and delete
 * actions, and the data is scoped per the caller's role via DocumentService.
 */
import { getFriendlyErrorMessage } from "../../../lib/errors";
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../auth/context/AuthContext";
import { useHasPermission } from "../../rbac/hooks/usePermissions";
import { DocumentService } from "../services/documentService";
import { EmployeeService } from "../../employees/services/employeeService";
import { CandidateService } from "../../recruitment/services/candidateService";
import { useEmployeeData } from "../../employees/hooks/useEmployeeData";
import { DocumentPreviewModal } from "../components/DocumentPreviewModal";
import type { VaultDocument, DocumentCategory, DocumentType, DocumentAccessLevel, Employee, Candidate } from "@hrms/middleware";
import { 
  Search, Upload, Trash2, Eye, Download, Lock, Users, User, Plus, X, 
  FileText, FileImage, File, ShieldAlert, FolderOpen, Calendar, HelpCircle, HardDrive
} from "lucide-react";

// Static category catalog used for the sidebar filters, badges, and the upload
// form select. `color` holds the Tailwind classes for each category badge.
const CATEGORIES: { value: DocumentCategory; label: string; color: string }[] = [
  { value: "contract", label: "Contracts", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "id_proof", label: "ID Proofs", color: "bg-sky-50 text-sky-700 border-sky-200" },
  { value: "resume", label: "Resumes", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "offer_letter", label: "Offer Letters", color: "bg-pink-50 text-pink-700 border-pink-200" },
  { value: "policy", label: "Policies", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "payslip", label: "Payslips", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "other", label: "Other Documents", color: "bg-slate-50 text-slate-700 border-slate-200" }
];

/** Top-level Document Vault page component (route view). */
export function DocumentsPage() {
  const { profile, activeTenant } = useAuth();
  const tenantId = profile?.activeTenantId || "";
  const primaryColor = activeTenant?.primaryColor || "#2563eb";
  
  // Permissions
  const hasPerm = useHasPermission();
  const canUpload = hasPerm("documents.create") || hasPerm("candidates.create") || hasPerm("employees.update");
  const canDelete = hasPerm("documents.delete") || hasPerm("candidates.delete") || hasPerm("employees.delete");

  // State
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Custom alerts state
  const [deleteDocConfirm, setDeleteDocConfirm] = useState<VaultDocument | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");

  // Modal / Preview States
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<VaultDocument | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Upload Form State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [docName, setDocName] = useState("");
  const [docCategory, setDocCategory] = useState<DocumentCategory>("other");
  const [docType, setDocType] = useState<DocumentType>("general");
  const [targetEmployeeId, setTargetEmployeeId] = useState("");
  const [targetCandidateId, setTargetCandidateId] = useState("");
  const [accessLevel, setAccessLevel] = useState<DocumentAccessLevel>("shared");


  // Load employee data via the standard hook
  const { employees, loading: empLoading } = useEmployeeData();

  const loadDocuments = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const role = profile?.tenants?.[tenantId]?.role || "employee";
      const [docs, cands] = await Promise.all([
        DocumentService.getDocuments(tenantId, { role, uid: profile?.id || "" }),
        CandidateService.getCandidates(tenantId).catch(() => [] as Candidate[])
      ]);
      setDocuments(docs);
      setCandidates(cands);
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyErrorMessage(err, "Failed to load Document Vault."));
    } finally {
      setLoading(false);
    }
  }, [tenantId, profile]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setUploadFile(file);
    if (file && !docName) {
      // Set default name without extension
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
      setDocName(nameWithoutExt);
    }
  };

  // Handle Upload Submission
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !uploadFile) return;
    
    setUploadLoading(true);
    try {
      let targetName = "";
      let targetUserId = "";

      if (docType === "employee") {
        const emp = employees.find(e => e.id === targetEmployeeId);
        if (emp) {
          targetName = `${emp.firstName} ${emp.lastName}`;
          targetUserId = emp.userId || "";
        }
      } else if (docType === "candidate") {
        const cand = candidates.find(c => c.id === targetCandidateId);
        if (cand) {
          targetName = `${cand.firstName} ${cand.lastName}`;
        }
      }

      await DocumentService.uploadDocument(
        tenantId,
        uploadFile,
        {
          name: docName.trim() || uploadFile.name,
          category: docCategory,
          type: docType,
          ...(docType === "employee" && targetEmployeeId ? { targetId: targetEmployeeId, targetName, targetUserId } : {}),
          ...(docType === "candidate" && targetCandidateId ? { targetId: targetCandidateId, targetName } : {}),
          uploadedBy: profile?.id || "",
          uploadedByName: profile?.displayName || "System User",
          accessLevel
        },
        profile ? { uid: profile.id, email: profile.email } : undefined
      );

      // Reset Form & Close
      setUploadModalOpen(false);
      setUploadFile(null);
      setDocName("");
      setDocCategory("other");
      setDocType("general");
      setTargetEmployeeId("");
      setTargetCandidateId("");
      setAccessLevel("shared");
      
      await loadDocuments();
      showToast("Document uploaded successfully!");
    } catch (err: any) {
      console.error(err);
      showToast(getFriendlyErrorMessage(err, "Failed to upload document."));
    } finally {
      setUploadLoading(false);
    }
  };

  // Handle Document Deletion
  const handleDeleteDoc = async () => {
    if (!deleteDocConfirm) return;
    const docToDelete = deleteDocConfirm;
    setDeleteDocConfirm(null);
    try {
      await DocumentService.deleteDocument(
        tenantId,
        docToDelete.id,
        docToDelete.storagePath,
        docToDelete.name,
        profile ? { uid: profile.id, email: profile.email } : undefined
      );
      await loadDocuments();
      showToast(`Document "${docToDelete.name}" deleted successfully.`);
    } catch (err: any) {
      console.error(err);
      showToast(getFriendlyErrorMessage(err, "Failed to delete document."));
    }
  };


  // Format Helper
  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  // Filter Logic
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.targetName && doc.targetName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory;
    const matchesType = selectedType === "all" || doc.type === selectedType;

    return matchesSearch && matchesCategory && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <HardDrive className="h-6 w-6 text-slate-600" />
            Document Vault
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Secure, encrypted documents repository for employees, candidates, and organizational settings.
          </p>
        </div>

        {canUpload && (
          <button
            onClick={() => setUploadModalOpen(true)}
            className="self-start inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
            style={{ backgroundColor: primaryColor }}
          >
            <Upload size={16} />
            <span>Upload Document</span>
          </button>
        )}
      </div>

      {/* Main Section */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Sidebar Categories Panel */}
        <div className="w-full lg:w-60 shrink-0 space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-3">Categories</div>
          <button
            onClick={() => setSelectedCategory("all")}
            className={`w-full flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-bold text-left transition-all cursor-pointer ${
              selectedCategory === "all"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <span>All Documents</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${selectedCategory === "all" ? "bg-slate-800 text-slate-200" : "bg-slate-200 text-slate-600"}`}>
              {documents.length}
            </span>
          </button>
          
          {CATEGORIES.map((cat) => {
            const count = documents.filter(d => d.category === cat.value).length;
            return (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`w-full flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-bold text-left transition-all cursor-pointer ${
                  selectedCategory === cat.value
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${selectedCategory === cat.value ? "bg-slate-800 text-slate-200" : "bg-slate-200 text-slate-600"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* List Content and Filter Bar */}
        <div className="flex-1 space-y-4 min-w-0">
          
          {/* Filters Dashboard */}
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search documents by name or linked owner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-4 text-xs outline-none focus:border-blue-600/60 focus:ring-2 focus:ring-blue-100 transition-all font-semibold"
              />
            </div>

            {/* Scope tabs */}
            <div className="flex rounded-xl bg-slate-150 p-1 font-bold text-xs">
              <button
                onClick={() => setSelectedType("all")}
                className={`rounded-lg px-3 py-1.5 cursor-pointer transition-colors ${selectedType === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"}`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedType("general")}
                className={`rounded-lg px-3 py-1.5 cursor-pointer transition-colors ${selectedType === "general" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"}`}
              >
                Org Docs
              </button>
              <button
                onClick={() => setSelectedType("employee")}
                className={`rounded-lg px-3 py-1.5 cursor-pointer transition-colors ${selectedType === "employee" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"}`}
              >
                Employee Docs
              </button>
              <button
                onClick={() => setSelectedType("candidate")}
                className={`rounded-lg px-3 py-1.5 cursor-pointer transition-colors ${selectedType === "candidate" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"}`}
              >
                Candidate Docs
              </button>
            </div>

          </div>

          {/* Documents Display */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 rounded-2xl border border-slate-200 bg-white p-4 animate-pulse flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-slate-100 rounded-lg" />
                    <div className="space-y-1.5">
                      <div className="h-3 w-40 bg-slate-100 rounded-sm" />
                      <div className="h-2.5 w-24 bg-slate-100 rounded-sm" />
                    </div>
                  </div>
                  <div className="h-7 w-20 bg-slate-100 rounded-lg" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-center text-rose-700">
              <ShieldAlert className="h-10 w-10 mx-auto mb-2 text-rose-500" />
              <h3 className="font-bold text-sm">Failed to load Document Vault</h3>
              <p className="text-xs text-rose-600 mt-1">{error}</p>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
              <FolderOpen className="h-14 w-14 mx-auto mb-3 text-slate-300" />
              <h3 className="font-bold text-slate-800">No documents found</h3>
              <p className="text-xs text-slate-400 mt-1.5 max-w-sm mx-auto">
                {searchQuery || selectedCategory !== "all" || selectedType !== "all" 
                  ? "Try relaxing your filters or check your permissions rules."
                  : "No documents have been uploaded to the vault yet."}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
              <div className="divide-y divide-slate-100">
                {filteredDocs.map((doc) => {
                  const isPdf = doc.contentType.includes("pdf");
                  const isImage = doc.contentType.startsWith("image/");
                  const catColor = CATEGORIES.find(c => c.value === doc.category)?.color || "bg-slate-50 text-slate-700";

                  return (
                    <div key={doc.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/40 transition-colors">
                      
                      {/* Document Meta */}
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-slate-100 border border-slate-200">
                          {isPdf && <FileText className="h-5 w-5 text-rose-500" />}
                          {!isPdf && isImage && <FileImage className="h-5 w-5 text-blue-500" />}
                          {!isPdf && !isImage && <File className="h-5 w-5 text-slate-400" />}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-sm truncate" title={doc.name}>
                            {doc.name}
                          </h4>
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-slate-400 font-semibold text-[10px] mt-0.5">
                            <span>{formatSize(doc.sizeBytes)}</span>
                            <span>â€¢</span>
                            <span className="flex items-center gap-1">
                              <Calendar size={11} />
                              {formatDate(doc.createdAt)}
                            </span>
                            <span>â€¢</span>
                            <span>Uploaded by {doc.uploadedByName}</span>
                          </div>
                        </div>
                      </div>

                      {/* Info Badges & Actions */}
                      <div className="flex flex-wrap items-center gap-3 justify-between sm:justify-end">
                        
                        {/* Scope/Target details */}
                        {doc.targetName && (
                          <div className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                            Linked: <span className="text-slate-800">{doc.targetName}</span>
                          </div>
                        )}

                        {/* Access Level Badge */}
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-100/60 border border-slate-200/60 rounded-md px-2 py-0.5">
                          {doc.accessLevel === "admin_only" && (
                            <>
                              <Lock size={10} className="text-rose-500" />
                              <span>Admin Only</span>
                            </>
                          )}
                          {doc.accessLevel === "employee_self" && (
                            <>
                              <User size={10} className="text-sky-500" />
                              <span>Employee Self</span>
                            </>
                          )}
                          {doc.accessLevel === "shared" && (
                            <>
                              <Users size={10} className="text-emerald-500" />
                              <span>Shared</span>
                            </>
                          )}
                        </div>

                        {/* Category Badge */}
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase border ${catColor}`}>
                          {doc.category}
                        </span>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-white transition-colors cursor-pointer"
                            title="Preview File"
                          >
                            <Eye size={14} />
                          </button>
                          <a
                            href={doc.downloadUrl}
                            download={doc.name}
                            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-white transition-colors cursor-pointer"
                            title="Download File"
                          >
                            <Download size={14} />
                          </a>
                          {canDelete && (
                            <button
                              onClick={() => setDeleteDocConfirm(doc)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete File"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>

                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* ==================== PREVIEW MODAL ==================== */}
      {previewDoc && (
        <DocumentPreviewModal
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {/* ==================== UPLOAD MODAL ==================== */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl relative overflow-y-auto max-h-[90vh]">
            
            <button
              onClick={() => setUploadModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
              aria-label="Close upload modal"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Upload size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Upload New Document</h3>
                <p className="text-xs text-slate-500">Add secure documents to the tenant repository.</p>
              </div>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs font-bold text-slate-700">
              
              {/* File Select */}
              <div className="space-y-1.5">
                <label className="text-slate-600">Select File *</label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-350 hover:border-blue-500 hover:bg-slate-50/50 rounded-2xl cursor-pointer transition-colors p-4">
                    <div className="flex flex-col items-center justify-center text-center">
                      <Upload className="h-8 w-8 text-slate-400 mb-2" />
                      {uploadFile ? (
                        <div className="text-slate-800 text-xs font-semibold max-w-[300px] truncate">
                          {uploadFile.name} ({formatSize(uploadFile.size)})
                        </div>
                      ) : (
                        <div className="text-slate-500 text-xs">
                          Drag and drop or <span className="text-blue-600 underline">click to browse</span>
                        </div>
                      )}
                      <p className="text-[10px] text-slate-400 mt-1">PDF, DOC, DOCX, PNG, JPG, or WEBP</p>
                    </div>
                    <input
                      type="file"
                      required
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              </div>

              {/* Name Input */}
              <div className="space-y-1.5">
                <label htmlFor="doc-name" className="text-slate-600 font-bold">Document Name *</label>
                <input
                  id="doc-name"
                  type="text"
                  required
                  placeholder="E.g., NDA Contract 2026"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs outline-none focus:border-blue-600/60 focus:ring-2 focus:ring-blue-100 transition-all font-semibold"
                />
              </div>

              {/* Category and Access Level grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="doc-category" className="text-slate-600">Category *</label>
                  <select
                    id="doc-category"
                    value={docCategory}
                    onChange={(e) => setDocCategory(e.target.value as DocumentCategory)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 bg-white text-slate-750 outline-none focus:border-blue-600 transition-all"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="doc-access" className="text-slate-600">Access Control *</label>
                  <select
                    id="doc-access"
                    value={accessLevel}
                    onChange={(e) => setAccessLevel(e.target.value as DocumentAccessLevel)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 bg-white text-slate-750 outline-none focus:border-blue-600 transition-all"
                  >
                    <option value="shared">Shared (All Org)</option>
                    <option value="admin_only">Restricted (Admin & HR)</option>
                    <option value="employee_self">Employee Self (Target Only)</option>
                  </select>
                </div>
              </div>

              {/* Target Type selection */}
              <div className="space-y-1.5">
                <label htmlFor="doc-type" className="text-slate-600">Target Type *</label>
                <select
                  id="doc-type"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as DocumentType)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 bg-white text-slate-750 outline-none focus:border-blue-600 transition-all"
                >
                  <option value="general">General Organization Doc</option>
                  <option value="employee">Employee Specific Doc</option>
                  <option value="candidate">Candidate Specific Doc</option>
                </select>
              </div>

              {/* Target selection list dropdowns */}
              {docType === "employee" && (
                <div className="space-y-1.5 animate-in fade-in duration-200">
                  <label htmlFor="target-employee" className="text-slate-600">Link Employee *</label>
                  {empLoading ? (
                    <div className="h-9 w-full bg-slate-50 border border-slate-200 rounded-xl animate-pulse" />
                  ) : (
                    <select
                      id="target-employee"
                      required
                      value={targetEmployeeId}
                      onChange={(e) => setTargetEmployeeId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 bg-white text-slate-750 outline-none focus:border-blue-600 transition-all"
                    >
                      <option value="">-- Choose Employee --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.firstName} {emp.lastName} ({emp.jobTitle})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {docType === "candidate" && (
                <div className="space-y-1.5 animate-in fade-in duration-200">
                  <label htmlFor="target-candidate" className="text-slate-600">Link Candidate *</label>
                  <select
                    id="target-candidate"
                    required
                    value={targetCandidateId}
                    onChange={(e) => setTargetCandidateId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 bg-white text-slate-750 outline-none focus:border-blue-600 transition-all"
                  >
                    <option value="">-- Choose Candidate --</option>
                    {candidates.map(cand => (
                      <option key={cand.id} value={cand.id}>
                        {cand.firstName} {cand.lastName} â€” {cand.jobTitle}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 mt-6 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadLoading}
                  className="rounded-xl px-5 py-2.5 text-white disabled:opacity-60 cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  {uploadLoading ? "Uploading..." : "Save to Vault"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ==================== DELETE CONFIRMATION MODAL ==================== */}
      {deleteDocConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900">Delete Document</h3>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to permanently delete <span className="font-bold text-slate-800">"{deleteDocConfirm.name}"</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setDeleteDocConfirm(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-650 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteDoc}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TOAST NOTIFICATION ==================== */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom duration-300">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold">
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

    </div>
  );
}

export default DocumentsPage;
```

## `frontend\src\features\documents\components\DocumentPreviewModal.tsx`

```tsx
/**
 * DocumentPreviewModal
 * ---------------------
 * Full-screen modal that previews a single vault document. PDFs render inline
 * in an <iframe>, images render in an <img>, and any other content type falls
 * back to a download prompt. Also exposes "open in tab" and "download" actions.
 */
import React from "react";
import { X, ExternalLink, Download, FileText, FileImage, File } from "lucide-react";
import type { VaultDocument } from "@hrms/middleware";

interface DocumentPreviewModalProps {
  document: VaultDocument;
  onClose: () => void;
}

/**
 * Renders the preview modal for a vault document.
 * @param document - The vault document to preview (provides content type, name, download URL, etc.).
 * @param onClose - Callback invoked when the modal should be dismissed.
 */
export function DocumentPreviewModal({ document, onClose }: DocumentPreviewModalProps) {
  const isPdf = document.contentType.includes("pdf");
  const isImage = document.contentType.startsWith("image/");

  // Convert a raw byte count into a human-readable size (e.g. "1.5 MB").
  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    // Pick the unit index from the magnitude of the value (log base 1024).
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Choose an icon that matches the document's content type.
  const getFileIcon = () => {
    if (isPdf) return <FileText className="h-10 w-10 text-rose-500" />;
    if (isImage) return <FileImage className="h-10 w-10 text-blue-500" />;
    return <File className="h-10 w-10 text-slate-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-4xl h-[85vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3 min-w-0">
            {getFileIcon()}
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900 truncate" title={document.name}>
                {document.name}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {formatSize(document.sizeBytes)} Â· {document.category.toUpperCase()} Â· {document.contentType}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <a
              href={document.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <ExternalLink size={15} />
              Open in Tab
            </a>
            <a
              href={document.downloadUrl}
              download={document.name}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer transition-colors"
            >
              <Download size={15} />
              Download
            </a>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
              aria-label="Close preview"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content/Viewer Area */}
        <div className="flex-1 bg-slate-100 p-4 flex items-center justify-center overflow-auto">
          {isPdf ? (
            <iframe
              src={`${document.downloadUrl}#view=FitH`}
              className="w-full h-full rounded-lg border border-slate-200 bg-white"
              title={document.name}
            />
          ) : isImage ? (
            <div className="max-w-full max-h-full flex items-center justify-center p-4">
              <img
                src={document.downloadUrl}
                alt={document.name}
                className="max-w-full max-h-[70vh] rounded-lg shadow-md object-contain bg-white p-2 border border-slate-200"
              />
            </div>
          ) : (
            <div className="text-center p-8 max-w-md rounded-2xl bg-white border border-slate-200 shadow-sm">
              <File className="h-16 w-16 text-slate-300 mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-bold text-slate-800">Preview not available</h3>
              <p className="text-sm text-slate-500 mt-2">
                This file type ({document.contentType}) cannot be previewed directly in the browser.
              </p>
              <a
                href={document.downloadUrl}
                download={document.name}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                <Download size={16} />
                Download File to View
              </a>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}

export default DocumentPreviewModal;
```

## `frontend\src\features\documents\services\documentService.ts`

```ts
import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "../../../lib/firebase";
import type { VaultDocument } from "@hrms/middleware";
import { AuditLogService } from "../../settings/services/auditLogService";
import { getReadableScopes, type DocumentAccessContext } from "./documentAccess";

export type { DocumentAccessContext } from "./documentAccess";

type CallerInfo = { uid: string; email: string };

function rid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
}

export const DocumentService = {
  /**
   * Fetches the vault documents the caller is allowed to read.
   *
   * Rather than querying every tenant document (which fails with
   * permission-denied for non-admin roles, because Firestore rules do not
   * filter results), this issues one query per permitted read scope and
   * merges the results, de-duplicating by document id.
   */
  async getDocuments(
    tenantId: string,
    access: DocumentAccessContext
  ): Promise<VaultDocument[]> {
    const col = collection(db, "documents");
    const scopes = getReadableScopes(access.role);

    const queries = scopes.map((scope) => {
      switch (scope) {
        case "all":
          return query(col, where("tenantId", "==", tenantId));
        case "shared":
          return query(col, where("tenantId", "==", tenantId), where("accessLevel", "==", "shared"));
        case "self":
          return query(col, where("tenantId", "==", tenantId), where("targetUserId", "==", access.uid));
        case "candidate":
          return query(col, where("tenantId", "==", tenantId), where("type", "==", "candidate"));
      }
    });

    const snaps = await Promise.all(queries.map((q) => getDocs(q)));

    // Merge & de-duplicate (a document can match more than one scope).
    const byId = new Map<string, VaultDocument>();
    snaps.forEach((snap) => snap.forEach((d) => byId.set(d.id, d.data() as VaultDocument)));

    // Sort client-side by date descending
    return Array.from(byId.values()).sort((a, b) => b.createdAt - a.createdAt);
  },

  /**
   * Uploads a document to storage and saves metadata in Firestore.
   */
  async uploadDocument(
    tenantId: string,
    file: File,
    metadata: Omit<
      VaultDocument,
      | "id"
      | "tenantId"
      | "createdAt"
      | "updatedAt"
      | "sizeBytes"
      | "contentType"
      | "storagePath"
      | "downloadUrl"
    >,
    caller?: CallerInfo
  ): Promise<VaultDocument> {
    const docId = rid("doc");
    
    // Scoped storage path: tenants/{tenantId}/documents/{docId}
    const storagePath = `tenants/${tenantId}/documents/${docId}`;
    const storageRef = ref(storage, storagePath);
    
    // Upload file
    await uploadBytes(storageRef, file, { contentType: file.type });
    const downloadUrl = await getDownloadURL(storageRef);
    
    const now = Date.now();
    const vaultDoc: VaultDocument = {
      ...metadata,
      id: docId,
      tenantId,
      createdAt: now,
      updatedAt: now,
      sizeBytes: file.size,
      contentType: file.type,
      storagePath,
      downloadUrl,
    };
    
    // Save metadata in Firestore
    await setDoc(doc(db, "documents", docId), vaultDoc);
    
    // Create audit log
    if (caller) {
      await AuditLogService.createAuditLog(tenantId, {
        userId: caller.uid,
        userEmail: caller.email,
        action: "create",
        resource: "employee", // Map it to employee for standard resource schema or auditLog schema
        resourceId: docId,
        details: `Uploaded document "${vaultDoc.name}" in category "${vaultDoc.category}" (${vaultDoc.type} doc)`,
      });
    }
    
    return vaultDoc;
  },

  /**
   * Deletes a document from storage and Firestore.
   */
  async deleteDocument(
    tenantId: string,
    docId: string,
    storagePath: string,
    documentName: string,
    caller?: CallerInfo
  ): Promise<void> {
    // 1. Delete from Storage
    try {
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
    } catch (error) {
      console.warn("Storage file deletion failed or file did not exist:", error);
      // Continue deleting Firestore record even if storage deletion fails
    }

    // 2. Delete from Firestore
    await deleteDoc(doc(db, "documents", docId));

    // 3. Log action
    if (caller) {
      await AuditLogService.createAuditLog(tenantId, {
        userId: caller.uid,
        userEmail: caller.email,
        action: "delete",
        resource: "employee",
        resourceId: docId,
        details: `Deleted vault document "${documentName}"`,
      });
    }
  },
};
```

## `frontend\src\features\documents\services\documentAccess.ts`

```ts
/**
 * Pure, Firebase-free helpers describing which vault documents a role may read.
 * Kept separate from documentService so it can be unit-tested without
 * initializing the Firebase SDK.
 *
 * These scopes mirror the `/documents` read rule in firestore.rules. They exist
 * because Firestore security rules are NOT filters: a query that could return a
 * single unreadable document fails entirely with permission-denied. The client
 * must therefore issue narrow queries that each match an allowed read condition.
 */

/** Identity needed to scope document reads to what firestore.rules permits. */
export type DocumentAccessContext = { role: string; uid: string };

/** Read scope a query can satisfy while remaining rule-compliant. */
export type DocumentReadScope = "all" | "shared" | "self" | "candidate";

/** Roles that may read every document in the tenant (full "all" scope). */
export const FULL_ACCESS_ROLES = ["super_admin", "org_admin", "hr_manager"];

/**
 * Returns the set of read scopes a role is permitted:
 *  - "all":       every document in the tenant
 *  - "shared":    documents with accessLevel == 'shared'
 *  - "self":      documents whose targetUserId == the caller's uid
 *  - "candidate": documents with type == 'candidate'
 */
export function getReadableScopes(role: string): DocumentReadScope[] {
  if (FULL_ACCESS_ROLES.includes(role)) return ["all"];
  if (role === "recruiter") return ["shared", "self", "candidate"];
  // employees and custom roles: only org-shared docs and docs targeted to them
  return ["shared", "self"];
}
```

## `frontend\src\features\documents\services\documents.test.ts`

```ts
import { describe, it, expect, vi } from "vitest";
import type { VaultDocument, DocumentCategory, DocumentType, DocumentAccessLevel, SystemRoleType } from "@hrms/middleware";
import { SYSTEM_ROLES } from "@hrms/middleware";
import { getReadableScopes } from "./documentAccess";

// Standard mock fixtures for testing
function makeDoc(overrides: Partial<VaultDocument> = {}): VaultDocument {
  return {
    id: "doc_1",
    tenantId: "t1",
    name: "Standard Resume",
    category: "resume",
    type: "candidate",
    targetId: "cand_1",
    uploadedBy: "u1",
    uploadedByName: "Hr Member",
    createdAt: 1000,
    updatedAt: 1000,
    sizeBytes: 1024 * 1024,
    contentType: "application/pdf",
    storagePath: "tenants/t1/documents/doc_1",
    downloadUrl: "https://mock-storage.firebase/doc_1",
    accessLevel: "shared",
    ...overrides,
  };
}

// Client filtering helper logic (usually run inside DocumentsPage.tsx)
function filterDocs(
  docs: VaultDocument[],
  filters: { query?: string; category?: string; type?: string }
): VaultDocument[] {
  return docs.filter((doc) => {
    const query = (filters.query || "").toLowerCase();
    const matchesSearch = 
      doc.name.toLowerCase().includes(query) ||
      (doc.targetName && doc.targetName.toLowerCase().includes(query));
    
    const matchesCategory = !filters.category || filters.category === "all" || doc.category === filters.category;
    const matchesType = !filters.type || filters.type === "all" || doc.type === filters.type;

    return matchesSearch && matchesCategory && matchesType;
  });
}

// Access evaluation logic mimicking firestore.rules and storage.rules
function evaluateAccess(
  doc: VaultDocument,
  user: { uid: string; role: string; tenantId: string }
): boolean {
  if (user.tenantId !== doc.tenantId) return false;
  
  // Admins & HR Managers always have access
  if (["super_admin", "org_admin", "hr_manager"].includes(user.role)) return true;
  
  // Recruiters have access to candidate documents
  if (user.role === "recruiter" && doc.type === "candidate") return true;
  
  // Employees have access to shared documents, or documents targeted specifically to their userId
  if (doc.accessLevel === "shared") return true;
  if (doc.targetUserId && doc.targetUserId === user.uid) return true;

  return false;
}

describe("Document Category and Filtering", () => {
  const docs = [
    makeDoc({ id: "1", name: "Job Contract NDA", category: "contract", type: "employee" }),
    makeDoc({ id: "2", name: "Ada Resume", category: "resume", type: "candidate", targetName: "Ada Lovelace" }),
    makeDoc({ id: "3", name: "Office Policy Manual", category: "policy", type: "general" }),
  ];

  it("filters by query matching document name case-insensitively", () => {
    const results = filterDocs(docs, { query: "contract" });
    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe("1");
  });

  it("filters by query matching target owner name", () => {
    const results = filterDocs(docs, { query: "Ada" });
    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe("2");
  });

  it("filters by category", () => {
    const results = filterDocs(docs, { category: "policy" });
    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe("3");
  });

  it("filters by type (employee, candidate, general)", () => {
    const results = filterDocs(docs, { type: "candidate" });
    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe("2");
  });

  it("combines multiple filter parameters", () => {
    const results = filterDocs(docs, { category: "contract", type: "employee" });
    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe("1");
  });

  it("returns all when filter parameters are set to 'all' or empty", () => {
    const results = filterDocs(docs, { category: "all", type: "all" });
    expect(results).toHaveLength(3);
  });
});

describe("Document Vault RBAC & Access Control Rules", () => {
  const adminUser = { uid: "admin_u", role: "org_admin", tenantId: "t1" };
  const hrUser = { uid: "hr_u", role: "hr_manager", tenantId: "t1" };
  const recruiterUser = { uid: "recruiter_u", role: "recruiter", tenantId: "t1" };
  const employeeUser = { uid: "emp_u", role: "employee", tenantId: "t1" };
  const otherTenantUser = { uid: "other_u", role: "org_admin", tenantId: "t2" };

  const contractDoc = makeDoc({ 
    id: "contract_1", 
    type: "employee", 
    category: "contract", 
    accessLevel: "admin_only" 
  });
  
  const personalPayslipDoc = makeDoc({ 
    id: "slip_1", 
    type: "employee", 
    category: "payslip", 
    accessLevel: "employee_self",
    targetUserId: "emp_u" 
  });
  
  const sharedPolicyDoc = makeDoc({ 
    id: "policy_1", 
    type: "general", 
    category: "policy", 
    accessLevel: "shared" 
  });
  
  const candidateDoc = makeDoc({ 
    id: "resume_1", 
    type: "candidate", 
    category: "resume" 
  });

  it("denies access to users from different tenants", () => {
    expect(evaluateAccess(sharedPolicyDoc, otherTenantUser)).toBe(false);
    expect(evaluateAccess(contractDoc, otherTenantUser)).toBe(false);
  });

  it("allows Org Admin and HR Manager to access all documents", () => {
    // Contract
    expect(evaluateAccess(contractDoc, adminUser)).toBe(true);
    expect(evaluateAccess(contractDoc, hrUser)).toBe(true);
    // Payslip
    expect(evaluateAccess(personalPayslipDoc, adminUser)).toBe(true);
    expect(evaluateAccess(personalPayslipDoc, hrUser)).toBe(true);
    // Shared
    expect(evaluateAccess(sharedPolicyDoc, adminUser)).toBe(true);
    expect(evaluateAccess(sharedPolicyDoc, hrUser)).toBe(true);
  });

  it("allows Recruiters to access candidate documents, but denies employee contracts and payslips", () => {
    expect(evaluateAccess(candidateDoc, recruiterUser)).toBe(true);
    expect(evaluateAccess(contractDoc, recruiterUser)).toBe(false);
    expect(evaluateAccess(personalPayslipDoc, recruiterUser)).toBe(false);
  });

  it("allows employees to see general shared documents and their own target documents, but denies other private files", () => {
    // Shared policy
    expect(evaluateAccess(sharedPolicyDoc, employeeUser)).toBe(true);
    // Self payslip
    expect(evaluateAccess(personalPayslipDoc, employeeUser)).toBe(true);
    // Other employee contract
    expect(evaluateAccess(contractDoc, employeeUser)).toBe(false);
  });
});

describe("getReadableScopes â€” query scoping mirrors firestore.rules", () => {
  it("grants admins/HR full-tenant read scope", () => {
    expect(getReadableScopes("super_admin")).toEqual(["all"]);
    expect(getReadableScopes("org_admin")).toEqual(["all"]);
    expect(getReadableScopes("hr_manager")).toEqual(["all"]);
  });

  it("grants recruiters shared, self, and candidate scopes (never 'all')", () => {
    const scopes = getReadableScopes("recruiter");
    expect(scopes).toContain("shared");
    expect(scopes).toContain("self");
    expect(scopes).toContain("candidate");
    expect(scopes).not.toContain("all");
  });

  it("limits employees to shared + self scopes only", () => {
    expect(getReadableScopes("employee")).toEqual(["shared", "self"]);
  });

  it("treats unknown/custom roles conservatively (shared + self only)", () => {
    expect(getReadableScopes("custom_role_xyz")).toEqual(["shared", "self"]);
  });

  it("never returns the broad 'all' scope for non-admin roles", () => {
    for (const role of ["recruiter", "employee", "custom_role_xyz"]) {
      expect(getReadableScopes(role)).not.toContain("all");
    }
  });
});

// Mirrors the permission-driven CREATE rule in firestore.rules:
//   hasPermission(tenantId, 'documents.create')
//     || (role == 'recruiter' && type == 'candidate')
// System-role permissions come from the real SYSTEM_ROLES map; custom roles
// supply their own permission list (resolved from /roles at runtime).
function hasDocPermission(
  ctx: { role: string; customPermissions?: string[] },
  permission: "documents.create" | "documents.update" | "documents.delete"
): boolean {
  const sys = SYSTEM_ROLES[ctx.role as SystemRoleType];
  if (sys) return (sys.permissions as string[]).includes(permission);
  return (ctx.customPermissions || []).includes(permission);
}

function evaluateCanCreate(
  doc: VaultDocument,
  ctx: { role: string; tenantId: string; customPermissions?: string[] }
): boolean {
  if (ctx.tenantId !== doc.tenantId) return false;
  if (hasDocPermission(ctx, "documents.create")) return true;
  if (ctx.role === "recruiter" && doc.type === "candidate") return true;
  return false;
}

describe("Document CREATE â€” permission-driven (RBAC matrix honored)", () => {
  const employeeDoc = makeDoc({ id: "c1", type: "employee", category: "contract", accessLevel: "employee_self" });
  const candidateDoc = makeDoc({ id: "c2", type: "candidate", category: "resume" });

  it("allows admins and HR (system roles carry documents.create)", () => {
    for (const role of ["super_admin", "org_admin", "hr_manager"]) {
      expect(evaluateCanCreate(employeeDoc, { role, tenantId: "t1" })).toBe(true);
    }
  });

  it("denies the built-in employee role (no documents.create) â€” unchanged", () => {
    expect(evaluateCanCreate(employeeDoc, { role: "employee", tenantId: "t1" })).toBe(false);
    expect(evaluateCanCreate(candidateDoc, { role: "employee", tenantId: "t1" })).toBe(false);
  });

  it("preserves recruiter candidate-doc special case, but not employee docs", () => {
    expect(evaluateCanCreate(candidateDoc, { role: "recruiter", tenantId: "t1" })).toBe(true);
    expect(evaluateCanCreate(employeeDoc, { role: "recruiter", tenantId: "t1" })).toBe(false);
  });

  it("ALLOWS a custom role granted documents.create (the option-2 capability)", () => {
    const customWithCreate = { role: "role_uploader", tenantId: "t1", customPermissions: ["documents.view", "documents.create"] };
    expect(evaluateCanCreate(employeeDoc, customWithCreate)).toBe(true);
    expect(evaluateCanCreate(candidateDoc, customWithCreate)).toBe(true);
  });

  it("denies a custom role that was NOT granted documents.create", () => {
    const customViewOnly = { role: "role_viewer", tenantId: "t1", customPermissions: ["documents.view"] };
    expect(evaluateCanCreate(employeeDoc, customViewOnly)).toBe(false);
  });

  it("denies cross-tenant creation regardless of permission", () => {
    expect(evaluateCanCreate(employeeDoc, { role: "org_admin", tenantId: "t2" })).toBe(false);
  });
});
```

## `frontend\src\features\teams\pages\TeamsListPage.tsx`

```tsx
/**
 * TeamsListPage
 * -----------------------------------------------------------------------------
 * Lists, creates, edits, and deletes teams for the active tenant. Teams belong
 * to a department and carry an optional lead plus a member roster. Data is
 * loaded alongside departments and employees (scoped by the caller's data
 * access level). Mutating actions are gated behind RBAC permission checks
 * (teams.create / teams.update / teams.delete).
 */
import { getFriendlyErrorMessage } from "../../../lib/errors";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../auth/context/AuthContext";
import { useHasPermission } from "../../rbac/hooks/usePermissions";
import { TeamService } from "../services/teamService";
import { EmployeeService } from "../../employees/services/employeeService";
import { Skeleton } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/ErrorState";
import { EmptyState } from "../../../components/ui/EmptyState";
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  X,
  Network,
  Search,
  UserCheck,
  FolderTree,
} from "lucide-react";
import type { Team, Department, Employee } from "@hrms/middleware";

/**
 * Renders the teams management page: a searchable/filterable grid of team
 * cards plus a create/edit modal. Reads auth context for tenant scoping and
 * RBAC permissions, and refreshes data after each successful mutation.
 */
export function TeamsListPage() {
  const { profile, user, dataAccessLevel } = useAuth();
  const tenantId = profile?.activeTenantId || "";

  // Permissions
  const hasPerm = useHasPermission();
  const canCreateTeam = hasPerm("teams.create");
  const canEditTeam = hasPerm("teams.update");
  const canDeleteTeam = hasPerm("teams.delete");

  const callerInfo = user ? { uid: user.uid, email: user.email || "" } : undefined;

  // Data state
  const [teams, setTeams] = useState<Team[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [callerEmployee, setCallerEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  // Form inputs
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);

    try {
      let resolvedCallerEmp: Employee | null = null;
      if (user?.uid) {
        resolvedCallerEmp = await EmployeeService.getCallerEmployee(tenantId, user.uid);
      }
      setCallerEmployee(resolvedCallerEmp);

      const [teamsData, deptsData, empsData] = await Promise.all([
        TeamService.getTeams(tenantId),
        EmployeeService.getDepartments(tenantId),
        EmployeeService.getEmployees(tenantId, dataAccessLevel, resolvedCallerEmp),
      ]);
      setTeams(teamsData);
      setDepartments(deptsData);
      setEmployees(empsData);
    } catch (err: unknown) {
      const message = getFriendlyErrorMessage(err, "Failed to load teams.");
      console.error("Error loading teams:", err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [tenantId, user, dataAccessLevel]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open Create modal
  const handleOpenCreate = () => {
    setEditingTeam(null);
    setTeamName("");
    setTeamDescription("");
    const firstDept = departments[0];
    setSelectedDeptId(firstDept ? firstDept.id : "");
    setSelectedLeadId("");
    setSelectedMemberIds([]);
    setModalOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (team: Team) => {
    setEditingTeam(team);
    setTeamName(team.name);
    setTeamDescription(team.description);
    setSelectedDeptId(team.departmentId);
    setSelectedLeadId(team.leadId || "");
    setSelectedMemberIds([...team.memberIds]);
    setModalOpen(true);
  };

  // Submit create/update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setSaveLoading(true);

    const teamData: Omit<Team, "id" | "tenantId" | "createdAt" | "updatedAt"> = {
      name: teamName,
      description: teamDescription,
      departmentId: selectedDeptId,
      memberIds: selectedMemberIds,
    };

    if (selectedLeadId) {
      teamData.leadId = selectedLeadId;
    }

    try {
      if (editingTeam) {
        await TeamService.updateTeam(editingTeam.id, teamData, callerInfo);
        alert("Team updated successfully!");
      } else {
        await TeamService.createTeam(tenantId, teamData, callerInfo);
        alert("Team created successfully!");
      }
      setModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const message = getFriendlyErrorMessage(err, "Failed to save team.");
      console.error(err);
      alert(message);
    } finally {
      setSaveLoading(false);
    }
  };

  // Delete team
  const handleDeleteTeam = async (teamId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete team "${name}"?`)) return;
    try {
      await TeamService.deleteTeam(teamId, callerInfo);
      alert("Team deleted.");
      fetchData();
    } catch (err: unknown) {
      const message = getFriendlyErrorMessage(err, "Failed to delete team.");
      console.error(err);
      alert(message);
    }
  };

  // Toggle member selection
  const toggleMember = (empId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  // Filter teams
  const filteredTeams = teams.filter((team) => {
    const matchesSearch = team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptFilter === "all" || team.departmentId === deptFilter;
    return matchesSearch && matchesDept;
  });

  // Helpers
  const getDeptName = (deptId: string) =>
    departments.find((d) => d.id === deptId)?.name || "Unassigned";

  const getEmployeeName = (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    return emp ? `${emp.firstName} ${emp.lastName}` : "Unknown";
  };

  const getEmployeeInitials = (empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    return emp
      ? `${emp.firstName.substring(0, 1)}${emp.lastName.substring(0, 1)}`
      : "??";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState description={error} onRetry={fetchData} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Teams</h1>
          <p className="text-sm text-slate-500">
            Manage cross-functional teams within your organization's departments.
          </p>
        </div>

        {canCreateTeam && (
          <button
            onClick={handleOpenCreate}
            className="self-start inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <Plus size={16} />
            <span>Create Team</span>
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search teams by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-4 text-xs outline-none focus:border-blue-600/60 focus:ring-2 focus:ring-blue-100 transition-all font-semibold"
          />
        </div>

        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-blue-600 text-slate-700"
        >
          <option value="all">All Departments</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>

        <div className="text-xs font-bold text-slate-500">
          {filteredTeams.length} team{filteredTeams.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Team Cards Grid */}
      {filteredTeams.length === 0 ? (
        <EmptyState
          title="No teams found"
          description={
            teams.length === 0
              ? "Your organization hasn't created any teams yet. Start by creating your first team."
              : "No teams match your current search or filter. Try adjusting your criteria."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTeams.map((team) => {
            const memberCount = team.memberIds.length;
            const leadName = team.leadId
              ? getEmployeeName(team.leadId)
              : "No lead assigned";
            const deptName = getDeptName(team.departmentId);

            return (
              <div
                key={team.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow relative group"
              >
                {/* Action Buttons */}
                {(canEditTeam || canDeleteTeam) && (
                  <div className="absolute right-4 top-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {canEditTeam && (
                      <button
                        onClick={() => handleOpenEdit(team)}
                        className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 cursor-pointer"
                        title="Edit Team"
                      >
                        <Edit2 size={14} />
                      </button>
                    )}
                    {canDeleteTeam && (
                      <button
                        onClick={() => handleDeleteTeam(team.id, team.name)}
                        className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
                        title="Delete Team"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )}

                {/* Team Info */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <Network size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{team.name}</h3>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold">
                        <FolderTree size={10} />
                        <span>{deptName}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal pt-1">
                    {team.description || "No description provided."}
                  </p>
                </div>

                {/* Team Lead & Members */}
                <div className="border-t border-slate-100 pt-3 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Team Lead
                      </div>
                      <div className="font-semibold text-slate-700 mt-0.5 flex items-center gap-1.5">
                        <UserCheck size={12} className="text-indigo-500" />
                        {leadName}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Members
                      </div>
                      <div className="font-extrabold text-indigo-600 text-sm mt-0.5">
                        {memberCount}
                      </div>
                    </div>
                  </div>

                  {/* Member Avatars */}
                  {memberCount > 0 && (
                    <div className="flex items-center -space-x-2">
                      {team.memberIds.slice(0, 5).map((memberId) => (
                        <div
                          key={memberId}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[9px] font-extrabold text-slate-600 border-2 border-white"
                          title={getEmployeeName(memberId)}
                        >
                          {getEmployeeInitials(memberId)}
                        </div>
                      ))}
                      {memberCount > 5 && (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-[9px] font-extrabold text-indigo-600 border-2 border-white">
                          +{memberCount - 5}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==================== CREATE / EDIT TEAM MODAL ==================== */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-md relative overflow-y-auto max-h-[90dvh] space-y-4">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Network size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">
                  {editingTeam ? "Edit Team" : "Create New Team"}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingTeam
                    ? "Update team details, lead assignment, and member roster."
                    : "Assemble a new team under an organizational department."}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Team Name */}
                <div>
                  <label
                    htmlFor="team-name"
                    className="text-slate-600 font-bold block mb-1"
                  >
                    Team Name
                  </label>
                  <input
                    id="team-name"
                    type="text"
                    required
                    placeholder="e.g. Frontend Squad"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-600 transition-all font-semibold"
                  />
                </div>

                {/* Department */}
                <div>
                  <label
                    htmlFor="team-dept"
                    className="text-slate-600 font-bold block mb-1"
                  >
                    Department
                  </label>
                  <select
                    id="team-dept"
                    required
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-600 font-semibold"
                  >
                    <option value="">Select a department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="team-desc"
                  className="text-slate-600 font-bold block mb-1"
                >
                  Description
                </label>
                <input
                  id="team-desc"
                  type="text"
                  placeholder="e.g. Responsible for all client-facing UI development"
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-600 transition-all font-semibold"
                />
              </div>

              {/* Team Lead */}
              <div>
                <label
                  htmlFor="team-lead"
                  className="text-slate-600 font-bold block mb-1"
                >
                  Team Lead
                </label>
                <select
                  id="team-lead"
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-blue-600 font-semibold"
                >
                  <option value="">No Lead Assigned</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} â€” {emp.jobTitle}
                    </option>
                  ))}
                </select>
              </div>

              {/* Member Selection */}
              <div>
                <label className="text-slate-600 font-bold block mb-2">
                  Team Members ({selectedMemberIds.length} selected)
                </label>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                  {employees.length === 0 ? (
                    <div className="px-4 py-6 text-center text-slate-400 text-xs">
                      No employees found. Create employees first.
                    </div>
                  ) : (
                    employees.map((emp) => {
                      const isSelected = selectedMemberIds.includes(emp.id);
                      return (
                        <label
                          key={emp.id}
                          className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-indigo-50/60"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleMember(emp.id)}
                            className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-200"
                          />
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[9px] font-extrabold text-slate-600">
                            {emp.firstName.substring(0, 1)}
                            {emp.lastName.substring(0, 1)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-slate-900 font-semibold">
                              {emp.firstName} {emp.lastName}
                            </span>
                            <span className="ml-2 text-slate-400">
                              {emp.jobTitle}
                            </span>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end border-t border-slate-100 pt-4 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {saveLoading
                    ? "Saving..."
                    : editingTeam
                    ? "Update Team"
                    : "Create Team"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Additive default export; named export `TeamsListPage` is preserved above.
export default TeamsListPage;
```

## `frontend\src\features\teams\services\teamService.ts`

```ts
/**
 * teamService
 * -----------------------------------------------------------------------------
 * Firestore-backed service for managing team documents within a tenant.
 * Supports listing, creating, updating, and deleting teams, and emits audit
 * log entries (via AuditLogService) when caller information is supplied.
 */
import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type { Team } from "@hrms/middleware";
import { AuditLogService } from "../../settings/services/auditLogService";

/**
 * Service to manage teams within a tenant.
 * Follows the same pattern as EmployeeService department methods.
 */
export const TeamService = {
  /**
   * Fetches all teams for a tenant.
   */
  async getTeams(tenantId: string): Promise<Team[]> {
    const q = query(collection(db, "teams"), where("tenantId", "==", tenantId));
    const snap = await getDocs(q);
    const list: Team[] = [];
    snap.forEach((docSnap) => {
      list.push(docSnap.data() as Team);
    });
    return list;
  },

  /**
   * Creates a new team.
   */
  async createTeam(
    tenantId: string,
    data: Omit<Team, "id" | "tenantId" | "createdAt" | "updatedAt">,
    callerInfo?: { uid: string; email: string }
  ): Promise<Team> {
    const id = `team_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    const now = Date.now();
    const team: Team = {
      ...data,
      id,
      tenantId,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db, "teams", id), team);

    if (callerInfo) {
      await AuditLogService.createAuditLog(tenantId, {
        userId: callerInfo.uid,
        userEmail: callerInfo.email,
        action: "create",
        resource: "team",
        resourceId: id,
        details: `Created team "${team.name}"`,
      });
    }

    return team;
  },

  /**
   * Updates an existing team.
   */
  async updateTeam(
    teamId: string,
    data: Partial<Omit<Team, "id" | "tenantId" | "createdAt" | "updatedAt">>,
    callerInfo?: { uid: string; email: string }
  ): Promise<void> {
    const ref = doc(db, "teams", teamId);

    if (callerInfo) {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const oldTeam = snap.data() as Team;
        await AuditLogService.createAuditLog(oldTeam.tenantId, {
          userId: callerInfo.uid,
          userEmail: callerInfo.email,
          action: "update",
          resource: "team",
          resourceId: teamId,
          details: `Updated team "${oldTeam.name}" details. Changes: ${JSON.stringify(data)}`,
        });
      }
    }

    await updateDoc(ref, {
      ...data,
      updatedAt: Date.now(),
    });
  },

  /**
   * Deletes a team.
   */
  async deleteTeam(
    teamId: string,
    callerInfo?: { uid: string; email: string }
  ): Promise<void> {
    if (callerInfo) {
      const snap = await getDoc(doc(db, "teams", teamId));
      if (snap.exists()) {
        const team = snap.data() as Team;
        await AuditLogService.createAuditLog(team.tenantId, {
          userId: callerInfo.uid,
          userEmail: callerInfo.email,
          action: "delete",
          resource: "team",
          resourceId: teamId,
          details: `Deleted team "${team.name}"`,
        });
      }
    }
    await deleteDoc(doc(db, "teams", teamId));
  },
};
```

## `frontend\src\features\settings\pages\SettingsPage.tsx`

```tsx
/**
 * SettingsPage
 * -----------------------------------------------------------------------------
 * Organization settings screen for a tenant. Provides three tabbed sections:
 *   1. Details   â€“ company name, industry, timezone, address, and logo upload.
 *   2. Branding  â€“ primary brand color, support email, and a live preview.
 *   3. Audit     â€“ a filterable, read-only view of the tenant's audit trail.
 *
 * Mutations (details/branding) write to the tenant document in Firestore and
 * emit audit-log entries. Editing controls are gated behind tenant role checks
 * (org_admin / super_admin / hr_manager).
 */
import { getFriendlyErrorMessage } from "../../../lib/errors";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../../lib/firebase";
import { useAuth } from "../../auth/context/AuthContext";
import { useHasPermission } from "../../rbac/hooks/usePermissions";
import { Skeleton } from "../../../components/ui/Skeleton";
import { Building2, Upload, MapPin, Globe, CheckCircle, Palette, Activity, Mail, RefreshCw, Check } from "lucide-react";
import { AuditLogService } from "../services/auditLogService";
import type { AuditLog } from "@hrms/middleware";

const settingsSchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters"),
  industry: z.string().min(2, "Please enter an industry"),
  timezone: z.string().min(2, "Please select a timezone"),
  address: z.string().min(5, "Please enter a valid company address"),
});

type SettingsForm = z.infer<typeof settingsSchema>;

const COLOR_PRESETS = [
  { value: "#2563eb", label: "Classic Blue" },
  { value: "#7c3aed", label: "Deep Purple" },
  { value: "#4f46e5", label: "Indigo Accent" },
  { value: "#10b981", label: "Emerald Green" },
  { value: "#f43f5e", label: "Rose Petal" },
  { value: "#d97706", label: "Amber Glow" },
  { value: "#475569", label: "Slate Grey" },
  { value: "#ea580c", label: "Vibrant Orange" },
];

/**
 * Renders the organization settings page with tabbed Details, Branding, and
 * Audit Logs sections. Reads the active tenant/profile from auth context and
 * persists changes to the tenant document while recording audit entries.
 */
export function SettingsPage() {
  const { activeTenant, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"details" | "branding" | "audit">("details");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Logo upload state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Custom branding states
  const [brandingColor, setBrandingColor] = useState("#2563eb");
  const [supportEmail, setSupportEmail] = useState("");
  const [savingBranding, setSavingBranding] = useState(false);

  // Audit Logs states
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditFilterAction, setAuditFilterAction] = useState("all");
  const [auditFilterResource, setAuditFilterResource] = useState("all");

  const tenantId = profile?.activeTenantId || "";
  const primaryColor = activeTenant?.primaryColor || "#2563eb";

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: "",
      industry: "",
      timezone: "",
      address: "",
    },
  });

  useEffect(() => {
    if (activeTenant) {
      setValue("name", activeTenant.name);
      setValue("industry", activeTenant.industry);
      setValue("timezone", activeTenant.timezone);
      setValue("address", activeTenant.address);
      if (activeTenant.logoURL) {
        setLogoPreview(activeTenant.logoURL);
      }
      setBrandingColor(activeTenant.primaryColor || "#2563eb");
      setSupportEmail(activeTenant.supportEmail || "");
    }
  }, [activeTenant, setValue]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const onDetailsSubmit = async (data: SettingsForm) => {
    if (!tenantId || !profile) return;

    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      let finalLogoURL = activeTenant?.logoURL || null;

      if (logoFile) {
        setUploadingLogo(true);
        const logoRef = ref(storage, `tenants/${tenantId}/logos/logo_${Date.now()}`);
        const uploadResult = await uploadBytes(logoRef, logoFile);
        finalLogoURL = await getDownloadURL(uploadResult.ref);
        setUploadingLogo(false);
      }

      const tenantRef = doc(db, "tenants", tenantId);
      await updateDoc(tenantRef, {
        name: data.name,
        industry: data.industry,
        timezone: data.timezone,
        address: data.address,
        logoURL: finalLogoURL,
        updatedAt: Date.now(),
      });

      // Write Audit Log
      await AuditLogService.createAuditLog(tenantId, {
        userId: profile.id,
        userEmail: profile.email,
        action: "update",
        resource: "tenant",
        resourceId: tenantId,
        details: `Updated company details (Name: "${data.name}", Industry: "${data.industry}")`,
      });

      setSuccess(true);
      setLogoFile(null);
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyErrorMessage(err, "Failed to save organization settings."));
    } finally {
      setSaving(false);
    }
  };

  const onBrandingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !profile) return;

    setSavingBranding(true);
    setSuccess(false);
    setError(null);

    try {
      const tenantRef = doc(db, "tenants", tenantId);
      await updateDoc(tenantRef, {
        primaryColor: brandingColor,
        supportEmail: supportEmail,
        updatedAt: Date.now(),
      });

      // Write Audit Log
      await AuditLogService.createAuditLog(tenantId, {
        userId: profile.id,
        userEmail: profile.email,
        action: "branding_change",
        resource: "tenant",
        resourceId: tenantId,
        details: `Updated branding settings (Primary Color: "${brandingColor}", Support Email: "${supportEmail}")`,
      });

      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(getFriendlyErrorMessage(err, "Failed to save branding settings."));
    } finally {
      setSavingBranding(false);
    }
  };

  const fetchAuditLogs = async () => {
    if (!tenantId) return;
    setLoadingAudit(true);
    try {
      const logs = await AuditLogService.getAuditLogs(tenantId);
      setAuditLogs(logs);
    } catch (err: any) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (activeTab === "audit") {
      fetchAuditLogs();
    }
  }, [activeTab, tenantId]);

  const hasPermission = useHasPermission();
  const isAuthorizedToManage = hasPermission("roles.update");

  if (!activeTenant) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Filter logs locally
  const filteredAuditLogs = auditLogs.filter((log) => {
    const logAction = log.action as string;
    const logResource = (log.resource || "role") as string;
    if (auditFilterAction !== "all" && logAction !== auditFilterAction) {
      // support legacy action checks if mapping isn't fully completed in some older logs
      const isLegacyMatch = 
        (auditFilterAction === "create" && logAction === "role.create") ||
        (auditFilterAction === "update" && logAction === "role.update") ||
        (auditFilterAction === "delete" && logAction === "role.delete") ||
        (auditFilterAction === "role_change" && (logAction === "user.role_assign" || logAction === "user.role_remove"));
      if (!isLegacyMatch) return false;
    }
    if (auditFilterResource !== "all" && logResource !== auditFilterResource) {
      // If resource is empty (older mock logs), we check if action starts with 'role' or 'user'
      const isLegacyMatch = 
        (auditFilterResource === "role" && (logAction.includes("role") || logResource === "role"));
      if (!isLegacyMatch && logResource) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Organization Settings</h1>
        <p className="text-sm text-slate-500">Manage company details, custom branding, and audit histories.</p>
      </div>

      {/* Dynamic Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => {
            setActiveTab("details");
            setSuccess(false);
            setError(null);
          }}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-bold border-b-2 cursor-pointer transition-all ${
            activeTab === "details"
              ? "text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
          style={activeTab === "details" ? { borderColor: primaryColor, color: primaryColor } : {}}
        >
          <Building2 size={16} />
          <span>Details</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("branding");
            setSuccess(false);
            setError(null);
          }}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-bold border-b-2 cursor-pointer transition-all ${
            activeTab === "branding"
              ? "text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
          style={activeTab === "branding" ? { borderColor: primaryColor, color: primaryColor } : {}}
        >
          <Palette size={16} />
          <span>Branding Customizer</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("audit");
            setSuccess(false);
            setError(null);
          }}
          className={`flex items-center gap-2 py-3 px-5 text-sm font-bold border-b-2 cursor-pointer transition-all ${
            activeTab === "audit"
              ? "text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
          style={activeTab === "audit" ? { borderColor: primaryColor, color: primaryColor } : {}}
        >
          <Activity size={16} />
          <span>Audit Logs</span>
        </button>
      </div>

      {success && (
        <div className="rounded-xl bg-green-50 p-4 text-sm font-medium text-green-700 border border-green-100 flex items-center gap-2">
          <CheckCircle size={18} />
          <span>Settings saved successfully!</span>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700 border border-red-100">
          {error}
        </div>
      )}

      {/* ==================== TAB 1: COMPANY DETAILS ==================== */}
      {activeTab === "details" && (
        <form onSubmit={handleSubmit(onDetailsSubmit)} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Card: Branding Logo */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1 flex flex-col items-center text-center">
            <h2 className="text-sm font-bold text-slate-800 self-start mb-4">Company Logo</h2>

            {/* Logo container */}
            <div className="relative flex h-32 w-32 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 overflow-hidden group">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo preview" className="h-full w-full object-cover" />
              ) : (
                <Building2 size={40} className="text-slate-300" />
              )}

              {isAuthorizedToManage && (
                <label className="absolute inset-0 bg-slate-900/50 flex flex-col items-center justify-center text-white text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Upload size={18} className="mb-1" />
                  Change Logo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="sr-only"
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-3">Supports JPG, PNG. Max size 2MB.</p>
            {uploadingLogo && <p className="text-xs text-blue-600 mt-2 font-semibold animate-pulse">Uploading logo...</p>}
          </div>

          {/* Right Card: Fields */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2 space-y-4">
            <h2 className="text-sm font-bold text-slate-800">Company Details</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="company-name" className="text-xs font-bold text-slate-600">
                  Company Name
                </label>
                <input
                  id="company-name"
                  type="text"
                  disabled={!isAuthorizedToManage}
                  placeholder="Acme Corp"
                  {...register("name")}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all disabled:bg-slate-50"
                  style={isAuthorizedToManage ? {} : { backgroundColor: "#f8fafc" }}
                />
                {errors.name && (
                  <p className="mt-1.5 text-[10px] font-semibold text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="industry" className="text-xs font-bold text-slate-600">
                  Industry
                </label>
                <input
                  id="industry"
                  type="text"
                  disabled={!isAuthorizedToManage}
                  placeholder="Technology"
                  {...register("industry")}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all disabled:bg-slate-50"
                  style={isAuthorizedToManage ? {} : { backgroundColor: "#f8fafc" }}
                />
                {errors.industry && (
                  <p className="mt-1.5 text-[10px] font-semibold text-red-600">{errors.industry.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="timezone" className="text-xs font-bold text-slate-600 flex items-center gap-1">
                  <Globe size={12} className="text-slate-400" />
                  Timezone
                </label>
                <select
                  id="timezone"
                  disabled={!isAuthorizedToManage}
                  {...register("timezone")}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-semibold text-slate-700 disabled:bg-slate-50"
                  style={isAuthorizedToManage ? {} : { backgroundColor: "#f8fafc" }}
                >
                  <option value="GMT-8:00">PST (Pacific Standard Time - GMT-8)</option>
                  <option value="GMT-5:00">EST (Eastern Standard Time - GMT-5)</option>
                  <option value="GMT+0:00">UTC (Coordinated Universal Time - GMT)</option>
                  <option value="GMT+1:00">CET (Central European Time - GMT+1)</option>
                  <option value="GMT+5:30">IST (India Standard Time - GMT+5:30)</option>
                  <option value="GMT+8:00">SGT (Singapore Time - GMT+8)</option>
                </select>
              </div>

              <div>
                <label htmlFor="address" className="text-xs font-bold text-slate-600 flex items-center gap-1">
                  <MapPin size={12} className="text-slate-400" />
                  Company Address
                </label>
                <input
                  id="address"
                  type="text"
                  disabled={!isAuthorizedToManage}
                  placeholder="123 Corporate Way, City"
                  {...register("address")}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all disabled:bg-slate-50"
                  style={isAuthorizedToManage ? {} : { backgroundColor: "#f8fafc" }}
                />
                {errors.address && (
                  <p className="mt-1.5 text-[10px] font-semibold text-red-600">{errors.address.message}</p>
                )}
              </div>
            </div>

            {isAuthorizedToManage && (
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl px-5 py-2.5 text-xs font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                  style={{ backgroundColor: primaryColor }}
                >
                  {saving ? "Saving Changes..." : "Save Settings"}
                </button>
              </div>
            )}
          </div>
        </form>
      )}

      {/* ==================== TAB 2: BRANDING CUSTOMIZER ==================== */}
      {activeTab === "branding" && (
        <form onSubmit={onBrandingSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Customizer Panel */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2 space-y-6">
            <h2 className="text-sm font-bold text-slate-800">Custom Branding Layout</h2>

            {/* Colors picker */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-600 block">
                Primary Brand Color
              </label>
              <div className="flex flex-wrap gap-2.5">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setBrandingColor(preset.value)}
                    className="h-8 w-8 rounded-full border border-slate-300 relative flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
                    style={{ backgroundColor: preset.value }}
                    title={preset.label}
                  >
                    {brandingColor === preset.value && (
                      <Check size={14} className="text-white drop-shadow-md" />
                    )}
                  </button>
                ))}
                
                {/* Custom Color Selector */}
                <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-2.5 py-1 bg-slate-50">
                  <input
                    type="color"
                    value={brandingColor}
                    onChange={(e) => setBrandingColor(e.target.value)}
                    className="h-6 w-8 rounded border border-slate-300 cursor-pointer"
                  />
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    {brandingColor}
                  </span>
                </div>
              </div>
            </div>

            {/* Support Email */}
            <div className="space-y-1.5 max-w-md">
              <label htmlFor="support-email" className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <Mail size={12} className="text-slate-400" />
                Support Email Address
              </label>
              <input
                id="support-email"
                type="email"
                required
                disabled={!isAuthorizedToManage}
                placeholder="support@company.com"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all disabled:bg-slate-50"
                style={isAuthorizedToManage ? {} : { backgroundColor: "#f8fafc" }}
              />
              <p className="text-[10px] text-slate-400">
                This email is displayed to tenant members in portals and support queries.
              </p>
            </div>

            {isAuthorizedToManage && (
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={savingBranding}
                  className="rounded-xl px-5 py-2.5 text-xs font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                  style={{ backgroundColor: brandingColor }}
                >
                  {savingBranding ? "Applying Branding..." : "Update Branding"}
                </button>
              </div>
            )}
          </div>

          {/* Real-time branding visual preview card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1 space-y-4">
            <h2 className="text-sm font-bold text-slate-800">Dynamic Preview</h2>
            <p className="text-xs text-slate-500 leading-normal">
              Observe how your selected primary color and support email apply across the portal navigation and branding elements.
            </p>

            <div className="border border-slate-200 rounded-2xl bg-slate-50 p-4 space-y-3">
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden h-48 flex">
                {/* Mock Sidebar */}
                <div className="w-1/4 border-r border-slate-100 p-2 space-y-2 flex flex-col justify-between bg-white">
                  <div className="space-y-1.5">
                    {/* Mock Logo */}
                    {logoPreview ? (
                      <img src={logoPreview} alt="mock" className="h-4 w-4 rounded object-cover" />
                    ) : (
                      <div className="h-4 w-4 rounded" style={{ backgroundColor: brandingColor }} />
                    )}
                    <div className="h-1.5 w-full rounded bg-slate-100" />
                    <div className="h-1.5 w-5/6 rounded bg-slate-100" />
                    <div className="h-2 w-3/4 rounded" style={{ backgroundColor: `${brandingColor}15` }} /> {/* active menu */}
                  </div>
                  <div className="h-1.5 w-1/2 rounded bg-slate-100" />
                </div>
                {/* Mock Content area */}
                <div className="flex-1 p-3 space-y-3 bg-slate-50/30">
                  {/* Mock Header */}
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <div className="h-2 w-16 bg-slate-100 rounded" />
                    <div className="flex gap-1.5">
                      <div className="h-3 w-3 bg-slate-100 rounded-full" />
                      <div className="h-3 w-6 rounded" style={{ backgroundColor: `${brandingColor}20`, border: `1px solid ${brandingColor}` }} />
                    </div>
                  </div>
                  {/* Mock Dashboard Widget */}
                  <div className="p-2.5 border border-slate-100 rounded-lg space-y-1.5 bg-white shadow-2xs">
                    <div className="h-2 w-1/3 bg-slate-200 rounded" />
                    <div className="h-1.5 w-full bg-slate-100 rounded" />
                    <div className="flex justify-end pt-1">
                      <div className="h-4.5 w-12 rounded-md text-white text-[8px] font-bold flex items-center justify-center" style={{ backgroundColor: brandingColor }}>
                        Submit
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {supportEmail && (
              <div className="rounded-xl border border-slate-100 p-3 bg-slate-50/50 space-y-1">
                <div className="text-[9px] font-bold text-slate-400 uppercase">Need Help?</div>
                <div className="text-[10px] font-bold text-slate-700 flex items-center gap-1">
                  <Mail size={10} style={{ color: brandingColor }} />
                  <span>{supportEmail}</span>
                </div>
              </div>
            )}
          </div>
        </form>
      )}

      {/* ==================== TAB 3: AUDIT LOGS VIEWER ==================== */}
      {activeTab === "audit" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">System Audit Trail</h2>
              <p className="text-xs text-slate-500">
                A historical log of critical modifications made inside this organization.
              </p>
            </div>

            {/* Filtering parameters */}
            <div className="flex flex-wrap gap-2">
              <select
                value={auditFilterAction}
                onChange={(e) => setAuditFilterAction(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-blue-600"
              >
                <option value="all">All Actions</option>
                <option value="create">Created</option>
                <option value="update">Updated</option>
                <option value="delete">Deleted</option>
                <option value="role_change">Role Assignment</option>
                <option value="branding_change">Branding Settings</option>
              </select>

              <select
                value={auditFilterResource}
                onChange={(e) => setAuditFilterResource(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-blue-600"
              >
                <option value="all">All Resources</option>
                <option value="employee">Employees</option>
                <option value="department">Departments</option>
                <option value="team">Teams</option>
                <option value="role">Roles</option>
                <option value="tenant">Tenant Settings</option>
              </select>

              <button
                onClick={fetchAuditLogs}
                disabled={loadingAudit}
                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                title="Refresh audit trails"
              >
                <RefreshCw size={14} className={loadingAudit ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {loadingAudit && auditLogs.length === 0 ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : filteredAuditLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs italic">
              No audit log records matching the criteria.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-5">Date & Time</th>
                      <th className="py-3 px-5">User</th>
                      <th className="py-3 px-5">Action</th>
                      <th className="py-3 px-5">Resource</th>
                      <th className="py-3 px-5">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                    {filteredAuditLogs.map((log) => {
                      // Determine badge stylings
                      const logAction = log.action as string;
                      const logResource = (log.resource || "role") as string;
                      let actionText = logAction;
                      let resourceText = logResource;
                      
                      let actionBadge = "bg-slate-100 text-slate-700 border-slate-200";
                      if (logAction === "create" || logAction === "role.create") {
                        actionBadge = "bg-green-50 text-green-700 border-green-200";
                        actionText = "create";
                      } else if (logAction === "update" || logAction === "role.update") {
                        actionBadge = "bg-blue-50 text-blue-700 border-blue-200";
                        actionText = "update";
                      } else if (logAction === "delete" || logAction === "role.delete") {
                        actionBadge = "bg-red-50 text-red-700 border-red-200";
                        actionText = "delete";
                      } else if (logAction === "branding_change") {
                        actionBadge = "bg-amber-50 text-amber-700 border-amber-200";
                        actionText = "branding";
                      } else if (logAction === "role_change" || logAction === "user.role_assign" || logAction === "user.role_remove") {
                        actionBadge = "bg-indigo-50 text-indigo-700 border-indigo-200";
                        actionText = "privileges";
                      }

                      let resourceBadge = "bg-slate-50 text-slate-600";
                      if (resourceText === "employee") resourceBadge = "bg-sky-50 text-sky-700";
                      else if (resourceText === "department") resourceBadge = "bg-teal-50 text-teal-700";
                      else if (resourceText === "team") resourceBadge = "bg-purple-50 text-purple-700";
                      else if (resourceText === "role") resourceBadge = "bg-violet-50 text-violet-700";
                      else if (resourceText === "tenant") resourceBadge = "bg-pink-50 text-pink-700";

                      const displayTime = log.timestamp || (log as any).createdAt;

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/20">
                          <td className="py-3.5 px-5 font-semibold text-slate-400 w-[180px]">
                            {new Date(displayTime).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-5 font-bold text-slate-700">
                            {log.userEmail || (log as any).actorName || "system"}
                          </td>
                          <td className="py-3.5 px-5">
                            <span className={`inline-flex px-2 py-0.5 rounded border text-[9px] font-bold uppercase ${actionBadge}`}>
                              {actionText}
                            </span>
                          </td>
                          <td className="py-3.5 px-5">
                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${resourceBadge}`}>
                              {resourceText}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 font-medium text-slate-800">
                            {log.details}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Additive default export; named export `SettingsPage` is preserved above.
export default SettingsPage;
```

## `frontend\src\features\settings\services\auditLogService.ts`

```ts
/**
 * auditLogService
 * -----------------------------------------------------------------------------
 * Firestore-backed service for recording and retrieving tenant audit logs.
 * Audit entries are stored in the top-level `auditLogs` collection and are
 * scoped/queried by `tenantId`.
 */
import { collection, doc, setDoc, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type { AuditLog } from "@hrms/middleware";

/**
 * Singleton service object exposing audit-log creation and retrieval helpers.
 */
export const AuditLogService = {
  /**
   * Records a new audit log entry in Firestore.
   */
  async createAuditLog(
    tenantId: string,
    data: Omit<AuditLog, "id" | "tenantId" | "timestamp">
  ): Promise<AuditLog> {
    const id = `log_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
    const log: AuditLog = {
      ...data,
      id,
      tenantId,
      timestamp: Date.now(),
    };
    await setDoc(doc(db, "auditLogs", id), log);
    return log;
  },

  /**
   * Fetches historical audit log entries for a tenant.
   */
  async getAuditLogs(tenantId: string, maxLimit: number = 100): Promise<AuditLog[]> {
    const q = query(
      collection(db, "auditLogs"),
      where("tenantId", "==", tenantId),
      orderBy("timestamp", "desc"),
      limit(maxLimit)
    );
    const snap = await getDocs(q);
    const logs: AuditLog[] = [];
    snap.forEach((docSnap) => {
      logs.push(docSnap.data() as AuditLog);
    });
    return logs;
  },
};
```

## `frontend\src\features\notifications\components\NotificationBell.tsx`

```tsx
import { useState, useEffect, useRef } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/context/AuthContext";
import type { AppNotification } from "@hrms/middleware";
import {
  subscribeToNotifications,
  markAsRead,
  markAllAsRead,
} from "../services/notificationService";

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function NotificationBell() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const tenantId = profile?.activeTenantId || "";
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !tenantId) {
      setItems([]);
      return;
    }
    const unsub = subscribeToNotifications(user.uid, tenantId, setItems);
    return () => unsub();
  }, [user, tenantId]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const unread = items.filter((n) => !n.read).length;

  const handleOpen = async (n: AppNotification) => {
    if (!n.read) {
      try { await markAsRead(n.id); } catch { /* ignore */ }
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-xl border border-slate-200 bg-white shadow-lg z-30">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <span className="text-sm font-bold text-slate-800">Notifications</span>
            {unread > 0 && (
              <button
                onClick={() => markAllAsRead(items)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-10 text-center text-xs text-slate-400 italic">
                You're all caught up.
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleOpen(n)}
                  className={`flex w-full items-start gap-2.5 border-b border-slate-50 px-4 py-3 text-left hover:bg-slate-50 cursor-pointer ${
                    n.read ? "" : "bg-blue-50/40"
                  }`}
                >
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-blue-600"}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold text-slate-800">{n.title}</span>
                    <span className="block text-xs text-slate-500 leading-snug">{n.body}</span>
                    <span className="mt-1 block text-[10px] font-medium text-slate-400">{timeAgo(n.createdAt)}</span>
                  </span>
                  {n.read && <Check size={12} className="mt-1 shrink-0 text-slate-300" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

## `frontend\src\features\notifications\services\notificationService.ts`

```ts
import {
  collection,
  doc,
  query,
  where,
  limit,
  onSnapshot,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type { AppNotification } from "@hrms/middleware";

/**
 * Live-subscribe to the current user's notifications for a tenant. Sorted
 * newest-first and capped client-side (two equality filters need no composite
 * index). Returns an unsubscribe function.
 */
export function subscribeToNotifications(
  userId: string,
  tenantId: string,
  cb: (notifications: AppNotification[]) => void
): () => void {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    where("tenantId", "==", tenantId),
    limit(50)
  );
  return onSnapshot(
    q,
    (snap) => {
      const list: AppNotification[] = [];
      snap.forEach((d) => list.push(d.data() as AppNotification));
      list.sort((a, b) => b.createdAt - a.createdAt);
      cb(list);
    },
    (err) => {
      console.error("[notifications] subscription error:", err);
      cb([]);
    }
  );
}

export async function markAsRead(id: string): Promise<void> {
  await updateDoc(doc(db, "notifications", id), { read: true });
}

export async function markAllAsRead(notifications: AppNotification[]): Promise<void> {
  const unread = notifications.filter((n) => !n.read);
  if (unread.length === 0) return;
  const batch = writeBatch(db);
  unread.forEach((n) => batch.update(doc(db, "notifications", n.id), { read: true }));
  await batch.commit();
}
```

## `middleware\package.json`

```json
{
  "name": "@hrms/middleware",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {},
  "devDependencies": {
    "typescript": "^5.6.3"
  }
}
```

## `middleware\tsconfig.json`

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": false,
    "declaration": true,
    "outDir": "dist"
  },
  "include": ["src"]
}
```

## `middleware\src\index.ts`

```ts
export * from "./types/rbac";
export * from "./types/tenant";
export * from "./types/user";
export * from "./types/department";
export * from "./types/employee";
export * from "./types/employeeRecords";
export * from "./types/team";
export * from "./types/audit";
export * from "./types/job";
export * from "./types/candidate";
export * from "./types/interview";
export * from "./types/offer";
export * from "./types/leave";
export * from "./types/document";
export * from "./types/notification";



```

## `middleware\src\types\user.ts`

```ts
/**
 * User type definitions.
 *
 * Models the cross-tenant user profile, each user's per-tenant membership
 * (role + status), and pending invitations. Consumed via named imports and
 * re-exported by the middleware barrel.
 */

import { SystemRoleType } from "./rbac";

/** Membership lifecycle state of a user within a single tenant. */
export type UserTenantStatus = "invited" | "active" | "disabled";

/** A user's role and membership status for one tenant. */
export interface UserTenantInfo {
  role: SystemRoleType | string; // maps to system role name or custom role ID
  status: UserTenantStatus;
  invitedAt?: number;
  joinedAt?: number;
}

/**
 * Top-level user profile (one document per Firebase Auth user). A single user
 * can belong to multiple tenants; `tenants` maps tenantId -> membership info and
 * `activeTenantId` records the currently selected tenant.
 */
export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  createdAt: number;
  updatedAt: number;
  activeTenantId: string | null;
  tenants: Record<string, UserTenantInfo>; // Map of tenantId -> Role and Status
}

/** A pending/accepted/expired invitation for a user to join a tenant. */
export interface UserInvitation {
  id: string; // generated ID or matching email
  email: string;
  tenantId: string;
  role: SystemRoleType | string;
  invitedBy: string; // User ID who invited
  createdAt: number;
  status: "pending" | "accepted" | "expired";
}
```

## `middleware\src\types\tenant.ts`

```ts
/**
 * Tenant type definitions.
 *
 * Models a tenant (organization) and its brandable settings. Consumed via named
 * imports and re-exported by the middleware barrel.
 */

/** A tenant organization, including custom-branding fields (logo, colors). */
export interface Tenant {
  id: string;
  name: string;
  industry: string;
  timezone: string;
  address: string;
  /** Organization logo URL, or null when none has been uploaded. */
  logoURL: string | null;
  primaryColor?: string;
  supportEmail?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Tenant plus extended settings. Currently augments {@link Tenant} with optional
 * theming fields; intended to grow (billing, customizations) in later phases.
 */
export interface TenantSettings extends Tenant {
  // Can be extended for billing, customizations, etc. in Phase 1
  primaryColor?: string;
  borderRadius?: string;
}
```

## `middleware\src\types\rbac.ts`

```ts
export type PermissionKey =
  // Users
  | "users.view"
  | "users.create"
  | "users.update"
  | "users.delete"
  // Roles
  | "roles.view"
  | "roles.create"
  | "roles.update"
  | "roles.delete"
  // Departments
  | "departments.view"
  | "departments.create"
  | "departments.update"
  | "departments.delete"
  // Teams
  | "teams.view"
  | "teams.create"
  | "teams.update"
  | "teams.delete"
  // Jobs
  | "jobs.view"
  | "jobs.create"
  | "jobs.update"
  | "jobs.delete"
  // Candidates
  | "candidates.view"
  | "candidates.create"
  | "candidates.update"
  | "candidates.delete"
  | "candidates.export"
  // Employees
  | "employees.view"
  | "employees.create"
  | "employees.update"
  | "employees.delete"
  // Leave
  | "leave.view"
  | "leave.create"
  | "leave.update"
  | "leave.delete"
  | "leave.approve"
  // Documents
  | "documents.view"
  | "documents.create"
  | "documents.update"
  | "documents.delete";

export type DataAccessLevel = "all" | "department" | "team" | "reports" | "self";

export interface Role {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  isSystemRole: boolean;
  permissions: PermissionKey[];
  dataAccessLevel: DataAccessLevel;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Permission {
  id: string;
  module: string;
  resource: string;
  action: string;
  key: PermissionKey;
}

export interface UserRole {
  id: string; // `${tenantId}_${userId}`
  userId: string;
  tenantId: string;
  roleIds: string[];
  updatedAt: number;
}

export type SystemRoleType = "super_admin" | "org_admin" | "hr_manager" | "recruiter" | "employee";

export interface SystemRoleConfig {
  name: string;
  description: string;
  permissions: PermissionKey[];
  dataAccessLevel: DataAccessLevel;
}

/**
 * Tenant-scoped override of a system role's permission matrix.
 *
 * System roles (e.g. `employee`) ship with a hardcoded default permission set
 * (see SYSTEM_ROLES). Org/Super admins may tailor a system role's permissions
 * for their organization; that customization is persisted as a SystemRoleOverride
 * document in the `roleOverrides` collection. When an override exists it replaces
 * the default `permissions` for that role within the tenant. The role's
 * `dataAccessLevel` is not overridable and always comes from SYSTEM_ROLES.
 */
export interface SystemRoleOverride {
  id: string; // `${tenantId}_${systemRoleType}`
  tenantId: string;
  systemRoleType: SystemRoleType;
  permissions: PermissionKey[];
  updatedAt: number;
}

/**
 * Deterministic document id for a tenant's system-role override.
 * Shared by the client (read/write) and mirrored by Firestore security rules.
 */
export function getSystemRoleOverrideId(
  tenantId: string,
  systemRoleType: SystemRoleType
): string {
  return `${tenantId}_${systemRoleType}`;
}

/**
 * System roles whose permission matrix tenant admins (Org/Super Admin) are
 * allowed to customize per tenant.
 *
 * The operational roles (HR Manager, Recruiter, Employee) are customizable.
 * The privileged roles `super_admin` and `org_admin` are intentionally EXCLUDED
 * and remain locked: stripping permissions from them could lock an entire
 * organization out of administration, so they are protected by design.
 */
export const EDITABLE_SYSTEM_ROLES: SystemRoleType[] = ["hr_manager", "recruiter", "employee"];

export const SYSTEM_ROLES: Record<SystemRoleType, SystemRoleConfig> = {
  super_admin: {
    name: "Super Admin",
    description: "Full control over the entire system. System configurations and global management.",
    permissions: [
      "users.view", "users.create", "users.update", "users.delete",
      "roles.view", "roles.create", "roles.update", "roles.delete",
      "departments.view", "departments.create", "departments.update", "departments.delete",
      "teams.view", "teams.create", "teams.update", "teams.delete",
      "jobs.view", "jobs.create", "jobs.update", "jobs.delete",
      "candidates.view", "candidates.create", "candidates.update", "candidates.delete", "candidates.export",
      "employees.view", "employees.create", "employees.update", "employees.delete",
      "leave.view", "leave.create", "leave.update", "leave.delete", "leave.approve",
      "documents.view", "documents.create", "documents.update", "documents.delete"
    ],
    dataAccessLevel: "all"
  },
  org_admin: {
    name: "Org Admin",
    description: "Administrator access for the specific tenant organization.",
    permissions: [
      "users.view", "users.create", "users.update", "users.delete",
      "roles.view", "roles.create", "roles.update", "roles.delete",
      "departments.view", "departments.create", "departments.update", "departments.delete",
      "teams.view", "teams.create", "teams.update", "teams.delete",
      "jobs.view", "jobs.create", "jobs.update", "jobs.delete",
      "candidates.view", "candidates.create", "candidates.update", "candidates.delete", "candidates.export",
      "employees.view", "employees.create", "employees.update", "employees.delete",
      "leave.view", "leave.create", "leave.update", "leave.delete", "leave.approve",
      "documents.view", "documents.create", "documents.update", "documents.delete"
    ],
    dataAccessLevel: "all"
  },
  hr_manager: {
    name: "HR Manager",
    description: "Manage employee profiles, leave requests, departments, and view candidates.",
    permissions: [
      "users.view", "users.create", "users.update",
      "departments.view", "departments.create", "departments.update", "departments.delete",
      "teams.view", "teams.create", "teams.update", "teams.delete",
      "jobs.view",
      "candidates.view",
      "employees.view", "employees.create", "employees.update", "employees.delete",
      "leave.view", "leave.create", "leave.update", "leave.delete", "leave.approve",
      "documents.view", "documents.create", "documents.update", "documents.delete"
    ],
    dataAccessLevel: "all"
  },
  recruiter: {
    name: "Recruiter",
    description: "Manage job postings and candidates.",
    permissions: [
      "users.view",
      "departments.view",
      "jobs.view", "jobs.create", "jobs.update", "jobs.delete",
      "candidates.view", "candidates.create", "candidates.update", "candidates.delete", "candidates.export",
      "employees.view"
    ],
    dataAccessLevel: "all"
  },
  employee: {
    name: "Employee",
    description: "Standard access for personal records, leave requests, and company directory.",
    permissions: [
      "users.view",
      "departments.view",
      "teams.view",
      "jobs.view",
      "employees.view",
      "leave.view", "leave.create",
      "documents.view"
    ],
    dataAccessLevel: "self"
  }
};

```

## `middleware\src\types\department.ts`

```ts
/**
 * Department type definitions.
 *
 * Models an organizational department, including support for a parent-child
 * hierarchy via `parentId`. Consumed via named imports and re-exported by the
 * middleware barrel.
 */

/**
 * A department within a tenant. Departments can form a tree through `parentId`
 * (cycle prevention is enforced in application logic, not the type).
 */
export interface Department {
  id: string;
  tenantId: string;
  name: string;
  code: string; // e.g. "ENG", "MKT", "HR"
  description: string;
  managerId?: string; // Employee ID of the department manager
  parentId?: string; // Parent department ID (references Department.id)
  isArchived?: boolean; // Archived status
  createdAt: number;
  updatedAt: number;
}
```

## `middleware\src\types\team.ts`

```ts
/**
 * Team type definitions.
 *
 * Models a team nested within a department, with an optional lead and a member
 * roster. Consumed via named imports and re-exported by the middleware barrel.
 */

/** A team belonging to a department, with a lead and a list of member employees. */
export interface Team {
  id: string;
  tenantId: string;
  name: string;
  departmentId: string; // References Department.id
  description: string;
  leadId?: string; // References Employee.id â€” the team lead
  memberIds: string[]; // Array of Employee.id values
  createdAt: number;
  updatedAt: number;
}
```

## `middleware\src\types\employee.ts`

```ts
/**
 * Employee type definitions.
 *
 * Models the tenant-readable employee directory record and the separately
 * stored, access-controlled compensation record. Consumed via named imports and
 * re-exported by the middleware barrel.
 */

/** Current employment state of an employee. */
export type EmployeeStatus = "active" | "onboarding" | "terminated" | "suspended";

/**
 * Core employee directory record (non-sensitive, tenant-readable). Sensitive
 * pay data lives separately in {@link EmployeeCompensation}.
 */
export interface Employee {
  id: string;
  tenantId: string;
  userId?: string; // Optional link to Firebase Auth/User Profile ID
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  departmentId: string; // References Department.id
  managerId?: string; // References Employee.id (for direct reports/manager relationships)
  status: EmployeeStatus;
  startDate: string; // ISO date string (YYYY-MM-DD)
  workLocation: string; // e.g. "Remote", "Office - NYC", "Office - London"
  createdAt: number;
  updatedAt: number;
}

/**
 * Sensitive compensation data, stored SEPARATELY from the (tenant-readable)
 * Employee directory record so it can be access-controlled at the database
 * layer (SEC-002). Doc id == employeeId. Readable only by holders of
 * employees.update (HR/admins) or the record owner; see firestore.rules
 * /employeeCompensation.
 */
export interface EmployeeCompensation {
  id: string; // == employeeId
  tenantId: string;
  employeeId: string;
  salary: number;
  currency: string;
  updatedAt: number;
}
```

## `middleware\src\types\employeeRecords.ts`

```ts
/* ------------------------------------------------------------------ */
/*  Contracts                                                          */
/* ------------------------------------------------------------------ */

export type ContractType =
  | "full_time"
  | "part_time"
  | "contract"
  | "internship"
  | "temporary"
  | "probation";

export type ContractStatus = "draft" | "active" | "expired" | "terminated";

export interface EmployeeContract {
  id: string;
  tenantId: string;
  employeeId: string;
  title: string;
  type: ContractType;
  startDate: string; // ISO date (YYYY-MM-DD)
  endDate?: string; // ISO date; empty/undefined => open-ended
  salary: number;
  currency: string;
  status: ContractStatus;
  /** Public download URL of an uploaded signed contract document. */
  documentUrl?: string;
  /** Storage path of the document (for deletion). */
  documentPath?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

/* ------------------------------------------------------------------ */
/*  Emergency contacts                                                 */
/* ------------------------------------------------------------------ */

export type ContactRelationship =
  | "spouse"
  | "parent"
  | "sibling"
  | "child"
  | "friend"
  | "other";

export interface EmergencyContact {
  id: string;
  tenantId: string;
  employeeId: string;
  name: string;
  relationship: ContactRelationship;
  phone: string;
  email?: string;
  address?: string;
  isPrimary: boolean;
  createdAt: number;
  updatedAt: number;
}

/* ------------------------------------------------------------------ */
/*  Employment history (internal role/comp changes)                    */
/* ------------------------------------------------------------------ */

export type EmploymentChangeType =
  | "hired"
  | "promotion"
  | "transfer"
  | "title_change"
  | "compensation_change"
  | "department_change"
  | "manager_change"
  | "offboarded";

export interface EmploymentHistoryEntry {
  id: string;
  tenantId: string;
  employeeId: string;
  changeType: EmploymentChangeType;
  title: string; // resulting job title
  departmentId?: string;
  managerId?: string;
  salary?: number;
  effectiveDate: string; // ISO date
  note?: string;
  createdAt: number;
  updatedAt: number;
}

/* ------------------------------------------------------------------ */
/*  Assets                                                             */
/* ------------------------------------------------------------------ */

export type AssetType =
  | "laptop"
  | "desktop"
  | "monitor"
  | "phone"
  | "tablet"
  | "access_card"
  | "vehicle"
  | "other";

export type AssetStatus = "assigned" | "returned" | "lost" | "damaged";

export interface EmployeeAsset {
  id: string;
  tenantId: string;
  employeeId: string;
  name: string;
  assetType: AssetType;
  serialNumber?: string;
  assignedDate: string; // ISO date
  returnedDate?: string; // ISO date
  status: AssetStatus;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

/* ------------------------------------------------------------------ */
/*  Lifecycle events                                                   */
/* ------------------------------------------------------------------ */

export type LifecycleStage =
  | "applicant"
  | "onboarding"
  | "active"
  | "on_leave"
  | "offboarding"
  | "terminated";

export interface LifecycleEvent {
  id: string;
  tenantId: string;
  employeeId: string;
  stage: LifecycleStage;
  effectiveDate: string; // ISO date
  note?: string;
  createdBy: string;
  createdAt: number;
}
```

## `middleware\src\types\job.ts`

```ts
/**
 * Job requisition type definitions.
 *
 * Models job postings/requisitions, their candidate pipeline, and the reusable
 * sequential approval workflow (also used by offers and leave requests).
 * Consumed via named imports and re-exported by the middleware barrel.
 */

/** Lifecycle state of a job requisition, from draft through to closed. */
export type JobStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "open"
  | "on_hold"
  | "closed";

/** Employment arrangement offered by the job. */
export type EmploymentType =
  | "full_time"
  | "part_time"
  | "contract"
  | "internship"
  | "temporary";

/** Where the work is performed. */
export type WorkMode = "remote" | "onsite" | "hybrid";

/** Decision state for an approval step or the overall workflow. */
export type ApprovalDecision = "pending" | "approved" | "rejected";

/** A single step in a sequential approval workflow. */
export interface ApprovalStep {
  approverId: string; // References UserProfile.id / Firebase Auth uid
  approverEmail: string;
  approverName?: string;
  order: number; // 0-based position in the sequence
  status: ApprovalDecision;
  comment?: string;
  decidedAt?: number;
}

/** Embedded approval workflow state, reused by Job requisitions and Offers. */
export interface ApprovalWorkflow {
  required: boolean;
  steps: ApprovalStep[];
  currentStep: number; // index of the step awaiting a decision
  status: ApprovalDecision; // overall workflow status
}

/** Default ordered pipeline stages applied to a new job. */
export const DEFAULT_PIPELINE_STAGES = [
  "Applied",
  "Screening",
  "Interview",
  "Offer",
  "Hired",
  "Rejected",
] as const;

/**
 * A job requisition / posting. Requisitions can require sequential approval
 * before they move to an `open` (publishable) state.
 */
export interface Job {
  id: string;
  tenantId: string;
  title: string;
  departmentId: string;
  location: string;
  workMode: WorkMode;
  employmentType: EmploymentType;
  description: string;
  responsibilities: string;
  requirements: string;
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  openings: number;
  status: JobStatus;
  /** When true (and status is open/approved), the job shows on the public careers page. */
  isPublished: boolean;
  /** Ordered list of pipeline stage names used by this job's candidates. */
  pipelineStages: string[];
  approval: ApprovalWorkflow;
  hiringManagerId?: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}
```

## `middleware\src\types\candidate.ts`

```ts
/**
 * Candidate (applicant) type definitions.
 *
 * Models applicants tracked through a job's pipeline and the notes left on them.
 * Consumed via named imports and re-exported by the middleware barrel.
 */

/** Overall lifecycle state of a candidate. */
export type CandidateStatus = "active" | "hired" | "rejected" | "withdrawn";

/** Where the candidate originated from. */
export type CandidateSource = "careers" | "referral" | "manual" | "agency" | "linkedin";

/**
 * A candidate / applicant associated with a specific job requisition.
 * The `stage` field tracks the candidate's position in the job's pipeline.
 */
export interface Candidate {
  id: string;
  tenantId: string;
  jobId: string;
  jobTitle: string; // denormalised for list/kanban display
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  /** Public download URL of the uploaded resume (if any). */
  resumeUrl?: string;
  /** Storage path of the resume, used for deletion/regeneration. */
  resumePath?: string;
  linkedinUrl?: string;
  coverLetter?: string;
  source: CandidateSource;
  /** Current pipeline stage name (must be one of the job's pipelineStages). */
  stage: string;
  status: CandidateStatus;
  /** 0â€“5 star rating. */
  rating?: number;
  appliedAt: number;
  createdAt: number;
  updatedAt: number;
}

/** A timestamped note left by a team member on a candidate. */
export interface CandidateNote {
  id: string;
  tenantId: string;
  candidateId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: number;
}
```

## `middleware\src\types\interview.ts`

```ts
/**
 * Interview type definitions.
 *
 * Models scheduled interviews for candidates, including mode, status, and
 * outcome. Consumed via named imports and re-exported by the middleware barrel.
 */

/** Scheduling state of an interview. */
export type InterviewStatus = "scheduled" | "completed" | "cancelled" | "no_show";

/** Interviewer's recommendation after the interview. */
export type InterviewOutcome =
  | "pending"
  | "strong_yes"
  | "yes"
  | "no"
  | "strong_no";

/** How the interview is conducted. */
export type InterviewMode = "onsite" | "phone" | "video";

/** A scheduled interview for a candidate, tied to a pipeline stage. */
export interface Interview {
  id: string;
  tenantId: string;
  candidateId: string;
  candidateName: string; // denormalised for display
  jobId: string;
  /** The pipeline stage this interview belongs to (e.g. "Interview"). */
  stage: string;
  title: string;
  mode: InterviewMode;
  /** Physical location or meeting link. */
  location: string;
  scheduledAt: number;
  durationMins: number;
  interviewerIds: string[];
  interviewerEmails: string[];
  status: InterviewStatus;
  outcome: InterviewOutcome;
  feedback?: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}
```

## `middleware\src\types\offer.ts`

```ts
/**
 * Offer type definitions.
 *
 * Models a formal employment offer extended to a candidate, including its
 * embedded approval workflow (reused from the job module). Consumed via named
 * imports and re-exported by the middleware barrel.
 */

import type { ApprovalWorkflow } from "./job";

/** Lifecycle state of an offer, from draft through to a final response. */
export type OfferStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "sent"
  | "accepted"
  | "declined"
  | "rescinded"
  | "expired";

/** A formal offer extended to a candidate for a specific job. */
export interface Offer {
  id: string;
  tenantId: string;
  candidateId: string;
  candidateName: string; // denormalised for display
  candidateEmail: string;
  jobId: string;
  jobTitle: string;
  salary: number;
  currency: string;
  /** ISO date (YYYY-MM-DD) the candidate is expected to start. */
  startDate: string;
  /** ISO date (YYYY-MM-DD) the offer expires. */
  expiryDate: string;
  status: OfferStatus;
  notes?: string;
  approval: ApprovalWorkflow;
  sentAt?: number;
  respondedAt?: number;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}
```

## `middleware\src\types\leave.ts`

```ts
/**
 * Leave management type definitions.
 *
 * Models leave types, accrual policies, leave requests (with multi-level
 * approval), per-employee balances, and holiday calendars. Consumed via named
 * imports and re-exported by the middleware barrel.
 */

import type { ApprovalWorkflow } from "./job";

/* ------------------------------------------------------------------ */
/*  Leave types                                                        */
/* ------------------------------------------------------------------ */

/** A category of leave (e.g. Annual, Sick) configurable per tenant. */
export interface LeaveType {
  id: string;
  tenantId: string;
  name: string; // e.g. "Annual Leave"
  code: string; // e.g. "AL"
  colorHex: string; // for UI chips/calendar
  paid: boolean;
  requiresApproval: boolean;
  /** Default annual allowance in days (used to seed balances). */
  defaultAllowanceDays: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

/* ------------------------------------------------------------------ */
/*  Leave policies (accrual configuration)                             */
/* ------------------------------------------------------------------ */

/** How leave accrues over time for a policy. */
export type AccrualMethod = "annual_lump" | "monthly" | "per_pay_period" | "none";

/** Accrual configuration governing how a leave type's balance is earned/capped. */
export interface LeavePolicy {
  id: string;
  tenantId: string;
  name: string;
  leaveTypeId: string;
  accrualMethod: AccrualMethod;
  /** Days granted per accrual period (e.g. per month). For annual_lump, the yearly total. */
  accrualRateDays: number;
  /** Maximum days that can be accrued in a year (0 = uncapped). */
  annualCapDays: number;
  /** Maximum days carried over into the next year (0 = none). */
  carryOverCapDays: number;
  /** Whether balances may go negative (e.g. advance leave). */
  allowNegativeBalance: boolean;
  /** Days a new joiner must wait before leave accrues/can be taken. */
  waitingPeriodDays: number;
  effectiveFrom: string; // ISO date
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

/* ------------------------------------------------------------------ */
/*  Leave requests (multi-level approval)                              */
/* ------------------------------------------------------------------ */

/** Lifecycle state of a leave request. */
export type LeaveRequestStatus = "pending" | "approved" | "rejected" | "cancelled";

/** An employee's request for leave, carrying a multi-level approval workflow. */
export interface LeaveRequest {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeName: string;
  leaveTypeId: string;
  leaveTypeName: string;
  startDate: string; // ISO date (YYYY-MM-DD)
  endDate: string; // ISO date (YYYY-MM-DD)
  /** Number of working days requested (excludes weekends/holidays). */
  days: number;
  halfDay: boolean;
  reason: string;
  status: LeaveRequestStatus;
  /** Multi-level sequential approval workflow. */
  approval: ApprovalWorkflow;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

/* ------------------------------------------------------------------ */
/*  Leave balances                                                     */
/* ------------------------------------------------------------------ */

/** An employee's accrued/used/pending balance for one leave type and year. */
export interface LeaveBalance {
  id: string; // `${tenantId}_${employeeId}_${leaveTypeId}_${year}`
  tenantId: string;
  employeeId: string;
  leaveTypeId: string;
  year: number;
  accruedDays: number;
  usedDays: number;
  /** Days reserved by pending (not yet approved) requests. */
  pendingDays: number;
  carriedOverDays: number;
  /** Epoch ms of the last accrual run applied to this balance. */
  lastAccruedAt: number;
  createdAt: number;
  updatedAt: number;
}

/* ------------------------------------------------------------------ */
/*  Holiday calendars                                                  */
/* ------------------------------------------------------------------ */

/** A single public/company holiday entry. */
export interface Holiday {
  date: string; // ISO date (YYYY-MM-DD)
  name: string;
}

/** A named, year-scoped set of holidays used in working-day calculations. */
export interface HolidayCalendar {
  id: string;
  tenantId: string;
  name: string;
  year: number;
  holidays: Holiday[];
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
}
```

## `middleware\src\types\document.ts`

```ts
/**
 * Document Vault type definitions.
 *
 * Models securely stored files (contracts, IDs, payslips, etc.) and their
 * access-control metadata. Consumed via named imports and re-exported by the
 * middleware barrel.
 */

/** Functional category of a vault document. */
export type DocumentCategory = 
  | "contract" 
  | "id_proof" 
  | "resume" 
  | "offer_letter" 
  | "policy" 
  | "payslip" 
  | "other";

/** Which kind of entity a document is associated with. */
export type DocumentType = "employee" | "candidate" | "general";

/** Who may view a document: admins only, the subject employee, or shared. */
export type DocumentAccessLevel = "admin_only" | "employee_self" | "shared";

/**
 * A file stored in the Document Vault, plus the metadata used to gate access at
 * the Storage-rule layer (target linkage + access level).
 */
export interface VaultDocument {
  id: string;
  tenantId: string;
  name: string;
  category: DocumentCategory;
  type: DocumentType;
  targetId?: string;       // Employee ID or Candidate ID
  targetName?: string;     // Name of employee/candidate (for display)
  targetUserId?: string;   // Firebase Auth UID of the target employee (for access control)
  uploadedBy: string;      // User UID
  uploadedByName: string;
  createdAt: number;
  updatedAt: number;
  sizeBytes: number;
  contentType: string;
  storagePath: string;     // tenants/{tenantId}/documents/{docId}
  downloadUrl: string;
  accessLevel: DocumentAccessLevel;
}
```

## `middleware\src\types\notification.ts`

```ts
/**
 * In-app notification type definitions.
 *
 * Models the notification documents created server-side on approval-workflow
 * events and read live by the Notification Center. Consumed via named imports
 * and re-exported by the middleware barrel.
 */

/**
 * In-app notification delivered to a specific user within a tenant. Created
 * server-side (Cloud Functions, Admin SDK) on approval-workflow events and read
 * live by the Notification Center bell.
 */
export type NotificationType =
  | "approval.requested"
  | "job.approved"
  | "job.rejected"
  | "job.published"
  | "leave.approved"
  | "leave.rejected"
  | "generic";

/** A single in-app notification record. */
export interface AppNotification {
  id: string;
  tenantId: string;
  /** Firebase Auth uid of the recipient. */
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  /** Optional in-app route to open when the notification is clicked. */
  link?: string;
  read: boolean;
  createdAt: number;
}
```

## `middleware\src\types\audit.ts`

```ts
/**
 * Audit log type definitions.
 *
 * Describes the immutable audit-trail record written whenever a user performs a
 * tracked action (create/update/delete, approvals, role/branding changes, etc.)
 * against a tenant resource. Consumed via named imports and re-exported by the
 * middleware barrel.
 */

/**
 * A single audit-trail entry recording who did what, to which resource, and when.
 * Stored per tenant; the `action`/`resource` unions enumerate every tracked
 * operation and entity so the audit feed can be filtered and labelled.
 */
export interface AuditLog {
  id: string;
  tenantId: string;
  /** Firebase Auth uid of the actor who performed the action. */
  userId: string;
  /** Actor's email, denormalised for display in the audit feed. */
  userEmail: string;
  /** The kind of operation performed. */
  action:
    | "create"
    | "update"
    | "delete"
    | "invite"
    | "role_change"
    | "branding_change"
    | "status_change"
    | "stage_change"
    | "approve"
    | "reject";
  /** The entity type the action was performed against. */
  resource:
    | "employee"
    | "department"
    | "team"
    | "role"
    | "tenant"
    | "job"
    | "candidate"
    | "candidateNote"
    | "interview"
    | "offer"
    | "leave_type"
    | "leave_policy"
    | "leave_request"
    | "leave_balance"
    | "holiday_calendar";
  /** Identifier of the affected resource document. */
  resourceId: string;
  /** Human-readable description of the change. */
  details: string;
  /** Epoch milliseconds when the action occurred. */
  timestamp: number;
}
```

## `backend\package.json`

```json
{
  "name": "@hrms/backend",
  "private": true,
  "version": "0.0.0",
  "main": "lib/index.js",
  "engines": {
    "node": "20"
  },
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "serve": "npm run build && firebase emulators:start --only functions",
    "shell": "npm run build && firebase functions:shell",
    "start": "npm run shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
  },
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^5.0.0",
    "nodemailer": "^6.9.13"
  },
  "devDependencies": {
    "@opentelemetry/api": "^1.9.1",
    "@types/nodemailer": "^6.4.15",
    "firebase-functions-test": "^3.1.0",
    "typescript": "^5.6.3"
  }
}
```

## `backend\tsconfig.json`

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "outDir": "lib",
    "sourceMap": true,
    "strict": true,
    "target": "es2022",
    "skipLibCheck": true,
    "esModuleInterop": true
  },
  "compileOnSave": true,
  "include": ["src"]
}
```

## `backend\.env.example`

```example
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
#  Backend (Cloud Functions) environment configuration
#  Copy this file to `.env` (loaded automatically by firebase-functions
#  for local/emulator runs and deploys). Do NOT commit real secrets.
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

# â”€â”€ SMTP transport â”€â”€
# Common providers:
#   Gmail / Google Workspace : smtp.gmail.com   (port 587, use an App Password)
#   SendGrid                 : smtp.sendgrid.net (port 587, user = "apikey")
#   Mailgun                  : smtp.mailgun.org  (port 587)
#   Amazon SES               : email-smtp.<region>.amazonaws.com (port 587)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-smtp-username

# SMTP_PASSWORD is a SECRET â€” do NOT put it here for production.
# Set it with:  firebase functions:secrets:set SMTP_PASSWORD
# For the local emulator you may add it to `.env.local` instead.

# â”€â”€ Sender identity â”€â”€
MAIL_FROM_NAME=HRMS
MAIL_FROM_ADDRESS=no-reply@yourdomain.com
SUPPORT_EMAIL=support@yourdomain.com

# â”€â”€ Branding / links used inside emails â”€â”€
APP_NAME=HRMS
APP_URL=https://app.yourdomain.com
APP_LOGO_URL=
```

## `backend\.env.local`

```local
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=mrinmoy@pravaahc.com
MAIL_FROM_NAME=HRMS
MAIL_FROM_ADDRESS=no-reply@hrms-ats.app
APP_NAME=HRMS
APP_URL=https://app.hrms-ats.app
APP_LOGO_URL=
SUPPORT_EMAIL=support@hrms-ats.app
```

## `backend\src\index.ts`

```ts
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
        `Your ${after.leaveTypeName || "leave"} request (${after.startDate} â†’ ${after.endDate}) has been approved.`
      );
    } else if (after.status === "rejected" && beforeStatus !== "rejected") {
      await notifyRequester(
        "leave.rejected",
        "Leave rejected",
        `Your ${after.leaveTypeName || "leave"} request (${after.startDate} â†’ ${after.endDate}) was rejected.`
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
          `${after.employeeName || "An employee"} requested ${after.leaveTypeName || "leave"} (${after.startDate} â†’ ${after.endDate}).`,
          link
        );
      }
    }
  });

// Export the function as a named export for Firebase trigger discovery
export { onLeaveRequestUpdated };

// Provide default export for the last export function, satisfying the requirement
export default onLeaveRequestUpdated;
```

## `backend\src\mailer.ts`

```ts
import * as nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { defineString, defineSecret } from "firebase-functions/params";
import * as functions from "firebase-functions";

/**
 * SMTP Server & Branding settings.
 *
 * Resolved from Firebase Functions parameters framework.
 * Locally populated using `backend/.env` or `.env.local`.
 * Production settings set using the firebase secrets utility.
 */
export const SMTP_HOST = defineString("SMTP_HOST", { default: "smtp.gmail.com" });
export const SMTP_PORT = defineString("SMTP_PORT", { default: "587" });
export const SMTP_USER = defineString("SMTP_USER", { default: "" });
export const SMTP_PASSWORD = defineSecret("SMTP_PASSWORD");

export const MAIL_FROM_NAME = defineString("MAIL_FROM_NAME", { default: "HRMS" });
export const MAIL_FROM_ADDRESS = defineString("MAIL_FROM_ADDRESS", { default: "no-reply@hrms-ats.app" });

export const APP_NAME = defineString("APP_NAME", { default: "HRMS" });
export const APP_URL = defineString("APP_URL", { default: "https://app.hrms-ats.app" });
export const APP_LOGO_URL = defineString("APP_LOGO_URL", { default: "" });
export const SUPPORT_EMAIL = defineString("SUPPORT_EMAIL", { default: "support@hrms-ats.app" });

/**
 * Fallback values in case the Functions parameter framework is not initialized.
 */
const DEFAULTS: Record<string, string> = {
  SMTP_HOST: "smtp.gmail.com",
  SMTP_PORT: "587",
  SMTP_USER: "",
  MAIL_FROM_NAME: "HRMS",
  MAIL_FROM_ADDRESS: "no-reply@hrms-ats.app",
  APP_NAME: "HRMS",
  APP_URL: "https://app.hrms-ats.app",
  APP_LOGO_URL: "",
  SUPPORT_EMAIL: "support@hrms-ats.app",
};

/**
 * Safely resolves a string configuration parameter.
 * Order of preference: (1) Resolved parameter value, (2) Environment variable, (3) System default.
 */
export function cfg(name: keyof typeof DEFAULTS, param: { value(): string }): string {
  try {
    const v = param.value();
    if (v !== undefined && v !== null && v !== "") return v;
  } catch {
    // Parameter framework not yet initialized; fall through
  }
  const envVal = process.env[name];
  if (envVal !== undefined && envVal !== "") return envVal;
  return DEFAULTS[name] ?? "";
}

/**
 * Resolves the public client App URL without trailing slashes.
 */
export function getAppUrl(): string {
  return cfg("APP_URL", APP_URL).replace(/\/$/, "");
}

/**
 * List of secrets to mount in `runWith({ secrets })` for functions using the mailer.
 */
export const MAIL_SECRETS = [SMTP_PASSWORD];

// Singleton cached transporter instance
let cachedTransporter: Transporter | null = null;

/**
 * Lazily creates and returns a nodemailer transporter.
 * Falls back to a jsonTransport stub if SMTP settings are missing (for local emulation).
 */
function getTransporter(): Transporter {
  if (cachedTransporter) return cachedTransporter;

  const host = cfg("SMTP_HOST", SMTP_HOST);
  const user = cfg("SMTP_USER", SMTP_USER);
  let pass = "";
  try {
    pass = SMTP_PASSWORD.value();
  } catch {
    pass = process.env.SMTP_PASSWORD ?? "";
  }
  const port = parseInt(cfg("SMTP_PORT", SMTP_PORT), 10) || 587;

  // Stub logging fallback if details are not fully configured
  if (!host || !user || !pass) {
    functions.logger.warn(
      "[mailer] SMTP credentials not fully configured. Using JSON stub transport (emails will be logged, not sent)."
    );
    cachedTransporter = nodemailer.createTransport({ jsonTransport: true });
    return cachedTransporter;
  }

  // Create real SMTP transport
  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // Use SSL/TLS on port 465, STARTTLS on 587
    auth: { user, pass },
  });

  return cachedTransporter;
}

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  /** Pre-rendered HTML email body */
  html: string;
  /** Optional plain-text fallback. Auto-generated if omitted. */
  text?: string;
  replyTo?: string;
}

/**
 * Sends an email using the active transporter.
 */
export async function sendMail(options: SendMailOptions): Promise<nodemailer.SentMessageInfo> {
  const transporter = getTransporter();
  const fromName = cfg("MAIL_FROM_NAME", MAIL_FROM_NAME);
  const fromAddress = cfg("MAIL_FROM_ADDRESS", MAIL_FROM_ADDRESS);

  const info = await transporter.sendMail({
    from: `"${fromName}" <${fromAddress}>`,
    to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
    subject: options.subject,
    html: options.html,
    text: options.text ?? htmlToText(options.html),
    replyTo: options.replyTo ?? cfg("SUPPORT_EMAIL", SUPPORT_EMAIL),
  });

  if ((info as { message?: unknown }).message) {
    // Stub notification logs
    functions.logger.info("[mailer] Stub email (not actually sent):", {
      to: options.to,
      subject: options.subject,
    });
  } else {
    functions.logger.info("[mailer] Email sent", { to: options.to, messageId: info.messageId });
  }

  return info;
}

export interface EmailContent {
  greeting?: string;
  heading: string;
  paragraphs: string[];
  button?: { label: string; url: string };
  footnote?: string;
}

/**
 * Generates structured, responsive HTML email layouts with inline styling.
 * Broadly compatible across major email clients (Gmail, Outlook, Apple Mail).
 */
export function renderEmail(content: EmailContent): string {
  const appName = cfg("APP_NAME", APP_NAME);
  const appUrl = getAppUrl();
  const logoUrl = cfg("APP_LOGO_URL", APP_LOGO_URL);
  const supportEmail = cfg("SUPPORT_EMAIL", SUPPORT_EMAIL);
  const year = new Date().getFullYear();

  const brand = "#4f46e5"; // Indigo-600
  const brandDark = "#4338ca";
  const ink = "#0f172a"; // Slate-900
  const muted = "#64748b"; // Slate-500
  const border = "#e2e8f0"; // Slate-200
  const bg = "#f8fafc"; // Slate-50

  const logoBlock = logoUrl
    ? `<img src="${escapeAttr(logoUrl)}" alt="${escapeAttr(appName)}" width="140" style="display:block;border:0;outline:none;text-decoration:none;height:auto;max-width:140px;" />`
    : `<span style="font-size:20px;font-weight:700;letter-spacing:-0.02em;color:${ink};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">${escapeHtml(appName)}</span>`;

  const greetingBlock = content.greeting
    ? `<p style="margin:0 0 16px;font-size:16px;line-height:24px;color:${ink};">${escapeHtml(content.greeting)}</p>`
    : "";

  const paragraphsBlock = content.paragraphs
    .map((p) => `<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#334155;">${escapeHtml(p)}</p>`)
    .join("");

  const buttonBlock = content.button
    ? `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 24px;">
        <tr>
          <td align="center" bgcolor="${brand}" style="border-radius:6px;">
            <a href="${escapeAttr(content.button.url)}"
               style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:500;color:#ffffff;text-decoration:none;border-radius:6px;background:${brand};border:1px solid ${brandDark};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
              ${escapeHtml(content.button.label)}
            </a>
          </td>
        </tr>
      </table>`
    : "";

  const footnoteBlock = content.footnote
    ? `<p style="margin:0 0 8px;font-size:13px;line-height:20px;color:${muted};">${escapeHtml(content.footnote)}</p>`
    : "";

  const fallbackLink = content.button
    ? `<p style="margin:16px 0 0;font-size:12px;line-height:18px;color:${muted};word-break:break-all;">
         If the button above does not work, copy and paste this link into your browser:<br/>
         <a href="${escapeAttr(content.button.url)}" style="color:${brand};">${escapeHtml(content.button.url)}</a>
       </p>`
    : "";

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "https://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="https://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light only" />
  <title>${escapeHtml(content.heading)}</title>
</head>
<body style="margin:0;padding:0;background:${bg};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(content.heading)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${bg};">
    <tr>
      <td align="center" style="padding:48px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:560px;max-width:100%;background:#ffffff;border:1px solid ${border};border-radius:12px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          <!-- Header Logo / App Name -->
          <tr>
            <td align="left" style="padding:40px 40px 0;">
              ${logoBlock}
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding:32px 40px 40px;">
              <h1 style="margin:0 0 16px;font-size:22px;line-height:30px;font-weight:700;color:${ink};letter-spacing:-0.02em;">${escapeHtml(content.heading)}</h1>
              ${greetingBlock}
              ${paragraphsBlock}
              ${buttonBlock}
              ${footnoteBlock}
              ${fallbackLink}
            </td>
          </tr>
          <!-- Divider Line -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background:${border};line-height:1px;font-size:0;">&nbsp;</div>
            </td>
          </tr>
          <!-- Footer Branding & Support info -->
          <tr>
            <td style="padding:32px 40px 40px;">
              <p style="margin:0 0 8px;font-size:13px;line-height:20px;color:${muted};">
                Questions? Reply to this email or contact us at
                <a href="mailto:${escapeAttr(supportEmail)}" style="color:${brand};text-decoration:none;font-weight:500;">${escapeHtml(supportEmail)}</a>.
              </p>
              <p style="margin:0;font-size:12px;line-height:18px;color:#94a3b8;">
                &copy; ${year} ${escapeHtml(appName)}. All rights reserved.<br/>
                <a href="${escapeAttr(appUrl)}" style="color:#94a3b8;text-decoration:underline;">${escapeHtml(stripScheme(appUrl))}</a>
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:24px 0 0;font-size:11px;line-height:16px;color:#94a3b8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;text-align:center;">
          This is an automated message from ${escapeHtml(appName)}. Please do not reply directly to this email.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export interface InvitationEmailParams {
  to: string;
  organizationName: string;
  inviterName?: string;
  role: string;
  acceptUrl: string;
}

/**
 * Sends a stylized organization invitation email to candidates/employees.
 */
export async function sendInvitationEmail(params: InvitationEmailParams): Promise<void> {
  const appName = cfg("APP_NAME", APP_NAME);
  const roleLabel = humanizeRole(params.role);
  const inviter = params.inviterName ? `${params.inviterName} has` : "You have been";

  const html = renderEmail({
    greeting: "Hello,",
    heading: `You've been invited to join ${params.organizationName}`,
    paragraphs: [
      `${inviter} invited you to join ${params.organizationName} on ${appName} as ${withArticle(roleLabel)}.`,
      `${appName} is the platform ${params.organizationName} uses to manage its people, hiring, and HR workflows. Accept the invitation below to set up your account and get started.`,
    ],
    button: { label: "Accept Invitation", url: params.acceptUrl },
    footnote: "This invitation will remain valid until it is accepted or revoked by an administrator.",
  });

  await sendMail({
    to: params.to,
    subject: `You're invited to join ${params.organizationName} on ${appName}`,
    html,
  });
}

export interface EmployeeWelcomeParams {
  to: string;
  employeeName: string;
  organizationName: string;
  setPasswordUrl: string;
}

/**
 * Sends a welcome email containing account activation details to newly added employees.
 */
export async function sendEmployeeWelcomeEmail(params: EmployeeWelcomeParams): Promise<void> {
  const appName = cfg("APP_NAME", APP_NAME);

  const html = renderEmail({
    greeting: `Hi ${params.employeeName},`,
    heading: `Welcome to ${params.organizationName}`,
    paragraphs: [
      `An account has been created for you on ${appName}, the platform ${params.organizationName} uses to manage its people and HR workflows.`,
      `To activate your account, set your password using the button below. Once that's done you can sign in with your email address, ${params.to}.`,
    ],
    button: { label: "Set Your Password", url: params.setPasswordUrl },
    footnote:
      'For your security this link will expire after a while. If it stops working, use "Forgot Password" on the sign-in page to request a new one.',
  });

  await sendMail({
    to: params.to,
    subject: `Set up your ${params.organizationName} account`,
    html,
  });
}

export interface PasswordResetParams {
  to: string;
  resetUrl: string;
  recipientName?: string;
}

/**
 * Sends password reset links via custom SMTP.
 */
export async function sendPasswordResetEmail(params: PasswordResetParams): Promise<void> {
  const appName = cfg("APP_NAME", APP_NAME);

  const html = renderEmail({
    greeting: params.recipientName ? `Hi ${params.recipientName},` : "Hello,",
    heading: "Reset your password",
    paragraphs: [
      `We received a request to reset the password for your ${appName} account (${params.to}).`,
      "Click the button below to choose a new password. If you didn't request this, you can safely ignore this email â€” your password won't change.",
    ],
    button: { label: "Reset Password", url: params.resetUrl },
    footnote:
      "For your security this link will expire after a while. If it stops working, request a new one from the sign-in page.",
  });

  await sendMail({
    to: params.to,
    subject: `Reset your ${appName} password`,
    html,
  });
}

export interface NotificationEmailParams {
  to: string;
  recipientName?: string;
  heading: string;
  lines: string[];
  ctaUrl?: string;
  ctaLabel?: string;
}

/**
 * Formats and delivers general transactional event notifications.
 */
export async function sendNotificationEmail(params: NotificationEmailParams): Promise<void> {
  const content: EmailContent = {
    greeting: params.recipientName ? `Hi ${params.recipientName},` : "Hello,",
    heading: params.heading,
    paragraphs: params.lines,
  };
  if (params.ctaUrl) {
    content.button = { label: params.ctaLabel || "Open", url: params.ctaUrl };
  }
  await sendMail({ to: params.to, subject: params.heading, html: renderEmail(content) });
}

export interface ApplicationReceivedParams {
  to: string;
  candidateName: string;
  jobTitle: string;
  organizationName: string;
}

/**
 * Delivers confirmation receipts to careers portal job applicants.
 */
export async function sendApplicationReceivedEmail(p: ApplicationReceivedParams): Promise<void> {
  const html = renderEmail({
    greeting: `Hi ${p.candidateName},`,
    heading: "We've received your application",
    paragraphs: [
      `Thank you for applying for the ${p.jobTitle} position at ${p.organizationName}.`,
      "Our recruitment team is reviewing applications and will be in touch if your profile matches what we're looking for. We appreciate your interest in joining us.",
    ],
    footnote: "You're receiving this because you applied through our careers page.",
  });
  await sendMail({ to: p.to, subject: `Application received â€” ${p.jobTitle}`, html });
}

export interface StatusUpdateParams {
  to: string;
  candidateName: string;
  jobTitle: string;
  organizationName: string;
  stage: string;
}

/**
 * Informs candidates about recruitment pipeline updates.
 */
export async function sendStatusUpdateEmail(p: StatusUpdateParams): Promise<void> {
  const html = renderEmail({
    greeting: `Hi ${p.candidateName},`,
    heading: "Update on your application",
    paragraphs: [
      `There's an update on your application for the ${p.jobTitle} role at ${p.organizationName}.`,
      `Your application has progressed to the "${p.stage}" stage. We'll reach out with any next steps.`,
    ],
  });
  await sendMail({ to: p.to, subject: `Your application update â€” ${p.jobTitle}`, html });
}

export interface RejectionParams {
  to: string;
  candidateName: string;
  jobTitle: string;
  organizationName: string;
}

/**
 * Sends polite application rejection notifications.
 */
export async function sendRejectionEmail(p: RejectionParams): Promise<void> {
  const html = renderEmail({
    greeting: `Hi ${p.candidateName},`,
    heading: "Update on your application",
    paragraphs: [
      `Thank you for taking the time to apply for the ${p.jobTitle} position at ${p.organizationName} and for your interest in joining our team.`,
      "After careful consideration, we have decided to move forward with other candidates for this role. This was a difficult decision given the quality of applicants.",
      "We genuinely appreciate the effort you put into your application and encourage you to apply for future openings that match your skills.",
    ],
    footnote: "We wish you the very best in your job search.",
  });
  await sendMail({ to: p.to, subject: `Your application â€” ${p.jobTitle}`, html });
}

export interface OfferEmailParams {
  to: string;
  candidateName: string;
  jobTitle: string;
  organizationName: string;
  salary: number;
  currency: string;
  startDate: string;
  viewUrl?: string;
}

/**
 * Notifies selected candidates that an offer letter has been sent.
 */
export async function sendOfferEmail(p: OfferEmailParams): Promise<void> {
  const salaryFmt = formatMoney(p.salary, p.currency);
  const paragraphs = [
    `We are delighted to offer you the ${p.jobTitle} position at ${p.organizationName}.`,
    `Proposed compensation: ${salaryFmt} per year. Proposed start date: ${p.startDate}.`,
    "Please review the details. Our team will follow up with the formal documentation and answer any questions you may have.",
  ];
  const content: EmailContent = {
    greeting: `Dear ${p.candidateName},`,
    heading: `Your offer from ${p.organizationName}`,
    paragraphs,
  };
  if (p.viewUrl) {
    content.button = { label: "View Your Offer", url: p.viewUrl };
  }
  await sendMail({ to: p.to, subject: `Your offer for ${p.jobTitle} at ${p.organizationName}`, html: renderEmail(content) });
}

export interface InterviewInviteParams {
  to: string | string[];
  recipientName: string;
  candidateName: string;
  jobTitle: string;
  organizationName: string;
  title: string;
  whenText: string;
  location: string;
  durationMins: number;
}

/**
 * Sends calendar invites and details of scheduled interviews.
 */
const sendInterviewInviteEmail = async (p: InterviewInviteParams): Promise<void> => {
  const html = renderEmail({
    greeting: `Hi ${p.recipientName},`,
    heading: `Interview scheduled: ${p.jobTitle}`,
    paragraphs: [
      `An interview "${p.title}" has been scheduled with ${p.candidateName} for the ${p.jobTitle} role at ${p.organizationName}.`,
      `When: ${p.whenText} (${p.durationMins} minutes)`,
      `Where: ${p.location}`,
    ],
    footnote: "Please add this to your calendar. Reach out to the recruitment team if you need to reschedule.",
  });
  await sendMail({ to: p.to, subject: `Interview scheduled â€” ${p.candidateName} (${p.jobTitle})`, html });
};

// Export the function as a named export
export { sendInterviewInviteEmail };

// Provide default export for the last export function, satisfying the requirement
export default sendInterviewInviteEmail;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Localizes numeric figures into standard currencies (e.g. USD, EUR).
 */
function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

/**
 * Translates snake_case keys into friendly human-readable strings.
 */
function humanizeRole(role: string): string {
  const map: Record<string, string> = {
    super_admin: "Super Admin",
    org_admin: "Organization Admin",
    hr_manager: "HR Manager",
    recruiter: "Recruiter",
    employee: "Employee",
    interviewer: "Interviewer",
    hiring_manager: "Hiring Manager",
  };
  return map[role] ?? role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Appends indefinite articles ("a" or "an") matching starting vowel sounds.
 */
function withArticle(noun: string): string {
  return /^[aeiou]/i.test(noun) ? `an ${noun}` : `a ${noun}`;
}

/**
 * Escapes characters to clean HTML format string.
 */
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Clean values for embedding safely into element attributes.
 */
function escapeAttr(input: string): string {
  return escapeHtml(input);
}

/**
 * Removes protocols and final paths to expose clean domains.
 */
function stripScheme(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

/**
 * Fallback converter translating HTML email components to raw plain-text.
 */
function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|h1|h2|tr|div)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
```

## `backend\seed-demo.cjs`

```js
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
    await auth.getUser(u.uid);
    await auth.updateUser(u.uid, { email: u.email, password: PASSWORD, displayName: u.displayName });
    console.log(`  â†» updated auth user ${u.email}`);
  } catch (e) {
    await auth.createUser({ uid: u.uid, email: u.email, password: PASSWORD, displayName: u.displayName, emailVerified: true });
    console.log(`  âœ“ created auth user ${u.email}`);
  }
}

async function seed() {
  console.log(`Seeding demo data into emulator project "${PROJECT_ID}"â€¦\n`);

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
  console.log("âœ“ tenant");

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
  console.log("âœ“ user profiles");

  // 3. Departments
  const departments = [
    { id: "dept_eng", name: "Engineering", code: "ENG", description: "Builds the product" },
    { id: "dept_product", name: "Product", code: "PRD", description: "Owns the roadmap" },
    { id: "dept_sales", name: "Sales", code: "SAL", description: "Drives revenue" },
  ];
  for (const d of departments) {
    await db.collection("departments").doc(d.id).set({ ...d, tenantId: TENANT_ID, createdAt: now, updatedAt: now });
  }
  console.log("âœ“ departments");

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
      salaryMin: 120000,
      salaryMax: 160000,
      currency: "USD",
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
      salaryMin: 100000,
      salaryMax: 140000,
      currency: "USD",
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
      currency: "USD",
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
  console.log("âœ“ jobs");

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
  console.log("âœ“ candidates");

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
  console.log("âœ“ candidate notes");

  // 7. Interview for the Interview-stage candidate
  await db.collection("interviews").doc("intv_demo_1").set({
    id: "intv_demo_1",
    tenantId: TENANT_ID,
    candidateId: candidateIds["Grace"],
    candidateName: "Grace Hopper",
    jobId: fe.id,
    stage: "Interview",
    title: "Technical Interview â€“ System Design",
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
  console.log("âœ“ interviews");

  // 8. Offer for the Offer-stage candidate
  await db.collection("offers").doc("offer_demo_1").set({
    id: "offer_demo_1",
    tenantId: TENANT_ID,
    candidateId: candidateIds["Linus"],
    candidateName: "Linus Torvalds",
    candidateEmail: "linus.torvalds@example.com",
    jobId: fe.id,
    jobTitle: fe.title,
    salary: 150000,
    currency: "USD",
    startDate: new Date(now + 30 * 86400000).toISOString().slice(0, 10),
    expiryDate: new Date(now + 14 * 86400000).toISOString().slice(0, 10),
    status: "draft",
    notes: "Standard senior package.",
    approval: { required: false, steps: [], currentStep: 0, status: "approved" },
    createdBy: "demo_recruiter",
    createdAt: now,
    updatedAt: now,
  });
  console.log("âœ“ offers");

  console.log("\nâœ… Demo data seeded successfully.\n");
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
```

## `tests\rules\rules.test.mjs`

```js
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
```

