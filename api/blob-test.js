import { put, list } from '@vercel/blob';

// TEMP diagnostic: exercises Blob list + put and returns the real errors.
// Remove after debugging.
export default async function handler(_req, res) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const out = { hasToken: Boolean(token), tokenPrefix: token ? token.slice(0, 14) : null };

  try {
    const r = await list({ prefix: 'rsvps.json', limit: 1, token });
    out.list = { ok: true, count: r.blobs.length };
  } catch (e) {
    out.list = { ok: false, error: String(e?.message || e) };
  }

  try {
    const b = await put('diag-test.json', JSON.stringify({ t: Date.now() }), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
      cacheControlMaxAge: 0,
      token,
    });
    out.put = { ok: true, url: b.url };
  } catch (e) {
    out.put = {
      ok: false,
      error: String(e?.message || e),
      name: e?.name,
      status: e?.status,
    };
  }

  res.json(out);
}
