/*
 * Album = a curated set of photos (image1…image12) under an "images/" location.
 *   • Local dev: served from client/public/images, listed by the Express server.
 *   • Production: stored in Vercel Blob under the "images/" prefix and listed by
 *     the serverless function — the gallery references the Blob URLs.
 * Either way the gallery just fetches the list, sorted image1 → image12.
 */
export async function listAlbum() {
  const res = await fetch('/api/album/list');
  if (!res.ok) return [];
  const data = await res.json();
  return data.images || [];
}
