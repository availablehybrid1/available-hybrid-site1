import { Redis } from "@upstash/redis";
import { deleteR2PhotoByUrl } from "./r2Photos";

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
  transmissionDetail?: string;
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

const VEHICLE_IDS_KEY = "available-hybrid:inventory:vehicle-ids";

function redisClient() {
  const url =
    process.env.UPSTASH_REDIS_KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    throw new Error("Upstash Redis environment variables are not configured");
  }

  return new Redis({ url, token });
}

function draftKey(chatId: number | string) {
  return `available-hybrid:draft:${chatId}`;
}

function vehicleKey(id: string) {
  return `available-hybrid:vehicle:${id}`;
}

export async function saveDraft(
  chatId: number | string,
  draft: BotDraft
): Promise<void> {
  const redis = redisClient();
  await redis.set(draftKey(chatId), draft, { ex: 60 * 60 * 24 * 7 });
}

export async function getDraft(
  chatId: number | string
): Promise<BotDraft | null> {
  const redis = redisClient();
  return (await redis.get<BotDraft>(draftKey(chatId))) ?? null;
}

export async function deleteDraft(chatId: number | string): Promise<void> {
  const redis = redisClient();
  await redis.del(draftKey(chatId));
}

export async function getStoredVehicle(
  id: string
): Promise<StoredVehicle | null> {
  const redis = redisClient();
  return (await redis.get<StoredVehicle>(vehicleKey(id))) ?? null;
}

export async function saveVehicle(vehicle: StoredVehicle): Promise<void> {
  const redis = redisClient();
  await Promise.all([
    redis.set(vehicleKey(vehicle.id), vehicle),
    redis.sadd(VEHICLE_IDS_KEY, vehicle.id),
  ]);
}

export async function deleteStoredVehicle(
  id: string,
  deletePhotos = true
): Promise<boolean> {
  const redis = redisClient();
  const vehicle = await getStoredVehicle(id);

  if (!vehicle) {
    await redis.srem(VEHICLE_IDS_KEY, id);
    return false;
  }

  if (deletePhotos) {
    const photoUrls = Object.entries(vehicle)
      .filter(
        ([key, value]) =>
          /^photo\d+$/i.test(key) &&
          typeof value === "string" &&
          value.startsWith("http")
      )
      .map(([, value]) => String(value));

    if (photoUrls.length) {
      await Promise.all(
        photoUrls.map(async (url) => {
          try {
            await deleteR2PhotoByUrl(url);
          } catch {
            // Vehicle metadata must still be removable if an image cannot be removed.
          }
        })
      );
    }
  }

  await Promise.all([
    redis.del(vehicleKey(id)),
    redis.srem(VEHICLE_IDS_KEY, id),
  ]);
  return true;
}

export async function listStoredVehicles(): Promise<StoredVehicle[]> {
  const redis = redisClient();
  const ids = await redis.smembers<string[]>(VEHICLE_IDS_KEY);
  if (!ids?.length) return [];

  const vehicles = await Promise.all(
    ids.map((id) => redis.get<StoredVehicle>(vehicleKey(id)))
  );

  return vehicles.filter((vehicle): vehicle is StoredVehicle => Boolean(vehicle?.id));
}
