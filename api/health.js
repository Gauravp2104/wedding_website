import { getMetrics } from '../lib/logger.js';
import { isBlobConfigured, blobTokenVarNames } from '../lib/rsvp-store.js';
import { isSheetsConfigured } from '../lib/google-sheets.js';

// GET /api/health — liveness + metrics + Blob/Sheets config visibility.
// blobConfigured=false means RSVPs can't be saved: connect a Blob store + redeploy.
// blobTokenVars lists the env-var NAMES (not values) that look like a Blob token,
// so you can tell "no store connected" (empty) from "redeploy needed / wrong name".
// sheetsConfigured=false means the live Google Sheet sync is best-effort-skipped
// (RSVPs still save fine) — see README.md "Live Google Sheet" to connect it.
export default async function handler(_req, res) {
  res.json({
    ok: true,
    metrics: getMetrics(),
    blobConfigured: isBlobConfigured(),
    blobTokenVars: blobTokenVarNames(),
    // All env-var NAMES (not values) containing "BLOB", to see what the store injected.
    blobEnvVars: Object.keys(process.env).filter((k) => k.toUpperCase().includes('BLOB')),
    sheetsConfigured: isSheetsConfigured(),
  });
}
