import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const normalize = (v) => String(v || "").replace(/\D/g, "");

// ✅ HARD-CODED SAMPLE DATA (replace later with full dataset)
const htsMapping = [
  { hts: "8544429090", result: "9903.85.68" },
  { hts: "8544422000", result: "9903.82.09" }
];

const dutyRules = [
  { code: "9903.85.68", rate: 0.25 },
  { code: "9903.82.09", rate: 0.25 }
];

export default function handler(req, res) {
  try {
    const input = req.body;

    const cleanHTS = normalize(input.hts);

    let rules = [];

    // ✅ Mapping logic
    let match =
      htsMapping.find(r => normalize(r.hts) === cleanHTS) ||
      htsMapping.find(r => normalize(r.hts).substring(0, 8) === cleanHTS.substring(0, 8)) ||
      htsMapping.find(r => normalize(r.hts).substring(0, 6) === cleanHTS.substring(0, 6));

    if (match) {
      const duty = dutyRules.find(d => d.code === match.result);

      rules.push({
        type: "232",
        code: match.result,
        rate: Number(duty?.rate || 0)
      });
    }

    // ✅ Section 301
    if (input.country?.toLowerCase() === "china") {
      rules.push({
        type: "301",
        code: "9903.88.03",
        rate: 0.25
      });
    }

    // ✅ Melt/Pou logic
    rules = rules.map(r => {
      if (r.type !== "232") return r;

      if (input.meltCountry === "russia") {
        return { ...r, code: "9903.85.67", rate: 2.0 };
      }

      if (input.metalPercent === 0) {
        return { ...r, code: "9903.82.01", rate: 0 };
      }

      return r;
    });

    // ✅ Calculate
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

    res.json({ applied, total });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
}
