const CARD_DEFS = [
  {
    role: "doctor",
    name: "Doctor",
    bg: "radial-gradient(ellipse at 50% 20%, #0d2e2a 0%, #080f12 100%)",
    accent: "#4de8c2",
    border: "rgba(77,232,194,0.3)",
    glow: "rgba(77,232,194,0.08)",
    glowOut: "rgba(77,232,194,0.05)",
    text: "#9dd8c8",
    rules: (
      <>
        In a <strong>1v1</strong>, show this card to <strong>heal</strong> an
        infected player.
        <br />
        <br />
        You cannot heal yourself. If infected, you switch sides.
      </>
    ),
    sigil: (c) => (
      <svg viewBox="0 0 90 90" fill="none">
        <rect
          x="36"
          y="18"
          width="18"
          height="54"
          rx="2"
          stroke={c}
          strokeWidth="1.5"
        />
        <rect
          x="18"
          y="36"
          width="54"
          height="18"
          rx="2"
          stroke={c}
          strokeWidth="1.5"
        />
        <rect x="40" y="22" width="10" height="46" fill={c} opacity="0.07" />
        <rect x="22" y="40" width="46" height="10" fill={c} opacity="0.07" />
        <circle
          cx="45"
          cy="45"
          r="6"
          stroke={c}
          strokeWidth="1"
          fill={c}
          opacity="0.2"
        />
        <circle
          cx="45"
          cy="45"
          r="20"
          stroke={c}
          strokeWidth="0.5"
          strokeDasharray="2 4"
          opacity="0.3"
        />
      </svg>
    ),
  },
  {
    role: "alien",
    name: "Alien",
    bg: "radial-gradient(ellipse at 50% 20%, #1a0d2e 0%, #080812 100%)",
    accent: "#b06aff",
    border: "rgba(176,106,255,0.35)",
    glow: "rgba(176,106,255,0.1)",
    glowOut: "rgba(176,106,255,0.06)",
    text: "#c4a8e0",
    rules: (
      <>
        In a <strong>1v1</strong>, show this card to <strong>infect</strong> a
        human.
        <br />
        <br />
        They join your team until healed. You <strong>win 1v1</strong> against
        the doctor.
      </>
    ),
    sigil: (c) => (
      <svg viewBox="0 0 90 90" fill="none">
        <ellipse
          cx="45"
          cy="44"
          rx="10"
          ry="6"
          stroke={c}
          strokeWidth="1.2"
          fill={c}
          opacity="0.12"
        />
        <path
          d="M39 44 Q45 36 51 44"
          stroke={c}
          strokeWidth="1"
          fill={c}
          opacity="0.08"
        />
        <path
          d="M35 46 L25 52 L35 50"
          stroke={c}
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M55 46 L65 52 L55 50"
          stroke={c}
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <ellipse cx="45" cy="50" rx="4" ry="2" fill={c} opacity="0.3" />
        <path
          d="M20 15 C18 22 22 28 28 32 C34 36 38 40 36 46"
          stroke={c}
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <circle cx="36" cy="47" r="1.5" fill={c} opacity="0.5" />
        <path
          d="M70 15 C72 22 68 28 62 32 C56 36 52 40 54 46"
          stroke={c}
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <circle cx="54" cy="47" r="1.5" fill={c} opacity="0.5" />
        <path
          d="M10 45 C14 42 20 43 26 45 C32 47 36 48 37 50"
          stroke={c}
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <circle cx="37" cy="51" r="1.5" fill={c} opacity="0.5" />
        <path
          d="M80 45 C76 42 70 43 64 45 C58 47 54 48 53 50"
          stroke={c}
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <circle cx="53" cy="51" r="1.5" fill={c} opacity="0.5" />
        <path
          d="M18 72 C22 65 28 60 34 57 C38 55 41 53 42 51"
          stroke={c}
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <circle cx="42" cy="51" r="1.5" fill={c} opacity="0.5" />
        <path
          d="M72 72 C68 65 62 60 56 57 C52 55 49 53 48 51"
          stroke={c}
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <circle cx="48" cy="51" r="1.5" fill={c} opacity="0.5" />
        <circle
          cx="45"
          cy="44"
          r="32"
          stroke={c}
          strokeWidth="0.4"
          strokeDasharray="1 5"
          opacity="0.2"
        />
      </svg>
    ),
  },
  {
    role: "immune",
    name: "Immune",
    bg: "radial-gradient(ellipse at 50% 20%, #2a2000 0%, #110e00 100%)",
    accent: "#f0c040",
    border: "rgba(240,192,64,0.35)",
    glow: "rgba(240,192,64,0.08)",
    glowOut: "rgba(240,192,64,0.05)",
    text: "#d8c888",
    rules: (
      <>
        You <strong>cannot be infected</strong>. Your card will flip, but you
        stay human.
        <br />
        <br />
        The alien does not know you are immune. You are not obliged to reveal
        your role when infected.
      </>
    ),
    sigil: (c) => (
      <svg viewBox="0 0 90 90" fill="none">
        <path
          d="M45 15 L72 30 L72 55 Q72 72 45 80 Q18 72 18 55 L18 30 Z"
          stroke={c}
          strokeWidth="1.5"
        />
        <path
          d="M45 25 L62 35 L62 54 Q62 66 45 72 Q28 66 28 54 L28 35 Z"
          stroke={c}
          strokeWidth="0.8"
          fill={c}
          fillOpacity="0.05"
        />
        <path
          d="M35 46 L42 53 L58 37"
          stroke={c}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx="45"
          cy="48"
          r="20"
          stroke={c}
          strokeWidth="0.4"
          strokeDasharray="1 5"
          opacity="0.3"
        />
      </svg>
    ),
  },
  {
    role: "predisposed",
    name: "Predisposed",
    bg: "radial-gradient(ellipse at 50% 20%, #1a1800 0%, #0e0c00 100%)",
    accent: "#c8b040",
    border: "rgba(160,140,40,0.3)",
    glow: "rgba(160,140,40,0.06)",
    glowOut: "rgba(160,140,40,0.04)",
    text: "#b8a870",
    rules: (
      <>
        You play as a normal human — until infected.
        <br />
        <br />
        Once infected, you <strong>cannot be healed</strong>. The doctor does
        not know the cure failed. <strong>Lie</strong> about the source of your
        infection. You are not obliged to reveal your role.
      </>
    ),
    sigil: (c) => (
      <svg viewBox="0 0 90 90" fill="none">
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
        <circle cx="67" cy="53" r="1" fill={c} opacity="0.5" />
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
    ),
  },
  {
    role: "empath",
    name: "Empath",
    bg: "radial-gradient(ellipse at 50% 20%, #1a0e2e 0%, #0c0814 100%)",
    accent: "#a06fff",
    border: "rgba(160,111,255,0.3)",
    glow: "rgba(160,111,255,0.08)",
    glowOut: "rgba(160,111,255,0.05)",
    text: "#c0a8e0",
    rules: (
      <>
        In a <strong>1v1</strong>, you may demand another player{" "}
        <strong>reveal their role card</strong>.
        <br />
        <br />
        They cannot refuse. Works even when infected.
      </>
    ),
    sigil: (c) => (
      <svg viewBox="0 0 90 90" fill="none">
        <path
          d="M15 45 Q30 22 45 22 Q60 22 75 45 Q60 68 45 68 Q30 68 15 45Z"
          stroke={c}
          strokeWidth="1.5"
        />
        <circle
          cx="45"
          cy="45"
          r="10"
          stroke={c}
          strokeWidth="1.2"
          fill={c}
          fillOpacity="0.12"
        />
        <circle cx="45" cy="45" r="4" fill={c} opacity="0.7" />
        <line
          x1="45"
          y1="10"
          x2="45"
          y2="18"
          stroke={c}
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.6"
        />
        <line
          x1="45"
          y1="72"
          x2="45"
          y2="80"
          stroke={c}
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.6"
        />
        <line
          x1="62"
          y1="15"
          x2="58"
          y2="22"
          stroke={c}
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.5"
        />
        <line
          x1="28"
          y1="15"
          x2="32"
          y2="22"
          stroke={c}
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.5"
        />
        <line
          x1="75"
          y1="30"
          x2="69"
          y2="35"
          stroke={c}
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.4"
        />
        <line
          x1="15"
          y1="30"
          x2="21"
          y2="35"
          stroke={c}
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.4"
        />
        <circle cx="50" cy="41" r="2" fill={c} opacity="0.4" />
      </svg>
    ),
  },
  {
    role: "duelist",
    name: "Duelist",
    bg: "radial-gradient(ellipse at 50% 20%, #2e0a0a 0%, #120606 100%)",
    accent: "#ff5a5a",
    border: "rgba(255,90,90,0.3)",
    glow: "rgba(255,90,90,0.08)",
    glowOut: "rgba(255,90,90,0.05)",
    text: "#d8a0a0",
    rules: (
      <>
        <strong>Once per game</strong>, you can kill in a <strong>1v1</strong> —
        no ally needed.
        <br />
        <br />
        Like everyone, you can also <strong>2v1 kill</strong> with an ally.
      </>
    ),
    sigil: (c) => (
      <svg viewBox="0 0 90 90" fill="none">
        <line
          x1="22"
          y1="68"
          x2="68"
          y2="22"
          stroke={c}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <line
          x1="68"
          y1="68"
          x2="22"
          y2="22"
          stroke={c}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="22" cy="22" r="5" fill={c} opacity="0.6" />
        <circle cx="68" cy="22" r="5" fill={c} opacity="0.6" />
        <circle
          cx="45"
          cy="45"
          r="8"
          stroke={c}
          strokeWidth="1.2"
          fill={c}
          fillOpacity="0.15"
        />
        <circle cx="45" cy="45" r="2" fill={c} opacity="0.8" />
        <line
          x1="22"
          y1="68"
          x2="30"
          y2="60"
          stroke={c}
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.4"
        />
        <line
          x1="68"
          y1="68"
          x2="60"
          y2="60"
          stroke={c}
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.4"
        />
      </svg>
    ),
  },
  {
    role: "human",
    name: "Human",
    bg: "radial-gradient(ellipse at 50% 20%, #1e2235 0%, #0d0e1a 100%)",
    accent: "#8ab0d8",
    border: "rgba(138,176,216,0.3)",
    glow: "rgba(138,176,216,0.06)",
    glowOut: "rgba(138,176,216,0.04)",
    text: "#a8bcd4",
    rules: (
      <>
        No special ability.
        <br />
        <br />
        Your only weapons are <strong>words</strong> and allies.
      </>
    ),
    sigil: (c) => (
      <svg viewBox="0 0 90 90" fill="none">
        <circle cx="45" cy="28" r="12" stroke={c} strokeWidth="1.5" />
        <path d="M20 75 C20 55 70 55 70 75" stroke={c} strokeWidth="1.5" />
        <circle cx="45" cy="28" r="4" fill={c} opacity="0.4" />
        <line
          x1="45"
          y1="42"
          x2="45"
          y2="58"
          stroke={c}
          strokeWidth="1"
          strokeDasharray="2 3"
          opacity="0.5"
        />
        <circle
          cx="45"
          cy="45"
          r="28"
          stroke={c}
          strokeWidth="0.5"
          strokeDasharray="3 5"
          opacity="0.2"
        />
      </svg>
    ),
  },
];

