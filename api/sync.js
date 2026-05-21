import * as XLSX from "xlsx";
import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default function handler(req, res) {
  res.json({
    message: "Sync disabled - using built-in data"
  });
}
