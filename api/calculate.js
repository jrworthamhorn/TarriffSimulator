import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const normalize = (v) => String(v || "").replace(/\D/g, "");

export default async function handler(req, res) {
  try {
    const input = req.body;

    const cleanHTS = normalize(input.hts);

    // ✅ Load DB data
    const { data: mapping } = await supabase.from("hts_mapping").select("*");
    const { data: dutyRules } = await supabase.from("duty_rules").select("*");

    let rules = [];

    // ✅ 232 Mapping (exact → 8 → 6)
    let match =
      mapping.find(r => normalize(r.hts) === cleanHTS) ||
      mapping.find(r => normalize(r.hts).substring(0, 8) === cleanHTS.substring(0, 8)) ||
      mapping.find(r => normalize(r.hts).substring(0, 6) === cleanHTS.substring(0, 6));

    if (match) {
      const d = dutyRules.find(x => x.code === match.result);
      rules.push({
        type: "232",
        code: match.result,
        rate: Number(d?.rate || 0),
        startDate: d?.start_date,
        endDate: d?.end_date
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

    // ✅ Section 122
    rules.push({
      type: "122",
      code: "9903.03.01",
      rate: 0.10,
      startDate: "2026-02-24",
      endDate: "2026-07-23"
    });

    // ✅ Melt / Pour adjustments
    rules = rules.map(r => {
      if (r.type !== "232") return r;

      if (input.meltCountry === "russia") {
        return { ...r, code: "9903.85.67", rate: 2.0 };
      }

      if (input.metalPercent === 0) {
        return { ...r, code: "9903.82.01", rate: 0 };
      }

      if (input.metalPercent < 15) {
        return { ...r, code: "9903.82.03", rate: 0 };
      }

      return r;
    });

    // ✅ Date filtering
    rules = rules.filter(r => {
      if (!r.startDate) return true;
      const entry = new Date(input.entryDate);
      return entry >= new Date(r.startDate) &&
             entry <= new Date(r.endDate);
    });

    // ✅ Stacking (232 blocks 122)
    const has232 = rules.some(r => r.type === "232");
    if (has232) {
      rules = rules.filter(r => r.type !== "122");
    }

    // ✅ Duty calculation
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

    const result = { applied, total };

    // ✅ Audit logging
    await supabase.from("audit_log").insert({
      user_name: input.user,
      hts: input.hts,
      country: input.country,
      value: input.value,
      entry_date: input.entryDate,
      result
    });

    res.status(200).json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Calculation failed" });
  }
}
