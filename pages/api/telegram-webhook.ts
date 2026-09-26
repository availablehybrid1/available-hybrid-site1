import type { NextApiRequest, NextApiResponse } from "next";
import { del, list, put } from "@vercel/blob";
import {
  answerCallbackQuery,
  getTelegramFileUrl,
  sendTelegramMessage,
} from "../../lib/telegram";
import {
  deleteDraft,
  getDraft,
  saveDraft,
  saveVehicle,
  type BotDraft,
  type StoredVehicle,
} from "../../lib/blobInventory";

type TelegramPhoto = {
  file_id: string;
  width?: number;
  height?: number;
  file_size?: number;
};

type TelegramMessage = {
  message_id?: number;
  chat?: { id?: number; type?: string };
  from?: { id?: number; first_name?: string; username?: string };
  text?: string;
  photo?: TelegramPhoto[];
};

type TelegramCallbackQuery = {
  id: string;
  data?: string;
  message?: TelegramMessage;
};

type TelegramUpdate = {
  update_id?: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
};

export const config = {
  api: {
    bodyParser: true,
  },
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function numericText(value: string) {
  return value.replace(/[^0-9]/g, "");
}

function slug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function decodeVin(vin: string) {
  try {
    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvaluesextended/${encodeURIComponent(
        vin
      )}?format=json`
    );
    if (!response.ok) return null;
    const data = await response.json();
    const result = data?.Results?.[0] ?? {};
    const electrification = String(result.ElectrificationLevel || "").trim();
    const primaryFuel = String(result.FuelTypePrimary || "").trim();
    const fuel = /hybrid/i.test(electrification)
      ? "Hybrid"
      : primaryFuel;

    const cylinders = String(result.EngineCylinders || "").trim();
    const displacement = String(result.DisplacementL || "").trim();
    const engine = [
      cylinders ? `${cylinders} cyl` : "",
      displacement ? `${displacement}L` : "",
    ]
      .filter(Boolean)
      .join(" · ");

    return {
      make: String(result.Make || "").trim(),
      model: String(result.Model || "").trim(),
      year: String(result.ModelYear || "").trim(),
      transmission: String(result.TransmissionStyle || "").trim(),
      fuel,
      trim: String(result.Trim || "").trim(),
      bodyClass: String(result.BodyClass || "").trim(),
      driveType: String(result.DriveType || "").trim(),
      engine,
    };
  } catch {
    return null;
  }
}

async function uploadTelegramPhoto(
  sessionId: string,
  messageId: number | undefined,
  photo: TelegramPhoto
) {
  const fileUrl = await getTelegramFileUrl(photo.file_id);
  const response = await fetch(fileUrl);
  if (!response.ok) throw new Error("Could not download Telegram photo");

  const contentType = response.headers.get("content-type") || "image/jpeg";
  const ext =
    contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
      ? "webp"
      : "jpg";

  const body = await response.arrayBuffer();
  const blob = await put(
    `inventory/photos/${sessionId}/${Date.now()}-${messageId ?? 0}.${ext}`,
    body,
    {
      access: "public",
      addRandomSuffix: true,
      contentType,
      cacheControlMaxAge: 31536000,
    }
  );

  return blob.url;
}

async function listSessionPhotos(sessionId: string) {
  const result = await list({
    prefix: `inventory/photos/${sessionId}/`,
    limit: 100,
  });
  return result.blobs
    .sort((a, b) => a.uploadedAt.getTime() - b.uploadedAt.getTime())
    .map((b) => b.url);
}

async function deleteSessionPhotos(sessionId: string) {
  const result = await list({
    prefix: `inventory/photos/${sessionId}/`,
    limit: 100,
  });
  if (result.blobs.length) {
    await del(result.blobs.map((b) => b.url));
  }
}

function buildAutomaticDescription(draft: BotDraft) {
  const vehicleName = [draft.year, draft.make, draft.model, draft.trim]
    .filter(Boolean)
    .join(" ");

  const details = [
    draft.titleStatus,
    draft.mileage
      ? `${Number(draft.mileage).toLocaleString()} miles`
      : "",
    draft.fuel,
    draft.transmission,
    draft.exterior ? `${draft.exterior} exterior` : "",
    draft.driveType,
    draft.engine,
  ].filter(Boolean);

  const sentences = [
    vehicleName ? `${vehicleName} available at Available Hybrid R&M Inc.` : "",
    details.length ? `${details.join(" · ")}.` : "",
    draft.notes?.trim() || "",
  ].filter(Boolean);

  return sentences.join(" ");
}

function titleKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "Clean Title", callback_data: "title:Clean Title" },
        { text: "Salvage", callback_data: "title:Salvage Title" },
      ],
      [
        { text: "Rebuilt", callback_data: "title:Rebuilt Title" },
        { text: "Other", callback_data: "title:Other" },
      ],
    ],
  };
}

function publishKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "✅ Publish", callback_data: "publish" },
        { text: "❌ Cancel", callback_data: "cancel" },
      ],
    ],
  };
}

async function handleCallback(query: TelegramCallbackQuery) {
  const chatId = query.message?.chat?.id;
  if (!chatId) return;

  await answerCallbackQuery(query.id);
  const draft = await getDraft(chatId);
  if (!draft) {
    await sendTelegramMessage(chatId, "No active vehicle. Use /addcar.");
    return;
  }

  if (query.data?.startsWith("title:")) {
    draft.titleStatus = query.data.slice("title:".length);
    draft.step = "exterior";
    await saveDraft(chatId, draft);

    await sendTelegramMessage(
      chatId,
      `Title: <b>${escapeHtml(draft.titleStatus)}</b>\n\nSend the <b>exterior color</b>.`
    );
    return;
  }

  if (query.data === "cancel") {
    await deleteSessionPhotos(draft.sessionId);
    await deleteDraft(chatId);
    await sendTelegramMessage(chatId, "Vehicle canceled.");
    return;
  }

  if (query.data === "publish") {
    const photos = await listSessionPhotos(draft.sessionId);
    if (!photos.length) {
      draft.step = "photos";
      await saveDraft(chatId, draft);
      await sendTelegramMessage(
        chatId,
        "Please send at least one photo, then type /done."
      );
      return;
    }

    const baseId = slug(
      `${draft.year || ""}-${draft.make || ""}-${draft.model || ""}`
    );
    const suffix = draft.vin
      ? draft.vin.slice(-6).toLowerCase()
      : Date.now().toString().slice(-6);
    const id = `${baseId || "vehicle"}-${suffix}`;

    const automaticDescription = buildAutomaticDescription(draft);
    draft.description = automaticDescription;

    const vehicle: StoredVehicle = {
      id,
      year: draft.year || "",
      make: draft.make || "",
      model: draft.model || "",
      mileage: draft.mileage || "",
      price: draft.price || "",
      exterior: draft.exterior || "",
      transmission: draft.transmission || "",
      fuel: draft.fuel || "",
      vin: draft.vin || "",
      status: "Available",
      description: automaticDescription,
      titleStatus: draft.titleStatus || "",
      trim: draft.trim || "",
      bodyClass: draft.bodyClass || "",
      driveType: draft.driveType || "",
      engine: draft.engine || "",
    };

    photos.forEach((url, index) => {
      vehicle[`photo${index + 1}`] = url;
    });

    await saveVehicle(vehicle);
    await deleteDraft(chatId);

    await sendTelegramMessage(
      chatId,
      [
        "✅ <b>Vehicle published</b>",
        "",
        `${escapeHtml(vehicle.year)} ${escapeHtml(vehicle.make)} ${escapeHtml(
          vehicle.model
        )}`,
        `$${Number(vehicle.price || 0).toLocaleString()}`,
        `${Number(vehicle.mileage || 0).toLocaleString()} miles`,
        vehicle.fuel ? `Fuel: ${escapeHtml(vehicle.fuel)}` : "",
        vehicle.transmission
          ? `Transmission: ${escapeHtml(vehicle.transmission)}`
          : "",
        vehicle.exterior
          ? `Exterior: ${escapeHtml(vehicle.exterior)}`
          : "",
        `${photos.length} photos`,
      ].join("\n")
    );
  }
}

async function handleMessage(message: TelegramMessage) {
  const chatId = message.chat?.id;
  if (!chatId) return;

  const text = message.text?.trim() ?? "";

  if (text === "/start") {
    await sendTelegramMessage(
      chatId,
      [
        "🚗 <b>Available Hybrid Inventory Bot</b>",
        "",
        "Connected and ready.",
        "",
        "/addcar - add a vehicle",
        "/inventory - inventory tools",
        "/cancel - cancel current vehicle",
      ].join("\n")
    );
    return;
  }

  if (text === "/cancel") {
    const draft = await getDraft(chatId);
    if (draft) await deleteSessionPhotos(draft.sessionId);
    await deleteDraft(chatId);
    await sendTelegramMessage(chatId, "Current vehicle canceled.");
    return;
  }

  if (text === "/addcar") {
    await deleteDraft(chatId);

    const draft: BotDraft = {
      sessionId: `${chatId}-${Date.now()}`,
      step: "vin",
      photos: [],
    };
    await saveDraft(chatId, draft);

    await sendTelegramMessage(chatId, "Send the <b>VIN</b> of the vehicle.");
    return;
  }

  if (text === "/inventory") {
    await sendTelegramMessage(
      chatId,
      "Inventory management will be added after the publishing flow is tested."
    );
    return;
  }

  const draft = await getDraft(chatId);
  if (!draft) {
    await sendTelegramMessage(chatId, "Use /addcar to add a vehicle.");
    return;
  }

  if (draft.step === "vin") {
    const vin = text.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (vin.length !== 17) {
      await sendTelegramMessage(
        chatId,
        "VIN should have 17 characters. Send it again."
      );
      return;
    }

    draft.vin = vin;
    const decoded = await decodeVin(vin);
    if (decoded) {
      draft.year = decoded.year;
      draft.make = decoded.make;
      draft.model = decoded.model;
      draft.transmission = decoded.transmission;
      draft.fuel = decoded.fuel;
      draft.trim = decoded.trim;
      draft.bodyClass = decoded.bodyClass;
      draft.driveType = decoded.driveType;
      draft.engine = decoded.engine;
    }
    draft.step = "mileage";
    await saveDraft(chatId, draft);

    const decodedText =
      draft.year || draft.make || draft.model
        ? `\n\nDetected: <b>${escapeHtml(
            [draft.year, draft.make, draft.model].filter(Boolean).join(" ")
          )}</b>`
        : "";

    await sendTelegramMessage(
      chatId,
      `VIN saved.${decodedText}\n\nSend the <b>mileage</b>.`
    );
    return;
  }

  if (draft.step === "mileage") {
    const mileage = numericText(text);
    if (!mileage) {
      await sendTelegramMessage(chatId, "Send mileage using numbers only.");
      return;
    }
    draft.mileage = mileage;
    draft.step = "price";
    await saveDraft(chatId, draft);
    await sendTelegramMessage(chatId, "Send the <b>price</b>.");
    return;
  }

  if (draft.step === "price") {
    const price = numericText(text);
    if (!price) {
      await sendTelegramMessage(chatId, "Send price using numbers only.");
      return;
    }
    draft.price = price;
    draft.step = "title";
    await saveDraft(chatId, draft);
    await sendTelegramMessage(chatId, "Select the title status:", titleKeyboard());
    return;
  }

  if (draft.step === "title") {
    await sendTelegramMessage(chatId, "Use one of the title buttons above.");
    return;
  }

  if (draft.step === "exterior") {
    if (!text) {
      await sendTelegramMessage(chatId, "Send the exterior color.");
      return;
    }

    draft.exterior = text;
    draft.step = "notes";
    await saveDraft(chatId, draft);

    await sendTelegramMessage(
      chatId,
      [
        "Exterior color saved.",
        "",
        "Send any extra notes you want included in the description",
        "(for example: new hybrid battery, new brakes, two owners),",
        "or type /skip.",
      ].join("\n")
    );
    return;
  }

  if (draft.step === "notes") {
    draft.notes = text === "/skip" ? "" : text;
    draft.description = buildAutomaticDescription(draft);
    draft.step = "photos";
    await saveDraft(chatId, draft);

    await sendTelegramMessage(
      chatId,
      [
        "Automatic description created:",
        "",
        `<i>${escapeHtml(draft.description)}</i>`,
        "",
        "Now send the vehicle photos.",
        "You can send multiple photos.",
        "",
        "When finished, type /done.",
      ].join("\n")
    );
    return;
  }

  if (draft.step === "photos") {
    if (message.photo?.length) {
      const largest = [...message.photo].sort(
        (a, b) => (b.file_size || 0) - (a.file_size || 0)
      )[0];
      await uploadTelegramPhoto(draft.sessionId, message.message_id, largest);
      return;
    }

    if (text === "/done") {
      const photos = await listSessionPhotos(draft.sessionId);
      if (!photos.length) {
        await sendTelegramMessage(
          chatId,
          "Send at least one vehicle photo before /done."
        );
        return;
      }

      draft.step = "confirm";
      await saveDraft(chatId, draft);

      const summary = [
        "🚗 <b>Ready to publish</b>",
        "",
        `${escapeHtml(draft.year || "")} ${escapeHtml(
          draft.make || ""
        )} ${escapeHtml(draft.model || "")}`.trim(),
        `VIN: ${escapeHtml(draft.vin || "")}`,
        `Mileage: ${Number(draft.mileage || 0).toLocaleString()}`,
        `Price: $${Number(draft.price || 0).toLocaleString()}`,
        `Title: ${escapeHtml(draft.titleStatus || "")}`,
        draft.fuel ? `Fuel: ${escapeHtml(draft.fuel)}` : "",
        draft.transmission
          ? `Transmission: ${escapeHtml(draft.transmission)}`
          : "",
        draft.exterior ? `Exterior: ${escapeHtml(draft.exterior)}` : "",
        `Photos: ${photos.length}`,
        "",
        `Description: ${escapeHtml(
          draft.description || buildAutomaticDescription(draft)
        )}`,
      ].join("\n");

      await sendTelegramMessage(chatId, summary, publishKeyboard());
      return;
    }

    await sendTelegramMessage(
      chatId,
      "Send photos, then type /done when you are finished."
    );
    return;
  }

  if (draft.step === "confirm") {
    await sendTelegramMessage(
      chatId,
      "Use Publish or Cancel on the confirmation message."
    );
  }
}

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
      hasBlobToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false });
  }

  try {
    const update = req.body as TelegramUpdate;

    if (update.callback_query) {
      await handleCallback(update.callback_query);
    } else if (update.message) {
      await handleMessage(update.message);
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return res.status(200).json({ ok: true });
  }
}
