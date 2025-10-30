// /pages/api/prequal.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, msg: "Method not allowed" });
  }

  // ENV del lado servidor (en Vercel)
  const service_id  = process.env.EMAILJS_SERVICE_ID;
  const template_id = process.env.EMAILJS_TEMPLATE_ID;
  const private_key = process.env.EMAILJS_PRIVATE_KEY; // accessToken
  const public_key  = process.env.EMAILJS_PUBLIC_KEY;  // user_id

  const missing: string[] = [];
  if (!service_id)  missing.push("EMAILJS_SERVICE_ID");
  if (!template_id) missing.push("EMAILJS_TEMPLATE_ID");
  if (!private_key) missing.push("EMAILJS_PRIVATE_KEY");
  if (!public_key)  missing.push("EMAILJS_PUBLIC_KEY");
  if (missing.length) {
    return res.status(500).json({ ok: false, msg: `Missing env: ${missing.join(", ")}` });
  }

  const {
    name, phone, email, language, vehicle, vin,
    downPayment, monthlyBudget, employment, monthlyIncome,
    housing, notes, page_url,
  } = req.body || {};

  const template_params = {
    name, phone, email, language, vehicle, vin,
    downPayment, monthlyBudget, employment, monthlyIncome,
    housing, notes, page_url,
  };

  try {
    const r = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id,
        template_id,
        user_id: public_key,      // ← requerido
        accessToken: private_key, // ← recomendado en servidor
        template_params,
      }),
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(500).json({ ok: false, msg: text || "EmailJS error" });
    }

    return res.status(200).json({ ok: true, msg: "Email sent successfully" });
  } catch (err: any) {
    console.error("EmailJS send failed:", err);
    return res.status(500).json({ ok: false, msg: err.message || "Server error" });
  }
}
