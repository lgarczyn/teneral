function Sigil({ role, color }) {
  const s = { width: "100%", height: "100%" };
  const c = color;
  if (role === "human")
    return (
      <svg viewBox="0 0 90 90" fill="none" style={s}>
        <circle cx="45" cy="32" r="14" stroke={c} strokeWidth="1.5" />
        <circle cx="45" cy="32" r="5" fill={c} opacity="0.3" />
        <path d="M22 75 C22 55 68 55 68 75" stroke={c} strokeWidth="1.5" />
        <circle
          cx="45"
          cy="45"
          r="36"
          stroke={c}
          strokeWidth="0.5"
          strokeDasharray="3 6"
          opacity="0.2"
        />
      </svg>
    );
  if (role === "doctor")
    return (
      <svg viewBox="0 0 90 90" fill="none" style={s}>
        <rect
          x="38"
          y="20"
          width="14"
          height="50"
          rx="3"
          stroke={c}
          strokeWidth="1.5"
          fill={c}
          fillOpacity="0.1"
        />
        <rect
          x="20"
          y="38"
          width="50"
          height="14"
          rx="3"
          stroke={c}
          strokeWidth="1.5"
          fill={c}
          fillOpacity="0.1"
        />
        <circle
          cx="45"
          cy="45"
          r="32"
          stroke={c}
          strokeWidth="0.5"
          strokeDasharray="2 5"
          opacity="0.25"
        />
      </svg>
    );
  if (role === "alien")
    return (
      <svg viewBox="0 0 90 90" fill="none" style={s}>
        <ellipse cx="45" cy="36" rx="20" ry="16" stroke={c} strokeWidth="1.5" />
        <ellipse
          cx="45"
          cy="36"
          rx="7"
          ry="10"
          stroke={c}
          strokeWidth="1"
          fill={c}
          opacity="0.1"
        />
        <circle cx="37" cy="32" r="3.5" fill={c} opacity="0.7" />
        <circle cx="53" cy="32" r="3.5" fill={c} opacity="0.7" />
        <path
          d="M28 52 Q36 66 45 64 Q54 66 62 52"
          stroke={c}
          strokeWidth="1.2"
        />
        <path
          d="M21 48 Q14 38 17 27"
          stroke={c}
          strokeWidth="1"
          strokeDasharray="2 3"
          opacity="0.5"
        />
        <path
          d="M69 48 Q76 38 73 27"
          stroke={c}
          strokeWidth="1"
          strokeDasharray="2 3"
          opacity="0.5"
        />
      </svg>
    );
  if (role === "immune")
    return (
      <svg viewBox="0 0 90 90" fill="none" style={s}>
        <path
          d="M45 14 L70 28 L70 52 Q70 70 45 78 Q20 70 20 52 L20 28 Z"
          stroke={c}
          strokeWidth="1.5"
        />
        <path
          d="M45 24 L62 34 L62 52 Q62 64 45 70 Q28 64 28 52 L28 34 Z"
          stroke={c}
          strokeWidth="0.7"
          fill={c}
          fillOpacity="0.05"
        />
        <path
          d="M33 46 L41 54 L57 38"
          stroke={c}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  if (role === "duelist")
    return (
      <svg viewBox="0 0 90 90" fill="none" style={s}>
        <line
          x1="22"
          y1="22"
          x2="68"
          y2="68"
          stroke={c}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <line
          x1="68"
          y1="22"
          x2="22"
          y2="68"
          stroke={c}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="45" cy="45" r="10" stroke={c} strokeWidth="1.2" />
        <circle cx="22" cy="22" r="3" fill={c} opacity="0.6" />
        <circle cx="68" cy="22" r="3" fill={c} opacity="0.6" />
        <circle cx="22" cy="68" r="3" fill={c} opacity="0.6" />
        <circle cx="68" cy="68" r="3" fill={c} opacity="0.6" />
      </svg>
    );
  if (role === "empath")
    return (
      <svg viewBox="0 0 90 90" fill="none" style={s}>
        <ellipse cx="45" cy="45" rx="22" ry="14" stroke={c} strokeWidth="1.5" />
        <circle
          cx="45"
          cy="45"
          r="6"
          stroke={c}
          strokeWidth="1.2"
          fill={c}
          fillOpacity="0.2"
        />
        <circle cx="45" cy="45" r="2.5" fill={c} opacity="0.8" />
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a, i) => (
          <line
            key={i}
            x1={45 + Math.cos((a * Math.PI) / 180) * 28}
            y1={45 + Math.sin((a * Math.PI) / 180) * 28}
            x2={45 + Math.cos((a * Math.PI) / 180) * 36}
            y2={45 + Math.sin((a * Math.PI) / 180) * 36}
            stroke={c}
            strokeWidth="0.9"
            strokeLinecap="round"
            opacity="0.5"
          />
        ))}
      </svg>
    );
  if (role === "predisposed")
    return (
      <svg viewBox="0 0 90 90" fill="none" style={s}>
        <path
          d="M45 15 A30 30 0 0 1 75 45"
          stroke={c}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M75 45 A30 30 0 0 1 45 75"
          stroke={c}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M45 75 A30 30 0 0 1 15 45"
          stroke={c}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M15 45 A30 30 0 0 1 45 15"
          stroke={c}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="4 4"
        />
        <path
          d="M45 45 L55 28"
          stroke={c}
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.8"
        />
        <path
          d="M45 45 L65 52"
          stroke={c}
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.6"
        />
        <path
          d="M45 45 L38 65"
          stroke={c}
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.7"
        />
        <path
          d="M45 45 L22 38"
          stroke={c}
          strokeWidth="0.8"
          strokeLinecap="round"
          opacity="0.5"
        />
        <circle cx="56" cy="26" r="1.5" fill={c} opacity="0.6" />
        <circle cx="37" cy="67" r="1.5" fill={c} opacity="0.5" />
        <circle
          cx="45"
          cy="45"
          r="4"
          stroke={c}
          strokeWidth="1"
          fill={c}
          fillOpacity="0.2"
        />
      </svg>
    );
  return null;
}
