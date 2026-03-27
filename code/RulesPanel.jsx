function RulesPanel() {
  const [html, setHtml] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("README.md")
      .then((r) => {
        if (!r.ok) throw new Error(r.statusText);
        return r.text();
      })
      .then((md) => setHtml(marked.parse(md)))
      .catch((e) => setError(e.message));
  }, []);

  if (error)
    return (
      <p className="text-red-400 text-xs">Failed to load rules: {error}</p>
    );
  if (!html) return <p className="text-gray-500 text-xs">Loading rules…</p>;

  return (
    <div className="rules-prose" dangerouslySetInnerHTML={{ __html: html }} />
  );
}
