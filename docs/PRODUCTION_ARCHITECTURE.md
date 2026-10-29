# Production Architecture Decision Record (ADR)

**System:** AttendoSchool Educational Institution HRMS SaaS  
**Production Hostname:** `https://hrms.attendoschool.online`  
**Hosting Target:** Hostinger VPS (Ubuntu Linux) + Google Firebase Cloud  
**Status:** Approved & Implemented  

---

## 1. Executive Summary

This document specifies the verified production deployment architecture for **AttendoSchool HRMS**. The application is structured as a hybrid enterprise SaaS:

- **Hostinger VPS:** Runs a hardened Nginx web server that serves an immutable, content-hashed, single-page application (SPA) built with React 19, TypeScript, and Vite.
- **Firebase Cloud Services:** Provides managed cloud infrastructure for Authentication (Firebase Auth), NoSQL Database (Cloud Firestore), Media/Document Vault (Firebase Storage), and Serverless Background Events (Cloud Functions).

---

## 2. Architecture Diagram

```
                    INTERNET (CLIENT BROWSERS)
                               │
            ┌──────────────────┴──────────────────┐
            │ https://hrms.attendoschool.online    │
            ▼                                     ▼
┌─────────────────────────────────┐   ┌──────────────────────────────────┐
│         HOSTINGER VPS           │   │      GOOGLE FIREBASE CLOUD       │
│                                 │   │                                  │
│  ┌───────────────────────────┐  │   │  ┌────────────────────────────┐  │
│  │   NGINX Web Server        │  │   │  │   Firebase Authentication  │  │
│  │   Port 80/443 (TLS 1.3)   │  │   │  │   Email/Password & SSO     │  │
│  └─────────────┬─────────────┘  │   │  └────────────────────────────┘  │
│                │                │   │                                  │
│                ▼                │   │  ┌────────────────────────────┐  │
│  ┌───────────────────────────┐  │   │  │   Cloud Firestore          │  │
│  │ /var/www/hrms-attendoschool│  │   │  │   Multi-tenant Database    │  │
│  │ ├── current (Symlink) ────┼──┼───┼─►│   Security Rules Enforced  │  │
│  │ └── releases/<commit-sha> │  │   │  └────────────────────────────┘  │
│  └───────────────────────────┘  │   │                                  │
│                                 │   │  ┌────────────────────────────┐  │
│  ┌───────────────────────────┐  │   │  │   Firebase Storage         │  │
│  │  Deploy Automation Scripts │  │   │  │   Staff Vault & Documents  │  │
│  │  (Zero-downtime & Rollback)│  │   │  └────────────────────────────┘  │
│  └───────────────────────────┘  │   │                                  │
│                                 │   │  ┌────────────────────────────┐  │
│                                 │   │  │   Cloud Functions (Node.js)│  │
│                                 │   │  │   Email Triggers & Events  │  │
│                                 │   │  └────────────────────────────┘  │
└─────────────────────────────────┘   └──────────────────────────────────┘
```

---

## 3. Component Responsibility Matrix

| Component | Hosted Location | Runtime / Technology | Responsibility |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | **Hostinger VPS** | Nginx + Vite React 19 Static Bundle | Institutional dashboards, staff attendance, faculty workload, timetable grid, payroll UI, ATS. |
| **Authentication** | **Firebase Cloud** | Firebase Authentication | Identity management, password resets, multi-tenant session tokens. |
| **Database** | **Firebase Cloud** | Cloud Firestore | Tenant data, campuses, staff records, attendance logs, timetables, payroll records. |
| **Document Vault** | **Firebase Cloud** | Firebase Storage | Staff contracts, certificates, resumes, institutional policy documents. |
| **Backend Triggers** | **Firebase Cloud** | Node.js Firebase Functions | Email notifications (offer letters, invitations), async event processing. |
| **TLS / SSL** | **Hostinger VPS** | Let's Encrypt (Certbot) | Automated HTTPS termination, HSTS, modern cipher suites. |

---

## 4. Why This Hybrid Design Was Selected

1. **Performance & Reliability:** The Vite SPA is compiled into static, content-hashed assets (`.js`, `.css`, `.html`). Nginx on Hostinger VPS serves these directly from memory and disk cache with gzip compression, giving sub-100ms first-contentful-paint without Node.js runtime overhead.
2. **Security Isolation:** Hosting Firestore and Auth natively on Firebase ensures enterprise-grade multi-tenant security rules (`firestore.rules` and `storage.rules`) are enforced at the database layer. No database credentials or admin keys reside on the VPS.
3. **Zero-Downtime Releases:** Atomic symlink switching (`current -> releases/<commit-sha>`) guarantees zero downtime during deployments and instant (<1 second) rollback capability if a release fails health verification.
4. **App Check Hardening:** In production builds, `FIREBASE_APPCHECK_DEBUG_TOKEN` is strictly disabled, protecting callable Cloud Functions against unauthorized traffic.

---

## 5. Hostinger VPS Filesystem Structure

```
/var/www/hrms-attendoschool/
├── current -> /var/www/hrms-attendoschool/releases/9bbe8da
├── previous -> /var/www/hrms-attendoschool/releases/f66b78a
├── releases/
│   ├── 1f9480f/
│   │   ├── index.html
│   │   ├── release-info.json
│   │   └── assets/
│   │       ├── index-CiLISFSi.js
│   │       └── index-C4HMXwBs.css
│   └── 9bbe8da/
│       ├── index.html
│       ├── release-info.json
│       └── assets/
└── shared/
    ├── rollback.log
    └── nginx.access.log
```
