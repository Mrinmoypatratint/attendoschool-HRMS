# GitHub Actions Environment & Secrets Configuration

To enable automated zero-downtime deployments to your Hostinger VPS, configure the **`production`** GitHub Environment in your repository:  
👉 **[https://github.com/Mrinmoypatratint/attendoschool-HRMS/settings/environments](https://github.com/Mrinmoypatratint/attendoschool-HRMS/settings/environments)**

---

## 1. Create the `production` Environment

1. Navigate to your repository on GitHub.
2. Click **Settings** $\rightarrow$ **Environments** (in the left sidebar).
3. Click **New environment**.
4. Name the environment: **`production`** and click **Configure environment**.
5. *(Optional recommended protection)* Under **Deployment branches**, select **Selected branches** and add `main`.

---

## 2. Environment Secrets

Add these under **Environment secrets** (encrypted and masked in logs):

| Secret Name | Value Description | Example / Format |
| :--- | :--- | :--- |
| `VPS_HOST` | Public IPv4 address of your Hostinger VPS | `195.35.x.x` |
| `VPS_USER` | Dedicated deploy user created on VPS | `deployer` |
| `VPS_PORT` | SSH Port (default is 22) | `22` |
| `VPS_SSH_PRIVATE_KEY` | Entire private key (`deploy_key`) including header & footer | `-----BEGIN OPENSSH PRIVATE KEY----- ...` |
| `VPS_SSH_KNOWN_HOSTS` | Output from `ssh-keyscan -H -t ed25519 <VPS_HOST>` | `|1|abc... ed25519 AAAAC3...` |
| `VITE_FIREBASE_API_KEY` | Firebase Web App API Key | `AIzaSy...` |

> 🔒 **Security Notice:** Never use `StrictHostKeyChecking=no`. Always provide the verified host fingerprint in `VPS_SSH_KNOWN_HOSTS` to prevent man-in-the-middle attacks.

---

## 3. Environment Variables

Add these under **Environment variables** (non-sensitive configuration):

| Variable Name | Value Description | Example |
| :--- | :--- | :--- |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Authentication Domain | `attendoschool-hrms.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Google Cloud / Firebase Project ID | `attendoschool-hrms` |
| `VITE_FIREBASE_STORAGE_BUCKET`| Cloud Storage Bucket URL | `attendoschool-hrms.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID | `123456789012` |
| `VITE_FIREBASE_APP_ID` | Firebase Web Application ID | `1:123456789012:web:abcdef` |
| `VITE_RECAPTCHA_SITE_KEY` | (Optional) Production reCAPTCHA v3 site key for App Check | `6Ld...` |

---

## 4. How the Secrets Flow into Production Builds

When you push to `main`:
1. The **`build-and-package`** job injects `VITE_FIREBASE_*` variables into the Vite compiler, generating the production bundle with real endpoints.
2. The **`deploy-vps`** job uses `VPS_SSH_PRIVATE_KEY` and `VPS_SSH_KNOWN_HOSTS` to establish an authenticated SSH connection to `deployer@VPS_HOST`.
3. The release is unpacked, verified, and activated atomically.
