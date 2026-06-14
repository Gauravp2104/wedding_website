// Six ceremonies across two days. Each carries its own palette.
// AM ceremonies use bright, sunlit palettes; PM ceremonies deepen
// toward dusk and night. `period` drives the bright/dark theme.
//
// `location` is the venue label shown on the map link; `MAPS_URL` is
// the shared Google Maps link the pill opens (works on phone + laptop).

export const MAPS_URL = 'https://maps.app.goo.gl/TsDAJPRXKB5JgNLz6';

// `start`/`end` are local Bengaluru times (Asia/Kolkata, +05:30) in
// YYYYMMDDTHHMMSS form. Convert to a UTC iCalendar stamp (…Z).
function icsStamp(local) {
  const Y = +local.slice(0, 4);
  const Mo = +local.slice(4, 6);
  const Da = +local.slice(6, 8);
  const H = +local.slice(9, 11);
  const Mi = +local.slice(11, 13);
  const S = +local.slice(13, 15);
  const u = new Date(Date.UTC(Y, Mo - 1, Da, H, Mi, S) - (5 * 60 + 30) * 60 * 1000);
  const p = (n) => String(n).padStart(2, '0');
  return `${u.getUTCFullYear()}${p(u.getUTCMonth() + 1)}${p(u.getUTCDate())}T${p(
    u.getUTCHours()
  )}${p(u.getUTCMinutes())}${p(u.getUTCSeconds())}Z`;
}

function icsEscape(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

// Build a single .ics file containing ALL ceremonies — one tap adds the whole
// schedule (both days) to Apple/Google/Outlook calendars.
export function buildIcs(list = events) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Gautam & Sandhya//Wedding//EN',
    'CALSCALE:GREGORIAN',
  ];
  for (const ev of list) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${ev.id}@gautam-sandhya-wedding`,
      'DTSTAMP:20260601T000000Z',
      `DTSTART:${icsStamp(ev.start)}`,
      `DTEND:${icsStamp(ev.end)}`,
      `SUMMARY:${icsEscape(`${ev.name} — Gautam & Sandhya`)}`,
      `LOCATION:${icsEscape(`${ev.location}, Bengaluru`)}`,
      `DESCRIPTION:${icsEscape(`${ev.blurb}\n\nVenue map: ${MAPS_URL}`)}`,
      'END:VEVENT'
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export const events = [
  {
    id: 'vratham',
    icon: '🕉️',
    name: 'Vratham',
    sanskrit: 'விரதம்',
    day: 'Day 1',
    date: 'Wednesday, 10 February 2027',
    time: '8:00 – 10:00 AM',
    period: 'AM',
    start: '20270210T080000',
    end: '20270210T100000',
    location: 'Shubh Royale',
    blurb:
      'The wedding opens at dawn with sacred vows. A Ganapathi puja and the tying of the kankanam — the protective thread — invoke divine blessings as the families step into two days of celebration.',
    palette: {
      bg: ['#fdf7e7', '#f7e3a8', '#f3cf73'],
      accent: '#b8860b',
      ink: '#43340f',
      sub: '#6b5524',
    },
  },
  {
    id: 'nitchayathartham',
    icon: '💍',
    name: 'Nitchayathartham',
    sanskrit: 'நிச்சயதார்த்தம்',
    day: 'Day 1',
    date: 'Wednesday, 10 February 2027',
    time: '11:00 AM – 12:30 PM',
    period: 'AM',
    start: '20270210T110000',
    end: '20270210T123000',
    location: 'Shubh Royale',
    blurb:
      'The formal engagement. Elders exchange the thamboolam, the lagna patrika is read aloud, and the union of the two families is blessed before the midday lamp.',
    palette: {
      bg: ['#fff2d0', '#f7c948', '#e8951f'],
      accent: '#9c3b0a',
      ink: '#4a2606',
      sub: '#7a3f10',
    },
  },
  {
    id: 'reception-musical',
    icon: '🎶',
    name: 'Reception & Musical Night',
    sanskrit: 'இசை இரவு',
    day: 'Day 1',
    date: 'Wednesday, 10 February 2027',
    time: '6:30 – 8:30 PM',
    period: 'PM',
    start: '20270210T183000',
    end: '20270210T203000',
    location: 'Shubh Royale',
    blurb:
      'As the lamps are lit, the evening turns to celebration — a grand reception with a live Carnatic and light-music ensemble under a canopy of jasmine and marigold.',
    palette: {
      bg: ['#3a0d1a', '#5e1226', '#7a1f2b'],
      accent: '#e7b84e',
      ink: '#f6e7c6',
      sub: '#d8b98c',
    },
  },
  {
    id: 'kasi-yatra-oonjal',
    icon: '🌿',
    name: 'Kasi Yatra & Oonjal',
    sanskrit: 'காசி யாத்திரை · ஊஞ்சல்',
    day: 'Day 2',
    date: 'Thursday, 11 February 2027',
    time: '8:00 AM',
    period: 'AM',
    start: '20270211T080000',
    end: '20270211T090000',
    location: 'Shubh Royale',
    blurb:
      'A playful morning ritual — the groom mock-departs for Kasi before being welcomed back, followed by the Oonjal, where the couple is seated on a flower-decked swing and serenaded.',
    palette: {
      bg: ['#f1f7e6', '#cfe3a3', '#a7c66b'],
      accent: '#4f7a1f',
      ink: '#2f3d16',
      sub: '#4f6128',
    },
  },
  {
    id: 'muhurtham',
    icon: 'mangalsutra',
    name: 'Muhurtham',
    sanskrit: 'முகூர்த்தம்',
    day: 'Day 2',
    date: 'Thursday, 11 February 2027',
    time: '10:30 – 11:30 AM',
    period: 'AM',
    start: '20270211T103000',
    end: '20270211T113000',
    location: 'Shubh Royale',
    blurb:
      'The sacred heart of the wedding. Around the holy agni, the mangalsutra is tied and the saptapadi taken — seven steps that bind Gautam and Sandhya for a lifetime.',
    palette: {
      bg: ['#fff8e0', '#f3cf73', '#e7b23a'],
      accent: '#a8430f',
      ink: '#42300c',
      sub: '#7a4a12',
    },
  },
  {
    id: 'nalungu',
    icon: '🌺',
    name: 'Nalungu',
    sanskrit: 'நலங்கு',
    day: 'Day 2',
    date: 'Thursday, 11 February 2027',
    time: '4:30 – 5:30 PM',
    period: 'PM',
    start: '20270211T163000',
    end: '20270211T173000',
    location: 'Shubh Royale',
    blurb:
      'A joyful, light-hearted close — turmeric and sandal are applied, games are played between the couple, and the families send them off with laughter, song and sweets.',
    palette: {
      bg: ['#4a1408', '#7c2a12', '#a8431b'],
      accent: '#ffd27a',
      ink: '#fbe6cf',
      sub: '#e6b88f',
    },
  },
];
