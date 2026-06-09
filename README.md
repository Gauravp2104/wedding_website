# 🪔 Gautam & Sandhya — South Indian Wedding Website

A full-stack, mobile-responsive wedding site with a South-Indian inspired design:
kolam ornaments, temple motifs, gold-on-maroon palette, and **six scroll-driven
ceremony sections** whose colour scheme brightens for **AM** ceremonies and deepens
for **PM** ceremonies. Includes a **photo album** the hosts upload into and guests
browse, and an animated **RSVP** form whose submissions are **saved to a durable
store**, **mirrored to a Google Sheet**, and **emailed to the hosts** the moment
they arrive.

## Stack
- **Frontend:** React 18 + Vite + Framer Motion
- **Local dev backend:** Node/Express (RSVPs → local JSON; photos → local disk)
- **Production backend (Vercel):** Serverless functions + Google Sheets (RSVPs) +
  Vercel Blob (album photos)
- **Notifications:** Nodemailer (SMTP) — emails every RSVP to a list of recipients
- **Observability:** structured JSON logs (request id + latency per call) and a
  `/api/health` endpoint exposing live counters

## Quick start

```bash
# from the project root
npm run install:all     # installs root + client + server deps
npm run dev             # starts API (:4000) and Vite dev server (:5173)
```

Then open **http://localhost:5173**.

The Vite dev server proxies `/api/*` calls to the Express backend on port 4000.

## Email notifications (sent on every RSVP)

Every RSVP triggers an email to one or more recipients. Configure SMTP in
`server/.env` (copy from `server/.env.example`):

| Variable | Meaning |
|----------|---------|
| `SMTP_HOST` | SMTP server (default `smtp.gmail.com`) |
| `SMTP_PORT` | `587` (STARTTLS) or `465` (implicit TLS) |
| `SMTP_USER` | SMTP login — e.g. your Gmail address |
| `SMTP_PASS` | SMTP password — for Gmail, a **App Password** |
| `RSVP_NOTIFY_TO` | comma/space-separated list of people to notify |
| `RSVP_NOTIFY_FROM` | optional `From:` address (defaults to `SMTP_USER`) |

