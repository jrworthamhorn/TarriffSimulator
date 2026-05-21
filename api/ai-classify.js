export default async function handler(req, res) {
  try {
    const { description } = req.body;

    let suggestion = "Unknown";

    const text = description.toLowerCase();

    if (text.includes("wire")) {
      suggestion = "8544429090";
    } else if (text.includes("motor")) {
      suggestion = "8501.10.40";
    } else if (text.includes("steel")) {
      suggestion = "7208.39.00";
    }

    res.json({ suggestion });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI classification failed" });
  }
}
``
