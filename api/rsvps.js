import { readRsvps } from '../lib/sheets.js';

// GET /api/rsvps — all RSVPs as JSON, read live from the Google Sheet.
export default async function handler(_req, res) {
  try {
    res.json(await readRsvps());
  } catch (err) {
    console.error('Failed to read RSVPs:', err);
    res.status(500).json({ ok: false, error: 'Could not read RSVPs.' });
  }
}
