import { useState } from "react";

export default function App() {

  const [user, setUser] = useState("");
  const [description, setDescription] = useState("");

  const [hts, setHts] = useState("");
  const [country, setCountry] = useState("");

  const [value, setValue] = useState("");
  const [entryDate, setEntryDate] = useState("");

  const [meltCountry, setMeltCountry] = useState("");
  const [metalPercent, setMetalPercent] = useState("");

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ Run main tariff engine
  const runCalculation = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user,
          description,
          hts,
          country,
          value: Number(value || 0),
          entryDate,
          meltCountry,
          metalPercent: Number(metalPercent || 0)
        })
      });

      const data = await response.json();

      const newEntry = {
        input: { user, hts, country, value, entryDate },
        result: data,
        timestamp: new Date().toLocaleString()
      };

      setResults(prev => [newEntry, ...prev]);
    } catch (err) {
      alert("Error running simulation");
      console.error(err);
    }

    setLoading(false);
  };

  // ✅ AI HTS suggestion
  const getHTSSuggestion = async () => {
    if (!description) return alert("Enter description first");

    const response = await fetch("/api/ai-classify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ description })
    });

    const data = await response.json();

    if (data?.suggestion) {
      setHts(data.suggestion);
    }
  };

  // ✅ Scenario comparison
  const runScenario = async () => {

    const scenarios = [
      { hts, country: "china", value, entryDate },
      { hts, country: "vietnam", value, entryDate }
    ];

    const response = await fetch("/api/scenario", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ scenarios })
    });

    const data = await response.json();

    alert("Scenario comparison complete — check console");
    console.log(data);
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>

      <h1>Tariff Simulator</h1>

      {/* USER */}
      <input
        placeholder="User Name"
        value={user}
        onChange={(e) => setUser(e.target.value)}
      /><br /><br />

      {/* DESCRIPTION + AI */}
      <input
        placeholder="Product Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <button onClick={getHTSSuggestion}>
        Suggest HTS
      </button><br /><br />

      {/* HTS */}
      <input
        placeholder="HTS Code"
        value={hts}
        onChange={(e) => setHts(e.target.value)}
      /><br /><br />

      {/* COUNTRY */}
      <input
        placeholder="Country"
        value={country}
        onChange={(e) => setCountry(e.target.value)}
      /><br /><br />

      {/* VALUE */}
      <input
        placeholder="Declared Value ($)"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      /><br /><br />

      {/* DATE */}
      <input
        type="date"
        value={entryDate}
        onChange={(e) => setEntryDate(e.target.value)}
      /><br /><br />

      {/* MELT COUNTRY */}
      <input
        placeholder="Melt / Pour Country"
        value={meltCountry}
        onChange={(e) => setMeltCountry(e.target.value)}
      /><br /><br />

      {/* METAL % */}
      <input
        placeholder="% Metal Content"
        value={metalPercent}
        onChange={(e) => setMetalPercent(e.target.value)}
      /><br /><br />

      {/* ACTIONS */}
      <button onClick={runCalculation} disabled={loading}>
        {loading ? "Running..." : "Run Simulation"}
      </button>

      <button onClick={runScenario}>
        Run Scenario (China vs Vietnam)
      </button>

      <hr />

      {/* RESULTS */}
      <h2>Results</h2>

      {results.map((entry, idx) => (

        <div key={idx} style={{
          border: "1px solid #ccc",
          padding: 10,
          marginBottom: 10
        }}>

          <div><b>User:</b> {entry.input.user}</div>
          <div><b>HTS:</b> {entry.input.hts}</div>
          <div><b>Country:</b> {entry.input.country}</div>
          <div><b>Value:</b> ${entry.input.value}</div>

          <br />

          <b>Applied Duties:</b>

          {entry.result?.applied?.map((r, i) => (
            <div key={i}>
              {r.code} ({(r.rate * 100).toFixed(2)}%) → ${r.amount.toFixed(2)}
            </div>
          ))}

          <div style={{ marginTop: 5 }}>
            <b>Total Duty:</b> ${entry.result?.total?.toFixed(2)}
          </div>

          <div style={{ fontSize: 12, marginTop: 5 }}>
            {entry.timestamp}
          </div>

        </div>
      ))}

    </div>
  );
}
``