> **Gmail:** enable 2-Step Verification, then create an
> [App Password](https://myaccount.google.com/apppasswords) and use it as `SMTP_PASS`.

Email is **best-effort**: if sending fails (or no recipients are set) the RSVP is
still saved and the failure is logged — the guest never sees an error.

## Viewing RSVPs & the Google Sheet mirror

**Local dev (Express):** every RSVP is saved to `server/data/rsvps.json` (the source of
truth) and, when Google creds are configured in `server/.env`, **also appended live to
your Google Sheet** (best-effort — never blocks the RSVP). Without Google creds the
mirror is skipped and logged.

- **View as JSON:** `http://localhost:4000/api/rsvps`

**Production (Vercel):** every RSVP is appended as a row in your **Google Sheet**;
`/api/rsvps` reads live from that Sheet. See **Deploying to Vercel** below.

### Backfill existing RSVPs into the Sheet

To push the rows already in `server/data/rsvps.json` up to the Sheet (e.g. the first
time you connect Sheets), run:

```bash
npm run sync:sheets
```

It reads Google creds from `server/.env` and appends every row. It appends
unconditionally, so **run it once against a fresh tab** (re-running duplicates rows).

## Photo album

A scroll section (`#album`) shows a responsive grid of photos with a full-screen
lightbox (arrow-key / Esc navigation). Hosts add photos through a password-gated
uploader; guests just browse.

- **Reveal the uploader:** open the site with `?admin` (e.g.
  `http://localhost:5173/?admin`), or double-click the small ⚙ in the album section.
  Enter the **`ADMIN_PASSWORD`** and pick photos.
- **Local dev:** photos are stored on disk in `server/data/uploads/` and served from
  `/uploads/...`.
- **Production (Vercel):** photos upload **directly from the browser to Vercel Blob**
  (the file bytes never pass through a function, so large photos bypass Vercel's
  4.5 MB request limit). The gallery lists them via `/api/album/list`.

> The `ADMIN_PASSWORD` is a shared secret typed into the browser — it is **never bundled
> into the client JS** (don't give it a `VITE_` name). Anyone who knows it can upload, so
> keep it private. Fine for a wedding album.

## Observability

- **Structured logs:** every request and RSVP emits a single-line JSON log with a
  short `requestId`, the event name (`rsvp.saved`, `rsvp.email.sent`,
  `rsvp.email.failed`, `http.request`), and `durationMs`. These show up in your
  terminal locally and in the Vercel function logs in production.
- **`X-Request-Id`** header is set on every response to correlate with the logs.
- **`/api/health`** returns `{ ok, metrics, email }` — live counters for
  `rsvpReceived / rsvpSaved / rsvpFailed / emailsSent / emailsFailed / emailsSkipped /
  sheetAppended / sheetFailed / albumUploaded / albumUploadFailed`, plus uptime and the
  configured recipient count. (On Vercel the counters are a per-invocation snapshot; the
  durable totals live in your Google Sheet.)

## Deploying to Vercel (recommended)

Vercel runs the backend as **serverless functions with a read-only, ephemeral
filesystem** — so local files (`rsvps.json`) do **not** persist there. Instead,
production uses a **Google Sheet as the durable store** (your live, shareable backup),
and each RSVP is **emailed to the hosts** via SMTP.

### 1. Create the Google Sheet + service account (one time)
1. Create a Google Sheet. Rename the first tab to **`RSVPs`**. Copy its **Sheet ID**
   from the URL: `https://docs.google.com/spreadsheets/d/`**`<SHEET_ID>`**`/edit`.
2. In [Google Cloud Console](https://console.cloud.google.com): create a project →
   **APIs & Services → Library → enable "Google Sheets API"**.
3. **APIs & Services → Credentials → Create credentials → Service account.** After
   creating it, open it → **Keys → Add key → JSON** and download the key file.
4. Open the JSON: copy `client_email` and `private_key`.
5. **Share the Sheet** with that `client_email` (Editor access) — this is what lets the
   function write to it.

### 2. Set Vercel environment variables
In the Vercel project → **Settings → Environment Variables**:

| Variable | Value |
|----------|-------|
| `GOOGLE_SHEET_ID` | the Sheet ID from step 1 |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | the `client_email` |
| `GOOGLE_PRIVATE_KEY` | the `private_key` (paste exactly, including the `\n`s) |
| `GOOGLE_SHEET_TAB` | `RSVPs` *(optional; defaults to `RSVPs`)* |
| `SMTP_HOST` | SMTP server (e.g. `smtp.gmail.com`) |
| `SMTP_PORT` | `587` or `465` |
| `SMTP_USER` | SMTP login |
| `SMTP_PASS` | SMTP password / Gmail App Password |
| `RSVP_NOTIFY_TO` | comma/space-separated recipients to email on each RSVP |
| `RSVP_NOTIFY_FROM` | optional `From:` address (defaults to `SMTP_USER`) |
| `ADMIN_PASSWORD` | password required to upload photos to the album |
| `BLOB_READ_WRITE_TOKEN` | **auto-injected** when you connect a Blob store (step 3) |

### 3. Connect a Vercel Blob store (for the album)
In the Vercel project → **Storage → Create / Connect → Blob**. Connecting it
**auto-injects `BLOB_READ_WRITE_TOKEN`** into the project's environment — you don't paste
it manually. This is where uploaded photos live. (Free tier is plenty for a wedding.)

### 4. Deploy + free domain
Push the repo to GitHub and **Import** it in Vercel (or run `vercel` then `vercel --prod`
from the CLI). `vercel.json` builds the client to `client/dist`; the `api/*` and
`api/album/*` functions are auto-mapped. No extra config needed.

You get a **free `*.vercel.app` URL** immediately. To pick the subdomain, go to
**Settings → Domains** and edit it to any available label, e.g.
`gautam-sandhya.vercel.app`. (Prefer a real custom domain later? Buy one from
Cloudflare/Namecheap and add it under the same Domains page — DNS instructions are shown
there.)

Then verify:
- **The site:** your `*.vercel.app` URL
- **Health + metrics:** `/api/health`
- **RSVPs as JSON:** `/api/rsvps` · **Live spreadsheet:** the Google Sheet itself
- **Email:** every RSVP lands in the inboxes listed in `RSVP_NOTIFY_TO`
- **Album:** open `/?admin`, enter `ADMIN_PASSWORD`, upload a photo (try a >4.5 MB one to
  confirm the Blob direct-upload path); it should appear in the grid and persist on reload.

To test the production functions locally, run `vercel dev` with the same env vars in a
root `.env.local`.

## Production build (self-hosted, persistent disk)

If you'd rather self-host on a server **with a persistent disk** (VPS, Render +
disk, etc.) and keep the file-based store, use the Express server instead:

```bash
npm run build           # builds the client to client/dist
npm start               # Express serves client/dist AND the /api routes on one port
```

Point `DATA_DIR` at your mounted volume (e.g. `DATA_DIR=/data`) so RSVPs survive
restarts. RSVPs save to `$DATA_DIR/rsvps.json` and album photos to `$DATA_DIR/uploads/`.
Set the same `SMTP_*` / `RSVP_NOTIFY_TO` / Google / `ADMIN_PASSWORD` env vars as needed.

To keep **album uploads on local disk** (instead of Vercel Blob) in this self-hosted
build, build the client with `VITE_BLOB=0`:

```bash
VITE_BLOB=0 npm run build && npm start
```

## Editing content
- **Events / timings / colours:** `client/src/data/events.js`
- **Couple details & parents' names:** `client/src/components/Story.jsx`
- **Theme tokens (gold/maroon/fonts):** `client/src/styles/global.css`

## Event schedule
| Day | Ceremony | Time | Theme |
|-----|----------|------|-------|
| 10 Feb 2027 | Vratham | 8:00–10:00 AM | ☀️ bright |
| 10 Feb 2027 | Nitchayathartham | 11:00 AM–12:30 PM | ☀️ bright |
| 10 Feb 2027 | Reception & Musical Night | 6:30–8:30 PM | 🌙 dark |
| 11 Feb 2027 | Kasi Yatra & Oonjal | 8:00 AM | ☀️ bright |
| 11 Feb 2027 | Muhurtham | 10:30–11:30 AM | ☀️ bright |
| 11 Feb 2027 | Nalungu | 4:30–5:30 PM | 🌙 dark |
