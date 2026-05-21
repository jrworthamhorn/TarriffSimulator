// ✅ Shared logic (same as calculate.js)
const runCalculation = (input) => {
  const normalizeHTS = (v) => String(v || "").replace(/\D/g, "");
  const normalizeCountry = (v) => String(v || "").toLowerCase().trim();

  const cleanHTS = normalizeHTS(input.hts);
  const country = normalizeCountry(input.country);

  const htsMapping = [
    { hts: "8544429090", code: "9903.85.68", rate: 0.25 }
  ];

  let rules = [];

  const match = htsMapping.find(m => normalizeHTS(m.hts) === cleanHTS);

  if (match) {
    rules.push({
      type: "232",
      code: match.code,
      rate: match.rate
    });
  }

  if (country === "china") {
    rules.push({
      type: "301",
      code: "9903.88.03",
      rate: 0.25
    });
  }

  if (normalizeCountry(input.meltCountry) === "russia") {
    rules = [{
      type: "232",
      code: "9903.85.67",
      rate: 2.0
    }];
  }

  let total = 0;

  const applied = rules.map(r => {
    const amount = input.value * r.rate;
    total += amount;

    return {
      code: r.code,
      rate: r.rate,
      amount
    };
  });

  return { applied, total };
};

// ✅ Scenario handler
export default function handler(req, res) {
  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body;

    const { scenarios } = body;

    const results = scenarios.map(s => runCalculation({
      ...s,
      value: Number(s.value || 0)
    }));

    res.status(200).json(results);

  } catch (err) {
    console.error("SCENARIO ERROR:", err);

    res.status(500).json({
      error: "Scenario failed",
      message: err.message
    });
  }
}
