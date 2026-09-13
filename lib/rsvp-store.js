import { put, list } from '@vercel/blob';
import { buildRsvpWorkbookBuffer } from './rsvp-xlsx.js';
import { logger, incr } from './logger.js';

/*
 * RSVP store for the Vercel deployment.
 *
 * Vercel functions have no writable disk, so the "rsvps.json file" lives in
 * Vercel Blob instead. Each RSVP reads the current JSON, appends, and writes it
 * back to the same blob path — so it stays a single, downloadable rsvps.json.
 *
 * Every write also regenerates "rsvps.xlsx" (same pathname, overwritten each
 * time — not an append-only log) so the couple always have a live, current
 * spreadsheet snapshot without needing to touch the JSON.
 *
 * Note: read-modify-write, not a transaction. Fine for a wedding's RSVP volume.
 */
const RSVP_BLOB = 'rsvps.json';
const RSVP_XLSX_BLOB = 'rsvps.xlsx';

// Resolve the Blob read/write token. Connecting a Blob store normally sets
// BLOB_READ_WRITE_TOKEN, but custom/extra stores can use a prefixed name like
// <STORE>_READ_WRITE_TOKEN — accept any of them so a misnamed token still works.
function blobToken() {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
  const key = Object.keys(process.env).find(
    (k) => k.endsWith('READ_WRITE_TOKEN') && process.env[k]
  );
  return key ? process.env[key] : null;
}

export function isBlobConfigured() {
  return Boolean(blobToken());
}

// Env-var NAMES (not values) that look like a Blob token — for /api/health.
export function blobTokenVarNames() {
  return Object.keys(process.env).filter((k) => k.endsWith('READ_WRITE_TOKEN'));
}

function requireToken() {
  const token = blobToken();
  if (!token) {
    throw new Error(
      'Vercel Blob not connected: no *_READ_WRITE_TOKEN in this deployment. ' +
        'In the Vercel project: Storage → connect a Blob store to this project, then redeploy.'
    );
  }
  return token;
}

export async function readRsvps() {
  const token = requireToken();
  const { blobs } = await list({ prefix: RSVP_BLOB, limit: 1, token });
  const found = blobs.find((b) => b.pathname === RSVP_BLOB);
  if (!found) return [];
  const res = await fetch(found.url, { cache: 'no-store' });
  if (!res.ok) return [];
  try {
    return await res.json();
  } catch {
    return [];
  }
}

export async function appendRsvp(entry) {
  const token = requireToken();
  const all = await readRsvps();
  // Upsert by id so a guest editing their RSVP replaces their entry.
  const i = entry.id ? all.findIndex((r) => r.id === entry.id) : -1;
  if (i >= 0) all[i] = entry;
  else all.push(entry);
  await put(RSVP_BLOB, JSON.stringify(all, null, 2), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 0,
    token,
  });

  // Best-effort: the JSON above is the source of truth, so a spreadsheet
  // failure never fails the RSVP save.
  try {
    const buffer = await buildRsvpWorkbookBuffer(all);
    await put(RSVP_XLSX_BLOB, buffer, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      cacheControlMaxAge: 0,
      token,
    });
    incr('rsvpXlsxSaved');
  } catch (err) {
    incr('rsvpXlsxFailed');
    logger.error('rsvp.xlsx.failed', { error: err.message });
  }

  return all;
}

// Resolve the current rsvps.xlsx blob's public URL (stable across
// overwrites), or null if no RSVP has been saved yet.
export async function rsvpsXlsxUrl() {
  const token = requireToken();
  const { blobs } = await list({ prefix: RSVP_XLSX_BLOB, limit: 1, token });
  const found = blobs.find((b) => b.pathname === RSVP_XLSX_BLOB);
  return found ? found.url : null;
}
