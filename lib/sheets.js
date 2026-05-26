import { google } from 'googleapis';

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_TAB = process.env.GOOGLE_SHEET_TAB || 'RSVPs';

// Header row written to the sheet; also used to map row arrays back to objects.
export const HEADERS = [
  'Name',
  'Attending',
  'Guests',
  'Email',
  'Phone',
  'Events',
  'Message',
  'Submitted',
];

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  // Vercel stores multi-line secrets with literal "\n"; restore real newlines.
  const key = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  if (!email || !key || !SHEET_ID) {
    throw new Error(
      'Missing Google env vars (GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEET_ID).'
    );
  }
  return new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

function sheetsClient() {
  return google.sheets({ version: 'v4', auth: getAuth() });
}

// Write the header row once, if the sheet is empty.
async function ensureHeader(sheets) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_TAB}!A1:H1`,
  });
  if (!res.data.values || res.data.values.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_TAB}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [HEADERS] },
    });
  }
}

export async function appendRsvp(entry) {
  const sheets = sheetsClient();
  await ensureHeader(sheets);
  const row = [
    entry.name,
    entry.attending === 'yes' ? 'Yes' : 'No',
    entry.guests,
    entry.email || '',
    entry.phone || '',
    (entry.events || []).join(', '),
    entry.message || '',
    entry.submittedAt,
  ];
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_TAB}!A1`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row] },
  });
}

export async function readRsvps() {
  const sheets = sheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_TAB}!A2:H`, // skip header row
  });
  const rows = res.data.values || [];
  return rows.map((r) => ({
    name: r[0] || '',
    attending: (r[1] || '').toLowerCase() === 'yes' ? 'yes' : 'no',
    guests: Number(r[2]) || 0,
    email: r[3] || '',
    phone: r[4] || '',
    events: r[5]
      ? r[5]
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
    message: r[6] || '',
    submittedAt: r[7] || '',
  }));
}
