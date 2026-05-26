import { appendRsvp } from '../lib/sheets.js';

// POST /api/rsvp — append one RSVP row to the Google Sheet.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

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
    await appendRsvp(entry);
    res.json({ ok: true, saved: true });
  } catch (err) {
    console.error('Failed to append RSVP:', err);
    res.status(500).json({ ok: false, error: 'Could not save your RSVP. Please try again.' });
  }
}
