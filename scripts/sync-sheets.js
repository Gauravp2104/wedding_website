#!/usr/bin/env node
/*
 * Backfill: push every RSVP in server/data/rsvps.json into the Google Sheet.
 *
 *   npm run sync:sheets
 *
 * Reads Google creds from server/.env. Appends every row unconditionally —
 * run it once against a fresh tab. (Re-running duplicates rows; `submittedAt`
 * is the natural dedupe key if you ever want to filter.)
 */
import dotenv from 'dotenv';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { appendRsvp } from '../lib/sheets.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Google creds live alongside the local server config.
dotenv.config({ path: join(__dirname, '..', 'server', '.env') });

const RSVP_FILE =
  process.env.RSVP_FILE ||
  join(process.env.DATA_DIR || join(__dirname, '..', 'server', 'data'), 'rsvps.json');

async function main() {
  if (!process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    console.error(
      'Missing Google env vars. Set GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, and\n' +
        'GOOGLE_PRIVATE_KEY in server/.env before running the backfill.'
    );
    process.exit(1);
  }

  const raw = await readFile(RSVP_FILE, 'utf-8').catch(() => '[]');
  const rows = JSON.parse(raw);
  console.log(`Backfilling ${rows.length} RSVP(s) from ${RSVP_FILE} → Google Sheet…\n`);

  let ok = 0;
  let fail = 0;
  for (const entry of rows) {
    try {
      await appendRsvp(entry); // serial: ensureHeader + append, avoids races
      ok++;
      console.log(`  ✓ ${entry.name}`);
    } catch (err) {
      fail++;
      console.error(`  ✗ ${entry.name}: ${err.message}`);
    }
  }
  console.log(`\nDone. Appended ${ok}, failed ${fail}.`);
  if (fail) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
