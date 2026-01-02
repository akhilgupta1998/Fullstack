import { useState } from "react";

function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!query) return;

    setLoading(true);
    setResults([]);
    setSource("");

    try {
      const res = await fetch(
        `http://localhost:5000/search?q=${query}`
      );
      const data = await res.json();

      setResults(data.data || []);
      setSource(data.source);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40, fontFamily: "Arial" }}>
      <h1>🔍 Dummy Search App</h1>

      <div style={{ marginBottom: 20 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search items (try: iphone)"
          style={{ padding: 10, width: 300 }}
        />
        <button
          onClick={search}
          style={{ marginLeft: 10, padding: "10px 16px" }}
        >
          Search
        </button>
      </div>

      {loading && <p>Loading...</p>}

      {source && (
        <p>
          Data source: <strong>{source}</strong>
        </p>
      )}

      <ul>
        {results.map((item, index) => (
          <li key={index}>
            {item.name} {item.category ? `(${item.category})` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
