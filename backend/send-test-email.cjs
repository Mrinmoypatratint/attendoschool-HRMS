/*
 * Local email test — sends a REAL invitation email using your SMTP settings.
 *
 * Usage (from the backend folder):
 *   node send-test-email.cjs recipient@example.com
 *
 * It reads SMTP/branding config from .env.local and the password from
 * .secret.local, then sends one sample invitation email. No Firebase emulator,
 * auth, or database is required.
 */
const fs = require("fs");
const path = require("path");

// --- tiny .env parser (no extra dependency) ---
function loadEnvFile(file) {
  const full = path.join(__dirname, file);
  if (!fs.existsSync(full)) return;
  const lines = fs.readFileSync(full, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    // strip optional surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".secret.local");

const recipient = process.argv[2];
if (!recipient) {
  console.error("Usage: node send-test-email.cjs recipient@example.com");
  process.exit(1);
}

// Basic config sanity checks with friendly messages
const problems = [];
if (!process.env.SMTP_USER || process.env.SMTP_USER.includes("your-email")) {
  problems.push("SMTP_USER is not set — edit backend/.env.local and put your real email address.");
}
if (!process.env.SMTP_PASSWORD || process.env.SMTP_PASSWORD.includes("paste-your")) {
  problems.push("SMTP_PASSWORD is not set — edit backend/.secret.local and paste your app password.");
}
if (problems.length) {
  console.error("Cannot send — fix the following first:\n - " + problems.join("\n - "));
  process.exit(1);
}

const { sendInvitationEmail } = require("./lib/mailer");

(async () => {
  console.log(`Sending test invitation email to ${recipient} via ${process.env.SMTP_HOST}...`);
  try {
    await sendInvitationEmail({
      to: recipient,
      organizationName: "Pravaah Consulting",
      inviterName: "Test Admin",
      role: "hr_manager",
      acceptUrl: `${(process.env.APP_URL || "http://localhost:5173").replace(/\/$/, "")}/login?email=${encodeURIComponent(recipient)}&invite=test_invite`,
    });
    console.log("✓ Done. Check the inbox (and the spam folder) for the invitation email.");
    process.exit(0);
  } catch (err) {
    console.error("✗ Failed to send:", err && err.message ? err.message : err);
    console.error("\nCommon causes:\n - Wrong SMTP_USER / app password\n - Gmail: you must use an App Password (needs 2-Step Verification), not your normal password\n - Network/firewall blocking port 587");
    process.exit(1);
  }
})();
