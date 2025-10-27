import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const body = req.body || {};

    // Honeypot anti-spam
    if (body.website) return res.status(400).json({ ok: false });

    // Validación mínima
    if (!body.fullName || !body.phone || !body.grossIncome || !body.smsOk) {
      return res.status(400).json({ ok: false, msg: "Missing fields" });
    }

    // Log temporal (verás esto en la consola del server o logs de Vercel)
    console.log("[PREQUAL]", {
      receivedAt: new Date().toISOString(),
      ...body,
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false });
  }
}
