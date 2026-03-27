function PlayerCard({ p, highlight }) {
  const ui = ROLE_DEFS[p.role]?.ui ?? ROLE_DEFS.human.ui;
  const infected = p.infected && p.role !== "alien" && p.role !== "predisposed";
  return (
    <div
      style={{
        width: 38,
        height: 44,
        opacity: p.alive ? 1 : 0.2,
        position: "relative",
        boxShadow: highlight ? `0 0 0 2px ${ui.color}` : "none",
      }}
      className={`rounded border-2 ${ui.border} select-none overflow-hidden ${infected ? "bg-orange-950" : "bg-gray-900"}`}
      title={`${p.name} · ${p.role}${infected ? " (infected)" : ""}${!p.alive ? " · dead" : ""}`}
    >
      <div style={{ position: "absolute", inset: 2, pointerEvents: "none" }}>
        <Sigil role={p.role} color={p.alive ? ui.color : "#374151"} />
      </div>
      {infected && (
        <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-orange-500 z-10" />
      )}
      {!p.alive && (
        <span className="absolute inset-0 flex items-center justify-center text-gray-700 text-lg font-bold z-10">
          ✕
        </span>
      )}
    </div>
  );
}
