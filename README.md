# 🪔 Gautam & Sandhya — South Indian Wedding Website

A full-stack, mobile-responsive wedding site with a South-Indian inspired design:
kolam ornaments, temple motifs, gold-on-maroon palette, and **six scroll-driven
ceremony sections** whose colour scheme brightens for **AM** ceremonies and deepens
for **PM** ceremonies. Ends with an animated **RSVP** form whose submissions are
**saved to a JSON file** and **exported to a downloadable Excel (.xlsx) spreadsheet**.

## Stack
- **Frontend:** React 18 + Vite + Framer Motion
- **Local dev backend:** Node/Express + ExcelJS (saves to local files)
- **Production backend (Vercel):** Serverless functions + Google Sheets (durable store)
  + ExcelJS (Excel generated on demand)

## Quick start

```bash
# from the project root
npm run install:all     # installs root + client + server deps
npm run dev             # starts API (:4000) and Vite dev server (:5173)
```

Then open **http://localhost:5173**.

The Vite dev server proxies `/api/*` calls to the Express backend on port 4000.

## Viewing & exporting RSVPs

**Local dev (Express):** every RSVP is saved to `server/data/rsvps.json` and the
spreadsheet `server/data/rsvps.xlsx` is regenerated on each submission.

- **View as JSON:** `http://localhost:4000/api/rsvps`
- **Download Excel (.xlsx):** `http://localhost:4000/api/rsvps.xlsx`
- **Or open the file directly:** `server/data/rsvps.xlsx`

**Production (Vercel):** every RSVP is appended as a row in your **Google Sheet**;
the same `/api/rsvps` (JSON) and `/api/rsvps.xlsx` (download) endpoints read live
from that Sheet. See **Deploying to Vercel** below.

Either way the Excel sheet has one row per guest with columns: Name, Attending,
Guests, Email, Phone, Events, Message, Submitted. No email or SMS setup is required.

## Deploying to Vercel (recommended)

Vercel runs the backend as **serverless functions with a read-only, ephemeral
filesystem** — so local files (`rsvps.json` / `rsvps.xlsx`) do **not** persist there.
Instead, production uses a **Google Sheet as the durable store**, and the Excel file is
**generated on demand** from the Sheet (`/api/rsvps.xlsx`). The Sheet doubles as your
live, shareable backup.

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

### 3. Deploy
Push the repo to GitHub and **Import** it in Vercel (or run `vercel` from the CLI).
`vercel.json` already builds the client to `client/dist` and serves the `/api/*`
functions. No extra config needed.

- **The site:** your Vercel URL
- **RSVPs as JSON:** `/api/rsvps`
- **Download Excel:** `/api/rsvps.xlsx`
- **Live spreadsheet:** the Google Sheet itself (every RSVP appears as a new row)

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
restarts. RSVPs save to `$DATA_DIR/rsvps.json` and `$DATA_DIR/rsvps.xlsx`.

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
