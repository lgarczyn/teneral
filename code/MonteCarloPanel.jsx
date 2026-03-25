function MonteCarloPanel({ cfg }) {
  const [n, setN] = useState(2000);
  const [results, setResults] = useState(null);
  const [running, setRunning] = useState(false);
  const run = useCallback(() => {
    setRunning(true);
    setResults(null);
    setTimeout(() => {
      setResults(runMonteCarlo(cfg, n));
      setRunning(false);
    }, 20);
  }, [cfg, n]);
  const pct = (v) =>
    results ? ((v / results.total) * 100).toFixed(1) + "%" : "—";
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-gray-400 text-sm">Runs</span>
        <select
          value={n}
          onChange={(e) => setN(+e.target.value)}
          className="bg-gray-800 text-white text-sm rounded px-2 py-1"
        >
          {[100, 500, 1000, 2000, 5000].map((v) => (
            <option key={v} value={v}>
              {v.toLocaleString()}
            </option>
          ))}
        </select>
        <button
          onClick={run}
          disabled={running}
          className="px-4 py-1 bg-indigo-700 hover:bg-indigo-600 disabled:opacity-40 rounded text-white text-sm"
        >
          {running ? "Running..." : "Run"}
        </button>
      </div>
      {results && (
        <>
          <div className="grid grid-cols-2 gap-2 text-center">
            {[
              { label: "Human wins", v: results.humanWins, color: "#3b82f6" },
              { label: "Alien wins", v: results.alienWins, color: "#ef4444" },
              { label: "Ties", v: results.ties, color: "#facc15" },
              { label: "Timeout", v: results.timeouts, color: "#6b7280" },
            ].map(({ label, v, color }) => (
              <div key={label} className="bg-gray-800 rounded-lg p-3">
                <div className="text-xl font-bold" style={{ color }}>
                  {pct(v)}
                </div>
                <div className="text-gray-400 text-xs">{label}</div>
                <div className="text-gray-600 text-[10px]">
                  {v}/{results.total}
                </div>
              </div>
            ))}
          </div>
          <p className="text-gray-400 text-sm">
            Avg:{" "}
            <span className="text-white font-mono">
              {results.avgTicks.toFixed(1)}
            </span>{" "}
            ticks
          </p>
          <ResponsiveContainer width="100%" height={80}>
            <BarChart
              data={[
                { name: "Humans", w: results.humanWins },
                { name: "Aliens", w: results.alienWins },
                { name: "Ties", w: results.ties },
                { name: "T/O", w: results.timeouts },
              ].filter((d) => d.w > 0)}
              margin={{ top: 0, right: 0, bottom: 0, left: -20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "none",
                  color: "#fff",
                }}
              />
              <Bar dataKey="w" fill="#6366f1" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <ResponsiveContainer width="100%" height={80}>
            <BarChart
              data={results.distArr}
              margin={{ top: 0, right: 0, bottom: 0, left: -20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="tick" tick={{ fill: "#9ca3af", fontSize: 10 }} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "none",
                  color: "#fff",
                }}
              />
              <Bar dataKey="count" fill="#10b981" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}
