# Production Deployment Runbook

**Service:** AttendoSchool Educational Institution HRMS SaaS  
**Production URL:** `https://hrms.attendoschool.online`  
**Deploy Trigger:** Push to `main` branch or GitHub Actions Manual Dispatch  

---

## 1. Routine Deployment Flow

Every deployment follows a fully automated, immutable release lifecycle:

```
[Developer / Engineer]
        │
        ▼ (PR merged to main)
[GitHub Actions CI/CD]
   ├─► Stage 1: Quality Gates (Typecheck, Lint, Test, Security audit)
   ├─► Stage 2: Production Vite Build with real Firebase parameters
   ├─► Stage 3: Tarball Archive + SHA256 Integrity Checksum Generation
   ├─► Stage 4: Secure SSH transfer to Hostinger VPS
   ├─► Stage 5: Atomic Release Activation (deploy-production.sh)
   ├─► Stage 6: Multi-layer Smoke Tests (verify-release.sh)
   └─► Stage 7: Auto-Rollback if verification fails (rollback-production.sh)
```

---

## 2. Triggering a Deployment

### Method A: Automated Push to `main` (Standard)
1. Merge your approved PR into `main`.
2. The GitHub Actions workflow `deploy.yml` triggers automatically.
3. Track progress live under: **GitHub Actions $\rightarrow$ Workflows $\rightarrow$ Production Deployment to Hostinger VPS**.

### Method B: Manual Dispatch (Re-deploying an Existing Commit)
1. Go to **Actions $\rightarrow$ Production Deployment to Hostinger VPS**.
2. Click **Run workflow**.
3. Select branch: `main` and click **Run workflow**.

---

## 3. Manual On-Server Deployment (Emergency / Maintenance)

If GitHub Actions is ever unavailable, you can deploy a packaged artifact directly on the VPS:

```bash
# Log in as deployer
ssh deployer@YOUR_VPS_IP

# Copy your built tarball to /tmp/hrms-frontend-<sha>.tar.gz
# Execute the atomic deployment script
/var/www/hrms-attendoschool/scripts/deploy-production.sh \
  "/tmp/hrms-frontend-abc1234.tar.gz" \
  "abc1234" \
  "/var/www/hrms-attendoschool" \
  5

# Run the health verification
/var/www/hrms-attendoschool/scripts/verify-release.sh \
  "hrms.attendoschool.online" \
  "/var/www/hrms-attendoschool"
```

---

## 4. Release History and Active Release Check

To check which release is currently live on the VPS:
```bash
# Check current symlink target
ls -la /var/www/hrms-attendoschool/current

# Check active release metadata
cat /var/www/hrms-attendoschool/current/release-info.json
```
Output:
```json
{
  "commitSha": "7b40d6f",
  "deployedAt": "2026-10-29T10:15:00Z",
  "deployedBy": "deployer",
  "hostname": "hostinger-vps"
}
```

To list all retained releases:
```bash
ls -la /var/www/hrms-attendoschool/releases/
```
