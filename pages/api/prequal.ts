// pages/api/prequal.ts
import type { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, msg: "Method not allowed" });

  try {
    const record = req.body || {};

    // 1) Honeypot anti-spam
    if (record.website) return res.status(200).json({ ok: true });

    // 2) Validación mínima
    const errors: string[] = [];
    if (!record.fullName) errors.push("fullName");
    if (!record.phone) errors.push("phone");
    if (!record.grossIncome) errors.push("grossIncome");
    if (errors.length) return res.status(400).json({ ok: false, msg: "Missing fields", fields: errors });

    // 3) Formatea el correo
    const subject = `Nueva Pre-Calificación – ${record.fullName}`;
    const text = [
      `Nueva solicitud de Pre-Calificación`,
      ``,
      `Datos del solicitante:`,
      `• Nombre: ${record.fullName}`,
      `• Teléfono: ${record.phone}`,
      `• Email: ${record.email || "-"}`,
      `• Preferencia contacto: ${record.contactPref || "-"}`,
      `• Licencia válida: ${record.hasDL ? "Sí" : "No"}`,
      `• Co-signer: ${record.coSigner ? "Sí" : "No"}`,
      `• DOB: ${record.dob || "-"}`,
      ``,
      `Vehículo de interés:`,
      `• VIN/Stock: ${record.vinOrStock || "-"}`,
      `• Año/Marca/Modelo: ${record.year || "-"} / ${record.make || "-"} / ${record.model || "-"}`,
      `• Enganche: ${record.down || "-"}`,
      `• Pago deseado: ${record.budget || "-"}`,
      ``,
      `Ingresos y vivienda:`,
      `• Ingreso mensual bruto: ${record.grossIncome}`,
      `• Vivienda: ${record.housing || "-"}`,
      `• Pago mensual vivienda: ${record.housingPay || "-"}`,
      ``,
      `Empleo:`,
      `• Tipo: ${record.empType || "-"}`,
      `• Tiempo en el trabajo: ${record.timeAtJob || "-"}`,
      ``,
      `Notas: ${record.notes || "-"}`,
      ``,
      `Consentimientos:`,
      `• SMS/Email OK: ${record.smsOk ? "Sí" : "No"}`,
      `• Soft credit check OK: ${record.softOk ? "Sí" : "No"}`,
      ``,
      `Idioma formulario: ${record.lang || "-"}`,
      `Recibido: ${new Date().toLocaleString()}`,
    ].join("\n");

    const html = text.replace(/\n/g, "<br/>");

    // 4) Enviar por SMTP (configura tus credenciales en .env.local)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST!,
      port: Number(process.env.SMTP_PORT || 587),
      secure: !!(process.env.SMTP_SECURE === "true"),
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Available Hybrid" <no-reply@hybridrm.com>`,
      to: process.env.SALES_INBOX!,         // destino principal (tu email)
      bcc: process.env.SALES_BCC || undefined, // copia opcional
      subject,
      text,
      html,
      replyTo: record.email || undefined,
    });

    // 5) OK
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("PREQUAL_ERR", e);
    return res.status(500).json({ ok: false, msg: "Server error" });
  }
}
