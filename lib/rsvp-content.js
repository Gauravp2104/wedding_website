// Shared helpers for turning a stored RSVP entry into guest-facing content —
// used by both the email (lib/rsvp-mailer.js) and SMS (lib/rsvp-sms.js)
// confirmations, so the wording/links stay consistent between the two.
import { events as ceremonies, MAPS_URL, icsStamp } from '../client/src/data/events.js';

export { ceremonies, MAPS_URL };

export function googleCalendarUrl(ev) {
  const dates = `${icsStamp(ev.start)}/${icsStamp(ev.end)}`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${ev.name} — Gautam & Sandhya`,
    dates,
    details: `${ev.blurb}\n\nVenue map: ${MAPS_URL}`,
    location: `${ev.location}, Bengaluru`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function attendanceSummary(entry) {
  if (entry.attending.bothDays === 'yes') return 'Reception & Muhurtham (both days)';
  const parts = [];
  if (entry.attending.reception === 'yes') parts.push('Reception (Day 1)');
  if (entry.attending.muhurtham === 'yes') parts.push('Muhurtham (Day 2)');
  return parts.join(', ') || '—';
}

export function accommodationSummary(entry) {
  if (entry.accommodation.value !== 'yes') return 'Not needed';
  if (entry.accommodation.bothDays === 'yes') return 'Both nights (9–11 Feb)';
  const days = [];
  if (entry.accommodation.day1 === 'yes') days.push('9–10 Feb');
  if (entry.accommodation.day2 === 'yes') days.push('10–11 Feb');
  return days.join(' & ') || 'Not needed';
}

export function editUrl(origin, id) {
  return `${origin}/?edit=${encodeURIComponent(id)}#rsvp`;
}
