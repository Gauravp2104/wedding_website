import { useEffect, useRef } from 'react';

// South Indian classical violin, playing quietly in the background for the
// whole visit — no mute control, on phone or laptop. Browsers block
// unmuted autoplay until the guest has interacted with the page at all, so
// we wait for their first interaction, then let them scroll a couple
// seconds into the site before the music fades in (rather than snapping on
// the instant they touch the screen).
// Drop your track at client/public/audio/violin.mp3 — see the README there.
const AUDIO_SRC = '/audio/music.mp3';
// Low background level — there's no mute button to fall back on, so it
// needs to stay unobtrusive on its own.
const TARGET_VOLUME = 0.18;
const FADE_MS = 900;
// Let a guest scroll for a couple of seconds before the music fades in,
// instead of it snapping on the instant they touch/click/scroll.
const START_DELAY_MS = 2500;

export default function AudioToggle() {
  const audioRef = useRef(null);
  const fadeRef = useRef(null);
  const startedRef = useRef(false);

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
    if (startedRef.current) return true;
    const audio = audioRef.current;
    if (!audio) return false;
    try {
      audio.volume = 0;
      await audio.play(); // must run inside/after a user gesture for iOS/Chrome
      startedRef.current = true;
      fadeTo(TARGET_VOLUME);
      return true;
    } catch {
      // Gesture/autoplay blocked or file missing — a later trigger retries.
      return false;
    }
  }

  // Music should always start automatically — every visit, on phone and
  // laptop alike. Try immediately first; browsers that allow unmuted
  // autoplay let it play right away. Browsers that don't (iOS Safari,
  // Chrome's stricter policies) reject that attempt, so we also arm a
  // listener for the guest's first interaction with the page.
  //
  // That first interaction must be an event the browser actually counts as
  // user activation, per the HTML spec's "activation-triggering input
  // event" list — click, touchend, keydown (not touchstart or wheel).
  // touchend fires at the end of every swipe, so plain scrolling on mobile
  // qualifies, not just taps. Once activation happens, Chrome and Safari
  // both allow later (not just synchronous) play() calls on that page, so
  // we don't call start() right away — we start a short timer instead, so
  // the music fades in after ~2-3s of scrolling rather than the instant
  // the guest touches the screen.
  useEffect(() => {
    const triggers = ['click', 'touchend', 'keydown', 'scroll'];
    let delayTimer = null;

    const onFirst = () => {
      cleanup();
      delayTimer = setTimeout(start, START_DELAY_MS);
    };
    const cleanup = () => triggers.forEach((t) => window.removeEventListener(t, onFirst));
    triggers.forEach((t) => window.addEventListener(t, onFirst, { passive: true }));

    start().then((ok) => {
      if (ok) cleanup();
    });

    return () => {
      cleanup();
      clearTimeout(delayTimer);
    };
  }, []);

  return <audio ref={audioRef} src={AUDIO_SRC} loop preload="auto" />;
}
