import { appendRsvp } from '../lib/rsvp-store.js';
import { incr, logger, newRequestId } from '../lib/logger.js';

// POST /api/rsvp — append one RSVP to the rsvps.json blob (Vercel deployment).
export default async function handler(req, res) {
  const requestId = newRequestId();
  res.setHeader('X-Request-Id', requestId);

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  incr('rsvpReceived');
  const { name, attending } = req.body || {};
  if (!name || !attending) {
    return res.status(400).json({ ok: false, error: 'Name and attendance are required.' });
  }

  const entry = {
    name: String(name).slice(0, 120),
    attending: attending === 'yes' ? 'yes' : 'no',
    guests: Number(req.body.guests) || 1,
    email: (req.body.email || '').slice(0, 160),
    phone: (req.body.phone || '').slice(0, 40),
    events: Array.isArray(req.body.events) ? req.body.events.slice(0, 10) : [],
    message: (req.body.message || '').slice(0, 1000),
    submittedAt: new Date().toISOString(),
  };

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
