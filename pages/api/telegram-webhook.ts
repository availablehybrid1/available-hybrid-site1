import type { NextApiRequest, NextApiResponse } from "next";
import { del, list, put } from "@vercel/blob";
import {
  answerCallbackQuery,
  getTelegramFileUrl,
  sendTelegramMessage,
} from "../../lib/telegram";
import {
  deleteDraft,
  deleteStoredVehicle,
  getDraft,
  getStoredVehicle,
  listStoredVehicles,
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
    .sort(
      (a, b) =>
        new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
    )
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


function normalizeColor(text: string) {
  const colors: Array<[RegExp, string]> = [
    [/\b(white|blanco|blanca)\b/i, "White"],
    [/\b(black|negro|negra)\b/i, "Black"],
    [/\b(silver|plateado|plateada)\b/i, "Silver"],
    [/\b(gray|grey|gris)\b/i, "Gray"],
    [/\b(red|rojo|roja)\b/i, "Red"],
    [/\b(blue|azul)\b/i, "Blue"],
    [/\b(green|verde)\b/i, "Green"],
    [/\b(beige|tan|crema)\b/i, "Beige"],
    [/\b(brown|marron|marrón|cafe|café)\b/i, "Brown"],
    [/\b(gold|dorado|dorada)\b/i, "Gold"],
  ];

  for (const [pattern, color] of colors) {
    if (pattern.test(text)) return color;
  }
  return "";
}

function parseCompactNumber(raw: string) {
  const cleaned = raw.toLowerCase().replace(/[$,\s]/g, "");
  const match = cleaned.match(/^(\d+(?:\.\d+)?)(k)?$/);
  if (!match) return "";
  const value = Number(match[1]);
  if (!Number.isFinite(value)) return "";
  return String(Math.round(match[2] ? value * 1000 : value));
}

function parseVehicleText(text: string) {
  const vinMatch = text.toUpperCase().match(/\b[A-HJ-NPR-Z0-9]{17}\b/);

  let mileage = "";
  const mileagePatterns = [
    /(?:mileage|miles|mi|millas|millaje)\s*[:=-]?\s*([\d,.]+\s*k?)/i,
    /([\d,.]+\s*k?)\s*(?:miles|mi|millas)\b/i,
  ];
  for (const pattern of mileagePatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      mileage = parseCompactNumber(match[1]);
      if (mileage) break;
    }
  }

  let price = "";
  const pricePatterns = [
    /\$\s*([\d,.]+\s*k?)/i,
    /(?:price|precio)\s*[:=-]?\s*\$?\s*([\d,.]+\s*k?)/i,
  ];
  for (const pattern of pricePatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      price = parseCompactNumber(match[1]);
      if (price) break;
    }
  }

  let titleStatus = "";
  if (/\b(clean title|titulo limpio|título limpio|clean)\b/i.test(text)) {
    titleStatus = "Clean Title";
  } else if (/\b(salvage|salvamento)\b/i.test(text)) {
    titleStatus = "Salvage Title";
  } else if (/\b(rebuilt|rebuild|reconstruido|reconstruida)\b/i.test(text)) {
    titleStatus = "Rebuilt Title";
  }

  return {
    vin: vinMatch?.[0] || "",
    mileage,
    price,
    titleStatus,
    exterior: normalizeColor(text),
  };
}


