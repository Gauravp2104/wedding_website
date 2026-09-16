#!/usr/bin/env node
/*
 * One-off backfill: push every RSVP currently in rsvps.json (Vercel Blob) to
 * the live Google Sheet, in case some were saved before Sheets sync was
 * configured, or a past sync attempt errored out.
 *
 *   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx \
 *   GOOGLE_SHEETS_ID=... \
 *   GOOGLE_SERVICE_ACCOUNT_JSON='{...}' \
 *   node scripts/sync-rsvps-to-sheet.mjs
 *
 * (or GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY —
 * see README.md "Live Google Sheet"). Get BLOB_READ_WRITE_TOKEN from
 * Vercel → Storage → your Blob store → ".env.local" snippet.
 */
import { list } from '@vercel/blob';
import { syncRsvpsToSheet, isSheetsConfigured } from '../lib/google-sheets.js';

const RSVP_BLOB = 'rsvps.json';

async function main() {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) {
    console.error('Missing BLOB_READ_WRITE_TOKEN. See the comment at the top of this script.');
    process.exit(1);
  }
  if (!isSheetsConfigured()) {
    console.error(
      'Google Sheets not configured: set GOOGLE_SHEETS_ID and either ' +
        'GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SERVICE_ACCOUNT_EMAIL + ' +
        'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.'
    );
    process.exit(1);
  }

  const { blobs } = await list({ prefix: RSVP_BLOB, limit: 1, token: blobToken });
  const found = blobs.find((b) => b.pathname === RSVP_BLOB);
  if (!found) {
    console.error(`No ${RSVP_BLOB} blob found.`);
    process.exit(1);
  }

  const res = await fetch(found.url, { cache: 'no-store' });
  if (!res.ok) {
    console.error(`Could not fetch ${RSVP_BLOB}: ${res.status}`);
    process.exit(1);
  }
  const entries = await res.json();

  console.log(`Syncing ${entries.length} RSVP(s) → Google Sheet…`);
  await syncRsvpsToSheet(entries);
  console.log('Done.');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
