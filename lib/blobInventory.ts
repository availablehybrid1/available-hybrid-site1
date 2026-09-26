import { del, list, put } from "@vercel/blob";

export type BotDraft = {
  sessionId: string;
  step:
    | "details"
    | "vin"
    | "mileage"
    | "price"
    | "title"
    | "exterior"
    | "notes"
    | "photos"
    | "cover"
    | "hover"
    | "confirm"
    | "edit";
  vin?: string;
  year?: string;
  make?: string;
  model?: string;
  transmission?: string;
  mileage?: string;
  price?: string;
  titleStatus?: string;
  exterior?: string;
  fuel?: string;
  trim?: string;
  bodyClass?: string;
  driveType?: string;
  engine?: string;
  notes?: string;
  description?: string;
  photos: string[];
  editingVehicleId?: string;
  coverPhotoIndex?: number;
  hoverPhotoIndex?: number;
  disableHoverPhoto?: boolean;
};

export type StoredVehicle = {
  id: string;
  year: string;
  make: string;
  model: string;
  mileage: string;
  price: string;
  exterior: string;
  transmission: string;
  fuel: string;
  vin: string;
  status: string;
  description: string;
  [key: string]: string;
};

function draftPrefix(chatId: number | string) {
  return `telegram/drafts/${chatId}/`;
}

export async function saveDraft(
  chatId: number | string,
  draft: BotDraft
): Promise<void> {
  const path = `${draftPrefix(chatId)}${Date.now()}.json`;
  await put(path, JSON.stringify(draft), {
    access: "public",
    addRandomSuffix: true,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
}

export async function getDraft(
  chatId: number | string
): Promise<BotDraft | null> {
  const result = await list({ prefix: draftPrefix(chatId), limit: 100 });
  const blob = [...result.blobs]
    .filter((b) => b.pathname.endsWith(".json"))
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0];

  if (!blob) return null;

  const res = await fetch(`${blob.url}?v=${Date.now()}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as BotDraft;
}

export async function deleteDraft(chatId: number | string): Promise<void> {
  const result = await list({ prefix: draftPrefix(chatId), limit: 100 });
  if (result.blobs.length) {
    await del(result.blobs.map((b) => b.url));
  }
}

function vehiclePath(id: string) {
  return `inventory/vehicles/${id}.json`;
}

export async function getStoredVehicle(
  id: string
): Promise<StoredVehicle | null> {
  const result = await list({ prefix: vehiclePath(id), limit: 10 });
  const blob = result.blobs.find((b) => b.pathname === vehiclePath(id));
  if (!blob) return null;

  try {
    const res = await fetch(`${blob.url}?v=${Date.now()}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as StoredVehicle;
  } catch {
    return null;
  }
}

export async function saveVehicle(vehicle: StoredVehicle): Promise<void> {
  const path = vehiclePath(vehicle.id);
  const existing = await list({ prefix: path, limit: 10 });
  const oldBlob = existing.blobs.find((b) => b.pathname === path);
  if (oldBlob) await del(oldBlob.url);

  await put(path, JSON.stringify(vehicle), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
}

export async function deleteStoredVehicle(
  id: string,
  deletePhotos = true
): Promise<boolean> {
  const vehicle = await getStoredVehicle(id);
  const result = await list({ prefix: vehiclePath(id), limit: 10 });
  const blob = result.blobs.find((b) => b.pathname === vehiclePath(id));

  if (deletePhotos && vehicle) {
    const photoUrls = Object.entries(vehicle)
      .filter(
        ([key, value]) =>
          key.toLowerCase().startsWith("photo") &&
          typeof value === "string" &&
          value.startsWith("http")
      )
      .map(([, value]) => String(value));

    if (photoUrls.length) {
      try {
        await del(photoUrls);
      } catch {
        // Keep deleting the inventory record even if an old photo is missing.
      }
    }
  }

  if (blob) {
    await del(blob.url);
    return true;
  }
  return false;
}

export async function listStoredVehicles(): Promise<StoredVehicle[]> {
  const result = await list({ prefix: "inventory/vehicles/", limit: 1000 });
  const vehicles: StoredVehicle[] = [];

  for (const blob of result.blobs) {
    if (!blob.pathname.endsWith(".json")) continue;
    try {
      const res = await fetch(`${blob.url}?v=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) continue;
      vehicles.push((await res.json()) as StoredVehicle);
    } catch {
      // Ignore a malformed inventory blob and keep loading the rest.
    }
  }

  return vehicles;
}