function CardFace({ def }) {
  return (
    <div
      className="teneral-card"
      style={{
        background: def.bg,
        "--card-accent": def.accent,
        "--card-border": def.border,
        "--card-glow": def.glow,
        "--card-glow-out": def.glowOut,
        "--card-text": def.text,
      }}
    >
      <div className="card-role-name" style={{ color: def.accent }}>
        {def.name}
      </div>
      <div
        className="card-sigil"
        style={{ filter: `drop-shadow(0 0 14px ${def.accent})` }}
      >
        {def.sigil(def.accent)}
      </div>
      <div
        className="card-divider"
        style={{
          background: `linear-gradient(90deg, transparent, ${def.accent}, transparent)`,
        }}
      />
      <div className="card-rules" style={{ color: def.text }}>
        {def.rules}
      </div>
    </div>
  );
}

function CardsPanel() {
  return (
    <div>
      <style>{`
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 20px;
        }
        .teneral-card {
          aspect-ratio: 2.5 / 3.5;
          border-radius: 14px;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 16px 14px 14px;
          isolation: isolate;
        }
        .teneral-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E");
          background-size: 120px;
          opacity: 0.4;
          z-index: 1;
          pointer-events: none;
        }
        .teneral-card::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 14px;
          border: 1px solid var(--card-border);
          box-shadow: inset 0 0 30px var(--card-glow), 0 0 20px var(--card-glow-out);
          z-index: 2;
          pointer-events: none;
        }
        .teneral-card > * { position: relative; z-index: 3; }
        .card-role-name {
          font-family: 'Cinzel', serif;
          font-size: 0.7rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          margin-bottom: 8px;
          text-shadow: 0 0 12px currentColor;
        }
        .card-sigil {
          width: 55%;
          aspect-ratio: 1;
          margin-bottom: 10px;
        }
        .card-sigil svg { width: 100%; height: 100%; }
        .card-divider {
          width: 80%;
          height: 1px;
          margin-bottom: 10px;
          opacity: 0.6;
        }
        .card-rules {
          font-family: 'Crimson Pro', serif;
          font-size: 0.85rem;
          line-height: 1.5;
          text-align: center;
          font-style: italic;
          padding: 0 4px;
        }
        .card-rules strong {
          font-style: normal;
          font-weight: 600;
          color: var(--card-accent);
        }
        .print-btn {
          margin-bottom: 16px;
          padding: 6px 16px;
          font-size: 0.75rem;
          border-radius: 6px;
          border: 1px solid #374151;
          background: #1f2937;
          color: #d1d5db;
          cursor: pointer;
          transition: background 0.15s;
        }
        .print-btn:hover { background: #374151; }

        @media print {
          .print-btn { display: none !important; }
        }
      `}</style>
      <div className="cards-print-root">
        <button
          className="print-btn"
          onClick={() => {
            const src = document.querySelector(".cards-print-root");
            const clone = src.cloneNode(true);
            clone.classList.add("cards-print-clone");
            clone.querySelector(".print-btn").remove();
            document.body.appendChild(clone);
            document.body.classList.add("printing-cards");
            const cleanup = () => {
              document.body.classList.remove("printing-cards");
              clone.remove();
              window.removeEventListener("afterprint", cleanup);
            };
            window.addEventListener("afterprint", cleanup);
            requestAnimationFrame(() => {
              requestAnimationFrame(() => window.print());
            });
          }}
        >
          Print Cards
        </button>
        <div className="cards-grid">
          {CARD_DEFS.map((def) => (
            <CardFace key={def.role} def={def} />
          ))}
        </div>
      </div>
    </div>
  );
}
