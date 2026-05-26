import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import ExcelJS from 'exceljs';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFile, writeFile, mkdir } from 'fs/promises';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
// DATA_DIR can be pointed at a mounted persistent volume in production
// (e.g. DATA_DIR=/data) so RSVPs survive restarts and redeploys.
const DATA_DIR = process.env.DATA_DIR || join(__dirname, 'data');
const RSVP_FILE = join(DATA_DIR, 'rsvps.json');
const XLSX_FILE = join(DATA_DIR, 'rsvps.xlsx');
const CLIENT_DIST = join(__dirname, '..', 'client', 'dist');

const app = express();
app.use(cors());
app.use(express.json());

/* ──────────────────────────────────────────────────────────────
 *  Storage helpers
 * ────────────────────────────────────────────────────────────── */

async function readRsvps() {
  try {
    const raw = await readFile(RSVP_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function saveRsvp(entry) {
  await mkdir(DATA_DIR, { recursive: true });
  const all = await readRsvps();
  all.push(entry);
  await writeFile(RSVP_FILE, JSON.stringify(all, null, 2), 'utf-8');
  return all;
}

/* ── Excel workbook built from the RSVP rows ───────────────────── */

const COLUMNS = [
  { header: 'Name', key: 'name', width: 28 },
  { header: 'Attending', key: 'attending', width: 12 },
  { header: 'Guests', key: 'guests', width: 8 },
  { header: 'Email', key: 'email', width: 30 },
  { header: 'Phone', key: 'phone', width: 20 },
  { header: 'Events', key: 'events', width: 40 },
  { header: 'Message', key: 'message', width: 50 },
  { header: 'Submitted', key: 'submittedAt', width: 24 },
];

function buildWorkbook(rows) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Gautam & Sandhya Wedding';
  wb.created = new Date();

  const ws = wb.addWorksheet('RSVPs');
  ws.columns = COLUMNS;

  // Style the header row
  ws.getRow(1).font = { bold: true, color: { argb: 'FFF5E6C8' } };
  ws.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF7A1F2B' },
  };
  ws.getRow(1).alignment = { vertical: 'middle' };

  rows.forEach((r) => {
    ws.addRow({
      name: r.name,
      attending: r.attending === 'yes' ? 'Yes' : 'No',
      guests: r.guests,
      email: r.email || '',
      phone: r.phone || '',
      events: (r.events || []).join(', '),
      message: r.message || '',
      submittedAt: r.submittedAt,
    });
  });

  ws.views = [{ state: 'frozen', ySplit: 1 }]; // keep header visible
  return wb;
}

// Regenerate the on-disk .xlsx so a fresh export always exists alongside the JSON.
async function writeWorkbookFile(rows) {
  const wb = buildWorkbook(rows);
  await wb.xlsx.writeFile(XLSX_FILE);
}

/* ──────────────────────────────────────────────────────────────
 *  Routes
 * ────────────────────────────────────────────────────────────── */

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/rsvp', async (req, res) => {
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
    const all = await saveRsvp(entry);
    await writeWorkbookFile(all);
    console.log(`📨 RSVP saved: ${entry.name} (${all.length} total)`);
    res.json({ ok: true, saved: true });
  } catch (err) {
    console.error('Failed to save RSVP:', err);
    res.status(500).json({ ok: false, error: 'Could not save your RSVP. Please try again.' });
  }
});

// View all RSVPs as JSON.
app.get('/api/rsvps', async (_req, res) => {
  res.json(await readRsvps());
});

// Download all RSVPs as an Excel (.xlsx) file, generated on the fly.
app.get('/api/rsvps.xlsx', async (_req, res) => {
  const rows = await readRsvps();
  const wb = buildWorkbook(rows);
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', 'attachment; filename="rsvps.xlsx"');
  await wb.xlsx.write(res);
  res.end();
});

// Serve the built React client (production). In dev, Vite serves it on :5173
// and proxies /api here, so this block is simply inactive until you run a build.
if (existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  // SPA fallback: any non-/api route returns index.html.
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.sendFile(join(CLIENT_DIST, 'index.html'));
  });
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\n🕉  Wedding API running on http://localhost:${PORT}`);
  console.log(`   • RSVPs saved to:  ${RSVP_FILE}`);
  console.log(`   • Excel export:    ${XLSX_FILE}`);
  console.log(`   • Static client:   ${existsSync(CLIENT_DIST) ? 'served' : 'not built (run npm run build)'}`);
  console.log(`   • Download Excel:  http://localhost:${PORT}/api/rsvps.xlsx\n`);
});
