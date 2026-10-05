import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!token) {
    return res.status(500).json({ ok: false, error: "Missing TELEGRAM_BOT_TOKEN" });
  }

  const webhookUrl = "https://available-hybrid-site1-guv8-git-main-availablehybrid1s-projects.vercel.app/api/telegram-webhook";

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/setWebhook`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          url: webhookUrl,
          ...(secret ? { secret_token: secret } : {}),
          allowed_updates: ["message", "callback_query"],
        }),
      }
    );

    const data = await response.json();

    return res.status(response.ok ? 200 : 502).json({
      ok: Boolean(data?.ok),
      description: data?.description ?? null,
      webhookUrl,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
