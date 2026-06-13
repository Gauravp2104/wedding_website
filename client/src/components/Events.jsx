import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { events, MAPS_URL } from '../data/events';
import { KolamCorner, Mangalsutra } from './Ornaments';

function gradient(palette) {
  const [a, b, c] = palette.bg;
  return `radial-gradient(circle at 50% 0%, ${a} 0%, ${b} 48%, ${c} 100%)`;
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
          <motion.a
            className="event__location"
            variants={rise}
            custom={6}
            href={MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: palette.ink, borderColor: palette.accent }}
          >
            <span style={{ color: palette.accent }}>📍</span> {ev.location}
            <span className="event__location-go" style={{ color: palette.accent }}>
              Open in Maps ↗
            </span>
          </motion.a>
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
      {/* Fixed background that morphs between palettes while scrolling */}
      <motion.div
        aria-hidden="true"
        style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
        animate={{ background: gradient(palette), opacity: inView ? 1 : 0 }}
        transition={{ duration: 1.1, ease: 'easeInOut' }}
      />

      {/* Scroll-progress rail — always present (even over the hero/story),
          so guests can jump to any ceremony from anywhere on the page. */}
      <motion.div
        className="rail"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
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
