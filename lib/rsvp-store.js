import { put, list } from '@vercel/blob';

/*
 * RSVP store for the Vercel deployment.
 *
 * Vercel functions have no writable disk, so the "rsvps.json file" lives in
 * Vercel Blob instead. Each RSVP reads the current JSON, appends, and writes it
 * back to the same blob path — so it stays a single, downloadable rsvps.json.
 *
 * Note: this is a read-modify-write, not a transaction. For a wedding's RSVP
 * volume the chance of two submissions overlapping is negligible; if you expect
 * bursts, use a queue/DB instead. Caching is disabled (cacheControlMaxAge: 0) so
 * each append reads the freshest copy.
 */
const RSVP_BLOB = 'rsvps.json';

// Fail fast with an actionable message instead of a generic SDK error when the
// Blob store hasn't been connected to the Vercel project yet.
function assertBlobConfigured() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      'Vercel Blob is not connected (BLOB_READ_WRITE_TOKEN missing). In the Vercel ' +
        'project: Storage → connect a Blob store, then redeploy.'
    );
  }
}

export async function readRsvps() {
  assertBlobConfigured();
  const { blobs } = await list({ prefix: RSVP_BLOB, limit: 1 });
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
  const all = await readRsvps();
  all.push(entry);
  await put(RSVP_BLOB, JSON.stringify(all, null, 2), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 0,
  });
  return all;
}
