import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import { logger, incr, getMetrics, newRequestId } from '../lib/logger.js';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
// DATA_DIR can be pointed at a mounted persistent volume in production
// (e.g. DATA_DIR=/data) so RSVPs and photos survive restarts and redeploys.
const DATA_DIR = process.env.DATA_DIR || join(__dirname, 'data');
const RSVP_FILE = join(DATA_DIR, 'rsvps.json');
const UPLOADS_DIR = join(DATA_DIR, 'uploads');
const CLIENT_DIST = join(__dirname, '..', 'client', 'dist');

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploaded album photos as static files.
app.use('/uploads', express.static(UPLOADS_DIR));

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
  all.push(entry);
  await writeFile(RSVP_FILE, JSON.stringify(all, null, 2), 'utf-8');
  return all;
}

/* ──────────────────────────────────────────────────────────────
 *  Album uploads — stored on local disk in DATA_DIR/uploads.
 * ────────────────────────────────────────────────────────────── */

const IMAGE_RE = /\.(jpe?g|png|webp|heic|gif)$/i;

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, `${Date.now()}-${safe}`);
    },
  }),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB per file
  fileFilter: (_req, file, cb) => cb(null, IMAGE_RE.test(file.originalname)),
});

// Gate uploads BEFORE multer touches the body — otherwise multer writes the
// file to disk during middleware even for an unauthorized request.
function requireAdmin(req, res, next) {
  const pw = req.headers['x-album-password'];
  if (!process.env.ADMIN_PASSWORD || pw !== process.env.ADMIN_PASSWORD) {
    incr('albumUploadFailed');
    logger.warn('album.upload.unauthorized', { requestId: req.id });
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
  next();
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

// Public album listing — read the uploads dir, newest first.
app.get('/api/album/list', async (_req, res) => {
  try {
    const files = await readdir(UPLOADS_DIR).catch(() => []);
    const images = files
      .filter((f) => IMAGE_RE.test(f))
      .sort((a, b) => (a < b ? 1 : -1)) // timestamp-prefixed → newest first
      .map((f) => ({ url: `/uploads/${f}`, name: f }));
    res.json({ images });
  } catch {
    res.json({ images: [] });
  }
});

// Admin photo upload (multipart). Password via x-album-password header.
app.post('/api/album/upload', requireAdmin, upload.array('files', 20), async (req, res) => {
  const files = req.files || [];
  incr('albumUploaded', files.length);
  const images = files.map((f) => ({
    url: `/uploads/${f.filename}`,
    name: f.filename,
    uploadedAt: new Date().toISOString(),
  }));
  logger.info('album.uploaded', { requestId: req.id, count: images.length });
  res.json({ ok: true, images });
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

// Ensure the uploads dir exists before serving so admin uploads never 500.
await mkdir(UPLOADS_DIR, { recursive: true });

app.listen(PORT, () => {
  logger.info('server.started', {
    port: PORT,
    rsvpFile: RSVP_FILE,
    uploadsDir: UPLOADS_DIR,
    clientServed: existsSync(CLIENT_DIST),
    albumAdminConfigured: Boolean(process.env.ADMIN_PASSWORD),
  });
  console.log(`\n🕉  Wedding API running on http://localhost:${PORT}`);
  console.log(`   • RSVPs saved to:   ${RSVP_FILE}`);
  console.log(
    `   • Album uploads:    ${
      process.env.ADMIN_PASSWORD ? 'admin password set' : 'NOT configured (set ADMIN_PASSWORD)'
    } → ${UPLOADS_DIR}`
  );
  console.log(`   • View RSVPs:       http://localhost:${PORT}/api/rsvps`);
  console.log(`   • Health + metrics: http://localhost:${PORT}/api/health\n`);
});
