// pages/api/decode-vin.ts
import type { NextApiRequest, NextApiResponse } from "next";

type FuelEconomyVehicle = {
  id?: string | number;
  city08?: string | number;
  highway08?: string | number;
  comb08?: string | number;
  trany?: string;
  drive?: string;
  cylinders?: string | number;
  displ?: string | number;
};

async function getFuelEconomyMpg(decoded: any) {
  const year = String(decoded.ModelYear || "").trim();
  const make = String(decoded.Make || "").trim();
  const model = String(decoded.Model || "").trim();

  if (!year || !make || !model) return null;

  try {
    const params = new URLSearchParams({ year, make, model });
    const menuRes = await fetch(
      `https://www.fueleconomy.gov/ws/rest/vehicle/menu/options?${params.toString()}`,
      { headers: { Accept: "application/json" } }
    );

    if (!menuRes.ok) return null;

    const menuJson = await menuRes.json();
    const rawItems = menuJson?.menuItem;
    const items = Array.isArray(rawItems)
      ? rawItems
      : rawItems
      ? [rawItems]
      : [];

    const ids = items
      .map((item: any) => String(item?.value || "").trim())
      .filter(Boolean)
      .slice(0, 12);

    if (!ids.length) return null;

    const candidates = await Promise.all(
      ids.map(async (id: string) => {
        try {
          const vehicleRes = await fetch(
            `https://www.fueleconomy.gov/ws/rest/vehicle/${encodeURIComponent(id)}`,
            { headers: { Accept: "application/json" } }
          );
          if (!vehicleRes.ok) return null;
          return (await vehicleRes.json()) as FuelEconomyVehicle;
        } catch {
          return null;
        }
      })
    );

    const valid = candidates.filter(Boolean) as FuelEconomyVehicle[];
    if (!valid.length) return null;

    const wantedCyl = Number(decoded.EngineCylinders || 0);
    const wantedDispl = Number(decoded.DisplacementL || 0);
    const wantedDrive = String(decoded.DriveType || "").toLowerCase();
    const wantedTrans = String(decoded.TransmissionStyle || "").toLowerCase();

    const score = (v: FuelEconomyVehicle) => {
      let total = 0;

      if (wantedCyl && Number(v.cylinders || 0) === wantedCyl) total += 4;

      if (
        wantedDispl &&
        Number.isFinite(Number(v.displ)) &&
        Math.abs(Number(v.displ) - wantedDispl) < 0.2
      ) {
        total += 4;
      }

      const drive = String(v.drive || "").toLowerCase();
      if (
        wantedDrive &&
        ((wantedDrive.includes("all") && drive.includes("all")) ||
          (wantedDrive.includes("4") && drive.includes("4")) ||
          (wantedDrive.includes("front") && drive.includes("front")) ||
          (wantedDrive.includes("rear") && drive.includes("rear")))
      ) {
        total += 3;
      }

      const trany = String(v.trany || "").toLowerCase();
      if (
        wantedTrans &&
        ((wantedTrans.includes("automatic") && trany.includes("auto")) ||
          (wantedTrans.includes("manual") && trany.includes("manual")))
      ) {
        total += 2;
      }

      return total;
    };

    const best = valid
      .map((v) => ({ v, score: score(v) }))
      .sort((a, b) => b.score - a.score)[0]?.v;

    if (!best) return null;

    const city = Number(best.city08 || 0);
    const highway = Number(best.highway08 || 0);
    const combined = Number(best.comb08 || 0);

    if (!city && !highway && !combined) return null;

    return {
      mpgCity: city || null,
      mpgHighway: highway || null,
      mpgCombined: combined || null,
      mpgSource: "FuelEconomy.gov",
    };
  } catch {
    return null;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { vin } = req.query;

  if (!vin || typeof vin !== "string") {
    return res.status(400).json({ error: "VIN is required" });
  }

  try {
    // Usamos el API público de NHTSA (no necesita key)
    const apiRes = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvaluesextended/${encodeURIComponent(
        vin
      )}?format=json`
    );

    if (!apiRes.ok) {
      return res
        .status(500)
        .json({ error: "Error contacting VIN decode service" });
    }

    const data = await apiRes.json();
    const result = data?.Results?.[0] ?? {};

    const mpg = await getFuelEconomyMpg(result);

    const simplified = {
      make: result.Make || null,
      model: result.Model || null,
      modelYear: result.ModelYear || null,
      trim: result.Trim || null,
      bodyClass: result.BodyClass || null,
      engineCylinders: result.EngineCylinders || null,
      engineDisplacementL: result.DisplacementL || null,
      transmission: result.TransmissionStyle || null,
      driveType: result.DriveType || null,
      mpgCity: mpg?.mpgCity ?? null,
      mpgHighway: mpg?.mpgHighway ?? null,
      mpgCombined: mpg?.mpgCombined ?? null,
      mpgSource: mpg?.mpgSource ?? null,
    };

    return res.status(200).json(simplified);
  } catch (err) {
    console.error("VIN decode error:", err);
    return res.status(500).json({ error: "Failed to decode VIN" });
  }
}
