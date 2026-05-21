import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  try {
    const { id, user } = req.body;

    await supabase
      .from("audit_log")
      .update({
        status: "approved",
        approved_by: user
      })
      .eq("id", id);

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Approval failed" });
  }
}
