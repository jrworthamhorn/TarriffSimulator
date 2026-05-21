import { useState } from "react";

// ✅ SIMPLE BUILT-IN HTS DATA (expand later)
const htsData = [
  { code: "8544429090", description: "insulated electric wire" },
  { code: "85011040", description: "electric motors" },
  { code: "72083900", description: "steel products" }
];

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

  // ✅ RESET FORM
  const resetForm = () => {
    setUser("");
    setDescription("");
    setHts("");
    setCountry("");
    setValue("");
    setEntryDate("");
    setMeltCountry("");
    setMetalPercent("");
  };

  // ✅ OPEN HTS WEBSITE
  const openHTS = () => {
    window.open("https://hts.usitc.gov/", "_blank");
  };

  // ✅ HTS SUGGESTION (no more "Unknown")
  const getHTSSuggestion = () => {
    if (!description) {
      alert("Enter description first");
      return;
    }

    const match = htsData.find(item =>
      item.description.toLowerCase().includes(description.toLowerCase())
    );

    if (match) {
      setHts(match.code);
    } else {
      alert("No matching HTS found");
    }
  };

  // ✅ RUN SIMULATION
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

      if (!response.ok) {
        throw new Error(data?.error || "API error");
      }

      const newEntry = {
        input: { user, hts, country, value },
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

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>

      <h1>Tariff Simulator</h1>

      {/* USER */}
      <input
        placeholder="User Name"
        value={user}
        onChange={(e) => setUser(e.target.value)}
      /><br /><br />

      {/* DESCRIPTION */}
      <input
        placeholder="Product Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      {/* HTS BUTTONS */}
      <button onClick={getHTSSuggestion}>
        Suggest HTS
      </button>

      <button onClick={openHTS} style={{ marginLeft: 10 }}>
        Open HTS Website
      </button>

      <br /><br />

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

      {/* MELT */}
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

      {/* ACTION BUTTONS */}
      <button onClick={runCalculation} disabled={loading}>
        {loading ? "Running..." : "Run Simulation"}
      </button>

      <button onClick={resetForm} style={{ marginLeft: 10 }}>
        Reset Form
      </button>

      <hr />

      {/* RESULTS */}
      <h2>Results</h2>

      {results.map((entry, idx) => (

        <div key={idx} style={{
          border: "1px solid #ccc",
          padding: 12,
          marginBottom: 12,
          background: "#f9f9f9"
        }}>

          <div><b>User:</b> {entry.input.user}</div>
          <div><b>HTS:</b> {entry.input.hts}</div>
          <div><b>Country:</b> {entry.input.country}</div>
          <div><b>Value:</b> ${entry.input.value}</div>

          <br />

          <b>Applied Duties:</b>

          {entry.result?.applied?.length > 0 ? (
            entry.result.applied.map((r, i) => (
              <div key={i}>
                {r.code} ({(r.rate * 100).toFixed(2)}%) → ${r.amount.toFixed(2)}
              </div>
            ))
          ) : (
            <div>No duties applied</div>
          )}

          <div style={{ marginTop: 6 }}>
            <b>Total Duty:</b> ${entry.result?.total?.toFixed(2)}
          </div>

          <div style={{ fontSize: 12, marginTop: 5, color: "#555" }}>
            {entry.timestamp}
          </div>

        </div>
      ))}

    </div>
  );
}
