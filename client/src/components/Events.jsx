import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { events, MAPS_URL } from '../data/events';
import { KolamCorner, Mangalsutra } from './Ornaments';

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// A tinted scrim in the event's own palette, laid over its background
// illustration so the artwork reads as "shaded" colour rather than a
// flat photo — keeps text legible while still showing the caricature.
function shade(palette, alpha) {
  const [a, b, c] = palette.bg;
  const rgba = (hex, mul) => {
    const [r, g, bl] = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${bl}, ${Math.min(1, alpha * mul).toFixed(2)})`;
  };
  return `radial-gradient(circle at 50% 0%, ${rgba(a, 1)} 0%, ${rgba(b, 1.05)} 48%, ${rgba(c, 1.1)} 100%)`;
}

function EventContent({ ev }) {
  const { palette } = ev;
  const rise = {
    hidden: { opacity: 0, y: 30 },
    show: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
    }),
  };
  return (
    <section className="event" id={ev.id} style={{ color: palette.ink }}>
      <KolamCorner className="event__corner event__corner--tl" style={{ color: palette.accent }} />
      <KolamCorner className="event__corner event__corner--br" style={{ color: palette.accent }} />

      <motion.div
        className="event__inner"
        initial="hidden"
        whileInView="show"
        viewport={{ once: false, amount: 0.5 }}
      >
        <motion.span className="event__badge" variants={rise} custom={0} style={{ color: palette.sub }}>
          {ev.day} · {ev.date}
        </motion.span>
        <motion.div
          className="event__icon"
          variants={rise}
          custom={1}
          style={ev.icon === 'mangalsutra' ? { color: palette.accent } : undefined}
        >
          {ev.icon === 'mangalsutra' ? <Mangalsutra style={{ verticalAlign: 'middle' }} /> : ev.icon}
        </motion.div>
        <motion.h2 className="event__name" variants={rise} custom={2} style={{ color: palette.accent }}>
          {ev.name}
        </motion.h2>
        <motion.p className="event__script" variants={rise} custom={3}>
          {ev.sanskrit}
        </motion.p>
        <motion.div className="event__time" variants={rise} custom={4}>
          <small>When</small>
          {ev.time}
        </motion.div>
        <motion.p className="event__blurb" variants={rise} custom={5} style={{ color: palette.sub }}>
          {ev.blurb}
        </motion.p>
        {ev.location && (
          <motion.div className="event__actions" variants={rise} custom={6}>
            <a
              className="event__action"
              href={MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: palette.ink, borderColor: palette.accent }}
            >
              <span style={{ color: palette.accent }}>📍</span> Get directions
              <small style={{ color: palette.sub }}>{ev.location}</small>
            </a>
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}

export default function Events() {
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  const refs = useRef([]);
  const containerRef = useRef(null);

  // Track which event section occupies the centre of the viewport.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(Number(entry.target.dataset.index));
        });
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
    );
    refs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // The rail + side label only appear once we've scrolled into the
  // events area (i.e. past the names intro), and hide again afterwards.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: '-25% 0px -25% 0px', threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const palette = events[active].palette;

  return (
    <div className="events" id="events" ref={containerRef}>
      {/* Fixed background: each ceremony's caricature artwork, cross-fading
          as guests scroll, with a palette-tinted scrim shading it so the
          text above stays legible. */}
      <div
        aria-hidden="true"
        style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: inView ? 1 : 0, transition: 'opacity 1.1s ease-in-out' }}
      >
        {events.map((ev, i) => (
          <motion.div
            key={ev.id}
            className="events__bg-img"
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${ev.image})`,
              backgroundColor: ev.palette.bg[1],
            }}
            animate={{ opacity: i === active ? 1 : 0 }}
            transition={{ duration: 1.1, ease: 'easeInOut' }}
          />
        ))}
        <motion.div
          className="events__scrim"
          style={{ position: 'absolute', inset: 0 }}
          animate={{ background: shade(palette, 0.82) }}
          transition={{ duration: 1.1, ease: 'easeInOut' }}
        />
      </div>

      {/* Scroll-progress rail — always present (even over the hero/story),
          so guests can jump to any ceremony from anywhere on the page. */}
      <motion.div
        className="rail"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        {/* Small labelled button so guests know the dots jump to the ceremonies. */}
        <button
          type="button"
          className="rail__cap"
          aria-label="Jump to the ceremonies"
          onClick={() => refs.current[0]?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
        >
          Events
        </button>
        {events.map((ev, i) => (
          <button
            key={ev.id}
            className={`rail__dot ${ev.period === 'AM' ? 'rail__dot--am' : 'rail__dot--pm'} ${
              i === active && inView ? 'rail__dot--on' : ''
            }`}
            aria-label={`${ev.name} · ${ev.time}`}
            onClick={() => refs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          >
            <span className="rail__label">
              {ev.name}
              <small>{ev.time}</small>
            </span>
          </button>
        ))}
      </motion.div>

      {/* Vertical time-of-day label — only after scrolling past the names */}
      <AnimatePresence mode="wait">
        {inView && (
          <motion.div
            key={active}
            className="tod-label"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.78 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{ color: palette.ink }}
          >
            {events[active].period === 'AM' ? 'Morning · AM' : 'Evening · PM'}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ position: 'relative', zIndex: 2 }}>
        {events.map((ev, i) => (
          <div key={ev.id} data-index={i} ref={(el) => (refs.current[i] = el)}>
            <EventContent ev={ev} />
          </div>
        ))}
      </div>
    </div>
  );
}
