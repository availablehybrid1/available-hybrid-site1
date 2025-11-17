// /pages/api/lead.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, msg: "Method not allowed" });
  }

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
    type, // "availability" | "offer" | "testDrive"
    vehicleId,
    vehicleTitle,
    vin,
    // availability:
    firstName,
    lastName,
    phone,
    email,
    comments,
    // offer:
    name,
    offer,
    message,
    // test drive:
    preferredDate,
    preferredTime,
    preferredContact, // "Text" | "Email" | "WhatsApp"
    page_url,
  } = req.body || {};

  const safe = (v: any) => (v ? String(v) : "-");

  let title = "";
  let body = "";

  if (type === "availability") {
    title = "📩 NEW AVAILABILITY REQUEST";
    body = `
${title}

🚗 Vehicle: ${safe(vehicleTitle)} (ID: ${safe(vehicleId)})
🔑 VIN: ${safe(vin)}

👤 Name: ${safe(firstName)} ${safe(lastName)}
📱 Phone: ${safe(phone)}
✉️ Email: ${safe(email)}

📝 Comments:
${safe(comments)}

🔗 Page:
${safe(page_url)}
`;
  } else if (type === "offer") {
    title = "📩 NEW OFFER";
    body = `
${title}

🚗 Vehicle: ${safe(vehicleTitle)} (ID: ${safe(vehicleId)})
🔑 VIN: ${safe(vin)}

👤 Name: ${safe(name)}
📱 Phone: ${safe(phone)}
✉️ Email: ${safe(email)}

💰 Offer: ${safe(offer)}

📝 Message:
${safe(message)}

🔗 Page:
${safe(page_url)}
`;
  } else if (type === "testDrive") {
    title = "📩 NEW TEST DRIVE REQUEST";
    body = `
${title}

🚗 Vehicle: ${safe(vehicleTitle)} (ID: ${safe(vehicleId)})
🔑 VIN: ${safe(vin)}

👤 Name: ${safe(name || firstName)}
📱 Phone: ${safe(phone)}
✉️ Email: ${safe(email)}

📅 Preferred date: ${safe(preferredDate)}
⏰ Preferred time: ${safe(preferredTime)}
☎️ Preferred contact: ${safe(preferredContact)}

📝 Comments:
${safe(comments || message)}

🔗 Page:
${safe(page_url)}
`;
  } else {
    return res.status(400).json({ ok: false, msg: "Invalid type" });
  }

  const template_params = {
    // puedes usar estos campos en tu template si quieres
    type,
    vehicleId,
    vehicleTitle,
    vin,
    firstName,
    lastName,
    name,
    phone,
    email,
    offer,
    comments,
    message,
    preferredDate,
    preferredTime,
    preferredContact,
    page_url,
    // resumen listo para el cuerpo del correo
    summary: body,
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

    return res.status(200).json({ ok: true, msg: "Email sent successfully" });
  } catch (err: any) {
    console.error("EmailJS lead send failed:", err);
    return res
      .status(500)
      .json({ ok: false, msg: err.message || "Server error" });
  }
}
