import { getMetrics } from '../lib/logger.js';

// GET /api/health — liveness + metrics + config visibility. On Vercel the
// counters are a per-invocation snapshot (they reset on cold starts).
export default function handler(_req, res) {
  res.json({
    ok: true,
    metrics: getMetrics(),
    // Whether the Vercel Blob store is connected. If false in production,
    // RSVPs can't be saved — connect a Blob store and redeploy.
    blobConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  });
}
