import { motion } from 'framer-motion';

// Rotating mandala kolam behind the names.
function Mandala() {
  const petals = Array.from({ length: 16 });
  return (
    <motion.svg
      className="hero__mandala"
      viewBox="0 0 400 400"
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 90, ease: 'linear' }}
      aria-hidden="true"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1">
        {[60, 110, 160, 190].map((r) => (
          <circle key={r} cx="200" cy="200" r={r} />
        ))}
        {petals.map((_, i) => (
          <path
            key={i}
            d="M200 40 q22 60 0 120 q-22-60 0-120 Z"
            transform={`rotate(${(360 / petals.length) * i} 200 200)`}
          />
        ))}
        {petals.map((_, i) => (
          <circle
            key={`d${i}`}
            cx="200"
            cy="60"
            r="2.5"
            fill="currentColor"
            transform={`rotate(${(360 / petals.length) * i} 200 200)`}
          />
        ))}
      </g>
    </motion.svg>
  );
}

// The ornate "knot" that ties the two names together.
function MangalaKnot() {
  return (
    <motion.div
      className="hero__knot"
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.9, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.svg
        viewBox="0 0 80 80"
        width="74"
        height="74"
        animate={{ rotate: [0, 8, -8, 0] }}
        transition={{ repeat: Infinity, duration: 9, ease: 'easeInOut' }}
        aria-hidden="true"
      >
        <g fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M40 14 C58 22 58 40 40 40 C22 40 22 22 40 14 Z" />
          <path d="M40 66 C22 58 22 40 40 40 C58 40 58 58 40 66 Z" />
          <circle cx="40" cy="40" r="3.4" fill="currentColor" />
        </g>
      </motion.svg>
      <span className="hero__amp">&amp;</span>
    </motion.div>
  );
}

const fade = {
  hidden: { opacity: 0, y: 24 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.2 + i * 0.16, duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function Hero() {
  return (
    <header className="hero" id="top">
      <Mandala />

      <motion.div className="hero__lamp" custom={0} variants={fade} initial="hidden" animate="show">
        🪔
      </motion.div>

      <motion.p className="hero__intro" custom={1} variants={fade} initial="hidden" animate="show">
        Where two families become one, and two souls take seven steps into forever —
      </motion.p>

      <div className="hero__duo">
        <motion.span className="hero__name" custom={2} variants={fade} initial="hidden" animate="show">
          Gautam
        </motion.span>
        <MangalaKnot />
        <motion.span className="hero__name" custom={3} variants={fade} initial="hidden" animate="show">
          Sandhya
        </motion.span>
      </div>

      <motion.p className="hero__join" custom={4} variants={fade} initial="hidden" animate="show">
        invite you to share in their happily ever after
      </motion.p>

      <motion.div className="hero__date" custom={5} variants={fade} initial="hidden" animate="show">
        10 &amp; 11 February 2027 · Bengaluru
      </motion.div>

      <motion.a
        className="hero__cta"
        href="#rsvp"
        custom={6}
        variants={fade}
        initial="hidden"
        animate="show"
      >
        Click here to RSVP →
      </motion.a>

      <motion.p
        className="hero__scroll"
        animate={{ y: [0, 8, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        Scroll to begin ↓
      </motion.p>
    </header>
  );
}
