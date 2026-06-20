# Background music

Drop your track here as **`music.mp3`**:

    client/public/audio/music.mp3

The floating ♫ button (bottom-right of the site) plays it on the visitor's
first interaction (click/tap/scroll anywhere), loops it softly, and remembers
if they mute it.

## Picking a file

- Use a **royalty-free / no-copyright** South Indian classical (Carnatic)
  violin instrumental — e.g. from [Pixabay Music](https://pixabay.com/music/search/indian%20classical/)
  (free, commercial use, no attribution required).
- Prefer a calm, **loopable** piece, ~1–3 min.
- Keep it small: export **MP3 ~96–128 kbps** (ideally under ~3 MB) so the page
  stays fast.

To use a different filename or format, update `AUDIO_SRC` in
`client/src/components/AudioToggle.jsx`.
