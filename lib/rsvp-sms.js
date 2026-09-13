// RSVP confirmation texts, sent to the guest's phone via Twilio's REST API
// (plain fetch — no SDK dependency). Phone is the one guaranteed contact
// method for every guest (it's a required field), so this is the primary
// confirmation channel; email (lib/rsvp-mailer.js) is a bonus if given.
//
// Every successful RSVP — first submission or an edit — sends a fresh text
// reflecting the guest's *current* answer, so a guest who flips from
// "can't make it" to "joyfully accept" (or back) gets the right message.
//
// Config (env):
//   TWILIO_ACCOUNT_SID
//   TWILIO_AUTH_TOKEN
//   TWILIO_FROM_NUMBER     the Twilio number texts are sent from (E.164, e.g. +14155550123)
//
// Without these, sending is skipped (and logged) so a missing config never
// breaks RSVP saving — the RSVP is already safely stored.
import { attendanceSummary, editUrl } from './rsvp-content.js';
import { logger, incr } from './logger.js';

export function isSmsConfigured() {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER);
}

// Keep only a leading "+" and digits — Twilio requires E.164 (e.g. "+919876543210").
// Guest phones are stored as "<dial code> <national number>" (e.g. "+91 98765 43210").
function toE164(phone) {
  const cleaned = String(phone || '').replace(/[^\d+]/g, '');
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}

function renderMessage(entry, origin) {
  const attending = entry.attending.value === 'yes';
  const editLink = editUrl(origin, entry.id);
  if (attending) {
    return (
      `Thanks for RSVPing for Gautam and Sandhya's wedding! You're confirmed: ${attendanceSummary(entry)}. ` +
      `Edit your RSVP any time: ${editLink}`
    );
  }
  return (
    `Thanks for RSVPing for Gautam and Sandhya's wedding. Sorry to not see you there — if you change your ` +
    `mind, you can edit your RSVP any time: ${editLink}`
  );
}

// `entry` is the stored (nested yes/no) RSVP shape from buildRsvpEntry.
// `origin` is the site's own base URL, used to build the "edit my RSVP"
// link. Never throws — best-effort, like the email confirmation.
export async function sendRsvpConfirmationSms(entry, { origin, requestId } = {}) {
  if (!entry.phone) return { sent: false, skipped: true, reason: 'no-phone' };

  if (!isSmsConfigured()) {
    incr('smsSkipped');
    logger.warn('rsvp.sms.skipped', {
      requestId,
      reason: 'TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_FROM_NUMBER not configured',
    });
    return { sent: false, skipped: true, reason: 'not-configured' };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const to = toE164(entry.phone);
  const body = renderMessage(entry, origin);

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: process.env.TWILIO_FROM_NUMBER,
        To: to,
        Body: body,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`Twilio API error ${res.status}: ${errBody}`);
    }

    const data = await res.json();
    incr('smsSent');
    logger.info('rsvp.sms.sent', { requestId, to, sid: data.sid });
    return { sent: true, skipped: false };
  } catch (err) {
    incr('smsFailed');
    logger.error('rsvp.sms.failed', { requestId, to, error: err.message });
    return { sent: false, skipped: false, error: err.message };
  }
}
