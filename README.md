# 🪔 Gautam & Sandhya — South Indian Wedding Website

A full-stack, mobile-responsive wedding site with a South-Indian inspired design:
kolam ornaments, temple motifs, gold-on-maroon palette, and **six scroll-driven
ceremony sections** whose colour scheme brightens for **AM** ceremonies and deepens
for **PM** ceremonies. Includes a **photo album** the hosts upload into and guests
browse, and an animated **RSVP** form whose submissions are **saved to a JSON file**
(with a **live Google Sheet** kept in sync alongside it) on the server.

## Stack
- **Frontend:** React 18 + Vite + Framer Motion
- **Local dev backend:** Node/Express — RSVPs → `data/rsvps.json`, photos → `data/uploads/`
- **Production (Vercel):** serverless functions in `api/` that read/write a
  `rsvps.json` file **and** album photos in **Vercel Blob** (durable storage; no disk needed)
- **Observability:** structured JSON logs (request id + latency per call) and a
  `/api/health` endpoint exposing live counters

The main service used in production is **Vercel Blob** (free tier, part of your Vercel
project — no separate account needed). No confirmation texts/emails are sent to
guests — RSVPs are simply saved, live, to `rsvps.json`, and optionally mirrored to a
**Google Sheet** you and the family can watch update in real time.

## Quick start

```bash
# from the project root
npm run install:all     # installs root + client + server deps
npm run dev             # starts API (:4000) and Vite dev server (:5173)
```

Then open **http://localhost:5173**.

The Vite dev server proxies `/api/*` calls to the Express backend on port 4000.

## RSVPs

Every RSVP is appended to a **`rsvps.json`** file — one object per guest with
`name, attending, guests, email, phone, events, message, submittedAt`. Phone is
required (so hosts have a way to reach a guest); email is optional. A guest can
resubmit to edit their RSVP (same `id`) any time, including a change of mind between
attending / not. No confirmation texts or emails are sent — the site doesn't
integrate with Twilio/SMTP at all.

### Live Google Sheet
Every save — first submission or a later edit — also re-syncs a **Google Sheet**
(`lib/google-sheets.js`, no extra npm dependency — a service-account JWT is signed
with Node's built-in `crypto` and exchanged for an access token, then the Sheets
REST API is called directly with `fetch`) from the full, current RSVP list: one row
per guest, with Name / Attending / Ceremonies / Guests / Accommodation / Phone /
Email / Message / Submitted-at columns. It's a full clear-and-rewrite each save (not
an append-only log), so the sheet always matches `rsvps.json` exactly — a guest
editing or withdrawing their RSVP never leaves a stale row.

It's **optional and best-effort**: if it isn't configured (or a sync call fails), the
RSVP still saves to `rsvps.json` — you'll just see `rsvpSheetSyncFailed` tick up in
`/api/health` instead of the site erroring for the guest.

**Setup (one-time, ~5 minutes):**

