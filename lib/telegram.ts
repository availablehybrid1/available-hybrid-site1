type TelegramMethodPayload = Record<string, unknown>;

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function telegramApi<T = any>(
  method: string,
  payload: TelegramMethodPayload
): Promise<T> {
  if (!BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  }

  const response = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/${method}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  const data = await response.json();

  if (!response.ok || !data?.ok) {
    throw new Error(
      `Telegram API error (${method}): ${JSON.stringify(data)}`
    );
  }

  return data.result as T;
}

export async function sendTelegramMessage(
  chatId: number | string,
  text: string
) {
  return telegramApi("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
  });
}
