// Email service for Collabora.
// Uses nodemailer over SMTP (Gmail by default). All sends are best-effort:
// failures are logged but never throw, so a mail problem can't break a request.
//
// Required env vars (set in .env locally / Cloud Run secrets in prod):
//   SMTP_USER      the sending Gmail address, e.g. you@gmail.com
//   SMTP_PASS      a Google App Password (16 chars, NOT your normal password)
// Optional:
//   SMTP_HOST      default smtp.gmail.com
//   SMTP_PORT      default 465
//   MAIL_FROM_NAME default "Collabora"
//   MAIL_FROM      default = SMTP_USER
//   APP_URL        frontend base URL used for button links, e.g. https://collabora.vercel.app

const nodemailer = require('nodemailer');

const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT, 10) || 465;
const FROM_NAME = process.env.MAIL_FROM_NAME || 'Collabora';
const FROM_ADDR = process.env.MAIL_FROM || SMTP_USER;
const APP_URL = (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');

const mailEnabled = Boolean(SMTP_USER && SMTP_PASS);

let transporter = null;
if (mailEnabled) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for 587 (STARTTLS)
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
} else {
  console.warn('[email] SMTP_USER/SMTP_PASS not set — emails are disabled (logged only).');
}

// ---------------------------------------------------------------------------
// HTML template — table-based + inline styles for broad email-client support.
// ---------------------------------------------------------------------------
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Build a branded HTML email.
 * @param {object} o
 * @param {string} o.preheader  hidden inbox-preview text
 * @param {string} o.heading    big title in the body
 * @param {string} [o.intro]    greeting line, e.g. "Hi Sarah,"
 * @param {string[]} [o.lines]  paragraphs of body copy
 * @param {Array<{label:string,value:string}>} [o.details]  optional key/value box
 * @param {string} [o.ctaText]  button label
 * @param {string} [o.ctaUrl]   button link
 */
