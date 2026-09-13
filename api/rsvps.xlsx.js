import { rsvpsXlsxUrl } from '../lib/rsvp-store.js';

// GET /api/rsvps.xlsx — a stable link to the live RSVP spreadsheet.
// Redirects to the current rsvps.xlsx blob (same pathname, overwritten on
// every RSVP save — see lib/rsvp-store.js), so this URL always serves the
// latest snapshot. Bookmark it to open/download in Excel any time.
export default async function handler(_req, res) {
  try {
    const url = await rsvpsXlsxUrl();
    if (!url) return res.status(404).json({ ok: false, error: 'No RSVPs yet.' });
    res.writeHead(302, { Location: url });
    res.end();
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Could not load the RSVP spreadsheet.' });
  }
}
