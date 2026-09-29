import { createHash } from "crypto";
import { list } from "@vercel/blob";

export type StudioCover = { vehicleId: string; sourceUrl: string; coverUrl: string };
export function studioKey(vehicleId: string, sourceUrl: string) {
  return createHash("sha256").update(JSON.stringify([vehicleId, sourceUrl])).digest("hex");
}
export async function listStudioCovers(): Promise<Map<string, StudioCover>> {
  const covers = new Map<string, StudioCover>();
  if (!process.env.PHOTO_WORKER_TOKEN) return covers;
  let cursor: string | undefined;
  do {
    const result = await list({ prefix: "inventory/studio-covers/", limit: 1000, cursor });
    await Promise.all(result.blobs.filter(b => b.pathname.endsWith(".json")).map(async b => {
      const response = await fetch(b.url, { cache: "no-store" });
      if (!response.ok) throw new Error("Cannot read studio cover record");
      const cover = await response.json() as StudioCover;
      if (typeof cover.vehicleId !== "string" || typeof cover.sourceUrl !== "string" ||
          typeof cover.coverUrl !== "string" || !cover.coverUrl.startsWith("https://")) return;
      const key = studioKey(cover.vehicleId, cover.sourceUrl);
      if (b.pathname === `inventory/studio-covers/${key}.json`) covers.set(key, cover);
    }));
    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor);
  return covers;
}
