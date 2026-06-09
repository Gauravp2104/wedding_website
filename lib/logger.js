import { randomUUID } from 'crypto';

/* ──────────────────────────────────────────────────────────────
 *  Tiny structured logger + in-process metrics.
 *
 *  Logs are emitted as single-line JSON so they're greppable and
 *  parse cleanly in Vercel / any log aggregator. Metrics are kept
 *  in memory: durable for the long-lived Express server, and a
 *  per-invocation snapshot on Vercel's serverless functions.
 * ────────────────────────────────────────────────────────────── */

const metrics = {
  startedAt: new Date().toISOString(),
  rsvpReceived: 0,
  rsvpSaved: 0,
  rsvpFailed: 0,
  emailsSent: 0,
  emailsFailed: 0,
  emailsSkipped: 0,
  sheetAppended: 0,
  sheetFailed: 0,
  albumUploaded: 0,
  albumUploadFailed: 0,
};

export function incr(key, by = 1) {
  if (key in metrics) metrics[key] += by;
}

export function getMetrics() {
  return { ...metrics, uptimeSeconds: Math.round(process.uptime()) };
}

// Short, human-friendly correlation id to tie a request's logs together.
export function newRequestId() {
  return randomUUID().slice(0, 8);
}

function emit(level, msg, fields = {}) {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, msg, ...fields });
  if (level === 'error') console.error(line);
  else console.log(line);
}

export const logger = {
  info: (msg, fields) => emit('info', msg, fields),
  warn: (msg, fields) => emit('warn', msg, fields),
  error: (msg, fields) => emit('error', msg, fields),
};
