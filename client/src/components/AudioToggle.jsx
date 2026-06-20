import { useEffect, useRef, useState } from 'react';

// South Indian classical violin that begins on the visitor's first interaction
// (browsers block audio until a user gesture) and can be muted at any time.
// Drop your track at client/public/audio/violin.mp3 — see the README there.
const AUDIO_SRC = '/audio/violin.mp3';
const PREF_KEY = 'gs_audio'; // 'on' | 'off' — remembered across visits
const TARGET_VOLUME = 0.35; // soft background level
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
    if (!audio) return;
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
    } catch {
      // Gesture/autoplay blocked or file missing — leave it off.
      setPlaying(false);
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

  // Begin on the first tap/click/key, unless the guest muted it before.
  useEffect(() => {
    let pref = null;
    try {
      pref = localStorage.getItem(PREF_KEY);
    } catch {
      /* ignore */
    }
    if (pref === 'off') return undefined;

    const onFirst = () => {
      start();
      cleanup();
    };
    const cleanup = () => {
      window.removeEventListener('pointerdown', onFirst);
      window.removeEventListener('keydown', onFirst);
    };
    window.addEventListener('pointerdown', onFirst);
    window.addEventListener('keydown', onFirst);
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
