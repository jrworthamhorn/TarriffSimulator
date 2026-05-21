import * as XLSX from "xlsx";
import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  try {
    const response = await fetch(process.env.SHAREPOINT_URL, {
      headers: {
        Authorization: `Bearer ${process.env.GRAPH_TOKEN}`
      }
    });

    const buffer = await response.arrayBuffer();

    const workbook = XLSX.read(buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet);

    const parsed = json.map(r => ({
      hts: String(r["US HTS"]).replace(/\D/g, ""),
      result: r["Chapter 99 Result"]
    }));

    await supabase.from("hts_mapping").delete().neq("hts", "");
    await supabase.from("hts_mapping").insert(parsed);

    res.json({ status: "Synced" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Sync failed" });
  }
}
