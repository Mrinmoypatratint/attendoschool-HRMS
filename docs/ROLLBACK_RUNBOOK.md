# Production Rollback Runbook

**Service:** AttendoSchool Educational Institution HRMS SaaS  
**Production URL:** `https://hrms.attendoschool.online`  
**Rollback Duration:** < 1 Second (Atomic Symlink Reversal)  

---

## 1. Automated Rollback Behavior

During every automated deployment, GitHub Actions executes [`verify-release.sh`](file:///d:/Projects/hrms-ats-saas/scripts/verify-release.sh). If any check fails (missing assets, HTTP errors, broken SPA routing):

1. The deployment process halts immediately before reporting success.
2. The workflow automatically invokes [`rollback-production.sh`](file:///d:/Projects/hrms-ats-saas/scripts/rollback-production.sh).
3. The symlink `/var/www/hrms-attendoschool/current` is atomically reverted to the `previous` release.
4. Nginx reloads cleanly.
5. The deployment job marks itself **FAILED** in GitHub Actions with error telemetry.
6. End users continue using the previous known-good release without downtime.

---

## 2. Instant Manual Rollback (1-Command)

If an issue is discovered after a successful deployment (e.g. client-side runtime logic bug):

Log in to the Hostinger VPS:
```bash
ssh deployer@YOUR_VPS_IP
```

Run the rollback script with no arguments (automatically restores the previous release):
```bash
/var/www/hrms-attendoschool/scripts/rollback-production.sh
```

Sample output:
```
==========================================================
  AttendoSchool HRMS — Release Rollback Procedure        
==========================================================
[+] Current failing release: 9bbe8da
[+] Using recorded 'previous' symlink target: f66b78a
[+] Atomically restoring symlink 'current' -> /var/www/hrms-attendoschool/releases/f66b78a...
[+] Reloading web server...
    [✓] Nginx reloaded.
[+] Rollback event recorded in /var/www/hrms-attendoschool/shared/rollback.log
[+] Re-verifying restored release health...
  [✓] ALL HEALTH CHECKS PASSED. Release verified successfully!
==========================================================
  [✓] ROLLBACK COMPLETE: Active release restored to f66b78a
==========================================================
```

---

## 3. Rollback to a Specific Historical Commit SHA

If you need to roll back several releases back to a specific known commit:

1. List available releases:
   ```bash
   ls -la /var/www/hrms-attendoschool/releases/
   ```
2. Pass the desired commit SHA to the rollback script:
   ```bash
   /var/www/hrms-attendoschool/scripts/rollback-production.sh "c5c4fa6"
   ```

---

## 4. Rollback Audit Log

All rollback events are logged in `/var/www/hrms-attendoschool/shared/rollback.log`:
```bash
cat /var/www/hrms-attendoschool/shared/rollback.log
```
Example log entry:
```
2026-10-29T10:20:00Z | ROLLBACK EXECUTED | From: 9bbe8da | Restored: f66b78a | By: deployer
```

---

## 5. Critical Database Safety Rules
- **Frontend vs Firestore:** Rollback of the frontend SPA switches static code. It **never** mutates or deletes records in Cloud Firestore.
- **Backward Compatibility:** All Firestore schema changes are designed additively so older frontend releases remain compatible with the database.
