import { useEffect, useRef, useState } from 'react';

// South Indian classical violin that begins on the visitor's first interaction
// (browsers block audio until a user gesture) and can be muted at any time.
// Drop your track at client/public/audio/violin.mp3 — see the README there.
const AUDIO_SRC = '/audio/music.mp3';
const TARGET_VOLUME = 0.3; // soft background level
const FADE_MS = 900;

export default function AudioToggle() {
  const audioRef = useRef(null);
  const fadeRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  // Ramp volume up to `to` (0..1) over FADE_MS. Only used for the fade-IN —
  // muting pauses immediately instead (see stop() below), so a stalled or
  // ignored fade can never leave audio audibly playing after a guest asked
  // for silence.
  function fadeTo(to) {
    const audio = audioRef.current;
    if (!audio) return;
    clearInterval(fadeRef.current);
    const frames = Math.max(1, Math.round(FADE_MS / 60));
    const step = (to - audio.volume) / frames;
    fadeRef.current = setInterval(() => {
      const next = audio.volume + step;
      const done = step >= 0 ? next >= to : next <= to;
      audio.volume = Math.min(1, Math.max(0, done ? to : next));
      if (done) clearInterval(fadeRef.current);
    }, 60);
  }

  async function start() {
    const audio = audioRef.current;
    if (!audio) return false;
    try {
      audio.volume = 0;
      await audio.play(); // must run inside the user gesture for iOS/Safari
      setPlaying(true);
      fadeTo(TARGET_VOLUME);
      return true;
    } catch {
      // Gesture/autoplay blocked or file missing — leave it off.
      setPlaying(false);
      return false;
    }
  }

  // Mute immediately, not via a volume fade — iOS Safari ignores the
  // `volume` property entirely, so a fade-then-pause there would leave
  // the music audibly playing for the whole fade duration after the tap.
  // pause() itself has no gesture restriction, so this always takes effect.
  function stop() {
    setPlaying(false);
    clearInterval(fadeRef.current);
    audioRef.current?.pause();
  }

  const toggle = () => (playing ? stop() : start());

  // Music should always start automatically when the page loads — every
  // visit, on phone and laptop alike, regardless of whether a guest muted
  // it on an earlier visit. Try to start it immediately; browsers that
  // allow unmuted autoplay let it play right away. Browsers that don't
  // (iOS Safari, and stricter Chrome/Firefox policies) reject that attempt,
  // so we also start it on the guest's very first interaction — a tap,
  // click, key, or scroll — which is as close to "always on" as those
  // policies allow.
  useEffect(() => {
    const triggers = ['pointerdown', 'keydown', 'touchstart', 'wheel', 'scroll'];
    const onFirst = async () => {
      const ok = await start();
      if (ok) cleanup();
    };
    const cleanup = () => triggers.forEach((t) => window.removeEventListener(t, onFirst));
    triggers.forEach((t) => window.addEventListener(t, onFirst, { passive: true }));

    start().then((ok) => {
      if (ok) cleanup();
    });

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <audio ref={audioRef} src={AUDIO_SRC} loop preload="auto" />
      <button
        type="button"
        className={`audio-toggle ${playing ? 'on' : ''}`}
        onClick={toggle}
        aria-label={playing ? 'Mute music' : 'Play music'}
        title={playing ? 'Mute music' : 'Play music'}
      >
        <span className="audio-toggle__icon" aria-hidden="true">
          {playing ? '🎵' : '🔇'}
        </span>
      </button>
    </>
  );
}
