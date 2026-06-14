import { getMetrics } from '../lib/logger.js';
import { isBlobConfigured, blobTokenVarNames } from '../lib/rsvp-store.js';

// GET /api/health — liveness + metrics + Blob config visibility.
// blobConfigured=false means RSVPs can't be saved: connect a Blob store + redeploy.
// blobTokenVars lists the env-var NAMES (not values) that look like a Blob token,
// so you can tell "no store connected" (empty) from "redeploy needed / wrong name".
export default function handler(_req, res) {
  res.json({
    ok: true,
    metrics: getMetrics(),
    blobConfigured: isBlobConfigured(),
    blobTokenVars: blobTokenVarNames(),
  });
}
