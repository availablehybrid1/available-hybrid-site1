import type { NextApiRequest, NextApiResponse } from "next";
import { sendTelegramMessage } from "../../lib/telegram";

type TelegramUpdate = {
  update_id?: number;
  message?: {
    message_id?: number;
    chat?: {
      id?: number;
      type?: string;
    };
    from?: {
      id?: number;
      first_name?: string;
      username?: string;
    };
    text?: string;
  };
};

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      vercelEnv: process.env.VERCEL_ENV ?? null,
      hasBotToken: Boolean(process.env.TELEGRAM_BOT_TOKEN),
      hasWebhookSecret: Boolean(process.env.TELEGRAM_WEBHOOK_SECRET),
    });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false });
  }

  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const receivedSecret = req.headers["x-telegram-bot-api-secret-token"];

  // In Preview, allow the request through while we finish validating
  // the webhook setup. Production will still require the secret to match.
  if (
    process.env.VERCEL_ENV !== "preview" &&
    (!expectedSecret || receivedSecret !== expectedSecret)
  ) {
    return res.status(401).json({ ok: false });
  }

  const update = req.body as TelegramUpdate;
  const message = update.message;
  const chatId = message?.chat?.id;
  const text = message?.text?.trim() ?? "";

  if (!chatId) {
    return res.status(200).json({ ok: true });
  }

  try {
    if (text === "/start") {
      await sendTelegramMessage(
        chatId,
        [
          "🚗 <b>Available Hybrid Inventory Bot</b>",
          "",
          "Bot conectado correctamente.",
          "",
          "Comandos disponibles:",
          "/addcar - agregar un vehículo",
          "/inventory - ver inventario",
          "/help - ayuda",
        ].join("\n")
      );
    } else if (text === "/addcar") {
      await sendTelegramMessage(
        chatId,
        [
          "✅ El bot ya está conectado.",
          "",
          "El flujo para agregar vehículos se está preparando.",
          "El siguiente paso será pedir VIN, millaje, precio, título y fotos.",
        ].join("\n")
      );
    } else if (text === "/inventory") {
      await sendTelegramMessage(
        chatId,
        "📋 La administración del inventario se conectará en el siguiente paso."
      );
    } else if (text === "/help") {
      await sendTelegramMessage(
        chatId,
        "Usa /addcar para comenzar a agregar un vehículo."
      );
    } else {
      await sendTelegramMessage(
        chatId,
        "Escribe /start para ver los comandos disponibles."
      );
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return res.status(200).json({ ok: true });
  }
}