1. **Create a Google Cloud project** (or reuse one) at
   [console.cloud.google.com](https://console.cloud.google.com).
2. **Enable the Google Sheets API:** in the project, go to **APIs & Services →
   Library**, search "Google Sheets API", click **Enable**.
3. **Create a service account:** **APIs & Services → Credentials → Create
   Credentials → Service account**. Give it any name (e.g. `wedding-rsvp-sync`) and
   click through — it doesn't need any project-level role.
4. **Create a JSON key for it:** open the service account → **Keys → Add Key →
   Create new key → JSON**. This downloads a `.json` file — keep it private, it's a
   credential. You'll need two fields out of it: `client_email` and `private_key`.
5. **Create the Google Sheet:** make a new spreadsheet at
   [sheets.google.com](https://sheets.google.com) (any name, e.g. "Wedding RSVPs").
   Copy its **spreadsheet ID** from the URL:
   `https://docs.google.com/spreadsheets/d/`**`THIS_PART`**`/edit`.
6. **Share the sheet with the service account:** click **Share** on the sheet and
   share it with the `client_email` from step 4 (looks like
   `wedding-rsvp-sync@your-project.iam.gserviceaccount.com`), giving it **Editor**
   access. This is the step people miss — without it, syncing fails with a
   permission error.
7. **Set the env vars** (locally in `server/.env`, and on Vercel — see the deploy
   section below):
   - `GOOGLE_SHEETS_ID` — the spreadsheet ID from step 5
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL` — the `client_email` from the JSON key
   - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` — the `private_key` from the JSON key,
     including the `-----BEGIN/END PRIVATE KEY-----` lines. Most places you paste an
     env var can't hold real line breaks, so paste it with literal `\n` (the code
     converts them back) — that's exactly how it appears inside the downloaded JSON
     file, so you can usually copy that field's value verbatim.
   - Alternative to the two vars above: set **`GOOGLE_SERVICE_ACCOUNT_JSON`** to the
     entire downloaded JSON file's contents as one value — handy if your host lets
     you paste one multi-line secret more easily than two.

That's it — no OAuth login, no consent screen, nothing the couple has to click through.
The next RSVP submitted will populate the sheet's first tab; open it any time to see
live totals. (Optional: if you rename the sheet's tab away from the default, set
`GOOGLE_SHEETS_TAB` to that tab name so writes still land in the right place.)

- **Local dev:** the JSON file lives on disk at `server/data/rsvps.json`.
- **Production (Vercel):** the same `rsvps.json` is stored in **Vercel Blob** (Vercel
  functions can't write to disk), and each RSVP reads it, appends, and writes it back.
- **View all RSVPs as JSON:** `GET /api/rsvps` (works in both). Locally you can also open
  `server/data/rsvps.json`; in production you can download `rsvps.json` from the Vercel
  Blob dashboard.

> Set `DATA_DIR` (e.g. `DATA_DIR=/data`) to change where the **local** files live.

## Photo album

A scroll section (`#album`) shows a responsive grid of photos with a full-screen
lightbox (arrow-key / Esc navigation). Hosts add photos through a password-gated
uploader; guests just browse.

- **Reveal the uploader:** open the site with `?admin` (e.g.
  `http://localhost:5173/?admin`), or double-click the small ⚙ in the album section.
  Enter the **`ADMIN_PASSWORD`** and pick photos.
- **Local dev:** photos are stored on disk in `server/data/uploads/`, served from
  `/uploads/...`.
- **Production (Vercel):** photos upload **directly from the browser to Vercel Blob**
  (the bytes never pass through a function, so large photos bypass Vercel's 4.5 MB request
  limit). The gallery lists them via `/api/album/list`.
- Uploads are gated by `ADMIN_PASSWORD` before anything is stored.

> The `ADMIN_PASSWORD` is a shared secret typed into the browser — it is **never bundled
> into the client JS**. Anyone who knows it can upload, so keep it private. Fine for a
> wedding album.

## Observability

- **Structured logs:** every request and RSVP emits a single-line JSON log with a
  short `requestId`, the event name (`rsvp.saved`, `album.uploaded`, `http.request`),
  and `durationMs`.
- **`X-Request-Id`** header is set on every response to correlate with the logs.
- **`/api/health`** returns `{ ok, metrics, sheetsConfigured }` — live counters for
  `rsvpReceived / rsvpSaved / rsvpFailed / rsvpSheetSynced / rsvpSheetSyncFailed /
  albumUploaded / albumUploadFailed`, plus uptime.

## Deploying to Vercel (free)

In production the static client is served by Vercel's CDN and the `/api/*` routes run as
serverless functions. Since functions have **no writable disk**, the `rsvps.json` file
and the album photos both live in **Vercel Blob** — durable, free-tier storage that's
part of your Vercel project. `vercel.json` already points the build at `client/dist`; the
`api/*` and `api/album/*` functions are auto-mapped. No code changes needed.

### 1. Push the repo to GitHub
Commit everything and push to a GitHub repo.

### 2. Import the project in Vercel
At [vercel.com](https://vercel.com) → **Add New → Project → Import** your repo. Vercel
reads `vercel.json` for the build; just click **Deploy**. (CLI alternative: `npm i -g
vercel`, then `vercel` and `vercel --prod`.)

### 3. Connect a Vercel Blob store  ← this is what makes RSVPs persist
In the project → **Storage → Create / Connect → Blob**. Connecting it **auto-injects the
`BLOB_READ_WRITE_TOKEN`** env var — this is what lets the functions read/write
`rsvps.json` and the album photos. (Free tier is plenty for a wedding.)

### 4. Set the admin password + (optional) Google Sheet sync
Project → **Settings → Environment Variables** → add:

| Variable | Value |
|----------|-------|
| `ADMIN_PASSWORD` | a private password you choose (gates album uploads) |
| `BLOB_READ_WRITE_TOKEN` | **auto-added in step 3** — don't set it by hand |
| `GOOGLE_SHEETS_ID` | optional — spreadsheet ID, see "Live Google Sheet" above |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | optional — from the service account's JSON key |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | optional — from the same JSON key (keep the `\n`s) |

(Or set the single `GOOGLE_SERVICE_ACCOUNT_JSON` var instead of the last two — see
"Live Google Sheet" above. Skip all four Google vars entirely if you don't want the
Sheet sync; RSVPs still save fine without it.)

Then **redeploy** (Deployments → ⋯ → Redeploy) so the new env vars take effect.

### 5. Free domain
You immediately get a free `*.vercel.app` URL. To choose the label, go to **Settings →
Domains** and edit it, e.g. `gautam-sandhya.vercel.app`. (Want a real domain later? Buy
one from Cloudflare/Namecheap and add it on the same page — DNS steps are shown there.)

### Verify after deploy
- **Site:** your `*.vercel.app` URL · **Health:** `/api/health` — check `sheetsConfigured:
  true` if you set up the Google Sheet sync.
- **RSVP:** submit the form → `GET /api/rsvps` returns it, and `rsvps.json` appears in
  the **Blob** store (Storage → your Blob → Browse). Submitting again **updates** it in
  place. If Sheets is configured, the same RSVP shows up as a row in your Google Sheet
  within a second or two — that's the "live sync" working in production. If it doesn't
  appear, check `/api/health`'s `rsvpSheetSyncFailed` counter and the Vercel function
  logs for the `rsvp.sheet.failed` error (almost always a missing **Share** on the sheet —
  see step 6 in "Live Google Sheet" above).
- **Album:** open `/?admin`, enter `ADMIN_PASSWORD`, upload a photo (try a >4.5 MB one to
  confirm the direct-to-Blob path) → it shows in the grid and persists on reload.

> **Note:** RSVP saving is a read-append-write on one JSON blob, not a transaction. For a
> wedding's volume that's fine; two RSVPs submitted in the same instant could in theory
> collide. If you expect bursts, switch the store to a database (e.g. Vercel KV/Postgres).

### Testing the Vercel functions locally (optional)
Run `vercel dev` with a `.env.local` containing `BLOB_READ_WRITE_TOKEN` and
`ADMIN_PASSWORD`. (Plain `npm run dev` uses the Express server + local disk instead, which
needs no token.)

## Editing content
- **Events / timings / colours:** `client/src/data/events.js`
- **Couple details & parents' names:** `client/src/components/Story.jsx`
- **Theme tokens (gold/maroon/fonts):** `client/src/styles/global.css`

## Event schedule
| Day | Ceremony | Time | Theme |
|-----|----------|------|-------|
| 10 Feb 2027 | Vratham | 8:00–10:00 AM | ☀️ bright |
| 10 Feb 2027 | Nitchayathartham | 11:00 AM–12:30 PM | ☀️ bright |
| 10 Feb 2027 | Reception | 6:30–8:30 PM | 🌙 dark |
| 11 Feb 2027 | Kasi Yatra & Oonjal | 8:00 AM | ☀️ bright |
| 11 Feb 2027 | Muhurtham | 10:30–11:30 AM | ☀️ bright |
| 11 Feb 2027 | Nalungu | 4:30–5:30 PM | 🌙 dark |
