import { createSign } from 'node:crypto';

/*
 * Live-syncs RSVPs to a Google Sheet the couple can watch update in real
 * time, using a Google service account: a signed JWT (Node's built-in
 * crypto — no extra npm dependency) is exchanged for an OAuth access token,
 * then plain fetch calls hit the Sheets REST API directly.
 *
 * Setup steps: see README.md → "Live Google Sheet".
 */

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

// One column per field in the stored RSVP JSON (see lib/rsvp-entry.js), so
// nothing needs to be inferred or looked up elsewhere — plus a couple of
// plain-language summary columns for a quick read.
const HEADER = [
  'ID',
  'Name',
  'Email',
  'Phone',
  'Guests',
  'Attending',
  'Reception (Day 1)',
  'Muhurtham (Day 2)',
  'Attending both days',
  'Ceremonies (summary)',
  'Accommodation needed',
  'Accommodation 9–10 Feb',
  'Accommodation 10–11 Feb',
  'Accommodation both nights',
  'Accommodation (summary)',
  'Message',
  'Submitted at',
];

function yesNo(v) {
  return v === 'yes' ? 'Yes' : 'No';
}

function attendanceSummary(entry) {
  const a = entry.attending || {};
  if (a.value !== 'yes') return 'Not attending';
  if (a.bothDays === 'yes') return 'Reception & Muhurtham (both days)';
  const parts = [];
  if (a.reception === 'yes') parts.push('Reception (Day 1)');
  if (a.muhurtham === 'yes') parts.push('Muhurtham (Day 2)');
  return parts.join(', ') || '—';
}

function accommodationSummary(entry) {
  const acc = entry.accommodation || {};
  if (acc.value !== 'yes') return 'Not needed';
  if (acc.bothDays === 'yes') return 'Both nights (9–11 Feb)';
  const days = [];
  if (acc.day1 === 'yes') days.push('9–10 Feb');
  if (acc.day2 === 'yes') days.push('10–11 Feb');
  return days.join(' & ') || 'Not needed';
}

// The sheet is written with valueInputOption=USER_ENTERED, so any cell whose
// text starts with =, +, -, @, tab, or a stray leading single/double quote is
// parsed as a formula (or breaks the CSV-like value) by Sheets — a phone
// number like "+91 98765 43210" comes out as #ERROR! instead of showing the
// number. A leading apostrophe forces Sheets to treat the cell as plain text
// (and isn't shown), so escape any free-text field that could start with one
// of those characters. Phone numbers specifically are always forced to text,
// since a long digit-only number would otherwise be auto-formatted (and can
// lose a leading "0" or be rendered in scientific notation).
function asText(value) {
  const str = value == null ? '' : String(value);
  return /^[=+\-@'"\t]/.test(str) ? `'${str}` : str;
}

function asPhoneText(value) {
  const str = value == null ? '' : String(value);
  if (!str) return '';
  return str.startsWith("'") ? str : `'${str}`;
}

function toRow(entry) {
  const a = entry.attending || {};
  const acc = entry.accommodation || {};
  return [
    asText(entry.id),
    asText(entry.name),
    asText(entry.email),
    asPhoneText(entry.phone),
    entry.guests || 1,
    yesNo(a.value),
    yesNo(a.reception),
    yesNo(a.muhurtham),
    yesNo(a.bothDays),
    attendanceSummary(entry),
    yesNo(acc.value),
    yesNo(acc.day1),
    yesNo(acc.day2),
    yesNo(acc.bothDays),
    accommodationSummary(entry),
    asText(entry.message),
    entry.submittedAt ? new Date(entry.submittedAt).toISOString().slice(0, 16).replace('T', ' ') : '',
  ];
}

// Service-account credentials, from either one pasted JSON key file
// (GOOGLE_SERVICE_ACCOUNT_JSON) or two separate env vars — whichever is
// easier to paste into the host you're deploying to.
function credentials() {
  const sheetId = process.env.GOOGLE_SHEETS_ID;
  if (!sheetId) return null;

  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.client_email && parsed.private_key) {
        return { email: parsed.client_email, key: parsed.private_key, sheetId };
      }
    } catch {
      // Malformed JSON — fall through and try the separate env vars below.
    }
  }

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!email || !rawKey) return null;
  // Most hosts can't store a real multi-line value in an env var, so the
  // key is pasted with literal "\n" escapes — turn them back into newlines.
  return { email, key: rawKey.replace(/\\n/g, '\n'), sheetId };
}

export function isSheetsConfigured() {
  return Boolean(credentials());
}

function requireCredentials() {
  const creds = credentials();
  if (!creds) {
    throw new Error(
      'Google Sheets not connected: set GOOGLE_SHEETS_ID and either ' +
        'GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SERVICE_ACCOUNT_EMAIL + ' +
        'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY, then redeploy. See README.md "Live Google Sheet".'
    );
  }
  return creds;
}

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Cached per warm instance (serverless container or the long-lived local
// server) — access tokens are valid for an hour, no need to mint a new one
// on every RSVP.
let cachedToken = null;

async function getAccessToken(creds) {
  if (cachedToken && cachedToken.exp > Date.now() + 30_000) return cachedToken.token;

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64url(
    JSON.stringify({ iss: creds.email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 })
  );
  const unsigned = `${header}.${claims}`;
  const signature = base64url(createSign('RSA-SHA256').update(unsigned).sign(creds.key));
  const jwt = `${unsigned}.${signature}`;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    throw new Error(`Google auth failed: ${res.status} ${await res.text().catch(() => '')}`);
  }
  const data = await res.json();
  cachedToken = { token: data.access_token, exp: Date.now() + data.expires_in * 1000 };
  return cachedToken.token;
}

async function apiFetch(url, token, init = {}) {
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Google Sheets API ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json().catch(() => ({}));
}

// Full-snapshot rewrite (the same approach rsvps.json's old rsvps.xlsx
// companion used): clear the sheet, then write the header + every current
// RSVP. Simpler and safer than trying to diff/upsert individual rows, and
// at wedding RSVP volume the extra round trip is free — it also means a
// guest's edited or removed RSVP never leaves a stale row behind.
export async function syncRsvpsToSheet(entries) {
  const creds = requireCredentials();
  const token = await getAccessToken(creds);
  const tab = process.env.GOOGLE_SHEETS_TAB || ''; // '' = the sheet's first/default tab
  const a1 = (suffix) => (tab ? `${tab}!${suffix}` : suffix);
  const base = `${SHEETS_API}/${creds.sheetId}/values`;

  await apiFetch(`${base}/${encodeURIComponent(a1('A:Z'))}:clear`, token, { method: 'POST' });
  await apiFetch(`${base}/${encodeURIComponent(a1('A1'))}?valueInputOption=USER_ENTERED`, token, {
    method: 'PUT',
    body: JSON.stringify({ values: [HEADER, ...entries.map(toRow)] }),
  });
}
