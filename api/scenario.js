export default async function handler(req, res) {
  try {
    const { scenarios } = req.body;

    const results = [];

    for (let s of scenarios) {
      const r = await fetch(process.env.BASE_URL + "/api/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(s)
      });

      const data = await r.json();
      results.push(data);
    }

    res.json(results);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Scenario failed" });
  }
}
