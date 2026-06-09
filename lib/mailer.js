import nodemailer from 'nodemailer';
import { logger, incr } from './logger.js';

/* ──────────────────────────────────────────────────────────────
 *  Email notifications — sent to one or more recipients every time
 *  an RSVP is submitted. Best-effort: a failure here never blocks
 *  the RSVP from being saved (the caller decides what to do with
 *  the returned result).
 *
 *  Config (env):
 *    SMTP_HOST          default smtp.gmail.com
 *    SMTP_PORT          default 587 (use 465 for implicit TLS)
 *    SMTP_USER          SMTP login (e.g. your Gmail address)
 *    SMTP_PASS          SMTP password / Gmail app password
 *    RSVP_NOTIFY_TO     comma- or space-separated recipient list
 *    RSVP_NOTIFY_FROM   From: address (defaults to SMTP_USER)
 * ────────────────────────────────────────────────────────────── */

// Parse the comma/space-separated recipient list into a clean array.
export function notifyRecipients() {
  return (process.env.RSVP_NOTIFY_TO || '')
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

let cachedTransport;
function transport() {
  if (cachedTransport) return cachedTransport;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    throw new Error('Missing SMTP_USER / SMTP_PASS for email notifications.');
  }
  const port = Number(process.env.SMTP_PORT) || 587;
  cachedTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465, // implicit TLS on 465, STARTTLS otherwise
    auth: { user, pass },
  });
  return cachedTransport;
}

function escapeHtml(s = '') {
  return String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

function renderEmail(entry) {
  const attending = entry.attending === 'yes';
  const events = (entry.events || []).join(', ') || '—';
  const rows = [
    ['Name', entry.name],
    ['Attending', attending ? 'Yes 🎉' : 'No 😢'],
    ['Guests', entry.guests],
    ['Email', entry.email || '—'],
    ['Phone', entry.phone || '—'],
    ['Events', events],
    ['Message', entry.message || '—'],
    ['Submitted', entry.submittedAt],
  ];

  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n');

  const tableRows = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px;color:#7a1f2b;font-weight:600;white-space:nowrap">${escapeHtml(
          k
        )}</td><td style="padding:6px 12px;color:#222">${escapeHtml(String(v))}</td></tr>`
    )
    .join('');

  const html = `
  <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;border:1px solid #e6d6a8;border-radius:10px;overflow:hidden">
    <div style="background:#7a1f2b;color:#f5e6c8;padding:16px 20px;font-size:18px">🪔 New RSVP — Gautam &amp; Sandhya</div>
    <table style="border-collapse:collapse;width:100%;background:#fffdf7">${tableRows}</table>
  </div>`;

  return { text, html };
}

/**
 * Send the RSVP notification email to all configured recipients.
 * Returns { sent, skipped, recipients, durationMs, error? } and never throws.
 */
export async function sendRsvpNotification(entry, { requestId } = {}) {
  const startedAt = Date.now();
  const to = notifyRecipients();

  if (to.length === 0) {
    incr('emailsSkipped');
    logger.warn('rsvp.email.skipped', {
      requestId,
      reason: 'no recipients configured (set RSVP_NOTIFY_TO)',
    });
    return { sent: false, skipped: true, recipients: 0, durationMs: 0 };
  }

  const from = process.env.RSVP_NOTIFY_FROM || process.env.SMTP_USER;
  const { text, html } = renderEmail(entry);
  const subject = `${entry.attending === 'yes' ? '🎉' : '😢'} RSVP from ${entry.name}`;

  try {
    const info = await transport().sendMail({ from, to, subject, text, html });
    const durationMs = Date.now() - startedAt;
    incr('emailsSent');
    logger.info('rsvp.email.sent', {
      requestId,
      recipients: to.length,
      messageId: info.messageId,
      durationMs,
    });
    return { sent: true, skipped: false, recipients: to.length, durationMs };
  } catch (err) {
    const durationMs = Date.now() - startedAt;
    incr('emailsFailed');
    logger.error('rsvp.email.failed', {
      requestId,
      recipients: to.length,
      durationMs,
      error: err.message,
    });
    return { sent: false, skipped: false, recipients: to.length, durationMs, error: err.message };
  }
}
