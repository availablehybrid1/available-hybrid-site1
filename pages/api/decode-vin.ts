// pages/api/decode-vin.ts
import type { NextApiRequest, NextApiResponse } from "next";

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
    };

    return res.status(200).json(simplified);
  } catch (err) {
    console.error("VIN decode error:", err);
    return res.status(500).json({ error: "Failed to decode VIN" });
  }
}
