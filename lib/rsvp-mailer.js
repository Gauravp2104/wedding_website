// RSVP confirmation emails, sent to the guest via SMTP (nodemailer) — the
// same transport approach this project used before for host notifications
// (see git history: lib/mailer.js), now pointed at the guest instead.
//
// Every successful RSVP — first submission or an edit — sends a fresh
// confirmation reflecting the guest's *current* answer, so a guest who
// flips from "can't make it" to "joyfully accept" (or back) automatically
// gets the right email for their new answer.
//
// Config (env):
//   SMTP_HOST          default smtp.gmail.com
//   SMTP_PORT          default 587 (use 465 for implicit TLS)
//   SMTP_USER          SMTP login (e.g. a Gmail address + app password)
//   SMTP_PASS          SMTP password / Gmail app password
//   RSVP_FROM_EMAIL    From: address (defaults to SMTP_USER)
//
// Without SMTP_USER/SMTP_PASS, sending is skipped (and logged) so a missing
// config never breaks RSVP saving — the RSVP is already safely stored.
import nodemailer from 'nodemailer';
import { events as ceremonies, MAPS_URL, icsStamp } from '../client/src/data/events.js';
import { logger, incr } from './logger.js';

export function isMailerConfigured() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

let cachedTransport;
function transport() {
  if (cachedTransport) return cachedTransport;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    throw new Error('Missing SMTP_USER / SMTP_PASS for RSVP confirmation emails.');
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

function googleCalendarUrl(ev) {
  const dates = `${icsStamp(ev.start)}/${icsStamp(ev.end)}`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${ev.name} — Gautam & Sandhya`,
    dates,
    details: `${ev.blurb}\n\nVenue map: ${MAPS_URL}`,
    location: `${ev.location}, Bengaluru`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function attendanceSummary(entry) {
  if (entry.attending.bothDays === 'yes') return 'Reception & Muhurtham (both days)';
  const parts = [];
  if (entry.attending.reception === 'yes') parts.push('Reception (Day 1)');
  if (entry.attending.muhurtham === 'yes') parts.push('Muhurtham (Day 2)');
  return parts.join(', ') || '—';
}

function accommodationSummary(entry) {
  if (entry.accommodation.value !== 'yes') return 'Not needed';
  if (entry.accommodation.bothDays === 'yes') return 'Both nights (9–11 Feb)';
  const days = [];
  if (entry.accommodation.day1 === 'yes') days.push('9–10 Feb');
  if (entry.accommodation.day2 === 'yes') days.push('10–11 Feb');
  return days.join(' & ') || 'Not needed';
}

function editUrl(origin, id) {
  return `${origin}/?edit=${encodeURIComponent(id)}#rsvp`;
}

function calendarListHtml() {
  return ceremonies
    .map(
      (ev) =>
        `<li style="margin:0 0 8px;"><a href="${googleCalendarUrl(ev)}" style="color:#9c3b0a;text-decoration:none;font-weight:600;">+ Add "${ev.name}" to Google Calendar</a><br/><span style="color:#7a5230;font-size:13px;">${ev.date}, ${ev.time}</span></li>`
    )
    .join('\n');
}

function renderHtml(entry, origin) {
  const attending = entry.attending.value === 'yes';
  const editLink = editUrl(origin, entry.id);
  const intro = attending
    ? `<p>Thanks for RSVPing for Gautam and Sandhya's wedding! We're overjoyed you'll be celebrating with us.</p>`
    : `<p>Thanks for RSVPing for Gautam and Sandhya's wedding. Sorry to not see you there — if you change your mind, you can edit your RSVP any time using the button below.</p>`;
  const summary = attending
    ? `<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;color:#4a2606;">
        <tr><td style="padding:6px 0;color:#7a5230;">Attending</td><td style="padding:6px 0;font-weight:600;text-align:right;">${attendanceSummary(entry)}</td></tr>
        <tr><td style="padding:6px 0;color:#7a5230;">Guests</td><td style="padding:6px 0;font-weight:600;text-align:right;">${entry.guests}</td></tr>
        <tr><td style="padding:6px 0;color:#7a5230;">Accommodation</td><td style="padding:6px 0;font-weight:600;text-align:right;">${accommodationSummary(entry)}</td></tr>
      </table>`
    : '';
  const note = entry.message
    ? `<p style="color:#7a5230;font-style:italic;">"${entry.message}"</p>`
    : '';

  return `
  <div style="font-family:Georgia,'Times New Roman',serif;max-width:560px;margin:0 auto;background:#fff8e0;border:1px solid #f3cf73;border-radius:12px;overflow:hidden;">
    <div style="background:#4a2606;color:#fdf7e7;padding:24px;text-align:center;">
      <div style="font-size:28px;">🪔</div>
      <h1 style="margin:8px 0 0;font-size:22px;">Gautam &amp; Sandhya</h1>
      <p style="margin:4px 0 0;opacity:0.85;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;">10 &amp; 11 February 2027 · Bengaluru</p>
    </div>
    <div style="padding:24px;color:#4a2606;font-size:15px;line-height:1.6;">
      <p>Dear ${entry.name},</p>
      ${intro}
      ${summary}
      <p style="margin:20px 0 8px;font-weight:600;">Add the ceremonies to your calendar:</p>
      <ul style="padding-left:18px;margin:0 0 20px;">${calendarListHtml()}</ul>
      <p style="margin:20px 0;">
        <a href="${editLink}" style="display:inline-block;background:#9c3b0a;color:#fff8e0;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600;">✎ Edit my RSVP</a>
      </p>
      ${note}
      <p style="margin-top:28px;">With love,<br/>Gautam &amp; Sandhya</p>
    </div>
  </div>`;
}

function renderText(entry, origin) {
  const attending = entry.attending.value === 'yes';
  const editLink = editUrl(origin, entry.id);
  const lines = [
    `Dear ${entry.name},`,
    '',
    attending
      ? "Thanks for RSVPing for Gautam and Sandhya's wedding! We're overjoyed you'll be celebrating with us."
      : "Thanks for RSVPing for Gautam and Sandhya's wedding. Sorry to not see you there — if you change your mind, you can edit your RSVP any time using the link below.",
  ];
  if (attending) {
    lines.push(
      '',
      `Attending: ${attendanceSummary(entry)}`,
      `Guests: ${entry.guests}`,
      `Accommodation: ${accommodationSummary(entry)}`
    );
  }
  lines.push(
    '',
    'Add the ceremonies to your calendar:',
    ...ceremonies.map((ev) => `- ${ev.name} (${ev.date}, ${ev.time}): ${googleCalendarUrl(ev)}`),
    '',
    `Edit your RSVP any time: ${editLink}`,
    '',
    'With love,',
    'Gautam & Sandhya'
  );
  return lines.join('\n');
}

// `entry` is the stored (nested yes/no) RSVP shape from buildRsvpEntry.
// `origin` is the site's own base URL (e.g. https://gautam-sandhya.vercel.app),
// used to build the "edit my RSVP" link. Never throws — best-effort, like the
// project's prior email notifications.
export async function sendRsvpConfirmationEmail(entry, { origin, requestId } = {}) {
  if (!entry.email) return { sent: false, skipped: true, reason: 'no-email' };

  if (!isMailerConfigured()) {
    incr('emailsSkipped');
    logger.warn('rsvp.email.skipped', { requestId, reason: 'SMTP_USER/SMTP_PASS not configured' });
    return { sent: false, skipped: true, reason: 'not-configured' };
  }

  const attending = entry.attending.value === 'yes';
  const subject = attending
    ? "You're on the list! RSVP confirmed for Gautam & Sandhya's wedding"
    : "Thanks for your RSVP — Gautam & Sandhya's wedding";
  const from = process.env.RSVP_FROM_EMAIL || process.env.SMTP_USER;

  try {
    const info = await transport().sendMail({
      from,
      to: entry.email,
      subject,
      text: renderText(entry, origin),
      html: renderHtml(entry, origin),
    });
    incr('emailsSent');
    logger.info('rsvp.email.sent', { requestId, to: entry.email, attending, messageId: info.messageId });
    return { sent: true, skipped: false };
  } catch (err) {
    incr('emailsFailed');
    logger.error('rsvp.email.failed', { requestId, to: entry.email, error: err.message });
    return { sent: false, skipped: false, error: err.message };
  }
}
