import type { NextApiRequest, NextApiResponse } from "next";
import { createHash } from "crypto";
import { deleteR2PhotoByUrl, uploadR2Photo } from "../../lib/r2Photos";
import {
  answerCallbackQuery,
  getTelegramFileUrl,
  sendTelegramMessage,
  sendTelegramPhotoAlbum,
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
    const primaryFuel = String(result.FuelTypePrimary || result.FuelTypeSecondary || "").trim();
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
      transmission:
        String(result.TransmissionStyle || "").trim() ||
        (/hybrid/i.test(fuel) ? "Automatic" : ""),
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
  const bytes = new Uint8Array(body);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const key = `inventory/photos/${sessionId}/${String(
    messageId ?? 0
  ).padStart(12, "0")}-${Date.now()}.${ext}`;

  const url = await uploadR2Photo({
    key,
    body: bytes,
    contentType,
    sha256,
  });

  return { url, sha256 };
}

async function deleteSessionPhotos(photoUrls: string[]) {
  if (!photoUrls.length) return;

  await Promise.all(
    photoUrls.map(async (url) => {
      try {
        await deleteR2PhotoByUrl(url);
      } catch {
        // Keep draft cleanup moving even if a single image cannot be removed.
      }
    })
  );
}


function normalizeDraftCardDetails(draft: BotDraft) {
  const normalizedTransmission = normalizeTransmission(draft.transmission || "");
  if (normalizedTransmission) {
    if (draft.transmission !== normalizedTransmission && !draft.transmissionDetail) {
      draft.transmissionDetail = draft.transmission;
    }
    draft.transmission = normalizedTransmission;
  } else if (!draft.transmission && /hybrid/i.test(draft.fuel || "")) {
    draft.transmission = "Automatic";
  }

  if (draft.exterior) {
    const normalized = normalizeColor(draft.exterior);
    if (normalized) draft.exterior = normalized;
  }

  return draft;
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
    draft.transmissionDetail || draft.transmission,
    draft.exterior ? `${draft.exterior} exterior` : "",
    draft.driveType,
    draft.engine,
  ].filter(Boolean);

  const sentences = [
    vehicleName ? `${vehicleName}.` : "",
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
  const cleaned = raw.toLowerCase().replace(/[$,\s]/g, "").replace(/^(\d{1,3})\.(\d{3})$/, "$1$2");
  const match = cleaned.match(/^(\d+(?:\.\d+)?)(k)?$/);
  if (!match) return "";
  const value = Number(match[1]);
  if (!Number.isFinite(value)) return "";
  return String(Math.round(match[2] ? value * 1000 : value));
}

function normalizeTransmission(text: string) {
  if (/\b(automatic|automatica|automático|automática|auto|cvt|e-cvt|ecvt)\b/i.test(text)) {
    return "Automatic";
  }
  if (/\b(manual|stick shift|estandar|estándar)\b/i.test(text)) {
    return "Manual";
  }
  return "";
}

function normalizeFuel(text: string) {
  if (/\b(hybrid|híbrido|hibrido)\b/i.test(text)) return "Hybrid";
  if (/\b(diesel|diésel)\b/i.test(text)) return "Diesel";
  if (/\b(electric|eléctrico|electrico|ev)\b/i.test(text)) return "Electric";
  if (/\b(gasoline|gasolina|gas|petrol)\b/i.test(text)) return "Gasoline";
  return "";
}

