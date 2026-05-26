import { readRsvps } from '../lib/sheets.js';
import { workbookBuffer } from '../lib/excel.js';

// GET /api/rsvps.xlsx (rewritten to /api/rsvps-xlsx) — build the Excel in memory
// from the Google Sheet and stream it as a download. Nothing is written to disk.
export default async function handler(_req, res) {
  try {
    const rows = await readRsvps();
    const buf = await workbookBuffer(rows);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename="rsvps.xlsx"');
    res.send(Buffer.from(buf));
  } catch (err) {
    console.error('Failed to build Excel:', err);
    res.status(500).json({ ok: false, error: 'Could not generate the Excel file.' });
  }
}
