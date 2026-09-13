import ExcelJS from 'exceljs';

// Builds the "rsvps.xlsx" workbook from the same entries stored in
// rsvps.json — regenerated from scratch on every RSVP save, so it's always
// a full, current snapshot (not an append-only log). See lib/rsvp-store.js
// (Vercel Blob) and server/index.js (local dev) for where this gets written.

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

const COLUMNS = [
  { header: 'Name', key: 'name', width: 26 },
  { header: 'Attending', key: 'attending', width: 12 },
  { header: 'Ceremonies', key: 'ceremonies', width: 30 },
  { header: 'Guests', key: 'guests', width: 9 },
  { header: 'Accommodation', key: 'accommodation', width: 20 },
  { header: 'Phone', key: 'phone', width: 18 },
  { header: 'Email', key: 'email', width: 26 },
  { header: 'Message', key: 'message', width: 40 },
  { header: 'Submitted at', key: 'submittedAt', width: 22 },
];

export async function buildRsvpWorkbookBuffer(entries) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Gautam & Sandhya's wedding site";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('RSVPs', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });
  sheet.columns = COLUMNS;
  sheet.getRow(1).font = { bold: true };
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: COLUMNS.length } };

  for (const entry of entries) {
    sheet.addRow({
      name: entry.name || '',
      attending: entry.attending?.value === 'yes' ? 'Yes' : 'No',
      ceremonies: attendanceSummary(entry),
      guests: entry.guests || 1,
      accommodation: accommodationSummary(entry),
      phone: entry.phone || '',
      email: entry.email || '',
      message: entry.message || '',
      submittedAt: entry.submittedAt ? new Date(entry.submittedAt) : '',
    });
  }

  sheet.getColumn('submittedAt').numFmt = 'yyyy-mm-dd hh:mm';

  return workbook.xlsx.writeBuffer();
}