function parseEngine(text: string) {
  const displacement = text.match(/\b(\d(?:\.\d)?)\s*(?:l|liters?|litros?)\b/i)?.[1];
  const cylinders = text.match(/\b(?:([3468])\s*(?:cyl(?:inders?)?|cilindros?)|v([468]))\b/i);
  const count = cylinders?.[1] || cylinders?.[2];
  return [count ? `${count} cyl` : "", displacement ? `${displacement}L` : ""]
    .filter(Boolean).join(" · ");
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

  const numbers = Array.from(
    text.replace(vinMatch?.[0] || "", " ").matchAll(/\b(?:\d{1,3}(?:[,\.]\d{3})+|\d{4,6}|\d+(?:\.\d+)?\s*k)\b/gi)
  )
    .map((match) => parseCompactNumber(match[0]))
    .filter((value) => {
      const amount = Number(value);
      return amount >= 1000 && amount <= 999999 && !(amount >= 1900 && amount <= 2100);
    });
  if (!mileage && !price && numbers.length === 2) {
    const sorted = [...numbers].sort((a, b) => Number(a) - Number(b));
    if (Number(sorted[1]) >= 50000 && Number(sorted[0]) <= 100000) {
      mileage = sorted[1];
      price = sorted[0];
    }
  }
  if (!price && mileage) {
    const candidates = numbers.filter((n) => n !== mileage && Number(n) <= 100000);
    if (candidates.length === 1) price = candidates[0];
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
    transmission: normalizeTransmission(text),
    fuel: normalizeFuel(text),
    engine: parseEngine(text),
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
      const normalized = normalizeTransmission(decoded.transmission);
      draft.transmission = normalized || decoded.transmission;
      draft.transmissionDetail = normalized && decoded.transmission !== normalized ? decoded.transmission : "";
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
  if (parsed.transmission) draft.transmission = parsed.transmission;
  if (parsed.fuel) draft.fuel = parsed.fuel;
  if (parsed.engine) draft.engine = parsed.engine;

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
  if (!draft.transmission) missing.push("transmission");
  if (!draft.exterior) missing.push("exterior color");
  if (!draft.fuel) missing.push("fuel (gasoline, hybrid, diesel or electric)");
  if (!draft.engine) missing.push("engine (example: 4 cyl 2.5L)");
  return missing;
}

function draftSummary(draft: BotDraft) {
  return [
    [draft.year, draft.make, draft.model, draft.trim].filter(Boolean).join(" "),
    draft.vin ? `VIN: ${draft.vin}` : "",
    draft.mileage ? `Mileage: ${Number(draft.mileage).toLocaleString()}` : "",
    draft.price ? `Price: ${Number(draft.price).toLocaleString()}` : "",
    draft.titleStatus ? `Title: ${draft.titleStatus}` : "",
    draft.fuel ? `Fuel: ${draft.fuel}` : "",
    draft.transmission ? `Transmission: ${draft.transmission}` : "",
    draft.exterior ? `Exterior: ${draft.exterior}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}



function transmissionKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "Automatic", callback_data: "settransmission:Automatic" },
        { text: "Manual", callback_data: "settransmission:Manual" },
      ],
    ],
  };
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



function mainMenuKeyboard() {
  return {
    keyboard: [
      [
        { text: "➕ Add Car" },
        { text: "🚗 Inventory" },
      ],
      [
        { text: "❌ Cancel" },
        { text: "❓ Help" },
      ],
      [
        { text: "🆔 My ID" },
      ],
    ],
    resize_keyboard: true,
    is_persistent: true,
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
            { text: "📷 Cover", callback_data: `pickcover:${vehicle.id}` },
            { text: "🖼 Hover", callback_data: `pickhover:${vehicle.id}` },
          ],
          [
            { text: "📸 Replace Photos", callback_data: `replacephotos:${vehicle.id}` },
          ],
          [
            { text: "🗑 Delete", callback_data: `delete:${vehicle.id}` },
          ],
        ],
  };
}


function storedVehiclePhotos(vehicle: StoredVehicle) {
  return Object.entries(vehicle)
    .filter(
      ([key, value]) =>
        /^photo\d+$/i.test(key) &&
        typeof value === "string" &&
        value.startsWith("http")
    )
    .sort(([a], [b]) => {
      const aNum = Number(a.replace(/\D/g, "")) || 0;
      const bNum = Number(b.replace(/\D/g, "")) || 0;
      return aNum - bNum;
    })
    .map(([, value]) => String(value));
}

function existingCoverKeyboard(vehicleId: string, photoCount: number) {
  const buttons = Array.from({ length: Math.min(photoCount, 20) }, (_, index) => ({
    text: `${index + 1}`,
    callback_data: `setcover:${vehicleId}:${index}`,
  }));

  const rows = [];
  for (let i = 0; i < buttons.length; i += 5) {
    rows.push(buttons.slice(i, i + 5));
  }
  return { inline_keyboard: rows };
}



function existingHoverKeyboard(vehicleId: string, photoCount: number) {
  const buttons = Array.from({ length: Math.min(photoCount, 20) }, (_, index) => ({
    text: `${index + 1}`,
    callback_data: `sethover:${vehicleId}:${index}`,
  }));

  const rows = [];
  for (let i = 0; i < buttons.length; i += 5) {
    rows.push(buttons.slice(i, i + 5));
  }
  rows.push([
    { text: "No hover photo", callback_data: `sethover:${vehicleId}:none` },
  ]);
  return { inline_keyboard: rows };
}


function replacePhotosMenuKeyboard(vehicleId: string) {
  return {
    inline_keyboard: [
      [
        { text: "Replace one photo", callback_data: `replaceone:${vehicleId}` },
      ],
      [
        { text: "Replace all photos", callback_data: `replaceall:${vehicleId}` },
      ],
      [
        { text: "Cancel", callback_data: `replacecancel:${vehicleId}` },
      ],
    ],
  };
}

function replaceOnePhotoKeyboard(vehicleId: string, photoCount: number) {
  const buttons = Array.from({ length: Math.min(photoCount, 20) }, (_, index) => ({
    text: `${index + 1}`,
    callback_data: `replacepick:${vehicleId}:${index}`,
  }));

  const rows = [];
  for (let i = 0; i < buttons.length; i += 5) {
    rows.push(buttons.slice(i, i + 5));
  }
  return { inline_keyboard: rows };
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
    transmissionDetail: vehicle.transmissionDetail || "",
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
    transmission: normalizeTransmission(draft.transmission || vehicle.transmission || "") || draft.transmission || vehicle.transmission || "",
    transmissionDetail: draft.transmissionDetail || vehicle.transmissionDetail || "",
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



function coverPhotoKeyboard(photoCount: number) {
  const buttons = Array.from({ length: Math.min(photoCount, 20) }, (_, index) => ({
    text: `${index + 1}`,
    callback_data: `cover:${index}`,
  }));

  const rows = [];
  for (let i = 0; i < buttons.length; i += 5) {
    rows.push(buttons.slice(i, i + 5));
  }

  return { inline_keyboard: rows };
}



function hoverPhotoKeyboard(photoCount: number) {
  const buttons = Array.from({ length: Math.min(photoCount, 20) }, (_, index) => ({
    text: `${index + 1}`,
    callback_data: `hover:${index}`,
  }));

  const rows = [];
  for (let i = 0; i < buttons.length; i += 5) {
    rows.push(buttons.slice(i, i + 5));
  }
  rows.push([{ text: "No hover photo", callback_data: "hover:none" }]);

  return { inline_keyboard: rows };
}


function duplicatePhotoKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "Replace", callback_data: "duplicate:replace" },
        { text: "Keep both", callback_data: "duplicate:keep" },
      ],
      [
        { text: "Cancel", callback_data: "duplicate:cancel" },
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



  if (query.data?.startsWith("settransmission:")) {
    const draft = await getDraft(chatId);
    if (!draft) {
      await sendTelegramMessage(chatId, "No active vehicle. Use /addcar.");
      return;
    }

    draft.transmission = query.data.slice("settransmission:".length);
    await saveDraft(chatId, draft);

    if (!draft.exterior) {
      await sendTelegramMessage(
        chatId,
        "Transmission saved. What is the <b>exterior color</b>? Example: Black, White, Silver."
      );
      return;
    }

    const missing = missingVehicleFields(draft);
    if (missing.length) {
      await sendTelegramMessage(
        chatId,
        `Still missing: <b>${escapeHtml(missing.join(", "))}</b>`
      );
      return;
    }

    normalizeDraftCardDetails(draft);
    draft.description = buildAutomaticDescription(draft);
    draft.step = "photos";
    await saveDraft(chatId, draft);

    await sendTelegramMessage(
      chatId,
      [
        "✅ Vehicle information complete.",
        "",
        `<b>${escapeHtml(draftSummary(draft))}</b>`,
        "",
        "Now send the vehicle photos.",
        "When finished, type /done.",
      ].join("\n")
    );
    return;
  }

  if (query.data?.startsWith("cover:")) {
    const selectedIndex = Number(query.data.slice("cover:".length));
    const draft = await getDraft(chatId);

    if (!draft) {
      await sendTelegramMessage(chatId, "No active vehicle. Use /addcar.");
      return;
    }

    const photos = draft.photos || [];
    if (
      !Number.isInteger(selectedIndex) ||
      selectedIndex < 0 ||
      selectedIndex >= photos.length
    ) {
      await sendTelegramMessage(chatId, "That cover photo is no longer available.");
      return;
    }

    draft.coverPhotoIndex = selectedIndex;
    draft.step = "hover";
    await saveDraft(chatId, draft);

    try {
      await sendTelegramPhotoAlbum(
        chatId,
        photos.slice(0, 10).map((url, index) => ({
          url,
          caption: `Photo #${index + 1}`,
        }))
      );
    } catch {
      // Keep the numbered controls available even if preview fails.
    }

    await sendTelegramMessage(
      chatId,
      [
        "Choose the <b>second photo</b> shown when the mouse passes over the card.",
        "",
        "Pick a clean photo, or choose No hover photo.",
      ].join("\n"),
      hoverPhotoKeyboard(photos.length)
    );
    return;

  }



  if (query.data?.startsWith("hover:")) {
    const draft = await getDraft(chatId);
    if (!draft) {
      await sendTelegramMessage(chatId, "No active vehicle. Use /addcar.");
      return;
    }

    const photos = draft.photos || [];
    const selection = query.data.slice("hover:".length);

    if (selection === "none") {
      draft.disableHoverPhoto = true;
      draft.hoverPhotoIndex = undefined;
    } else {
      const selectedIndex = Number(selection);
      if (
        !Number.isInteger(selectedIndex) ||
        selectedIndex < 0 ||
        selectedIndex >= photos.length
      ) {
        await sendTelegramMessage(chatId, "That hover photo is no longer available.");
        return;
      }
      draft.disableHoverPhoto = false;
      draft.hoverPhotoIndex = selectedIndex;
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
      `Price: ${Number(draft.price || 0).toLocaleString()}`,
      `Title: ${escapeHtml(draft.titleStatus || "")}`,
      draft.fuel ? `Fuel: ${escapeHtml(draft.fuel)}` : "",
      draft.transmission
        ? `Transmission: ${escapeHtml(draft.transmission)}`
        : "",
      draft.exterior ? `Exterior: ${escapeHtml(draft.exterior)}` : "",
      `Cover photo: #${(draft.coverPhotoIndex ?? 0) + 1}`,
      draft.disableHoverPhoto
        ? "Hover photo: disabled"
        : `Hover photo: #${(draft.hoverPhotoIndex ?? 0) + 1}`,
      `Photos: ${photos.length}`,
      "",
      `Description: ${escapeHtml(
        draft.description || buildAutomaticDescription(draft)
      )}`,
    ].join("\n");

    await sendTelegramMessage(chatId, summary, publishKeyboard());
    return;
  }


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
      ].join("\n"),
      mainMenuKeyboard()
    );
    return;
  }


  if (query.data?.startsWith("replacephotos:")) {
    const id = query.data.slice("replacephotos:".length);
    const vehicle = await getStoredVehicle(id);

    if (!vehicle) {
      await sendTelegramMessage(chatId, "Vehicle not found.");
      return;
    }

    await sendTelegramMessage(
      chatId,
      [
        "📸 <b>Replace photos</b>",
        "",
        `Vehicle: <b>${escapeHtml(
          [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ")
        )}</b>`,
        "",
        "What do you want to replace?",
      ].join("\n"),
      replacePhotosMenuKeyboard(id)
    );
    return;
  }

  if (query.data?.startsWith("replaceall:")) {
    const id = query.data.slice("replaceall:".length);
    const vehicle = await getStoredVehicle(id);

    if (!vehicle) {
      await sendTelegramMessage(chatId, "Vehicle not found.");
      return;
    }

    await deleteDraft(chatId);

    const photoDraft: BotDraft = {
      sessionId: `replace-${id}-${Date.now()}`,
      step: "replacephotos",
      editingVehicleId: id,
      photos: [],
      photoHashes: [],
    };

    await saveDraft(chatId, photoDraft);

    await sendTelegramMessage(
      chatId,
      [
        "📸 <b>Replace all photos</b>",
        "",
        "Send the complete new photo set.",
        "The first photo will become the cover.",
        "When finished, type /done.",
      ].join("\n")
    );
    return;
  }

  if (query.data?.startsWith("replaceone:")) {
    const id = query.data.slice("replaceone:".length);
    const vehicle = await getStoredVehicle(id);

    if (!vehicle) {
      await sendTelegramMessage(chatId, "Vehicle not found.");
      return;
    }

    const photos = storedVehiclePhotos(vehicle);
    if (!photos.length) {
      await sendTelegramMessage(chatId, "This vehicle has no stored photos.");
      return;
    }

    try {
      await sendTelegramPhotoAlbum(
        chatId,
        photos.slice(0, 10).map((url, index) => ({
          url,
          caption: `Photo #${index + 1}`,
        }))
      );
    } catch {}

    await sendTelegramMessage(
      chatId,
      [
        "Choose the photo you want to replace.",
        "",
        photos.length > 10
          ? "Preview shows the first 10 photos."
          : "Tap the matching number below.",
      ].join("\n"),
      replaceOnePhotoKeyboard(id, photos.length)
    );
    return;
  }

  if (query.data?.startsWith("replacepick:")) {
    const [, id, indexText] = query.data.split(":");
    const index = Number(indexText);
    const vehicle = await getStoredVehicle(id);

    if (!vehicle) {
      await sendTelegramMessage(chatId, "Vehicle not found.");
      return;
    }

    const photos = storedVehiclePhotos(vehicle);
    if (!Number.isInteger(index) || index < 0 || index >= photos.length) {
      await sendTelegramMessage(chatId, "That photo is no longer available.");
      return;
    }

    await deleteDraft(chatId);

    const photoDraft: BotDraft = {
      sessionId: `replace-one-${id}-${Date.now()}`,
      step: "replaceonephoto",
      editingVehicleId: id,
      replacePhotoIndex: index,
      photos: [],
      photoHashes: [],
    };

    await saveDraft(chatId, photoDraft);

    await sendTelegramMessage(
      chatId,
      `Send the new photo for <b>Photo #${index + 1}</b>.`
    );
    return;
  }

  if (query.data?.startsWith("replacecancel:")) {
    await deleteDraft(chatId);
    await sendTelegramMessage(chatId, "Photo replacement canceled.");
    return;
  }

  if (query.data?.startsWith("pickcover:")) {
    const id = query.data.slice("pickcover:".length);
    const vehicle = await getStoredVehicle(id);
    if (!vehicle) {
      await sendTelegramMessage(chatId, "Vehicle not found.");
      return;
    }

    const photos = storedVehiclePhotos(vehicle);
    if (!photos.length) {
      await sendTelegramMessage(chatId, "This vehicle has no stored photos.");
      return;
    }

    try {
      await sendTelegramPhotoAlbum(
        chatId,
        photos.slice(0, 10).map((url, index) => ({
          url,
          caption: `Photo #${index + 1}`,
        }))
      );
    } catch {
      // Keep the numbered controls available even if preview fails.
    }

    await sendTelegramMessage(
      chatId,
      "Choose which photo should be the website cover:",
      existingCoverKeyboard(vehicle.id, photos.length)
    );
    return;
  }

  if (query.data?.startsWith("setcover:")) {
    const payload = query.data.slice("setcover:".length);
    const separator = payload.lastIndexOf(":");
    if (separator <= 0) {
      await sendTelegramMessage(chatId, "Could not read that cover selection.");
      return;
    }

    const id = payload.slice(0, separator);
    const selectedIndex = Number(payload.slice(separator + 1));
    const vehicle = await getStoredVehicle(id);
    if (!vehicle) {
      await sendTelegramMessage(chatId, "Vehicle not found.");
      return;
    }

    const photos = storedVehiclePhotos(vehicle);
    if (
      !Number.isInteger(selectedIndex) ||
      selectedIndex < 0 ||
      selectedIndex >= photos.length
    ) {
      await sendTelegramMessage(chatId, "That cover photo is no longer available.");
      return;
    }

    const ordered = [...photos];
    const [selected] = ordered.splice(selectedIndex, 1);
    ordered.unshift(selected);

    for (const key of Object.keys(vehicle)) {
      if (/^photo\d+$/i.test(key)) delete vehicle[key];
    }
    ordered.forEach((url, index) => {
      vehicle[`photo${index + 1}`] = url;
    });

    await saveVehicle(vehicle);
    await sendTelegramMessage(chatId, "📷 Cover photo updated.");
    return;
  }



  if (query.data?.startsWith("pickhover:")) {
    const id = query.data.slice("pickhover:".length);
    const vehicle = await getStoredVehicle(id);
    if (!vehicle) {
      await sendTelegramMessage(chatId, "Vehicle not found.");
      return;
    }

    const photos = storedVehiclePhotos(vehicle);
    if (!photos.length) {
      await sendTelegramMessage(chatId, "This vehicle has no stored photos.");
      return;
    }

    try {
      await sendTelegramPhotoAlbum(
        chatId,
        photos.slice(0, 10).map((url, index) => ({
          url,
          caption: `Photo #${index + 1}`,
        }))
      );
    } catch {
      // Keep the numbered controls available even if preview fails.
    }

    await sendTelegramMessage(
      chatId,
      "Choose the photo shown when the mouse passes over the vehicle card:",
      existingHoverKeyboard(vehicle.id, photos.length)
    );
    return;
  }

  if (query.data?.startsWith("sethover:")) {
    const payload = query.data.slice("sethover:".length);
    const separator = payload.lastIndexOf(":");
    if (separator <= 0) {
      await sendTelegramMessage(chatId, "Could not read that hover selection.");
      return;
    }

    const id = payload.slice(0, separator);
    const selection = payload.slice(separator + 1);
    const vehicle = await getStoredVehicle(id);
    if (!vehicle) {
      await sendTelegramMessage(chatId, "Vehicle not found.");
      return;
    }

    const photos = storedVehiclePhotos(vehicle);
    if (selection === "none") {
      vehicle.cardHoverPhoto = "none";
      await saveVehicle(vehicle);
      await sendTelegramMessage(chatId, "🖼 Hover photo disabled.");
      return;
    }

    const selectedIndex = Number(selection);
    if (
      !Number.isInteger(selectedIndex) ||
      selectedIndex < 0 ||
      selectedIndex >= photos.length
    ) {
      await sendTelegramMessage(chatId, "That hover photo is no longer available.");
      return;
    }

    vehicle.cardHoverPhoto = photos[selectedIndex];
    await saveVehicle(vehicle);
    await sendTelegramMessage(chatId, "🖼 Hover photo updated.");
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


  if (query.data?.startsWith("duplicate:")) {
    const draft = await getDraft(chatId);
    if (!draft) {
      await sendTelegramMessage(chatId, "No active vehicle. Use /addcar.");
      return;
    }

    const action = query.data.slice("duplicate:".length);
    const pendingUrl = draft.pendingDuplicateUrl;
    const pendingHash = draft.pendingDuplicateHash;

    if (!pendingUrl || !pendingHash) {
      await sendTelegramMessage(chatId, "No duplicate photo is waiting for a decision.");
      return;
    }

    if (action === "cancel") {
      try {
        await deleteR2PhotoByUrl(pendingUrl);
      } catch {}
      draft.pendingDuplicateUrl = undefined;
      draft.pendingDuplicateHash = undefined;
      await saveDraft(chatId, draft);
      await sendTelegramMessage(chatId, "Duplicate photo canceled.");
      return;
    }

    if (action === "replace") {
      const idx = (draft.photoHashes || []).findIndex((hash) => hash === pendingHash);
      if (idx >= 0) {
        const oldUrl = draft.photos?.[idx];
        if (oldUrl && oldUrl !== pendingUrl) {
          try {
            await deleteR2PhotoByUrl(oldUrl);
          } catch {}
        }
        draft.photos[idx] = pendingUrl;
        draft.photoHashes![idx] = pendingHash;
      } else {
        draft.photos = [...(draft.photos || []), pendingUrl];
        draft.photoHashes = [...(draft.photoHashes || []), pendingHash];
      }
      draft.pendingDuplicateUrl = undefined;
      draft.pendingDuplicateHash = undefined;
      await saveDraft(chatId, draft);
      await sendTelegramMessage(chatId, "Duplicate photo replaced.");
      return;
    }

    if (action === "keep") {
      draft.photos = [...(draft.photos || []), pendingUrl];
      draft.photoHashes = [...(draft.photoHashes || []), pendingHash];
      draft.pendingDuplicateUrl = undefined;
      draft.pendingDuplicateHash = undefined;
      await saveDraft(chatId, draft);
      await sendTelegramMessage(chatId, "Both copies kept.");
      return;
    }
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
    await deleteSessionPhotos(draft.photos || []);
    await deleteDraft(chatId);
    await sendTelegramMessage(chatId, "Vehicle canceled.");
    return;
  }

  if (query.data === "publish") {
    const photos = draft.photos || [];
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

    normalizeDraftCardDetails(draft);
    const automaticDescription = buildAutomaticDescription(draft);
    draft.description = automaticDescription;

    const orderedPhotos = [...photos];
    const selectedCoverIndex = draft.coverPhotoIndex ?? 0;
    if (
      selectedCoverIndex > 0 &&
      selectedCoverIndex < orderedPhotos.length
    ) {
      const [selectedCover] = orderedPhotos.splice(selectedCoverIndex, 1);
      orderedPhotos.unshift(selectedCover);
    }

    const vehicle: StoredVehicle = {
      id,
      year: draft.year || "",
      make: draft.make || "",
      model: draft.model || "",
      mileage: draft.mileage || "",
      price: draft.price || "",
      exterior: draft.exterior || "",
      transmission: normalizeTransmission(draft.transmission || "") || draft.transmission || "",
      transmissionDetail: draft.transmissionDetail || "",
      fuel: draft.fuel || "",
      vin: draft.vin || "",
      status: "Available",
      description: automaticDescription,
      titleStatus: draft.titleStatus || "",
      trim: draft.trim || "",
      bodyClass: draft.bodyClass || "",
      driveType: draft.driveType || "",
      engine: draft.engine || "",
      cardHoverPhoto:
        draft.disableHoverPhoto
          ? "none"
          : photos[draft.hoverPhotoIndex ?? 1] || "none",
    };

    orderedPhotos.forEach((url, index) => {
      vehicle[`photo${index + 1}`] = url;
      const hash = draft.photoHashes?.[index];
      if (hash) vehicle[`photoHash${index + 1}`] = hash;
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
        `${orderedPhotos.length} photos`,
      ].join("\n")
    );
  }
}

