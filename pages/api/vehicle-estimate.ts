import type { NextApiRequest, NextApiResponse } from "next";

function roundTo50(value: number) {
  return Math.max(0, Math.round(value / 50) * 50);
}

function dealerOfferRange(marketPrice: number, titleStatus: string, condition: string) {
  const conditionFactors: Record<string, [number, number]> = {
    excellent: [0.78, 0.84],
    good: [0.73, 0.80],
    fair: [0.64, 0.73],
    needs_repair: [0.48, 0.62],
    not_running: [0.30, 0.48],
  };

  const titleFactors: Record<string, number> = {
    clean: 1,
    rebuilt: 0.78,
    salvage: 0.62,
  };

  const factors = conditionFactors[condition] || conditionFactors.good;
  const titleFactor = titleFactors[titleStatus] ?? 1;

  return {
    low: roundTo50(marketPrice * factors[0] * titleFactor),
    high: roundTo50(marketPrice * factors[1] * titleFactor),
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.MARKETCHECK_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: "Vehicle estimate service is not configured yet.",
      code: "ESTIMATE_NOT_CONFIGURED",
    });
  }

  const vin = String(req.body?.vin || "").toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "");
  const mileage = Number(req.body?.mileage || 0);
  const titleStatus = String(req.body?.titleStatus || "clean");
  const condition = String(req.body?.condition || "good");

  if (vin.length !== 17 || !Number.isFinite(mileage) || mileage <= 0) {
    return res.status(400).json({ error: "Invalid VIN or mileage." });
  }

  const params = new URLSearchParams({
    api_key: apiKey,
    vin,
    miles: String(Math.round(mileage)),
    dealer_type: "independent",
    zip: "91335",
    fallback_to_generic: "true",
  });

  try {
    const response = await fetch(
      "https://api.marketcheck.com/v2/predict/car/us/marketcheck_price?" + params.toString(),
      { headers: { Accept: "application/json" } }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("MarketCheck estimate error", response.status, data);
      return res.status(502).json({ error: "Market data is temporarily unavailable. Please try again." });
    }

    let marketPrice = Number(data?.marketcheck_price || 0);

    if (!marketPrice && Array.isArray(data?.generic_prices) && data.generic_prices.length) {
      const prices = data.generic_prices
        .map((item: any) => Number(item?.marketcheck_price || 0))
        .filter((value: number) => Number.isFinite(value) && value > 0)
        .sort((a: number, b: number) => a - b);

      if (prices.length) marketPrice = prices[Math.floor(prices.length / 2)];
    }

    if (!marketPrice) {
      return res.status(404).json({ error: "We could not find enough market data for this vehicle." });
    }

    const range = dealerOfferRange(marketPrice, titleStatus, condition);

    return res.status(200).json({
      marketPrice: Math.round(marketPrice),
      low: range.low,
      high: Math.max(range.low, range.high),
      currency: "USD",
      source: "MarketCheck",
    });
  } catch (error) {
    console.error("Vehicle estimate failure", error);
    return res.status(500).json({ error: "Vehicle estimate is temporarily unavailable." });
  }
}