function extractFreeformNotes(text: string) {
  let notes = text;

  notes = notes.replace(/\b[A-HJ-NPR-Z0-9]{17}\b/gi, " ");
  notes = notes.replace(
    /(?:mileage|miles|mi|millas|millaje)\s*[:=-]?\s*[\d,.]+\s*k?/gi,
    " "
  );
  notes = notes.replace(/[\d,.]+\s*k?\s*(?:miles|mi|millas)\b/gi, " ");
  notes = notes.replace(/\$\s*[\d,.]+\s*k?/gi, " ");
  notes = notes.replace(
    /(?:price|precio)\s*[:=-]?\s*\$?\s*[\d,.]+\s*k?/gi,
    " "
  );
  notes = notes.replace(
    /\b(clean title|titulo limpio|título limpio|salvage(?: title)?|salvamento|rebuilt(?: title)?|rebuild|reconstruido|reconstruida)\b/gi,
    " "
  );
  notes = notes.replace(
    /\b(white|blanco|blanca|black|negro|negra|silver|plateado|plateada|gray|grey|gris|red|rojo|roja|blue|azul|green|verde|beige|tan|crema|brown|marron|marrón|cafe|café|gold|dorado|dorada)\b/gi,
    " "
  );
  notes = notes.replace(/\b(vin|color|exterior|title|titulo|título)\b\s*[:=-]?/gi, " ");
  notes = notes.replace(/[|;,]+/g, " ");
  notes = notes.replace(/\s+/g, " ").trim();

  return notes.length >= 4 ? notes : "";
}


async function enrichDraftFromText(draft: BotDraft, text: string) {
  const parsed = parseVehicleText(text);

  if (parsed.vin) {
    draft.vin = parsed.vin;
    const decoded = await decodeVin(parsed.vin);
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
  }

  if (parsed.mileage) draft.mileage = parsed.mileage;
  if (parsed.price) draft.price = parsed.price;
  if (parsed.titleStatus) draft.titleStatus = parsed.titleStatus;
  if (parsed.exterior) draft.exterior = parsed.exterior;

  const explicitNotes = text.match(
    /(?:notes?|notas?|description|descripcion|descripción)\s*[:=-]\s*(.+)$/i
  );
  const freeformNotes = explicitNotes?.[1]?.trim() || extractFreeformNotes(text);

  if (freeformNotes) {
    draft.notes = freeformNotes;
  }

  return draft;
}

function missingVehicleFields(draft: BotDraft) {
  const missing: string[] = [];
  if (!draft.vin) missing.push("VIN");
  if (!draft.mileage) missing.push("mileage");
  if (!draft.price) missing.push("price");
  if (!draft.titleStatus) missing.push("title status");
  return missing;
}

