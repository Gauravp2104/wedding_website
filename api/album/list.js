import { list } from '@vercel/blob';

/*
 * GET /api/album/list — public gallery listing. Reads photos stored under the
 * "album/" prefix in Vercel Blob and returns their public CDN URLs, newest first.
 */
export default async function handler(_req, res) {
  try {
    const { blobs } = await list({ prefix: 'album/' });
    const images = blobs
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
      .map((b) => ({ url: b.url, name: b.pathname, uploadedAt: b.uploadedAt }));
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.json({ images });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Could not list album.' });
  }
}
