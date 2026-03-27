var EVT_COLOR = {
  infect: "#fb923c",
  infect_immune: "#22d3ee",
  heal: "#60a5fa",
  false_heal: "#f97316",
  kill: "#f87171",
  group_kill: "#f87171",
  empath_scan: "#a78bfa",
  vote: "#facc15",
};

function fmtPlayer(players, id, infected) {
  const p = players[id];
  if (!p) return `?${id}`;
  return p.name + (infected ? "[inf]" : "");
}

function fmtEvent(e, players) {
  const p = (id, inf) => fmtPlayer(players, id, inf);
  switch (e.type) {
    case "infect":
      return `  ${p(e.from, false)} infected ${p(e.to, false)}`;
    case "infect_immune":
      return `  ${p(e.from, false)} tried ${p(e.to, false)} (immune)`;
    case "heal":
      return `  ${p(e.from, false)} healed ${p(e.to, false)}`;
    case "false_heal":
      return `  ${p(e.to, true)} lied to ${p(e.from, false)}${e.framed != null ? ` → framed ${p(e.framed, false)}` : ""}`;
    case "empath_scan":
      return `  ${p(e.from, e.fromInfected)} scanned ${p(e.to, e.toInfected)} → ${e.revealed}`;
    case "kill":
      return `  ${p(e.from, e.fromInfected)} killed ${p(e.to, e.toInfected)}`;
    case "group_kill":
      return `  ${p(e.killers[0], e.killersInfected?.[0])}+${p(e.killers[1], e.killersInfected?.[1])} → killed ${p(e.victim, e.victimInfected)}`;
    case "vote":
      return e.elimId != null
        ? `  vote: ${p(e.elimId, e.elimInfected)} out (${e.elimRole})`
        : "  vote: tie";
    default:
      return null;
  }
}

function EventLog({ log, lastEvent, players }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [log, lastEvent]);
  const lastStr = lastEvent ? JSON.stringify(lastEvent) : null;
  return (
    <div
      ref={ref}
      className="h-32 overflow-y-auto text-xs font-mono bg-black/40 rounded p-2"
    >
      {log.map((entry, i) => (
        <div key={i}>
          <div style={{ borderTop: "1px solid #1f2937", margin: "2px 0" }} />
          {entry.events.map((e, j) => {
            const msg = fmtEvent(e, players);
            if (!msg) return null;
            const isLast = lastStr && JSON.stringify(e) === lastStr;
            return (
              <div
                key={j}
                style={{
                  color: EVT_COLOR[e.type] || "#9ca3af",
                  fontWeight: isLast ? "bold" : "normal",
                  background: isLast ? "rgba(255,255,255,0.05)" : "none",
                }}
              >
                {msg}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
