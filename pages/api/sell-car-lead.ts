// Telegram lead notification endpoint
import type { NextApiRequest, NextApiResponse } from "next";
import { sendTelegramMessage } from "../../lib/telegram";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!chatId) {
    return res.status(503).json({
      error: "Lead notification is not configured yet.",
      code: "TELEGRAM_ADMIN_CHAT_ID_MISSING",
    });
  }

  const vin = String(req.body?.vin || "");
  const mileage = String(req.body?.mileage || "");
  const titleStatus = String(req.body?.titleStatus || "");
  const condition = String(req.body?.condition || "");
  const low = Number(req.body?.low || 0);
  const high = Number(req.body?.high || 0);
  const name = String(req.body?.name || "");
  const phone = String(req.body?.phone || "");
  const vehicle = String(req.body?.vehicle || "");

  if (!vin || !name || !phone || !low || !high) {
    return res.status(400).json({ error: "Missing required lead information." });
  }

  const text = [
    "🚗 <b>New Sell Your Car Lead</b>",
    "",
    vehicle ? "<b>Vehicle:</b> " + escapeHtml(vehicle) : "",
    "<b>VIN:</b> " + escapeHtml(vin),
    "<b>Mileage:</b> " + escapeHtml(mileage),
    "<b>Title:</b> " + escapeHtml(titleStatus),
    "<b>Condition:</b> " + escapeHtml(condition),
    "<b>Estimated range:</b> $" + low.toLocaleString() + " – $" + high.toLocaleString(),
    "",
    "<b>Name:</b> " + escapeHtml(name),
    "<b>Phone:</b> " + escapeHtml(phone),
  ].filter(Boolean).join("\n");

  try {
    await sendTelegramMessage(chatId, text);
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Sell car Telegram notification failed", error);
    return res.status(500).json({ error: "Could not send lead notification." });
  }
}
