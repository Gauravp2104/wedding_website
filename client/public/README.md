# Album images

Drop the album photos in **this folder**, named **`image1` … `image12`** (any
common image extension — `.jpg` recommended), e.g.:

```
client/public/images/image1.jpg
client/public/images/image2.jpg
...
client/public/images/image12.jpg
```

- **Local dev** (`npm run dev`): the gallery reads these directly — they show up
  at `http://localhost:5173/images/image1.jpg`, ordered `image1 → image12`.
- **Production (Vercel):** the same files are uploaded to **Vercel Blob** under
  the `images/` prefix and the live site references them from there. Upload them
  with one command after dropping them here:

  ```
  # token from: Vercel → Storage → your Blob store → ".env.local" snippet
  # (or run `vercel env pull` and copy BLOB_READ_WRITE_TOKEN)
  BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx npm run upload:images
  ```

The actual image files are git-ignored (so the repo stays small) — they live
locally and in Blob, not in git.
