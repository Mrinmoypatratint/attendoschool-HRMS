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
    debug: true,
    logger: true,
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
 * Sends an account status change email (activated / deactivated).
 */
export interface AccountStatusEmailParams {
  to: string;
  organizationName: string;
  /** Actor name (the admin who toggled the account) */
  actorName?: string;
  /** Actor role (e.g. org_admin / hr_manager), as a friendly label if you want */
  actorRole?: string;
  status: "active" | "disabled";
}

/**
 * Notifies users when their account is activated/deactivated by an admin.
 */
export async function sendAccountStatusEmail(p: AccountStatusEmailParams): Promise<void> {
  const appName = cfg("APP_NAME", APP_NAME);
  const isActive = p.status === "active";

  const heading = isActive ? "Your account has been activated" : "Your account has been deactivated";
  const paragraphs: string[] = [];

  const actorLine =
    p.actorName && p.actorRole
      ? `This update was made by ${p.actorName} (${p.actorRole}).`
      : p.actorName
      ? `This update was made by ${p.actorName}.`
      : "";

  if (actorLine) paragraphs.push(actorLine);

  paragraphs.push(
    `Your ${appName} account for ${p.organizationName} is now ${p.status}.`
  );

  if (isActive) {
    paragraphs.push("You can sign in again with your existing email and password.");
  } else {
    paragraphs.push("You will not be able to sign in until your account is re-activated by an administrator.");
  }

  const html = renderEmail({
    greeting: "Hello,",
    heading,
    paragraphs,
    footnote: "If you believe you received this email by mistake, contact your organization support team.",
  });

  await sendMail({
    to: p.to,
    subject: `${heading} — ${p.organizationName}`,
    html,
  });
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
      "Click the button below to choose a new password. If you didn't request this, you can safely ignore this email — your password won't change.",
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
  await sendMail({ to: p.to, subject: `Application received — ${p.jobTitle}`, html });
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
  await sendMail({ to: p.to, subject: `Your application update — ${p.jobTitle}`, html });
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
  await sendMail({ to: p.to, subject: `Your application — ${p.jobTitle}`, html });
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
  await sendMail({ to: p.to, subject: `Interview scheduled — ${p.candidateName} (${p.jobTitle})`, html });
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
