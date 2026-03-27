const TABS = ["rules", "cards", "config", "visualize", "montecarlo"];

function tabFromHash() {
  const h = location.hash.replace("#", "");
  return TABS.includes(h) ? h : "rules";
}

function App() {
  const [tab, setTabRaw] = useState(tabFromHash);
  const [cfg, setCfgRaw] = useState(DEFAULT_CFG);

  const setTab = useCallback((id) => {
    setTabRaw(id);
    history.pushState(null, "", "#" + id);
  }, []);

  useEffect(() => {
    const onPop = () => setTabRaw(tabFromHash());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    try {
      const v = localStorage.getItem("teneral:cfg");
      if (v) setCfgRaw({ ...DEFAULT_CFG, ...JSON.parse(v) });
    } catch {}
  }, []);

  const setCfg = useCallback((next) => {
    setCfgRaw(next);
    try {
      localStorage.setItem("teneral:cfg", JSON.stringify(next));
    } catch {}
  }, []);

  const subtitle =
    `${(cfg.nHumans || 0) + (cfg.nAliens || 0) + (cfg.nDoctors || 0) + (cfg.nDuelists || 0) + (cfg.nImmune || 0) + (cfg.nEmpaths || 0) + (cfg.nPredisposed || 0)}p · ${cfg.nRooms}r · ${cfg.nHumans || 0}H · ${cfg.nAliens}A · ${cfg.nDoctors}D` +
    `${cfg.nDuelists ? ` · ${cfg.nDuelists}U` : ""}${cfg.nImmune ? ` · ${cfg.nImmune}I` : ""}` +
    `${cfg.nEmpaths ? ` · ${cfg.nEmpaths}E` : ""}${cfg.nPredisposed ? ` · ${cfg.nPredisposed}P` : ""}`;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 font-sans max-w-xl mx-auto">
      <div className="mb-4">
        <h1 className="text-base font-bold tracking-tight">
          Teneral Simulator
        </h1>
        <p className="text-gray-600 text-xs font-mono mt-0.5">{subtitle}</p>
      </div>
      <div className="flex gap-1 mb-3 bg-gray-900 p-1 rounded-lg">
        {[
          { id: "rules", label: "Rules" },
          { id: "cards", label: "Cards" },
          { id: "config", label: "Config" },
          { id: "visualize", label: "Visualize" },
          { id: "montecarlo", label: "Monte Carlo" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-1 text-xs rounded transition-colors ${tab === t.id ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="bg-gray-900 rounded-xl p-4">
        {tab === "config" && <ConfigPanel cfg={cfg} onChange={setCfg} />}
        {tab === "visualize" && <VisualizerPanel cfg={cfg} />}
        {tab === "montecarlo" && <MonteCarloPanel cfg={cfg} />}
        {tab === "rules" && <RulesPanel />}
        {tab === "cards" && <CardsPanel />}
      </div>
    </div>
  );
}

// Mount
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(App));
