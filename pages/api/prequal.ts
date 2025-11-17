// /pages/api/prequal.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, msg: "Method not allowed" });
  }

  // ENV del lado servidor (en Vercel)
  const service_id = process.env.EMAILJS_SERVICE_ID;
  const template_id = process.env.EMAILJS_TEMPLATE_ID;
  const private_key = process.env.EMAILJS_PRIVATE_KEY; // accessToken
  const public_key = process.env.EMAILJS_PUBLIC_KEY; // user_id

  const missing: string[] = [];
  if (!service_id) missing.push("EMAILJS_SERVICE_ID");
  if (!template_id) missing.push("EMAILJS_TEMPLATE_ID");
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
    language, // "EN" | "ES"
    vehicle,
    vin,
    downPayment,
    monthlyBudget,
    employment,
    monthlyIncome,
    hasLicense,
    licenseNumber,
    proofIncome,
    contactMethod,
    heardAbout,
    referralName,
    addressStreet,
    addressCity,
    addressState,
    addressZip,
    notes,
    page_url,
  } = req.body || {};

  const isEN = language === "EN";

  const safe = (v: any) => (v ? String(v) : "-");

  const summary = isEN
    ? `📩 NEW PRE-QUALIFICATION REQUEST

👤 Name: ${safe(name)}
📱 Phone: ${safe(phone)}
✉️ Email: ${safe(email)}
🌐 Language: ${safe(language)}

🚗 Vehicle of Interest: ${safe(vehicle)}
🔑 VIN: ${safe(vin)}

💵 Down Payment: ${safe(downPayment)}
💸 Monthly Budget: ${safe(monthlyBudget)}
💰 Monthly Income: ${safe(monthlyIncome)}
💼 Employment: ${safe(employment)}

🪪 Driver's License: ${safe(hasLicense)}
${licenseNumber ? `🧾 License Number: ${licenseNumber}\n` : ""}🧾 Proof of Income: ${safe(
        proofIncome
      )}

☎️ Preferred Contact: ${safe(contactMethod)}

📍 Address:
${[addressStreet, addressCity, addressState, addressZip].filter(Boolean).join(
        ", "
      ) || "-"}

📣 Heard about us: ${safe(heardAbout)}
👥 Referral Name: ${safe(referralName)}

📝 Notes:
${safe(notes)}

🔗 Submitted from:
${safe(page_url)}
`
    : `📩 NUEVA SOLICITUD DE PRE-CALIFICACIÓN

👤 Nombre: ${safe(name)}
📱 Teléfono: ${safe(phone)}
✉️ Correo: ${safe(email)}
🌐 Idioma: ${safe(language)}

🚗 Vehículo de interés: ${safe(vehicle)}
🔑 VIN: ${safe(vin)}

💵 Pago inicial: ${safe(downPayment)}
💸 Presupuesto mensual: ${safe(monthlyBudget)}
💰 Ingreso mensual: ${safe(monthlyIncome)}
💼 Situación laboral: ${safe(employment)}

🪪 Licencia de conducir: ${safe(hasLicense)}
${licenseNumber ? `🧾 Número de licencia: ${licenseNumber}\n` : ""}🧾 Prueba de ingresos: ${safe(
        proofIncome
      )}

☎️ Método de contacto preferido: ${safe(contactMethod)}

📍 Dirección:
${[addressStreet, addressCity, addressState, addressZip].filter(Boolean).join(
        ", "
      ) || "-"}

📣 ¿Cómo nos conoció?: ${safe(heardAbout)}
👥 Nombre de quien recomendó: ${safe(referralName)}

📝 Notas:
${safe(notes)}

🔗 Enviado desde:
${safe(page_url)}
`;

  const template_params = {
    // campos individuales (por si los usas en el template)
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
    hasLicense,
    licenseNumber,
    proofIncome,
    contactMethod,
    heardAbout,
    referralName,
    addressStreet,
    addressCity,
    addressState,
    addressZip,
    notes,
    page_url,
    // resumen formateado listo para mostrar en el cuerpo del correo
    summary,
  };

  try {
    const r = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id,
        template_id,
        user_id: public_key, // requerido
        accessToken: private_key, // recomendado en servidor
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
    console.error("EmailJS send failed:", err);
    return res
      .status(500)
      .json({ ok: false, msg: err.message || "Server error" });
  }
}
