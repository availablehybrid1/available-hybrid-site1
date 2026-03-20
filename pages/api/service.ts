import type { NextApiRequest, NextApiResponse } from "next";

type ResponseData =
  | { ok: true; msg: string }
  | { ok: false; msg: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, msg: "Method not allowed" });
  }

  const service_id = process.env.EMAILJS_SERVICE_ID;
  const template_id = process.env.EMAILJS_SERVICE_TEMPLATE_ID;
  const private_key = process.env.EMAILJS_PRIVATE_KEY;
  const public_key = process.env.EMAILJS_PUBLIC_KEY;

  const missing: string[] = [];
  if (!service_id) missing.push("EMAILJS_SERVICE_ID");
  if (!template_id) missing.push("EMAILJS_SERVICE_TEMPLATE_ID");
  if (!private_key) missing.push("EMAILJS_PRIVATE_KEY");
  if (!public_key) missing.push("EMAILJS_PUBLIC_KEY");

  if (missing.length) {
    return res
      .status(500)
      .json({ ok: false, msg: `Missing env: ${missing.join(", ")}` });
  }

  const {
    name,
    phone,
    email,
    date,
    vehicle,
    service,
    message,
    language,
    page_url,
    time,
  } = req.body || {};

  if (!name || !phone || !vehicle || !service || !date) {
    return res.status(400).json({ ok: false, msg: "Missing required fields" });
  }

  const isEN = language === "EN";
  const safe = (v: any) => (v ? String(v) : "-");

  const summary = isEN
    ? `📩 NEW SERVICE REQUEST

👤 Name: ${safe(name)}
📱 Phone: ${safe(phone)}
✉️ Email: ${safe(email)}

🚗 Vehicle: ${safe(vehicle)}
🛠️ Service Needed: ${safe(service)}
📅 Preferred Date: ${safe(date)}

📝 Description:
${safe(message)}

🔗 Submitted from:
${safe(page_url)}
`
    : `📩 NUEVA SOLICITUD DE SERVICIO

👤 Nombre: ${safe(name)}
📱 Teléfono: ${safe(phone)}
✉️ Correo: ${safe(email)}

🚗 Vehículo: ${safe(vehicle)}
🛠️ Servicio requerido: ${safe(service)}
📅 Fecha preferida: ${safe(date)}

📝 Descripción:
${safe(message)}

🔗 Enviado desde:
${safe(page_url)}
`;

  const template_params = {
    name,
    phone,
    email,
    date,
    vehicle,
    service,
    message,
    language,
    page_url,
    summary,
    time,
  };

  try {
    const r = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id,
        template_id,
        user_id: public_key,
        accessToken: private_key,
        template_params,
      }),
    });

    if (!r.ok) {
      const text = await r.text();
      return res
        .status(500)
        .json({ ok: false, msg: text || "EmailJS error" });
    }

    return res
      .status(200)
      .json({ ok: true, msg: "Email sent successfully" });
  } catch (err: any) {
    return res
      .status(500)
      .json({ ok: false, msg: err.message || "Server error" });
  }
}
