// pages/api/prequal.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, msg: "Method not allowed" });
  }

  try {
    const {
      name, phone, email, language, vehicle, vin,
      downPayment, monthlyBudget, employment, monthlyIncome, housing, notes, page_url
    } = req.body || {};

    // Validación mínima
    if (!name || !phone) {
      return res.status(400).json({ ok: false, msg: "Missing required fields" });
    }

    // EmailJS (REST) con Private Key (server-side, sin límites de dominio)
    const service_id   = process.env.EMAILJS_SERVICE_ID!;
    const template_id  = process.env.EMAILJS_TEMPLATE_ID!;
    const private_key  = process.env.EMAILJS_PRIVATE_KEY!; // "Use Private Key (recommended)" en EmailJS

    const payload = {
      service_id,
      template_id,
      accessToken: private_key, // <- clave privada, solo desde el servidor
      template_params: {
        name, phone, email, language, vehicle, vin,
        downPayment, monthlyBudget, employment, monthlyIncome, housing, notes,
        page_url: page_url || "",
      },
    };

    const r = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(500).json({ ok: false, msg: text || "EmailJS error" });
    }

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ ok: false, msg: err?.message || "Server error" });
  }
}
