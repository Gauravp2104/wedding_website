/*
 * Album client helper. The gallery contract is identical in both environments
 * (`GET /api/album/list` → { images }); only the upload transport differs:
 *   • Production (Vercel): browser uploads directly to Vercel Blob.
 *   • Local dev: multipart POST to the Express server (disk storage).
 */
const USE_BLOB = import.meta.env.PROD || import.meta.env.VITE_BLOB === '1';

export async function listAlbum() {
  const res = await fetch('/api/album/list');
  if (!res.ok) return [];
  const data = await res.json();
  return data.images || [];
}

export async function uploadPhotos(files, password) {
  if (USE_BLOB) {
    // Lazy-import keeps @vercel/blob out of the dev bundle.
    const { upload } = await import('@vercel/blob/client');
    const results = [];
    for (const file of files) {
      const blob = await upload(`album/${file.name}`, file, {
        access: 'public',
        handleUploadUrl: '/api/album/upload',
        clientPayload: password, // verified server-side in onBeforeGenerateToken
      });
      results.push({ url: blob.url, name: file.name });
    }
    return results;
  }

  // Local dev: send the files to Express as multipart/form-data.
  const fd = new FormData();
  for (const f of files) fd.append('files', f);
  const res = await fetch('/api/album/upload', {
    method: 'POST',
    headers: { 'x-album-password': password },
    body: fd,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Upload failed');
  }
  return (await res.json()).images;
}
