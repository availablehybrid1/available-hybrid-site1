import { del, list, put } from "@vercel/blob";

export type BotDraft = {
  sessionId: string;
  step:
    | "vin"
    | "mileage"
    | "price"
    | "title"
    | "exterior"
    | "notes"
    | "photos"
    | "confirm";
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

export async function saveVehicle(vehicle: StoredVehicle): Promise<void> {
  await put(
    `inventory/vehicles/${vehicle.id}.json`,
    JSON.stringify(vehicle),
    {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
      cacheControlMaxAge: 60,
    }
  );
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
