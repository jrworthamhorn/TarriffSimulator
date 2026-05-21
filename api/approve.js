import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default function handler(req, res) {
  res.json({
    success: true,
    message: "Approval simulated (no database)"
  });
}
