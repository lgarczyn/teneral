function ConfigPanel({ cfg, onChange }) {
  const totalPlayers =
    (cfg.nAliens || 0) +
    (cfg.nDoctors || 0) +
    (cfg.nDuelists || 0) +
    (cfg.nImmune || 0) +
    (cfg.nEmpaths || 0) +
    (cfg.nPredisposed || 0) +
    (cfg.nHumans || 0);
  const set = (k, v) => {
    v = +v;
    const next = { ...cfg, [k]: v };
    const nextTotal =
      (next.nAliens || 0) +
      (next.nDoctors || 0) +
      (next.nDuelists || 0) +
      (next.nImmune || 0) +
      (next.nEmpaths || 0) +
      (next.nPredisposed || 0) +
      (next.nHumans || 0);
    next.nRooms = Math.max(next.nRooms, Math.ceil(nextTotal / 3));
    onChange(next);
  };
  const minRooms = Math.ceil(totalPlayers / 3);
  const threshSteps = [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
  const threshLabel = { 0.3: "trigger-happy", 0.5: "normal", 0.8: "cautious" };
  const fields = [
    { label: "Humans", k: "nHumans", min: 0, max: 10 },
    { label: `Rooms (min ${minRooms})`, k: "nRooms", min: minRooms, max: 12 },
    { label: "Aliens", k: "nAliens", min: 0, max: 6 },
    { label: "Doctors", k: "nDoctors", min: 0, max: 6 },
    { label: "Duelists", k: "nDuelists", min: 0, max: 4 },
    { label: "Immune", k: "nImmune", min: 0, max: 4 },
    { label: "Empaths", k: "nEmpaths", min: 0, max: 4 },
    { label: "Predisposed", k: "nPredisposed", min: 0, max: 4 },
  ];
  const roleDesc = {
    alien: "alien · infects in 1v1",
    doctor: "doctor · heals in 1v1 · learns infector",
    human: "crew · gossips · calls votes",
    duelist: "duelist · 1 kill when belief >55%",
    immune: "immune · blocks infection silently",
    empath: "empath · forces role reveal · if infected leaks to aliens",
    predisposed: "predisposed · always alien-team · lies once to doctor",
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-gray-400 text-xs w-36 shrink-0">
          Total players
        </span>
        <span className="flex-1" />
        <span className="w-5 text-right text-white font-mono text-sm">
          {totalPlayers}
        </span>
      </div>
      {fields.map(({ label, k, min, max }) => (
        <div key={k} className="flex items-center gap-3">
          <span className="text-gray-400 text-xs w-36 shrink-0">{label}</span>
          <input
            type="range"
            min={min}
            max={max}
            value={cfg[k] ?? min}
            onChange={(e) => set(k, e.target.value)}
            className="flex-1 accent-indigo-500"
          />
          <span className="w-5 text-right text-white font-mono text-sm">
            {cfg[k]}
          </span>
        </div>
      ))}
      <div className="flex items-center gap-3">
        <span className="text-gray-400 text-xs w-36 shrink-0">
          Vote aggressiveness
        </span>
        <input
          type="range"
          min={0}
          max={threshSteps.length - 1}
          value={threshSteps.indexOf(cfg.voteThreshold ?? 0.7)}
          onChange={(e) =>
            onChange({ ...cfg, voteThreshold: threshSteps[+e.target.value] })
          }
          className="flex-1 accent-indigo-500"
        />
        <span className="w-24 text-right text-white font-mono text-xs">
          {threshLabel[cfg.voteThreshold] ?? cfg.voteThreshold}
        </span>
      </div>
      <div className="text-xs text-gray-600 space-y-1 border-t border-gray-800 pt-3">
        {Object.entries(ROLE_DEFS).map(([role, def]) => (
          <p key={role}>
            <span style={{ color: def.ui.color }} className="font-bold">
              {def.ui.letter}
            </span>{" "}
            {roleDesc[role]}
          </p>
        ))}
        <p className="text-gray-700 mt-1">
          3-person rooms: gossip only · alien-team gossip lies
        </p>
      </div>
      <div className="border-t border-gray-800 pt-3 space-y-2">
        <div className="flex gap-2 items-center">
          <span className="text-gray-500 text-xs">Config JSON</span>
          <button
            onClick={() => {
              try {
                onChange({
                  ...DEFAULT_CFG,
                  ...JSON.parse(document.getElementById("cfg-json").value),
                });
              } catch {}
            }}
            className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded"
          >
            Apply
          </button>
        </div>
        <textarea
          id="cfg-json"
          key={JSON.stringify(cfg)}
          defaultValue={JSON.stringify(cfg)}
          className="w-full bg-gray-800 text-gray-300 text-[10px] font-mono rounded p-1.5 border border-gray-700 resize-none"
          rows={3}
          spellCheck={false}
        />
      </div>
    </div>
  );
}
