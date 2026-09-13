import { appendRsvp, readRsvps } from '../lib/rsvp-store.js';
import { buildRsvpEntry } from '../lib/rsvp-entry.js';
import { incr, logger, newRequestId } from '../lib/logger.js';

// GET /api/rsvp?id=... — fetch one guest's saved RSVP, so a guest on a new
// device (or one who cleared localStorage) can look up and re-edit their
// response by id.
// POST /api/rsvp — append/upsert one RSVP to the rsvps.json blob (which also
// regenerates rsvps.xlsx — see lib/rsvp-store.js) (Vercel deployment).
export default async function handler(req, res) {
  const requestId = newRequestId();
  res.setHeader('X-Request-Id', requestId);

  if (req.method === 'GET') {
    const id = String((req.query && req.query.id) || '');
    if (!id) return res.status(400).json({ ok: false, error: 'Missing id.' });
    try {
      const all = await readRsvps();
      const found = all.find((r) => r.id === id);
      if (!found) return res.status(404).json({ ok: false, error: 'RSVP not found.' });
      return res.json({ ok: true, rsvp: found });
    } catch (err) {
      logger.error('rsvp.lookup.failed', { requestId, error: err.message });
      return res.status(500).json({ ok: false, error: 'Could not look up your RSVP.' });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  incr('rsvpReceived');
  const { name, attending, phone } = req.body || {};
  if (!name || !attending || !phone) {
    return res.status(400).json({ ok: false, error: 'Name, phone, and attendance are required.' });
  }

  const entry = buildRsvpEntry(req.body);

  try {
    const all = await appendRsvp(entry);
    incr('rsvpSaved');
    logger.info('rsvp.saved', { requestId, name: entry.name, total: all.length });

    res.json({ ok: true, saved: true });
  } catch (err) {
    incr('rsvpFailed');
    logger.error('rsvp.save.failed', { requestId, error: err.message });
    res.status(500).json({ ok: false, error: 'Could not save your RSVP. Please try again.' });
  }
}
