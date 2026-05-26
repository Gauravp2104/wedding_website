// A simple South-Indian-wedding-style monogram: a kolam dot-ring
// crowned by a small lotus, framing the couple's initials "G & S".
export default function Logo({ size = 44 }) {
  const dots = Array.from({ length: 16 });
  return (
    <svg
      className="logo"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label="Gautam and Sandhya"
    >
      {/* kolam dot-ring */}
      <g fill="currentColor">
        {dots.map((_, i) => {
          const a = (Math.PI * 2 * i) / dots.length;
          return <circle key={i} cx={50 + 44 * Math.cos(a)} cy={50 + 44 * Math.sin(a)} r="1.7" />;
        })}
      </g>
      <g fill="none" stroke="currentColor">
        <circle cx="50" cy="50" r="38" strokeWidth="1.4" />
        <circle cx="50" cy="50" r="33" strokeWidth="0.8" opacity="0.7" />
      </g>

      {/* little lotus / diya crown */}
      <g fill="currentColor">
        <path d="M50 8 q5 7 0 13 q-5-6 0-13 Z" />
        <path d="M44 11 q4 7 4 11 q-7-3-4-11 Z" opacity="0.8" />
        <path d="M56 11 q-4 7-4 11 q7-3 4-11 Z" opacity="0.8" />
      </g>

      {/* initials */}
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="'Marcellus', serif"
        fontSize="34"
        fill="currentColor"
        letterSpacing="-1"
      >
        G
        <tspan fontSize="20" dy="0" fontStyle="italic">
          &amp;
        </tspan>
        S
      </text>
    </svg>
  );
}