async function handleMessage(message: TelegramMessage) {
  const chatId = message.chat?.id;
  if (!chatId) return;

  let text = message.text?.trim() ?? "";

  const menuCommandMap: Record<string, string> = {
    "➕ Add Car": "/addcar",
    "🚗 Inventory": "/inventory",
    "❌ Cancel": "/cancel",
    "❓ Help": "/help",
    "🆔 My ID": "/id",
  };

  if (menuCommandMap[text]) {
    text = menuCommandMap[text];
  }


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
        "",
        "Inside /inventory:",
        "✏️ Edit - change price, mileage, color, title and other details",
        "✅ Sold - mark a vehicle sold and remove it from active website inventory",
        "↩️ Restore - make a sold vehicle available again",
        "🗑 Delete - permanently delete the vehicle and its Blob photos",
      ].join("\n"),
      mainMenuKeyboard()
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
        "",
        "Inside /inventory:",
        "✏️ Edit - change vehicle details",
        "✅ Sold - remove from active website inventory",
        "↩️ Restore - make a sold vehicle available again",
        "📷 Cover - choose the website cover photo",
        "🖼 Hover - choose the mouse-over photo or disable it",
        "🗑 Delete - permanently remove the vehicle",
      ].join("\n"),
      mainMenuKeyboard()
    );
    return;
  }

  if (text === "/id") {
    await sendTelegramMessage(chatId, `Chat ID: <code>${chatId}</code>`);
    return;
  }

  if (text === "/cancel") {
    const draft = await getDraft(chatId);
    if (draft) await deleteSessionPhotos(draft.photos || []);
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



  if (draft.step === "replaceonephoto") {
    const id = draft.editingVehicleId;
    const index = draft.replacePhotoIndex;

    if (!id || !Number.isInteger(index)) {
      await deleteDraft(chatId);
      await sendTelegramMessage(chatId, "Photo replacement session expired. Use /inventory.");
      return;
    }

    if (!message.photo?.length) {
      await sendTelegramMessage(chatId, `Send one new photo for Photo #${Number(index) + 1}.`);
      return;
    }

    const vehicle = await getStoredVehicle(id);
    if (!vehicle) {
      await deleteDraft(chatId);
      await sendTelegramMessage(chatId, "Vehicle not found.");
      return;
    }

    const largest = [...message.photo].sort(
      (a, b) => (b.file_size || 0) - (a.file_size || 0)
    )[0];

    const uploaded = await uploadTelegramPhoto(
      draft.sessionId,
      message.message_id,
      largest
    );

    const photoNumber = Number(index) + 1;
    const oldUrl = vehicle[`photo${photoNumber}`];

    vehicle[`photo${photoNumber}`] = uploaded.url;
    vehicle[`photoHash${photoNumber}`] = uploaded.sha256;

    if (photoNumber === 1) {
      vehicle.studioCover = "";
    }
    if (photoNumber === 2 || vehicle.cardHoverPhoto === oldUrl) {
      vehicle.cardHoverPhoto = photoNumber === 2 ? uploaded.url : vehicle.cardHoverPhoto;
    }

    await saveVehicle(vehicle);
    await deleteDraft(chatId);

    if (typeof oldUrl === "string") {
      try {
        await deleteR2PhotoByUrl(oldUrl);
      } catch {}
    }

    await sendTelegramMessage(
      chatId,
      `✅ Photo #${photoNumber} replaced successfully.`
    );
    return;
  }


  if (draft.step === "replacephotos") {
    const id = draft.editingVehicleId;
    if (!id) {
      await deleteSessionPhotos(draft.photos || []);
      await deleteDraft(chatId);
      await sendTelegramMessage(chatId, "Photo replacement session expired. Use /inventory.");
      return;
    }

    if (message.photo?.length) {
      const largest = [...message.photo].sort(
        (a, b) => (b.file_size || 0) - (a.file_size || 0)
      )[0];

      const uploaded = await uploadTelegramPhoto(
        draft.sessionId,
        message.message_id,
        largest
      );

      const hashes = draft.photoHashes || [];
      if (hashes.includes(uploaded.sha256)) {
        draft.pendingDuplicateUrl = uploaded.url;
        draft.pendingDuplicateHash = uploaded.sha256;
        await saveDraft(chatId, draft);

        await sendTelegramMessage(
          chatId,
          "⚠️ This photo is already in the current set. What do you want to do?",
          duplicatePhotoKeyboard()
        );
        return;
      }

      draft.photos = [...(draft.photos || []), uploaded.url];
      draft.photoHashes = [...hashes, uploaded.sha256];
      await saveDraft(chatId, draft);

      return;
    }

    if (text === "/done") {
      const photos = draft.photos || [];
      if (!photos.length) {
        await sendTelegramMessage(
          chatId,
          "Send at least one new photo before /done."
        );
        return;
      }

      const vehicle = await getStoredVehicle(id);
      if (!vehicle) {
        await deleteSessionPhotos(photos);
        await deleteDraft(chatId);
        await sendTelegramMessage(chatId, "Vehicle not found.");
        return;
      }

      const oldPhotos = storedVehiclePhotos(vehicle);

      for (const key of Object.keys(vehicle)) {
        if (/^photo\d+$/i.test(key) || /^photoHash\d+$/i.test(key)) delete vehicle[key];
      }

      photos.forEach((url, index) => {
        vehicle[`photo${index + 1}`] = url;
        const hash = draft.photoHashes?.[index];
        if (hash) vehicle[`photoHash${index + 1}`] = hash;
      });

      vehicle.cardHoverPhoto = photos[1] || "none";
      vehicle.studioCover = "";

      await saveVehicle(vehicle);
      await deleteDraft(chatId);

      await Promise.all(
        oldPhotos.map(async (url) => {
          try {
            await deleteR2PhotoByUrl(url);
          } catch {
            // Old photos may belong to the previous Blob store; ignore cleanup failures.
          }
        })
      );

      await sendTelegramMessage(
        chatId,
        [
          "✅ <b>Photos replaced</b>",
          "",
          `${photos.length} new photo${photos.length === 1 ? "" : "s"} saved.`,
          "The first photo is now the cover.",
          photos.length > 1
            ? "The second photo is now the hover photo."
            : "Hover photo is disabled.",
        ].join("\n")
      );
      return;
    }

    await sendTelegramMessage(
      chatId,
      "Send the new photos, then type /done when finished."
    );
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

      normalizeDraftCardDetails(draft);
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

    // If mileage is still missing, accept a plain number such as "137,480"
    // when the message itself looks like a mileage value.
    if (!draft.mileage) {
      const bareNumber = text.trim();
      if (/^\d{1,3}(?:,\d{3})+$/.test(bareNumber) || /^\d{4,6}$/.test(bareNumber)) {
        draft.mileage = bareNumber.replace(/,/g, "");
      }
    }

    // Also handle messages like "137,480, price 4499, clean title":
    // the first standalone number is treated as mileage when price is explicitly labeled.
    if (!draft.mileage && /(?:price|precio)\s*[:=-]?\s*\$?\s*[\d,.]+/i.test(text)) {
      const firstNumber = text.match(/^\s*([\d]{1,3}(?:,\d{3})+|\d{4,6})\b/);
      if (firstNumber?.[1]) {
        draft.mileage = firstNumber[1].replace(/,/g, "");
      }
    }

    const missing = missingVehicleFields(draft);

    if (missing.length) {
      await saveDraft(chatId, draft);

      if (!draft.transmission) {
        await sendTelegramMessage(
          chatId,
          [
            "I understood this so far:",
            "",
            `<b>${escapeHtml(draftSummary(draft) || "No structured data yet")}</b>`,
            "",
            "I could not confirm the <b>transmission</b>. Which one is it?",
          ].join("\n"),
          transmissionKeyboard()
        );
        return;
      }

      if (!draft.exterior) {
        await sendTelegramMessage(
          chatId,
          [
            "I understood this so far:",
            "",
            `<b>${escapeHtml(draftSummary(draft) || "No structured data yet")}</b>`,
            "",
            "What is the <b>exterior color</b>? Example: Black, White, Silver.",
          ].join("\n")
        );
        return;
      }

      await sendTelegramMessage(
        chatId,
        [
          "I understood this so far:",
          "",
          `<b>${escapeHtml(draftSummary(draft) || "No structured data yet")}</b>`,
          "",
          `Still missing: <b>${escapeHtml(missing.join(", "))}</b>`,
          "",
          "Send only the missing information. For example: fuel gasoline, engine 4 cyl 2.5L.",
        ].join("\n")
      );
      return;
    }

    normalizeDraftCardDetails(draft);
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
      const normalized = normalizeTransmission(decoded.transmission);
      draft.transmission = normalized || decoded.transmission;
      draft.transmissionDetail = normalized && decoded.transmission !== normalized ? decoded.transmission : "";
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
      const uploaded = await uploadTelegramPhoto(
        draft.sessionId,
        message.message_id,
        largest
      );

      const hashes = draft.photoHashes || [];
      if (hashes.includes(uploaded.sha256)) {
        draft.pendingDuplicateUrl = uploaded.url;
        draft.pendingDuplicateHash = uploaded.sha256;
        await saveDraft(chatId, draft);
        await sendTelegramMessage(
          chatId,
          "⚠️ This photo is already in the current set. What do you want to do?",
          duplicatePhotoKeyboard()
        );
        return;
      }

      draft.photos = [...(draft.photos || []), uploaded.url];
      draft.photoHashes = [...hashes, uploaded.sha256];
      await saveDraft(chatId, draft);
      return;
    }

    if (text === "/done") {
      const photos = draft.photos || [];
      if (!photos.length) {
        await sendTelegramMessage(
          chatId,
          "Send at least one vehicle photo before /done."
        );
        return;
      }

      if (photos.length === 1) {
        draft.coverPhotoIndex = 0;
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
          `Price: ${Number(draft.price || 0).toLocaleString()}`,
          `Title: ${escapeHtml(draft.titleStatus || "")}`,
          draft.fuel ? `Fuel: ${escapeHtml(draft.fuel)}` : "",
          draft.transmission
            ? `Transmission: ${escapeHtml(draft.transmission)}`
            : "",
          draft.exterior ? `Exterior: ${escapeHtml(draft.exterior)}` : "",
          "Cover photo: #1",
          "Photos: 1",
          "",
          `Description: ${escapeHtml(
            draft.description || buildAutomaticDescription(draft)
          )}`,
        ].join("\n");

        await sendTelegramMessage(chatId, summary, publishKeyboard());
        return;
      }

      draft.step = "cover";
      await saveDraft(chatId, draft);

      try {
        await sendTelegramPhotoAlbum(
          chatId,
          photos.slice(0, 10).map((url, index) => ({
            url,
            caption: `Photo #${index + 1}`,
          }))
        );
      } catch {
        // If Telegram cannot render the preview album, still show number buttons.
      }

      await sendTelegramMessage(
        chatId,
        [
          "Choose the <b>cover photo</b>.",
          "",
          photos.length > 10
            ? "Preview shows the first 10. All uploaded photos are still saved."
            : "Tap the number that should appear first on the website.",
        ].join("\n"),
        coverPhotoKeyboard(photos.length)
      );
      return;
    }

    await sendTelegramMessage(
      chatId,
      "Send photos, then type /done when you are finished."
    );
    return;
  }

  if (draft.step === "cover") {
    await sendTelegramMessage(
      chatId,
      "Choose the cover photo using one of the numbered buttons above."
    );
    return;
  }

  if (draft.step === "hover") {
    await sendTelegramMessage(
      chatId,
      "Choose the hover photo, or select No hover photo."
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
    let telegramWebhookUrl: string | null = null;
    try {
      const token = process.env.TELEGRAM_BOT_TOKEN;
      if (token) {
        const infoRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
        if (infoRes.ok) {
          const info = await infoRes.json();
          telegramWebhookUrl = info?.result?.url || null;
        }
      }
    } catch {
      // Diagnostic only; never expose the bot token.
    }

    return res.status(200).json({
      ok: true,
      vercelEnv: process.env.VERCEL_ENV ?? null,
      hasBotToken: Boolean(process.env.TELEGRAM_BOT_TOKEN),
      hasWebhookSecret: Boolean(process.env.TELEGRAM_WEBHOOK_SECRET),
      hasBlobToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      hasRedisUrl: Boolean(
        process.env.UPSTASH_REDIS_KV_REST_API_URL ||
        process.env.UPSTASH_REDIS_REST_URL ||
        process.env.KV_REST_API_URL
      ),
      hasRedisToken: Boolean(
        process.env.UPSTASH_REDIS_KV_REST_API_TOKEN ||
        process.env.UPSTASH_REDIS_REST_TOKEN ||
        process.env.KV_REST_API_TOKEN
      ),
      telegramWebhookUrl,
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
