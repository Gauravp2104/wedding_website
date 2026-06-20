// Builds the stored RSVP record from a raw request body.
//
// The saved shape is intentionally "binary": every sub-choice is expressed as
// an explicit "yes"/"no" flag and grouped under its parent, so a reader can
// see at a glance exactly which days a guest accepted and which nights they
// need a room for. Example:
//
//   "attending":     { "value": "yes", "reception": "yes", "muhurtham": "yes", "bothDays": "yes" }
//   "accommodation": { "value": "yes", "day1": "no",  "day2": "no",  "bothDays": "yes" }

const yn = (v) => (v === 'yes' ? 'yes' : 'no');
const flag = (cond) => (cond ? 'yes' : 'no');

export function buildRsvpEntry(body = {}) {
  const attending = yn(body.attending);
  // Ceremony choice id: 'reception' (Day 1) | 'muhurtham' (Day 2) | 'both'.
  const attendChoice = attending === 'yes' ? String(body.attendChoice || '') : '';
  const attendBoth = attendChoice === 'both';

  // Accommodation only applies when attending.
  const accommodation = attending === 'yes' ? yn(body.accommodation) : 'no';
  // Room-night choice id: 'day1' (9–10 Feb) | 'day2' (10–11 Feb) | 'both' (9–11 Feb).
  const accChoice = accommodation === 'yes' ? String(body.accommodationChoice || '') : '';
  const accBoth = accChoice === 'both';

  return {
    id: body.id ? String(body.id).slice(0, 64) : undefined,
    name: String(body.name || '').slice(0, 120),
    email: (body.email || '').slice(0, 160),
    phone: (body.phone || '').slice(0, 40),
    guests: Number(body.guests) || 1,
    attending: {
      value: attending,
      reception: flag(attendChoice === 'reception' || attendBoth),
      muhurtham: flag(attendChoice === 'muhurtham' || attendBoth),
      bothDays: flag(attendBoth),
    },
    accommodation: {
      value: accommodation,
      day1: flag(accChoice === 'day1' || accBoth),
      day2: flag(accChoice === 'day2' || accBoth),
      bothDays: flag(accBoth),
    },
    message: (body.message || '').slice(0, 1000),
    submittedAt: new Date().toISOString(),
  };
}
