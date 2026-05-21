export default function handler(req, res) {
  try {
    // ✅ SAFE BODY PARSE (fixes Vercel issues)
    const input =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body || {};

    // ✅ Normalize helpers
    const normalizeHTS = (v) => String(v || "").replace(/\D/g, "");
    const normalizeCountry = (v) =>
      String(v || "").toLowerCase().trim();

    const cleanHTS = normalizeHTS(input.hts);
    const country = normalizeCountry(input.country);

    // ✅ BASIC DATA (can expand later)
    const htsMapping = [
      { hts: "8544429090", code: "9903.85.68", rate: 0.25 },
      { hts: "8544422000", code: "9903.82.09", rate: 0.25 },
      { hts: "7318152065", code: "9903.82.02", rate: 0.25 }
    ];

    let rules = [];

    // ✅ 232 MAPPING (exact → fallback)
    let match =
      htsMapping.find(m => normalizeHTS(m.hts) === cleanHTS) ||
      htsMapping.find(m => normalizeHTS(m.hts).substring(0, 8) === cleanHTS.substring(0, 8)) ||
      htsMapping.find(m => normalizeHTS(m.hts).substring(0, 6) === cleanHTS.substring(0, 6));

    if (match) {
      rules.push({
        type: "232",
        code: match.code,
        rate: match.rate
      });
    }

    // ✅ SECTION 301
    if (country === "china") {
      rules.push({
        type: "301",
        code: "9903.88.03",
        rate: 0.25
      });
    }

    // ✅ MELT / POUR LOGIC
    if (normalizeCountry(input.meltCountry) === "russia") {
      // override everything (extreme case)
      rules = [{
        type: "232",
        code: "9903.85.67",
        rate: 2.0
      }];
    } else {
      // adjust for low metal / none
      rules = rules.map(r => {
        if (r.type !== "232") return r;

        if (Number(input.metalPercent) === 0) {
          return { ...r, code: "9903.82.01", rate: 0 };
        }

        if (Number(input.metalPercent) < 15) {
          return { ...r, code: "9903.82.03", rate: 0 };
        }

        return r;
      });
    }

    // ✅ VALUE SAFETY
    const value = Number(input.value || 0);

    // ✅ DUTY CALCULATION
    let total = 0;

    const applied = rules.map(rule => {
      const amount = value * rule.rate;
      total += amount;

      return {
        code: rule.code,
        rate: rule.rate,
        amount: Number(amount.toFixed(2))
      };
    });

    // ✅ FINAL RESPONSE
    return res.status(200).json({
      applied,
      total: Number(total.toFixed(2))
    });

  } catch (error) {
    // ✅ SAFE ERROR HANDLING (prevents crash)
    console.error("CALCULATION ERROR:", error);

    return res.status(500).json({
      error: "Calculation failed",
      message: error.message
    });
  }
}
