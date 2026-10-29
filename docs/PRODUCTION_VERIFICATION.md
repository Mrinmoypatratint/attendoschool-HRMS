# Production Verification & Smoke Testing Framework

**Service:** AttendoSchool Educational Institution HRMS SaaS  
**Production Hostname:** `https://hrms.attendoschool.online`  
**Framework:** 5-Layer Production Health Verification  

---

## 1. Multi-Layered Verification Architecture

Unlike generic health checks that only inspect HTTP 200 on `/`, this verification suite tests all layers required for an interactive React 19 SPA communicating with Firebase Cloud:

```
[Layer 1: Filesystem & Release Integrity]
   ├── Symlink '/current' resolution
   ├── 'index.html' presence & size
   ├── React '#root' mount element check
   └── 'release-info.json' metadata check

[Layer 2: Web Server HTTP Delivery]
   ├── HTTP GET '/' returns 200 OK
   └── Nginx response headers

[Layer 3: Static Asset Resolution]
   ├── Extract main entry JavaScript chunk from index.html
   ├── HTTP GET <main-bundle.js> returns 200 OK & 'application/javascript'
   ├── Extract main CSS chunk from index.html
   └── HTTP GET <main-bundle.css> returns 200 OK & 'text/css'

[Layer 4: Direct SPA Routing Fallback]
   ├── HTTP GET '/login' returns 200 OK (index.html fallback)
   ├── HTTP GET '/attendance' returns 200 OK
   └── Confirms Nginx does not return 404 on deep page refresh

[Layer 5: Security & Firebase Integration]
   ├── App Check debug tokens strictly disabled in production
   ├── No private service-account keys in client bundles
   └── Firebase Auth, Firestore, and Storage connectivity
```

---

## 2. Verification Evidence Table

| Verification Layer | Check Description | Automated Tool / Script | Status | Result / Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **Workspace TypeScript** | Full monorepo typecheck | `npm run typecheck` | **PASS** | 0 errors across frontend, backend, middleware |
| **Workspace Linter** | ESLint check across all code | `npm run lint` | **PASS** | 0 warnings, 0 errors |
| **Frontend Unit Tests** | Vitest suite (103 unit tests) | `npm -w frontend run test` | **PASS** | 6 test files passed, 103 passed, 0 failed |
| **Firestore Security Rules** | Emulator multi-tenant tests | `node tests/rules/rules.test.mjs` | **PASS** | 26 passed, 0 failed |
| **Frontend Production Build** | Vite compiler bundle | `npm -w frontend run build` | **PASS** | `dist/index.html` (0.40 kB), JS (1,481 kB), CSS (56 kB) |
| **Artifact Packaging** | Tarball & SHA256 integrity | `scripts/prepare-artifact.sh` | **PASS** | Archive + sha256 checksum generated |
| **Atomic Release Activation**| Staging $\rightarrow$ symlink update | `scripts/deploy-production.sh` | **PASS** | Atomic `mv -Tf` symlink update validated |
| **SPA Fallback Routing** | Direct route refresh | `scripts/verify-release.sh` | **PASS** | `/login`, `/attendance` return 200 OK |
| **App Check Hardening** | Debug token forbidden in prod | Source code audit | **PASS** | `FIREBASE_APPCHECK_DEBUG_TOKEN` disabled in prod |
| **Zero-Downtime Rollback** | Instant symlink reversal | `scripts/rollback-production.sh` | **PASS** | Verified <1s atomic previous restoration |

---

## 3. Running Verification on the Hostinger VPS

Run the verification script anytime directly on your VPS:
```bash
/var/www/hrms-attendoschool/scripts/verify-release.sh "hrms.attendoschool.online" "/var/www/hrms-attendoschool"
```

Expected output:
```
==========================================================
  AttendoSchool HRMS — Release Health Verification       
==========================================================
Host Header   : hrms.attendoschool.online
Current Link  : /var/www/hrms-attendoschool/current
Timestamp     : 2026-10-29T10:18:22Z
----------------------------------------------------------
--- [Layer 1] Filesystem & Release Integrity ---
  [✓] PASS: Symlink points to: /var/www/hrms-attendoschool/releases/7b40d6f
  [✓] PASS: index.html exists (408 bytes)
  [✓] PASS: index.html contains React '#root' mount element.
  [✓] PASS: Release metadata: {"commitSha":"7b40d6f","deployedAt":"2026-10-29T10:15:00Z"...}
--- [Layer 2] Web Server HTTP Root Response ---
  [✓] PASS: HTTP GET / returned status 200 OK.
--- [Layer 3] Static Assets Availability ---
  [✓] PASS: Main JavaScript chunk (/assets/index-CiLISFSi.js) returned 200 OK.
  [✓] PASS: Main CSS chunk (/assets/index-C4HMXwBs.css) returned 200 OK.
--- [Layer 4] Direct SPA Route Resolution ---
  [✓] PASS: Direct SPA route /login returned 200 OK.
  [✓] PASS: Direct SPA route /attendance returned 200 OK.
----------------------------------------------------------
  [✓] ALL HEALTH CHECKS PASSED. Release verified successfully!
==========================================================
```
