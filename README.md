# 🪔 Gautam & Sandhya — South Indian Wedding Website

A full-stack, mobile-responsive wedding site with a South-Indian inspired design:
kolam ornaments, temple motifs, gold-on-maroon palette, and **six scroll-driven
ceremony sections** whose colour scheme brightens for **AM** ceremonies and deepens
for **PM** ceremonies. Includes a **photo album** the hosts upload into and guests
browse, and an animated **RSVP** form whose submissions are **saved to a JSON file**
on the server.

## Stack
- **Frontend:** React 18 + Vite + Framer Motion
- **Local dev backend:** Node/Express — RSVPs → `data/rsvps.json`, photos → `data/uploads/`
- **Production (Vercel):** serverless functions in `api/` that read/write a
  `rsvps.json` file **and** album photos in **Vercel Blob** (durable storage; no disk needed)
- **Observability:** structured JSON logs (request id + latency per call) and a
  `/api/health` endpoint exposing live counters

The only service used in production is **Vercel Blob** (free tier, part of your Vercel
project — no separate account, no Google, no email).

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
`name, attending, guests, email, phone, events, message, submittedAt`.

- **Local dev:** the file lives on disk at `server/data/rsvps.json`.
- **Production (Vercel):** the same `rsvps.json` is stored in **Vercel Blob** (Vercel
  functions can't write to disk), and each RSVP reads it, appends, and writes it back.
- **View all RSVPs as JSON:** `GET /api/rsvps` (works in both). Locally you can also open
  `server/data/rsvps.json`; in production you can download `rsvps.json` from the Vercel
  Blob dashboard.

> Set `DATA_DIR` (e.g. `DATA_DIR=/data`) to change where the **local** file lives.

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
- **`/api/health`** returns `{ ok, metrics }` — live counters for
  `rsvpReceived / rsvpSaved / rsvpFailed / albumUploaded / albumUploadFailed`, plus uptime.

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

### 4. Set the admin password
Project → **Settings → Environment Variables** → add:

| Variable | Value |
|----------|-------|
| `ADMIN_PASSWORD` | a private password you choose (gates album uploads) |
| `BLOB_READ_WRITE_TOKEN` | **auto-added in step 3** — don't set it by hand |

Then **redeploy** (Deployments → ⋯ → Redeploy) so the new env vars take effect.

### 5. Free domain
You immediately get a free `*.vercel.app` URL. To choose the label, go to **Settings →
Domains** and edit it, e.g. `gautam-sandhya.vercel.app`. (Want a real domain later? Buy
one from Cloudflare/Namecheap and add it on the same page — DNS steps are shown there.)

### Verify after deploy
- **Site:** your `*.vercel.app` URL · **Health:** `/api/health`
- **RSVP:** submit the form → `GET /api/rsvps` returns it, and `rsvps.json` appears in the
  **Blob** store (Storage → your Blob → Browse). Submitting again **appends** to the same
  file — that's the "RSVP updates JSON" working in production.
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
| 10 Feb 2027 | Reception & Musical Night | 6:30–8:30 PM | 🌙 dark |
| 11 Feb 2027 | Kasi Yatra & Oonjal | 8:00 AM | ☀️ bright |
| 11 Feb 2027 | Muhurtham | 10:30–11:30 AM | ☀️ bright |
| 11 Feb 2027 | Nalungu | 4:30–5:30 PM | 🌙 dark |
