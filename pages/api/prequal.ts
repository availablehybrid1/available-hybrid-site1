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

    if (!name || !phone) {
      return res.status(400).json({ ok: false, msg: "Missing required fields" });
    }

    // Lee ENV y agrega fallbacks para prueba (solo para diagnosticar)
    const service_id_env  = process.env.EMAILJS_SERVICE_ID;
    const template_id_env = process.env.EMAILJS_TEMPLATE_ID;
    const private_key_env = process.env.EMAILJS_PRIVATE_KEY; // Private Key
    const public_key_env  = process.env.EMAILJS_PUBLIC_KEY;  // Public Key (user_id)

    // ❗️Quita estos fallbacks cuando confirmemos que llegan las ENV
    const service_id  = service_id_env  || "service_xrb71r7";
    const template_id = template_id_env || "template_qz2a2ut";
    const private_key = private_key_env || "OyVS1hiC_4adH5JDVCfI";
    const public_key  = public_key_env  || "qH7gMIgFjw3WbbX43E";

    // Log de diagnóstico (no imprime las claves reales si usas ENV)
    console.log("ENV CHECK", {
      has_service: !!service_id_env,
      has_template: !!template_id_env,
      has_private: !!private_key_env,
      has_public: !!public_key_env,
      using_fallbacks: {
        service: !service_id_env,
        template: !template_id_env,
        private: !private_key_env,
        public: !public_key_env,
      },
    });

    // Si quieres forzar error si falta alguna ENV (quita fallbacks arriba y descomenta):
    // if (!service_id_env || !template_id_env || !private_key_env || !public_key_env) {
    //   return res.status(500).json({ ok: false, msg: "Missing EmailJS ENV variables on server" });
    // }

    const payload = {
      service_id,
      template_id,
      user_id: public_key,      // requerido por EmailJS REST
      accessToken: private_key, // requerido por EmailJS REST
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
