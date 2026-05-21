export default function handler(req, res) {
  try {
    // ✅ Safe body parsing for Vercel
    const input =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body || {};

    // ✅ Helpers
    const normalizeHTS = (val) => String(val || "").replace(/\D/g, "");
    const normalizeCountry = (val) =>
      String(val || "").toLowerCase().trim();

    const cleanHTS = normalizeHTS(input.hts);
    const country = normalizeCountry(input.country);
    const meltCountry = normalizeCountry(input.meltCountry);
    const metalPercent = Number(input.metalPercent || 0);
    const value = Number(input.value || 0);

    // ✅ HTS → 9903 mapping dataset (expandable)
    const htsMapping = [
      { hts: "8544429090", code: "9903.85.68", rate: 0.25 },
      { hts: "8544422000", code: "9903.82.09", rate: 0.25 },
      { hts: "7318152065", code: "9903.82.02", rate: 0.25 }
    ];

    let rules = [];

    // ✅ STEP 1: FIND BEST MATCH (exact → 8-digit → 6-digit)
    let match =
      htsMapping.find(m => normalizeHTS(m.hts) === cleanHTS) ||
      htsMapping.find(m => normalizeHTS(m.hts).substring(0, 8) === cleanHTS.substring(0, 8)) ||
      htsMapping.find(m => normalizeHTS(m.hts).substring(0, 6) === cleanHTS.substring(0, 6));

    if (match) {
      rules.push({
        type: "232",
        code: match.code,
        rate: match.rate,
        source: "HTS Mapping"
      });
    }

    // ✅ STEP 2: SECTION 301 (China)
    if (country === "china") {
      rules.push({
        type: "301",
        code: "9903.88.03",
        rate: 0.25,
        source: "Section 301"
      });
    }

    // ✅ STEP 3: MELT / POUR LOGIC (high priority override)
    if (meltCountry === "russia") {
      rules = [{
        type: "232",
        code: "9903.85.67",
        rate: 2.0,
        source: "Russia Melt Override"
      }];
    } else {
      // ✅ Low metal adjustments
      rules = rules.map(rule => {
        if (rule.type !== "232") return rule;

        if (metalPercent === 0) {
          return {
            ...rule,
            code: "9903.82.01",
            rate: 0,
            source: "No Metal Content"
          };
        }

        if (metalPercent > 0 && metalPercent < 15) {
          return {
            ...rule,
            code: "9903.82.03",
            rate: 0,
            source: "Low Metal Content"
          };
        }

        return rule;
      });
    }

    // ✅ STEP 4: CALCULATE DUTIES
    let total = 0;

    const applied = rules.map(rule => {
      const amount = value * rule.rate;
      total += amount;

      return {
        code: rule.code,
        rate: rule.rate,
        amount: Number(amount.toFixed(2)),
        source: rule.source
      };
    });

    // ✅ STEP 5: RETURN RESULT
    return res.status(200).json({
      applied,
      total: Number(total.toFixed(2))
    });

  } catch (error) {
    console.error("CALCULATION ERROR:", error);

    return res.status(500).json({
      error: "Calculation failed",
      message: error.message
    });
  }
}
