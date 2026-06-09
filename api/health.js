import { getMetrics } from '../lib/logger.js';
import { notifyRecipients } from '../lib/mailer.js';

// GET /api/health — liveness + config visibility. Note: on Vercel's
// serverless runtime, metrics are per-invocation (they reset on cold
// starts), so treat counters as a snapshot, not a running total.
export default function handler(_req, res) {
  res.json({
    ok: true,
    metrics: getMetrics(),
    email: {
      recipients: notifyRecipients().length,
      configured: Boolean(process.env.SMTP_USER && process.env.SMTP_PASS),
    },
  });
}
