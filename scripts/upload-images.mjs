#!/usr/bin/env node
/*
 * Upload the curated album images to Vercel Blob under the "images/" prefix,
 * keeping the exact filenames (image1.jpg … image12.jpg) so the website can
 * reference them in order.
 *
 *   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx npm run upload:images
 *
 * Get the token from: Vercel → Storage → your Blob store → ".env.local" snippet,
 * or run `vercel env pull` and copy BLOB_READ_WRITE_TOKEN. The store must be PUBLIC.
 */
import { readFile, readdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';
import { put } from '@vercel/blob';

const __dirname = dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = join(__dirname, '..', 'client', 'public', 'images');
const IMAGE_RE = /\.(jpe?g|png|webp|heic|gif)$/i;
const CONTENT_TYPE = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.heic': 'image/heic',
};

async function main() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.error(
      'Missing BLOB_READ_WRITE_TOKEN.\n' +
        'Get it from Vercel → Storage → your Blob store → ".env.local" snippet\n' +
        '(or run `vercel env pull` and copy it), then:\n' +
        '  BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx npm run upload:images'
    );
    process.exit(1);
  }

  const files = (await readdir(IMAGES_DIR).catch(() => []))
    .filter((f) => IMAGE_RE.test(f))
    .sort();
  if (!files.length) {
    console.error(`No images found in ${IMAGES_DIR}. Add image1.jpg … image12.jpg first.`);
    process.exit(1);
  }

  console.log(`Uploading ${files.length} image(s) → Vercel Blob under "images/"…\n`);
  for (const f of files) {
    const buf = await readFile(join(IMAGES_DIR, f));
    const blob = await put(`images/${f}`, buf, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: CONTENT_TYPE[extname(f).toLowerCase()] || 'application/octet-stream',
      token,
    });
    console.log(`  ✓ ${f} → ${blob.url}`);
  }
  console.log('\nDone. The live site references these via /api/album/list.');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
