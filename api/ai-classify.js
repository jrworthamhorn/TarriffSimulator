export default function handler(req, res) {
  const { description } = req.body;

  let suggestion = "Unknown";

  const text = description.toLowerCase();

  if (text.includes("wire")) {
    suggestion = "8544429090";
  }
  if (text.includes("motor")) {
    suggestion = "85011040";
  }

  res.json({ suggestion });
}

