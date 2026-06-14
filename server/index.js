import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import { logger, incr, getMetrics, newRequestId } from '../lib/logger.js';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
// DATA_DIR can be pointed at a mounted persistent volume in production
// (e.g. DATA_DIR=/data) so RSVPs survive restarts and redeploys.
const DATA_DIR = process.env.DATA_DIR || join(__dirname, 'data');
const RSVP_FILE = join(DATA_DIR, 'rsvps.json');
// Curated album images for local dev (image1…image12). In production the same
// images live in Vercel Blob under the "images/" prefix.
const IMAGES_DIR = join(__dirname, '..', 'client', 'public', 'images');
const CLIENT_DIST = join(__dirname, '..', 'client', 'dist');

const IMAGE_RE = /\.(jpe?g|png|webp|heic|gif)$/i;
const imgNum = (s) => {
  const m = String(s).match(/(\d+)/);
  return m ? Number(m[1]) : 0;
};

const app = express();
app.use(cors());
app.use(express.json());

// Serve the curated album images (also served by Vite in dev from public/).
app.use('/images', express.static(IMAGES_DIR));

/* ──────────────────────────────────────────────────────────────
 *  Observability — tag every request with an id and log its
 *  outcome + latency as structured JSON.
 * ────────────────────────────────────────────────────────────── */
app.use((req, res, next) => {
  req.id = newRequestId();
  req.startedAt = Date.now();
  res.setHeader('X-Request-Id', req.id);
  res.on('finish', () => {
    logger.info('http.request', {
      requestId: req.id,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - req.startedAt,
    });
  });
  next();
});

/* ──────────────────────────────────────────────────────────────
 *  Storage helpers — every RSVP is appended to a durable JSON file.
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
  // Upsert by id so a guest editing their RSVP replaces their entry.
  const i = entry.id ? all.findIndex((r) => r.id === entry.id) : -1;
  if (i >= 0) all[i] = entry;
  else all.push(entry);
  await writeFile(RSVP_FILE, JSON.stringify(all, null, 2), 'utf-8');
  return all;
}

/* ──────────────────────────────────────────────────────────────
 *  Routes
 * ────────────────────────────────────────────────────────────── */

// Health + live metrics for monitoring.
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, metrics: getMetrics() });
});

app.post('/api/rsvp', async (req, res) => {
  incr('rsvpReceived');
  const { name, attending } = req.body || {};
  if (!name || !attending) {
    return res.status(400).json({ ok: false, error: 'Name and attendance are required.' });
  }

  const entry = {
    id: req.body.id ? String(req.body.id).slice(0, 64) : undefined,
    name: String(name).slice(0, 120),
    attending: attending === 'yes' ? 'yes' : 'no',
    guests: Number(req.body.guests) || 1,
    email: (req.body.email || '').slice(0, 160),
    phone: (req.body.phone || '').slice(0, 40),
    events: Array.isArray(req.body.events) ? req.body.events.slice(0, 10) : [],
    accommodation: req.body.accommodation === 'yes' ? 'yes' : 'no',
    message: (req.body.message || '').slice(0, 1000),
    submittedAt: new Date().toISOString(),
  };

  try {
    const all = await saveRsvp(entry);
    incr('rsvpSaved');
    logger.info('rsvp.saved', { requestId: req.id, name: entry.name, total: all.length });
    res.json({ ok: true, saved: true });
  } catch (err) {
    incr('rsvpFailed');
    logger.error('rsvp.save.failed', { requestId: req.id, error: err.message });
    res.status(500).json({ ok: false, error: 'Could not save your RSVP. Please try again.' });
  }
});

// View all RSVPs as JSON.
app.get('/api/rsvps', async (_req, res) => {
  res.json(await readRsvps());
});

// Public album listing — the curated images in client/public/images,
// ordered image1 → image12. (Production lists Vercel Blob "images/" instead.)
app.get('/api/album/list', async (_req, res) => {
  try {
    const files = await readdir(IMAGES_DIR).catch(() => []);
    const images = files
      .filter((f) => IMAGE_RE.test(f))
      .sort((a, b) => imgNum(a) - imgNum(b))
      .map((f) => ({ url: `/images/${f}`, name: f }));
    res.json({ images });
  } catch {
    res.json({ images: [] });
  }
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
  logger.info('server.started', {
    port: PORT,
    rsvpFile: RSVP_FILE,
    imagesDir: IMAGES_DIR,
    clientServed: existsSync(CLIENT_DIST),
  });
  console.log(`\n🕉  Wedding API running on http://localhost:${PORT}`);
  console.log(`   • RSVPs saved to:   ${RSVP_FILE}`);
  console.log(`   • Album images:     ${IMAGES_DIR}`);
  console.log(`   • View RSVPs:       http://localhost:${PORT}/api/rsvps`);
  console.log(`   • Health + metrics: http://localhost:${PORT}/api/health\n`);
});
