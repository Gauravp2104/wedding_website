import { useEffect, useRef, useState } from 'react';

// South Indian classical violin that begins on the visitor's first interaction
// (browsers block audio until a user gesture) and can be muted at any time.
// Drop your track at client/public/audio/violin.mp3 — see the README there.
const AUDIO_SRC = '/audio/music.mp3';
const PREF_KEY = 'gs_audio'; // 'on' | 'off' — remembered across visits
const TARGET_VOLUME = 0.3; // soft background level
const FADE_MS = 1400;

export default function AudioToggle() {
  const audioRef = useRef(null);
  const fadeRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  // Ramp volume to `to` (0..1) over FADE_MS, optionally pausing at the end.
  // (iOS ignores the volume property, so there it simply starts/stops.)
  function fadeTo(to, { pauseAtEnd = false } = {}) {
    const audio = audioRef.current;
    if (!audio) return;
    clearInterval(fadeRef.current);
    const frames = Math.max(1, Math.round(FADE_MS / 60));
    const step = (to - audio.volume) / frames;
    fadeRef.current = setInterval(() => {
      const next = audio.volume + step;
      const done = step >= 0 ? next >= to : next <= to;
      audio.volume = Math.min(1, Math.max(0, done ? to : next));
      if (done) {
        clearInterval(fadeRef.current);
        if (pauseAtEnd) audio.pause();
      }
    }, 60);
  }

  async function start() {
    const audio = audioRef.current;
    if (!audio) return false;
    try {
      audio.volume = 0;
      await audio.play(); // must run inside the user gesture for iOS/Safari
      setPlaying(true);
      try {
        localStorage.setItem(PREF_KEY, 'on');
      } catch {
        /* ignore */
      }
      fadeTo(TARGET_VOLUME);
      return true;
    } catch {
      // Gesture/autoplay blocked or file missing — leave it off.
      setPlaying(false);
      return false;
    }
  }

  function stop() {
    setPlaying(false);
    try {
      localStorage.setItem(PREF_KEY, 'off');
    } catch {
      /* ignore */
    }
    fadeTo(0, { pauseAtEnd: true });
  }

  const toggle = () => (playing ? stop() : start());

  // Music should be on from the moment the site loads, on phone and laptop
  // alike — unless the guest muted it on a previous visit. Try to start it
  // immediately; browsers that allow unmuted autoplay let it play right
  // away. Browsers that don't (iOS Safari, and stricter Chrome/Firefox
  // policies) reject that attempt, so we keep listening for the guest's
  // very first interaction — a tap, click, key, or scroll — and start it
  // then instead, which is as close to "always on" as those policies allow.
  useEffect(() => {
    let pref = null;
    try {
      pref = localStorage.getItem(PREF_KEY);
    } catch {
      /* ignore */
    }
    if (pref === 'off') return undefined;

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