function renderHtml(o) {
  const accent = '#4f46e5';
  const detailRows = (o.details || [])
    .map(
      (d) => `
        <tr>
          <td style="padding:6px 0;color:#6b7280;font-size:13px;width:140px;vertical-align:top;">${escapeHtml(d.label)}</td>
          <td style="padding:6px 0;color:#111827;font-size:13px;font-weight:600;">${escapeHtml(d.value)}</td>
        </tr>`
    )
    .join('');

  const detailsBox = detailRows
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="background:#f9fafb;border:1px solid #eef0f3;border-radius:10px;padding:14px 18px;margin:8px 0 20px;">
         ${detailRows}
       </table>`
    : '';

  const bodyParas = (o.lines || [])
    .map(
      (l) =>
        `<p style="margin:0 0 14px;color:#374151;font-size:15px;line-height:1.6;">${escapeHtml(l)}</p>`
    )
    .join('');

  const cta =
    o.ctaText && o.ctaUrl
      ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 8px;">
           <tr><td style="border-radius:8px;background:${accent};">
             <a href="${o.ctaUrl}" target="_blank"
                style="display:inline-block;padding:12px 26px;font-size:15px;font-weight:600;
                       color:#ffffff;text-decoration:none;border-radius:8px;">${escapeHtml(o.ctaText)}</a>
           </td></tr>
         </table>`
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>${escapeHtml(o.heading)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f7;-webkit-font-smoothing:antialiased;
             font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <span style="display:none;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">
    ${escapeHtml(o.preheader || o.heading)}
  </span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0"
               style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;
                      border:1px solid #eaecef;box-shadow:0 1px 3px rgba(16,24,40,0.04);">
          <!-- header -->
          <tr>
            <td style="background:${accent};padding:22px 32px;">
              <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.2px;">Collabora</span>
            </td>
          </tr>
          <!-- body -->
          <tr>
            <td style="padding:32px 32px 8px;">
              <h1 style="margin:0 0 16px;color:#111827;font-size:22px;font-weight:700;line-height:1.3;">
                ${escapeHtml(o.heading)}
              </h1>
              ${o.intro ? `<p style="margin:0 0 14px;color:#374151;font-size:15px;line-height:1.6;">${escapeHtml(o.intro)}</p>` : ''}
              ${bodyParas}
              ${detailsBox}
              ${cta}
            </td>
          </tr>
          <!-- footer -->
          <tr>
            <td style="padding:22px 32px 30px;border-top:1px solid #f0f1f3;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                You're receiving this email from Collabora because you're a member of a workspace.<br>
                <a href="${APP_URL}" style="color:${accent};text-decoration:none;">Open Collabora</a>
                &nbsp;•&nbsp; This is an automated message, please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderText(o) {
  const parts = [];
  if (o.intro) parts.push(o.intro);
  parts.push(o.heading);
  (o.lines || []).forEach((l) => parts.push(l));
  (o.details || []).forEach((d) => parts.push(`${d.label}: ${d.value}`));
  if (o.ctaText && o.ctaUrl) parts.push(`${o.ctaText}: ${o.ctaUrl}`);
  parts.push('\n— Collabora (automated message)');
  return parts.join('\n');
}

/**
 * Send a branded email. `to` may be a string or an array of addresses.
 * Multiple recipients are sent as BCC so they don't see each other.
 * Never throws — logs and resolves either way.
 */
async function sendMail({ to, subject, ...content }) {
  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (recipients.length === 0) return;

  if (!mailEnabled) {
    console.log(`[email] (disabled) would send "${subject}" to ${recipients.join(', ')}`);
    return;
  }

  const message = {
    from: `"${FROM_NAME}" <${FROM_ADDR}>`,
    subject,
    html: renderHtml(content),
    text: renderText(content),
  };
  // Single recipient -> To; multiple -> undisclosed BCC.
  if (recipients.length === 1) message.to = recipients[0];
  else {
    message.to = `"${FROM_NAME}" <${FROM_ADDR}>`;
    message.bcc = recipients;
  }

  try {
    await transporter.sendMail(message);
    console.log(`[email] sent "${subject}" to ${recipients.length} recipient(s)`);
  } catch (err) {
    console.error(`[email] failed to send "${subject}":`, err.message);
  }
}

const appLink = (path = '') => `${APP_URL}${path.startsWith('/') ? '' : '/'}${path}`;

// ---------------------------------------------------------------------------
// Event helpers
// ---------------------------------------------------------------------------

function sendWelcomeEmail(user) {
  return sendMail({
    to: user.email,
    subject: 'Welcome to Collabora 🎉',
    preheader: 'Your Collabora account is ready.',
    heading: 'Welcome to Collabora!',
    intro: `Hi ${user.first_name || 'there'},`,
    lines: [
      'Your account has been created successfully. Collabora helps you and your team manage tasks, share files, and stay in sync — all in one place.',
      'Click below to sign in and create or join your first team.',
    ],
    ctaText: 'Open Collabora',
    ctaUrl: appLink('/'),
  });
}

function sendAddedToTeamEmail({ recipient, teamName, addedByName }) {
  return sendMail({
    to: recipient.email,
    subject: `You've been added to "${teamName}"`,
    preheader: `You're now a member of ${teamName} on Collabora.`,
    heading: `You've joined ${teamName}`,
    intro: `Hi ${recipient.first_name || 'there'},`,
    lines: [
      `${addedByName || 'A team admin'} added you to the team "${teamName}" on Collabora.`,
      'You can now view tasks, join discussions, and share files with the team.',
    ],
    ctaText: 'Go to team',
    ctaUrl: appLink('/'),
  });
}

function sendTaskAssignedEmail({ recipient, taskName, teamName, dueDate, assignedByName }) {
  const details = [{ label: 'Task', value: taskName }];
  if (teamName) details.push({ label: 'Team', value: teamName });
  if (dueDate) details.push({ label: 'Due date', value: String(dueDate).slice(0, 10) });
  return sendMail({
    to: recipient.email,
    subject: `New task assigned: ${taskName}`,
    preheader: `You've been assigned "${taskName}".`,
    heading: 'A task was assigned to you',
    intro: `Hi ${recipient.first_name || 'there'},`,
    lines: [
      `${assignedByName || 'A teammate'} assigned you a task on Collabora. Here are the details:`,
    ],
    details,
    ctaText: 'View task',
    ctaUrl: appLink('/'),
  });
}

/**
 * Generic notification email used by createNotification() — covers task
 * create/update/delete, new discussions, and file uploads/deletes.
 * @param {string[]} emails recipient addresses
 * @param {object} n { type, message, link, teamName }
 */
function sendNotificationEmail(emails, n) {
  if (!emails || emails.length === 0) return;
  return sendMail({
    to: emails,
    subject: n.teamName ? `${n.type} — ${n.teamName}` : n.type,
    preheader: n.message,
    heading: n.type,
    lines: [n.message],
    ctaText: 'Open in Collabora',
    ctaUrl: appLink(n.link || '/'),
  });
}

module.exports = {
  sendMail,
  sendWelcomeEmail,
  sendAddedToTeamEmail,
  sendTaskAssignedEmail,
  sendNotificationEmail,
  mailEnabled,
};
