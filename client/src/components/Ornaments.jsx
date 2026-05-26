// Reusable South-Indian-inspired SVG ornaments: kolam dot-grids,
// temple arches, mango/paisley borders. Color is inherited via
// currentColor so they tint to each section's palette.

export function KolamCorner({ style }) {
  return (
    <svg viewBox="0 0 120 120" width="120" height="120" style={style} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.55">
        <path d="M10 60 q25-25 50 0 q25 25 50 0" />
        <path d="M10 60 q25 25 50 0 q25-25 50 0" />
        <circle cx="10" cy="60" r="3.5" fill="currentColor" stroke="none" />
        <circle cx="60" cy="60" r="3.5" fill="currentColor" stroke="none" />
        <circle cx="110" cy="60" r="3.5" fill="currentColor" stroke="none" />
        <circle cx="35" cy="42" r="2.5" fill="currentColor" stroke="none" />
        <circle cx="85" cy="42" r="2.5" fill="currentColor" stroke="none" />
        <circle cx="35" cy="78" r="2.5" fill="currentColor" stroke="none" />
        <circle cx="85" cy="78" r="2.5" fill="currentColor" stroke="none" />
        <path d="M60 18 q18 18 0 36 q-18-18 0-36 Z" />
        <path d="M60 66 q18 18 0 36 q-18-18 0-36 Z" />
      </g>
    </svg>
  );
}

// A peacock-feather / paisley divider used between sections.
export function PaisleyDivider({ style }) {
  return (
    <svg viewBox="0 0 300 40" width="220" height="30" style={style} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M150 6 C170 6 178 26 150 34 C122 26 130 6 150 6 Z" />
        <circle cx="150" cy="16" r="3" fill="currentColor" />
        <path d="M20 20 H120" strokeDasharray="2 6" strokeLinecap="round" />
        <path d="M180 20 H280" strokeDasharray="2 6" strokeLinecap="round" />
        <circle cx="120" cy="20" r="2.5" fill="currentColor" />
        <circle cx="180" cy="20" r="2.5" fill="currentColor" />
      </g>
    </svg>
  );
}

// Mangalsutra / thali — the sacred thread tied at the Muhurtham,
// the moment the marriage is solemnised.
export function Mangalsutra({ style }) {
  const beads = Array.from({ length: 9 });
  return (
    <svg viewBox="0 0 100 100" width="1em" height="1em" style={style} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        {/* the U-shaped chain (quadratic Bézier P0=14,20 P1=50,84 P2=86,20) */}
        <path d="M14 20 Q50 84 86 20" />
        {/* beads strung along the thread, placed on the same curve */}
        {beads.map((_, i) => {
          const t = (i + 1) / (beads.length + 1);
          const u = 1 - t;
          const x = u * u * 14 + 2 * u * t * 50 + t * t * 86;
          const y = u * u * 20 + 2 * u * t * 84 + t * t * 20;
          return <circle key={i} cx={x} cy={y} r="2.4" fill="currentColor" stroke="none" />;
        })}
      </g>
      {/* two gold thali pendants at the centre */}
      <g fill="currentColor">
        <circle cx="42" cy="70" r="9" />
        <circle cx="58" cy="70" r="9" />
      </g>
      <g fill="none" stroke="#1a0a14" strokeWidth="1.6" opacity="0.55">
        <circle cx="42" cy="70" r="4.5" />
        <circle cx="58" cy="70" r="4.5" />
      </g>
    </svg>
  );
}

// A temple gopuram silhouette for the hero.
export function TempleArch({ style }) {
  return (
    <svg viewBox="0 0 200 120" width="200" height="120" style={style} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.6" opacity="0.7">
        <path d="M100 6 L120 30 L116 30 L132 50 L126 50 L142 72 L58 72 L74 50 L68 50 L84 30 L80 30 Z" />
        <path d="M58 72 H142 V112 H58 Z" />
        <path d="M88 112 V86 a12 12 0 0 1 24 0 V112" />
        <circle cx="100" cy="6" r="3" fill="currentColor" />
      </g>
    </svg>
  );
}
