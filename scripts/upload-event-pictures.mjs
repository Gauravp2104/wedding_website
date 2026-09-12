#!/usr/bin/env node
/*
 * Upload the per-ceremony caricature images to Vercel Blob under the
 * "pictures/" prefix, keeping the exact filenames used in
 * client/src/data/events.js.
 *
 *   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx node scripts/upload-event-pictures.mjs
 */
import { readFile, readdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';
import { put } from '@vercel/blob';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PICTURES_DIR = join(__dirname, '..', 'client', 'public', 'pictures');
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
        '(or run `vercel env pull`), then:\n' +
        '  BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx node scripts/upload-event-pictures.mjs'
    );
    process.exit(1);
  }

  const files = (await readdir(PICTURES_DIR).catch(() => []))
    .filter((f) => IMAGE_RE.test(f))
    .sort();
  if (!files.length) {
    console.error(`No images found in ${PICTURES_DIR}.`);
    process.exit(1);
  }

  console.log(`Uploading ${files.length} event picture(s) → Vercel Blob under "pictures/"…\n`);
  const urls = {};
  for (const f of files) {
    const buf = await readFile(join(PICTURES_DIR, f));
    const blob = await put(`pictures/${f}`, buf, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: CONTENT_TYPE[extname(f).toLowerCase()] || 'application/octet-stream',
      token,
    });
    urls[f] = blob.url;
    console.log(`  ✓ ${f} → ${blob.url}`);
  }
  console.log('\n' + JSON.stringify(urls, null, 2));
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