function draftSummary(draft: BotDraft) {
  return [
    [draft.year, draft.make, draft.model, draft.trim].filter(Boolean).join(" "),
    draft.vin ? `VIN: ${draft.vin}` : "",
    draft.mileage ? `Mileage: ${Number(draft.mileage).toLocaleString()}` : "",
    draft.price ? `Price: ${Number(draft.price).toLocaleString()}` : "",
    draft.titleStatus ? `Title: ${draft.titleStatus}` : "",
    draft.exterior ? `Exterior: ${draft.exterior}` : "",
  ]
    .filter(Boolean)
    .join("\n");
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


function inventoryKeyboard(vehicle: StoredVehicle) {
  const isSold = String(vehicle.status || "").toLowerCase() === "sold";

  return {
    inline_keyboard: isSold
      ? [
          [
            { text: "↩️ Restore", callback_data: `restore:${vehicle.id}` },
            { text: "🗑 Delete", callback_data: `delete:${vehicle.id}` },
          ],
        ]
      : [
          [
            { text: "✏️ Edit", callback_data: `edit:${vehicle.id}` },
            { text: "✅ Sold", callback_data: `sold:${vehicle.id}` },
          ],
          [
            { text: "🗑 Delete", callback_data: `delete:${vehicle.id}` },
          ],
        ],
  };
}

function deleteConfirmKeyboard(id: string) {
  return {
    inline_keyboard: [
      [
        { text: "Yes, delete", callback_data: `confirmdelete:${id}` },
        { text: "Cancel", callback_data: `nodelete:${id}` },
      ],
    ],
  };
}

async function sendInventoryList(chatId: number) {
  const vehicles = await listStoredVehicles();
  if (!vehicles.length) {
    await sendTelegramMessage(chatId, "No vehicles are stored yet.");
    return;
  }

  const sorted = [...vehicles].sort((a, b) => {
    const aSold = String(a.status || "").toLowerCase() === "sold" ? 1 : 0;
    const bSold = String(b.status || "").toLowerCase() === "sold" ? 1 : 0;
    if (aSold !== bSold) return aSold - bSold;
    return Number(b.year || 0) - Number(a.year || 0);
  });

  const available = sorted.filter(
    (v) => String(v.status || "").toLowerCase() !== "sold"
  ).length;
  const sold = sorted.length - available;

  await sendTelegramMessage(
    chatId,
    `🚗 <b>Inventory</b>\n\nAvailable: ${available}\nSold: ${sold}\nTotal stored: ${sorted.length}`
  );

  for (const vehicle of sorted.slice(0, 30)) {
    const status =
      String(vehicle.status || "").toLowerCase() === "sold"
        ? "SOLD"
        : "AVAILABLE";

    await sendTelegramMessage(
      chatId,
      [
        `<b>${escapeHtml(
          [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ")
        )}</b>`,
        `Status: ${status}`,
        vehicle.price
          ? `Price: ${Number(vehicle.price).toLocaleString()}`
          : "",
        vehicle.mileage
          ? `Mileage: ${Number(vehicle.mileage).toLocaleString()}`
          : "",
        vehicle.vin ? `VIN: ${escapeHtml(vehicle.vin)}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      inventoryKeyboard(vehicle)
    );
  }

  if (sorted.length > 30) {
    await sendTelegramMessage(
      chatId,
      `Showing the first 30 of ${sorted.length} vehicles.`
    );
  }
}

function vehicleToDraft(vehicle: StoredVehicle): BotDraft {
  const photoUrls = Object.entries(vehicle)
    .filter(
      ([key, value]) =>
        key.toLowerCase().startsWith("photo") &&
        typeof value === "string" &&
        value.startsWith("http")
    )
    .map(([, value]) => String(value));

  return {
    sessionId: `edit-${vehicle.id}-${Date.now()}`,
    step: "edit",
    editingVehicleId: vehicle.id,
    vin: vehicle.vin || "",
    year: vehicle.year || "",
    make: vehicle.make || "",
    model: vehicle.model || "",
    transmission: vehicle.transmission || "",
    mileage: vehicle.mileage || "",
    price: vehicle.price || "",
    titleStatus: vehicle.titleStatus || "",
    exterior: vehicle.exterior || "",
    fuel: vehicle.fuel || "",
    trim: vehicle.trim || "",
    bodyClass: vehicle.bodyClass || "",
    driveType: vehicle.driveType || "",
    engine: vehicle.engine || "",
    notes: vehicle.notes || "",
    description: vehicle.description || "",
    photos: photoUrls,
  };
}

function applyDraftToVehicle(
  draft: BotDraft,
  vehicle: StoredVehicle
): StoredVehicle {
  return {
    ...vehicle,
    year: draft.year || vehicle.year || "",
    make: draft.make || vehicle.make || "",
    model: draft.model || vehicle.model || "",
    mileage: draft.mileage || vehicle.mileage || "",
    price: draft.price || vehicle.price || "",
    exterior: draft.exterior || vehicle.exterior || "",
    transmission: draft.transmission || vehicle.transmission || "",
    fuel: draft.fuel || vehicle.fuel || "",
    vin: draft.vin || vehicle.vin || "",
    titleStatus: draft.titleStatus || vehicle.titleStatus || "",
    trim: draft.trim || vehicle.trim || "",
    bodyClass: draft.bodyClass || vehicle.bodyClass || "",
    driveType: draft.driveType || vehicle.driveType || "",
    engine: draft.engine || vehicle.engine || "",
    notes: draft.notes || vehicle.notes || "",
    description: buildAutomaticDescription(draft),
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

  if (query.data?.startsWith("sold:")) {
    const id = query.data.slice("sold:".length);
    const vehicle = await getStoredVehicle(id);
    if (!vehicle) {
      await sendTelegramMessage(chatId, "Vehicle not found.");
      return;
    }
    vehicle.status = "Sold";
    await saveVehicle(vehicle);
    await sendTelegramMessage(
      chatId,
      `✅ ${escapeHtml(
        [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ")
      )} marked as SOLD and removed from active website inventory.`
    );
    return;
  }

  if (query.data?.startsWith("restore:")) {
    const id = query.data.slice("restore:".length);
    const vehicle = await getStoredVehicle(id);
    if (!vehicle) {
      await sendTelegramMessage(chatId, "Vehicle not found.");
      return;
    }
    vehicle.status = "Available";
    await saveVehicle(vehicle);
    await sendTelegramMessage(
      chatId,
      `↩️ ${escapeHtml(
        [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ")
      )} is available again.`
    );
    return;
  }

  if (query.data?.startsWith("edit:")) {
    const id = query.data.slice("edit:".length);
    const vehicle = await getStoredVehicle(id);
    if (!vehicle) {
      await sendTelegramMessage(chatId, "Vehicle not found.");
      return;
    }

    const editDraft = vehicleToDraft(vehicle);
    await deleteDraft(chatId);
    await saveDraft(chatId, editDraft);

    await sendTelegramMessage(
      chatId,
      [
        "✏️ <b>Edit vehicle</b>",
        "",
        `<b>${escapeHtml(draftSummary(editDraft))}</b>`,
        "",
        "Send the changes naturally in one message.",
        "",
        "Examples:",
        "<i>$6500</i>",
        "<i>190k miles, black</i>",
        "<i>salvage title, $5999</i>",
        "",
        "You can send more changes after that. Type /done when finished.",
      ].join("\n")
    );
    return;
  }

  if (query.data?.startsWith("delete:")) {
    const id = query.data.slice("delete:".length);
    const vehicle = await getStoredVehicle(id);
    if (!vehicle) {
      await sendTelegramMessage(chatId, "Vehicle not found.");
      return;
    }
    await sendTelegramMessage(
      chatId,
      `Delete <b>${escapeHtml(
        [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ")
      )}</b> permanently from inventory and delete its photos?`,
      deleteConfirmKeyboard(id)
    );
    return;
  }

  if (query.data?.startsWith("confirmdelete:")) {
    const id = query.data.slice("confirmdelete:".length);
    const removed = await deleteStoredVehicle(id, true);
    await sendTelegramMessage(
      chatId,
      removed
        ? "🗑 Vehicle deleted permanently."
        : "Vehicle was already removed."
    );
    return;
  }

  if (query.data?.startsWith("nodelete:")) {
    await sendTelegramMessage(chatId, "Delete canceled.");
    return;
  }


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


  if (/^(hola|hello|hi|hey|buenas|buenos dias|buenos días|buenas tardes|buenas noches)$/i.test(text)) {
    await sendTelegramMessage(
      chatId,
      [
        "👋 <b>Available Hybrid Inventory Bot</b>",
        "",
        "Commands:",
        "/addcar - add a vehicle",
        "/inventory - manage available and sold vehicles",
        "/cancel - cancel current add/edit session",
        "/id - show this Telegram chat ID",
        "/help - show commands",
      ].join("\n")
    );
    return;
  }

  if (text === "/start" || text === "/help") {
    await sendTelegramMessage(
      chatId,
      [
        "🚗 <b>Available Hybrid Inventory Bot</b>",
        "",
        "/addcar - add a vehicle",
        "/inventory - manage available and sold vehicles",
        "/cancel - cancel current add/edit session",
        "/id - show this Telegram chat ID",
        "/help - show commands",
      ].join("\n")
    );
    return;
  }

  if (text === "/id") {
    await sendTelegramMessage(chatId, `Chat ID: <code>${chatId}</code>`);
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
      step: "details",
      photos: [],
    };
    await saveDraft(chatId, draft);

    await sendTelegramMessage(
      chatId,
      [
        "Send me <b>all the vehicle information in one message</b>.",
        "",
        "Example:",
        "<i>VIN 1HGCM82633A123456, 185k miles, $5999, clean title, white, new brakes and hybrid battery replaced.</i>",
        "",
        "I will organize it automatically and only ask for anything important that is missing.",
      ].join("\n")
    );
    return;
  }

  if (text === "/inventory") {
    await sendInventoryList(chatId);
    return;
  }

  const draft = await getDraft(chatId);
  if (!draft) {
    await sendTelegramMessage(chatId, "Use /addcar to add a vehicle.");
    return;
  }



  if (draft.step === "edit") {
    const id = draft.editingVehicleId;
    if (!id) {
      await deleteDraft(chatId);
      await sendTelegramMessage(chatId, "Edit session expired. Use /inventory.");
      return;
    }

    if (text === "/done") {
      const vehicle = await getStoredVehicle(id);
      if (!vehicle) {
        await deleteDraft(chatId);
        await sendTelegramMessage(chatId, "Vehicle not found.");
        return;
      }

      const updated = applyDraftToVehicle(draft, vehicle);
      await saveVehicle(updated);
      await deleteDraft(chatId);

      await sendTelegramMessage(
        chatId,
        [
          "✅ <b>Vehicle updated</b>",
          "",
          `<b>${escapeHtml(draftSummary(draft))}</b>`,
          "",
          `Description: ${escapeHtml(updated.description || "")}`,
        ].join("\n")
      );
      return;
    }

    if (!text) {
      await sendTelegramMessage(
        chatId,
        "Send the change, or type /done when finished."
      );
      return;
    }

    await enrichDraftFromText(draft, text);

    const color = normalizeColor(text);
    if (color) draft.exterior = color;

    if (/\b(clean title|titulo limpio|título limpio|clean)\b/i.test(text)) {
      draft.titleStatus = "Clean Title";
    } else if (/\b(salvage|salvamento)\b/i.test(text)) {
      draft.titleStatus = "Salvage Title";
    } else if (
      /\b(rebuilt|rebuild|reconstruido|reconstruida)\b/i.test(text)
    ) {
      draft.titleStatus = "Rebuilt Title";
    }

    draft.description = buildAutomaticDescription(draft);
    await saveDraft(chatId, draft);

    await sendTelegramMessage(
      chatId,
      [
        "Updated in draft:",
        "",
        `<b>${escapeHtml(draftSummary(draft))}</b>`,
        "",
        "Send another change, or type /done to save.",
      ].join("\n")
    );
    return;
  }


  if (draft.step === "details") {
    if (!text) {
      await sendTelegramMessage(
        chatId,
        "Send the vehicle details in one message."
      );
      return;
    }

    await enrichDraftFromText(draft, text);
    const missing = missingVehicleFields(draft);

    if (missing.length) {
      await saveDraft(chatId, draft);
      await sendTelegramMessage(
        chatId,
        [
          "I understood this so far:",
          "",
          `<b>${escapeHtml(draftSummary(draft) || "No structured data yet")}</b>`,
          "",
          `Still missing: <b>${escapeHtml(missing.join(", "))}</b>`,
          "",
          "Send only the missing information, or send everything again in one message.",
        ].join("\n")
      );
      return;
    }

    draft.description = buildAutomaticDescription(draft);
    draft.step = "photos";
    await saveDraft(chatId, draft);

    await sendTelegramMessage(
      chatId,
      [
        "✅ I organized the vehicle information:",
        "",
        `<b>${escapeHtml(draftSummary(draft))}</b>`,
        "",
        "Automatic description:",
        `<i>${escapeHtml(draft.description)}</i>`,
        "",
        "Now send the vehicle photos.",
        "When finished, type /done.",
      ].join("\n")
    );
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

  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID?.trim();
  if (
    req.method === "POST" &&
    adminChatId &&
    String(
      (req.body as TelegramUpdate)?.message?.chat?.id ??
        (req.body as TelegramUpdate)?.callback_query?.message?.chat?.id ??
        ""
    ) !== adminChatId
  ) {
    return res.status(200).json({ ok: true });
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
