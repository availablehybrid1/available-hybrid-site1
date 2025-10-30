// /pages/api/prequal.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, msg: "Method not allowed" });
  }

  // ✅ Variables de entorno (deben estar en Vercel, sin NEXT_PUBLIC_)
  const service_id = process.env.EMAILJS_SERVICE_ID;
  const template_id = process.env.EMAILJS_TEMPLATE_ID;
  const private_key = process.env.EMAILJS_PRIVATE_KEY;
  const public_key = process.env.EMAILJS_PUBLIC_KEY;

  if (!service_id || !template_id || !private_key || !public_key) {
    return res.status(500).json({ ok: false, msg: "Missing EmailJS environment variables" });
  }

  const {
    name,
    phone,
    email,
    language,
    vehicle,
    vin,
    downPayment,
    monthlyBudget,
    employment,
    monthlyIncome,
    housing,
    notes,
    page_url,
  } = req.body;

  const templateParams = {
    name,
    phone,
    email,
    language,
    vehicle,
    vin,
    downPayment,
    monthlyBudget,
    employment,
    monthlyIncome,
    housing,
    notes,
    page_url,
  };

  try {
    // 👇 Llamada a la API de EmailJS usando la clave privada (segura)
    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        service_id,
        template_id,
        user_id: public_key,
        accessToken: private_key,
        template_params: templateParams,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({ ok: false, msg: errorText || "EmailJS error" });
    }

    return res.status(200).json({ ok: true, msg: "Email sent successfully" });
  } catch (err: any) {
    console.error("❌ EmailJS send failed:", err);
    return res.status(500).json({ ok: false, msg: err.message || "Server error" });
  }
}
