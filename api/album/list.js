import { list } from '@vercel/blob';

// Sort image1, image2, … image12 by their number (not by upload time).
const num = (s) => {
  const m = String(s).match(/(\d+)/);
  return m ? Number(m[1]) : 0;
};

/*
 * GET /api/album/list — public gallery listing. Returns the photos stored under
 * the "images/" prefix in Vercel Blob (image1…image12), ordered by number.
 */
export default async function handler(_req, res) {
  try {
    const { blobs } = await list({ prefix: 'images/' });
    const images = blobs
      .filter((b) => !b.pathname.endsWith('/'))
      .sort((a, b) => num(a.pathname) - num(b.pathname))
      .map((b) => ({ url: b.url, name: b.pathname }));
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.json({ images });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Could not list album.' });
  }
}
