import type { NextApiRequest, NextApiResponse } from "next";
import { createHash, timingSafeEqual } from "crypto";
import { put, del } from "@vercel/blob";
import { getStoredVehicle, listStoredVehicles } from "../../lib/blobInventory";
import { listStudioCovers, studioKey } from "../../lib/photoProcessing";

export const config = { api: { bodyParser: { sizeLimit: "4mb" } } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");
  const token = process.env.PHOTO_WORKER_TOKEN?.trim();
  if (!token || token.length < 32) return res.status(503).json({ error: "Worker not configured" });
  const supplied = req.headers.authorization?.replace(/^Bearer /, "") || "";
  const hash = (s: string) => createHash("sha256").update(s).digest();
  if (!timingSafeEqual(hash(token), hash(supplied))) return res.status(401).json({ error: "Unauthorized" });
  try {
    const covers = await listStudioCovers();
    if (req.method === "GET") {
      const vehicles = await listStoredVehicles();
      const jobs = vehicles.filter(v => v.status.toLowerCase() !== "sold" &&
        v.photo1?.startsWith("https://") && !covers.has(studioKey(v.id, v.photo1)))
        .slice(0, 3).map(v => ({ vehicleId: v.id, sourceUrl: v.photo1 }));
      return res.status(200).json({ jobs });
    }
    if (req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({ error: "Method not allowed" });
    }
    const { vehicleId, sourceUrl, imageBase64 } = req.body || {};
    if (typeof vehicleId !== "string" || typeof sourceUrl !== "string" ||
        typeof imageBase64 !== "string" || imageBase64.length > 4000000 ||
        !/^[A-Za-z0-9+/]+={0,2}$/.test(imageBase64)) {
      return res.status(400).json({ error: "Invalid upload" });
    }
    const vehicle = await getStoredVehicle(vehicleId);
    if (!vehicle || vehicle.status.toLowerCase() === "sold" || vehicle.photo1 !== sourceUrl) {
      return res.status(409).json({ error: "Vehicle or cover changed" });
    }
    const key = studioKey(vehicleId, sourceUrl);
    if (covers.has(key)) return res.status(200).json({ coverUrl: covers.get(key)!.coverUrl });
    const bytes = Buffer.from(imageBase64, "base64");
    const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    if (bytes.length > 3000000 || bytes.length < 24 || !bytes.subarray(0, 8).equals(pngSignature)) {
      return res.status(400).json({ error: "Expected PNG under 3 MB" });
    }
    const image = await put(`inventory/studio-images/${key}.png`, bytes, {
      access: "public", addRandomSuffix: true, contentType: "image/png",
    });
    // Check again after upload; never attach a stale result to a changed car.
    const current = await getStoredVehicle(vehicleId);
    if (!current || current.photo1 !== sourceUrl || current.status.toLowerCase() === "sold") {
      await del(image.url);
      return res.status(409).json({ error: "Vehicle or cover changed" });
    }
    try {
      await put(`inventory/studio-covers/${key}.json`, JSON.stringify({
        vehicleId, sourceUrl, coverUrl: image.url,
      }), { access: "public", addRandomSuffix: false, contentType: "application/json", cacheControlMaxAge: 60 });
    } catch (error) {
      await del(image.url).catch(() => undefined);
      throw error;
    }
    await res.revalidate("/inventory").catch(() => undefined);
    return res.status(200).json({ coverUrl: image.url });
  } catch (error) {
    console.error("Photo worker request failed", error);
    return res.status(500).json({ error: "Photo processing request failed" });
  }
}
