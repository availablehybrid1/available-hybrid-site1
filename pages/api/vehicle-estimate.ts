import type { NextApiRequest, NextApiResponse } from "next";

function roundTo50(value: number) {
  return Math.max(0, Math.round(value / 50) * 50);
}

function originalValueEstimate(make: string, bodyClass: string, fuel: string) {
  const luxuryMakes = new Set([
    "ACURA", "AUDI", "BMW", "CADILLAC", "GENESIS", "INFINITI",
    "LEXUS", "LINCOLN", "MERCEDES-BENZ", "PORSCHE", "VOLVO"
  ]);

  const premiumElectric = new Set(["TESLA", "RIVIAN", "LUCID"]);

  let base = 29000;
  const body = bodyClass.toLowerCase();

  if (/pickup|truck/.test(body)) base = 39000;
  else if (/sport utility|suv|crossover/.test(body)) base = 34000;
  else if (/minivan|van/.test(body)) base = 33000;
  else if (/coupe|convertible/.test(body)) base = 33000;
  else if (/wagon|hatchback/.test(body)) base = 28000;

  if (luxuryMakes.has(make.toUpperCase())) base *= 1.55;
  if (premiumElectric.has(make.toUpperCase())) base *= 1.75;
  if (/electric/i.test(fuel)) base *= 1.18;
  if (/hybrid/i.test(fuel)) base *= 1.08;

  return base;
}

function estimateDealerRange(args: {
  year: number;
  mileage: number;
  make: string;
  bodyClass: string;
  fuel: string;
  nhtsaBasePrice: number;
  titleStatus: string;
  condition: string;
}) {
  const currentYear = new Date().getFullYear();
  const age = Math.max(0, currentYear - args.year);

  const originalValue =
    args.nhtsaBasePrice > 5000 && args.nhtsaBasePrice < 250000
      ? args.nhtsaBasePrice
      : originalValueEstimate(args.make, args.bodyClass, args.fuel);

  // Broad depreciation curve for a preliminary estimate only.
  const ageFactor = Math.max(0.12, Math.pow(0.90, age));
  let estimatedRetail = originalValue * ageFactor;

  // Compare mileage with a simple 12,000 miles/year expectation.
  const expectedMiles = Math.max(12000, age * 12000);
  const mileageDifference = args.mileage - expectedMiles;
  const mileageAdjustment = Math.max(
    -0.22,
    Math.min(0.18, -(mileageDifference / 10000) * 0.025)
  );
  estimatedRetail *= 1 + mileageAdjustment;

  const titleFactors: Record<string, number> = {
    clean: 1,
    rebuilt: 0.72,
    salvage: 0.55,
  };

  const conditionFactors: Record<string, [number, number]> = {
    excellent: [0.80, 0.88],
    good: [0.72, 0.82],
    fair: [0.60, 0.72],
    needs_repair: [0.40, 0.58],
    not_running: [0.22, 0.40],
  };

  const titleFactor = titleFactors[args.titleStatus] ?? 1;
  const conditionFactor =
    conditionFactors[args.condition] || conditionFactors.good;

  // Dealer-buy range, not consumer retail value.
  const low = estimatedRetail * titleFactor * conditionFactor[0];
  const high = estimatedRetail * titleFactor * conditionFactor[1];

  return {
    low: roundTo50(low),
    high: roundTo50(Math.max(low, high)),
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const vin = String(req.body?.vin || "")
    .toUpperCase()
    .replace(/[^A-HJ-NPR-Z0-9]/g, "");
  const mileage = Number(req.body?.mileage || 0);
  const titleStatus = String(req.body?.titleStatus || "clean");
  const condition = String(req.body?.condition || "good");

  if (vin.length !== 17 || !Number.isFinite(mileage) || mileage <= 0) {
    return res.status(400).json({ error: "Invalid VIN or mileage." });
  }

  try {
    const response = await fetch(
      "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/" +
        encodeURIComponent(vin) +
        "?format=json",
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "AvailableHybridVehicleEstimator/1.0",
        },
      }
    );

    if (!response.ok) {
      return res.status(502).json({
        error: "Vehicle information is temporarily unavailable.",
      });
    }

    const data = await response.json();
    const vehicle = data?.Results?.[0] ?? {};

    const year = Number(vehicle.ModelYear || 0);
    const make = String(vehicle.Make || "").trim();
    const model = String(vehicle.Model || "").trim();
    const trim = String(vehicle.Trim || "").trim();
    const bodyClass = String(vehicle.BodyClass || "").trim();
    const fuel = String(
      vehicle.ElectrificationLevel || vehicle.FuelTypePrimary || ""
    ).trim();
    const nhtsaBasePrice = Number(vehicle.BasePrice || 0);

    if (!year || !make || !model) {
      return res.status(404).json({
        error: "We could not identify enough vehicle information from this VIN.",
      });
    }

    const range = estimateDealerRange({
      year,
      mileage,
      make,
      bodyClass,
      fuel,
      nhtsaBasePrice,
      titleStatus,
      condition,
    });

    return res.status(200).json({
      low: range.low,
      high: range.high,
      vehicle: {
        year,
        make,
        model,
        trim,
        bodyClass,
        fuel,
      },
      source: "NHTSA VIN data + Available Hybrid preliminary estimator",
    });
  } catch (error) {
    console.error("Vehicle estimate failure", error);
    return res.status(500).json({
      error: "Vehicle estimate is temporarily unavailable.",
    });
  }
}
