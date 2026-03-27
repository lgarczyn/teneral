function VisualizerPanel({ cfg }) {
  const [history, setHistory] = useState(() => [createGame(cfg)]);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(150);
  const game = history[history.length - 1];

  useEffect(() => {
    setHistory([createGame(cfg)]);
    setPlaying(false);
  }, [cfg]);
  useEffect(() => {
    if (!playing || game.winner) return;
    const t = setTimeout(
      () => setHistory((h) => [...h, stepGameEvent(h[h.length - 1])]),
      speed,
    );
    return () => clearTimeout(t);
  }, [playing, game.winner, game.tick, game.pendingEvents?.length, speed]);

  const stepFwd = () => {
    setPlaying(false);
    if (!game.winner) setHistory((h) => [...h, stepGameEvent(h[h.length - 1])]);
  };
  const stepBck = () => {
    setPlaying(false);
    setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h));
  };
  const reset = () => {
    setHistory([createGame(cfg)]);
    setPlaying(false);
  };

  const alive = game.players.filter((p) => p.alive);
  const alienTeam = alive.filter(isAlienTeam).length;
  const humanTeam = alive.filter((p) => !isAlienTeam(p)).length;

  const hl = new Set();
  if (game.lastEvent) {
    const e = game.lastEvent;
    [e.from, e.to, e.victim, e.elimId]
      .filter((x) => x != null)
      .forEach((id) => hl.add(id));
    (e.killers || []).forEach((id) => hl.add(id));
  }

  const statusOf = (p) =>
    p.alive
      ? isAlienTeam(p)
        ? "alive_infected"
        : "alive_healthy"
      : isAlienTeam(p)
        ? "dead_infected"
        : "dead_healthy";
  const ORDER = [
    "alive_healthy",
    "alive_infected",
    "dead_healthy",
    "dead_infected",
  ];
  const sorted = ORDER.flatMap((s) =>
    game.players.filter((p) => statusOf(p) === s),
  );
  const GBG = {
    alive_healthy: "#0d1f0d",
    alive_infected: "#1f0a00",
    dead_healthy: "#141414",
    dead_infected: "#1a0f00",
  };
  const GFG = {
    alive_healthy: "#4ade80",
    alive_infected: "#fb923c",
    dead_healthy: "#6b7280",
    dead_infected: "#b45309",
  };
  const GLBL = {
    alive_healthy: "alive · human",
    alive_infected: "alive · alien",
    dead_healthy: "dead · was human",
    dead_infected: "dead · was alien",
  };
  const SEP = "#374151";
  const CW = 34,
    CH = 30;

  const byRoom = new Map(game.rooms.map((r) => [r.id, []]));
  for (const p of game.players)
    if (p.alive && p.roomId != null && byRoom.has(p.roomId))
      byRoom.get(p.roomId).push(p);
  const activeRoom = game.lastEvent?.roomId ?? null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-xs font-mono flex-wrap">
        <span className="text-gray-500">tick {game.tick}</span>
        {game.pendingEvents?.length > 0 && (
          <span className="text-gray-600">+{game.pendingEvents.length}</span>
        )}
        <span className="text-red-400">aliens {alienTeam}</span>
        <span className="text-blue-400">humans {humanTeam}</span>
        {game.winner && (
          <span
            className={`font-bold ${game.winner === "aliens" ? "text-red-300" : game.winner === "tie" ? "text-yellow-300" : "text-green-300"}`}
          >
            {game.winner === "tie" ? "→ tie" : `→ ${game.winner} win`}
          </span>
        )}
        <div className="ml-auto">
          <select
            value={speed}
            onChange={(e) => setSpeed(+e.target.value)}
            className="bg-gray-800 text-white rounded px-1 py-0.5 text-xs"
          >
            <option value={1200}>1x</option>
            <option value={500}>2x</option>
            <option value={150}>8x</option>
            <option value={30}>30x</option>
          </select>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {game.rooms.map((room) => {
          const ps = byRoom.get(room.id) ?? [];
          const is1v1 = ps.length === 2;
          const isActive = room.id === activeRoom;
          const evtColor = EVT_COLOR[game.lastEvent?.type] || "#6366f1";
          return (
            <div
              key={room.id}
              style={{
                width: 3 * 38 + 2 * 2 + 2 * 6,
                padding: 6,
                flexShrink: 0,
                boxSizing: "border-box",
                boxShadow: isActive ? `0 0 0 1px ${evtColor}` : "none",
              }}
              className={`bg-gray-950 rounded border ${isActive ? "border-transparent" : is1v1 ? "border-indigo-900" : "border-gray-800"}`}
            >
              <div className="text-[8px] tracking-wide uppercase font-mono flex items-center gap-1 mb-1">
                <span className="text-gray-600">{room.name}</span>
                {is1v1 && <span className="text-indigo-700">1v1</span>}
              </div>
              <div style={{ display: "flex", gap: 2, minHeight: 44 }}>
                {ps.map((p) => (
                  <PlayerCard key={p.id} p={p} highlight={hl.has(p.id)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          overflowX: "auto",
          border: `1px solid ${SEP}`,
          borderRadius: 6,
        }}
      >
        <table
          style={{
            borderCollapse: "collapse",
            tableLayout: "fixed",
            fontSize: 9,
            fontFamily: "monospace",
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor: "#111827",
                position: "sticky",
                top: 0,
                zIndex: 10,
              }}
            >
              <th
                style={{
                  width: 60,
                  textAlign: "right",
                  paddingRight: 6,
                  color: "#374151",
                  fontWeight: "normal",
                  fontSize: 8,
                  position: "sticky",
                  left: 0,
                  backgroundColor: "#111827",
                  zIndex: 11,
                }}
              >
                down / right
              </th>
              {sorted.map((p, ci) => {
                const prev = ci > 0 ? statusOf(sorted[ci - 1]) : null;
                const ui = ROLE_DEFS[p.role]?.ui ?? ROLE_DEFS.human.ui;
                return (
                  <th
                    key={p.id}
                    style={{
                      width: CW,
                      fontWeight: "normal",
                      textAlign: "center",
                      borderLeft:
                        prev && prev !== statusOf(p)
                          ? `2px solid ${SEP}`
                          : "none",
                      paddingBottom: 2,
                      boxShadow: hl.has(p.id)
                        ? `inset 0 -2px 0 ${ui.color}`
                        : "none",
                    }}
                  >
                    <div
                      style={{
                        color: ui.color,
                        opacity: p.alive ? 1 : 0.4,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {ui.letter}
                      {p.name.match(/_(\d+)$/)?.[1] ?? ""}
                    </div>
                    <div
                      style={{
                        color: GFG[statusOf(p)],
                        fontSize: 7,
                        opacity: p.alive ? 1 : 0.6,
                      }}
                    >
                      {!p.alive ? "x" : isAlienTeam(p) ? "inf" : "ok"}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, ri) => {
              const prevRow = ri > 0 ? statusOf(sorted[ri - 1]) : null;
              const groupStart = prevRow !== statusOf(row);
              const rowUi = ROLE_DEFS[row.role]?.ui ?? ROLE_DEFS.human.ui;
              return (
                <React.Fragment key={row.id}>
                  {groupStart && (
                    <tr style={{ backgroundColor: "#111827" }}>
                      <td
                        colSpan={sorted.length + 1}
                        style={{
                          padding: "2px 6px",
                          fontSize: 8,
                          color: GFG[statusOf(row)],
                          borderTop: ri > 0 ? `2px solid ${SEP}` : "none",
                          fontFamily: "monospace",
                        }}
                      >
                        {GLBL[statusOf(row)]}
                      </td>
                    </tr>
                  )}
                  <tr
                    style={{
                      backgroundColor: GBG[statusOf(row)],
                      boxShadow: hl.has(row.id)
                        ? `inset 3px 0 0 ${rowUi.color}`
                        : "none",
                    }}
                  >
                    <td
                      style={{
                        textAlign: "right",
                        paddingRight: 6,
                        whiteSpace: "nowrap",
                        color: rowUi.color,
                        opacity: row.alive ? 1 : 0.5,
                        position: "sticky",
                        left: 0,
                        zIndex: 5,
                        backgroundColor: GBG[statusOf(row)],
                        fontSize: 9,
                      }}
                    >
                      {rowUi.letter}
                      {row.name.match(/_(\d+)$/)?.[1] ?? ""}
                      <span
                        style={{
                          color: GFG[statusOf(row)],
                          marginLeft: 2,
                          fontSize: 7,
                        }}
                      >
                        {!row.alive ? "x" : isAlienTeam(row) ? "inf" : "ok"}
                      </span>
                    </td>
                    {sorted.map((col, ci) => {
                      const prevCol = ci > 0 ? statusOf(sorted[ci - 1]) : null;
                      const bl =
                        prevCol && prevCol !== statusOf(col)
                          ? `2px solid ${SEP}`
                          : "none";
                      if (col.id === row.id)
                        return (
                          <td
                            key={col.id}
                            style={{
                              width: CW,
                              height: CH,
                              borderLeft: bl,
                              textAlign: "center",
                              color: "#374151",
                              verticalAlign: "middle",
                            }}
                          >
                            -
                          </td>
                        );
                      const fb = row.factionBelief[col.id] ?? null;
                      const rb = row.roleBelief[col.id] ?? null;
                      const rc = row.roleConfidence[col.id] ?? 0;
                      const pct = fb !== null ? Math.round(fb * 100) : null;
                      const bg =
                        fb === null
                          ? "transparent"
                          : fb > 0.7
                            ? "#4c1010"
                            : fb > 0.4
                              ? "#4a2200"
                              : fb > 0.1
                                ? "#222"
                                : "transparent";
                      const fg =
                        fb === null
                          ? "#6b7280"
                          : fb > 0.7
                            ? "#fca5a5"
                            : fb > 0.4
                              ? "#fde68a"
                              : fb > 0.1
                                ? "#e5e7eb"
                                : "#9ca3af";
                      return (
                        <td
                          key={col.id}
                          style={{
                            width: CW,
                            height: CH,
                            borderLeft: bl,
                            backgroundColor: bg,
                            textAlign: "center",
                            verticalAlign: "middle",
                            padding: "0 1px",
                          }}
                        >
                          <div
                            style={{ color: fg, lineHeight: 1.2, fontSize: 9 }}
                          >
                            {pct !== null ? `${pct}%` : "."}
                            {rc >= 1 && (
                              <span
                                style={{
                                  color: rb === "alien" ? "#f87171" : "#4ade80",
                                }}
                              >
                                {" "}
                                v
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              fontSize: 7,
                              lineHeight: 1.1,
                              color: rc >= 1 ? "#c4b5fd" : "#9ca3af",
                              overflow: "hidden",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {rb ?? "\u00a0"}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2">
        {[
          { label: "Reset", fn: reset, cls: "bg-gray-700 hover:bg-gray-600" },
          {
            label: "<",
            fn: stepBck,
            cls: "bg-gray-700 hover:bg-gray-600",
            disabled: history.length <= 1,
          },
          {
            label: ">",
            fn: stepFwd,
            cls: "bg-gray-700 hover:bg-gray-600",
            disabled: !!game.winner,
          },
          {
            label: playing ? "Pause" : "Play",
            fn: () => setPlaying((x) => !x),
            cls: playing
              ? "bg-amber-800 hover:bg-amber-700"
              : "bg-green-800 hover:bg-green-700",
            disabled: !!game.winner,
          },
        ].map(({ label, fn, cls, disabled }) => (
          <button
            key={label}
            onClick={fn}
            disabled={disabled}
            className={`px-3 py-1 text-xs text-white rounded ${cls} disabled:opacity-30`}
          >
            {label}
          </button>
        ))}
      </div>

      <EventLog
        log={game.log}
        lastEvent={game.lastEvent}
        players={game.players}
      />
    </div>
  );
}
