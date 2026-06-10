import { getMetrics } from '../lib/logger.js';

// GET /api/health — liveness + metrics. On Vercel the counters are a
// per-invocation snapshot (they reset on cold starts).
export default function handler(_req, res) {
  res.json({ ok: true, metrics: getMetrics() });
}
