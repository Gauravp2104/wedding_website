import { readRsvps } from '../lib/rsvp-store.js';

// GET /api/rsvps — all RSVPs as JSON, read from the rsvps.json blob.
export default async function handler(_req, res) {
  try {
    res.json(await readRsvps());
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Could not read RSVPs.' });
  }
}
