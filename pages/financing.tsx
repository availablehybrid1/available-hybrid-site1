// =============================================
// Next.js (App Router) - Página de Precalificación
// Archivo sugerido: app/financing/page.tsx
// Requiere TailwindCSS ya instalado en tu proyecto.
// - 100% bilingüe (ES/EN)
// - Validación básica en el cliente
// - Envío a /api/prequal (incluido abajo)
// - Incluye anti-spam (honeypot) y consentimiento legal
// =============================================

"use client";

import React, { useState } from "react";

// Utilidades simples
const currency = (v: string) => {
  const n = Number(String(v).replace(/[^0-9.]/g, ""));
  if (Number.isNaN(n)) return "";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
};

const phoneDigits = (v: string) => v.replace(/[^0-9]/g, "");

function PhoneInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const d = phoneDigits(value).slice(0, 10);
  let formatted = d;
  if (d.length > 6) formatted = `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  else if (d.length > 3) formatted = `(${d.slice(0, 3)}) ${d.slice(3)}`;
  else if (d.length > 0) formatted = `(${d}`;
  return (
    <input
      className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
      inputMode="tel"
      value={formatted}
      onChange={(e) => onChange(e.target.value)}
      placeholder="(555) 123-4567"
      aria-label="Phone"
    />
  );
}

export default function FinancingPage() {
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [lang, setLang] = useState<"es" | "en">("es");

  const t = (k: string) => {
    const dict: Record<string, { es: string; en: string }> = {
      title: { es: "Precalificación de Financiamiento", en: "Financing Pre‑Qualification" },
      subtitle: { es: "En 2–3 minutos. Sin impacto en tu puntaje (consulta suave).", en: "2–3 minutes. No impact to your score (soft check)." },
      legal: { es: "Al enviar, autorizo a AVAILABLE HYBRID R&M INC. a contactarme por teléfono, texto o email. Esta es una pre‑calificación con consulta suave; no es aprobación final. No compartiremos tu SSN ni haremos consulta dura sin tu permiso.", en: "By submitting, I authorize AVAILABLE HYBRID R&M INC. to contact me via phone, text, or email. This is a soft‑check pre‑qualification; not a final approval. We will not hard‑pull or request SSN without your permission." },
      submit: { es: "Enviar solicitud", en: "Submit Request" },
      required: { es: "Requerido", en: "Required" },
      applicant: { es: "Datos del solicitante", en: "Applicant info" },
      vehicle: { es: "Vehículo de interés (opcional)", en: "Vehicle of interest (optional)" },
      income: { es: "Ingresos y vivienda", en: "Income & housing" },
      employment: { es: "Empleo", en: "Employment" },
      consent: { es: "Consentimiento y envío", en: "Consent & submit" },
      fullName: { es: "Nombre completo", en: "Full name" },
      phone: { es: "Teléfono", en: "Phone" },
      email: { es: "Email (recomendado)", en: "Email (recommended)" },
      contactPref: { es: "Preferencia de contacto", en: "Preferred contact" },
      call: { es: "Llamada", en: "Call" },
      text: { es: "Texto", en: "Text" },
      emailK: { es: "Email", en: "Email" },
      dl: { es: "¿Tienes licencia válida?", en: "Do you have a valid driver’s license?" },
      cosigner: { es: "¿Cuentas con co‑signer? (opcional)", en: "Co‑signer available? (optional)" },
      yymm: { es: "Fecha de nacimiento (opcional)", en: "Date of birth (optional)" },
      vinOrStock: { es: "VIN o ID del inventario (opcional)", en: "VIN or stock ID (optional)" },
      year: { es: "Año", en: "Year" },
      make: { es: "Marca", en: "Make" },
      model: { es: "Modelo", en: "Model" },
      down: { es: "Enganche estimado ($)", en: "Estimated down payment ($)" },
      budget: { es: "Pago mensual deseado ($)", en: "Desired monthly payment ($)" },
      grossIncome: { es: "Ingreso mensual bruto ($)", en: "Gross monthly income ($)" },
      housing: { es: "Tipo de vivienda", en: "Housing" },
      rent: { es: "Rento", en: "Rent" },
      own: { es: "Propia", en: "Own" },
      family: { es: "Con familia", en: "With family" },
      housingPay: { es: "Pago mensual de vivienda ($)", en: "Monthly housing payment ($)" },
      empType: { es: "Tipo de empleo", en: "Employment type" },
      w2: { es: "W‑2", en: "W‑2" },
      _1099: { es: "1099", en: "1099" },
      self: { es: "Independiente", en: "Self‑employed" },
      timeAtJob: { es: "Tiempo en el trabajo", en: "Time at job" },
      lt6: { es: "< 6 meses", en: "< 6 months" },
      _612: { es: "6–12 meses", en: "6–12 months" },
      _1to2: { es: "1–2 años", en: "1–2 years" },
      _2plus: { es: "> 2 años", en: "> 2 years" },
      notes: { es: "Notas adicionales (opcional)", en: "Additional notes (optional)" },
      smsConsent: { es: "Acepto recibir SMS/email para coordinar mi solicitud.", en: "I agree to receive SMS/email to coordinate my request." },
      softCheck: { es: "Autorizo una consulta suave (NO afecta mi puntaje)", en: "I authorize a soft credit check (NO impact to my score)" },
      success: { es: "¡Recibido! Te contactaremos en breve.", en: "Received! We’ll be in touch shortly." },
      error: { es: "Hubo un error. Intenta de nuevo.", en: "Something went wrong. Please try again." },
      langLabel: { es: "Idioma del formulario", en: "Form language" },
    };
    return dict[k]?.[lang] ?? k;
  };

  // Estado del formulario
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    contactPref: "text",
    hasDL: false,
    coSigner: false,
    dob: "",
    vinOrStock: "",
    year: "",
    make: "",
    model: "",
    down: "",
    budget: "",
    grossIncome: "",
    housing: "rent",
    housingPay: "",
    empType: "w2",
    timeAtJob: "lt6",
    notes: "",
    smsOk: false,
    softOk: true,
    // Anti‑spam honeypot
    website: "",
  });

  const set = (k: string, v: any) => setForm((s) => ({ ...s, [k]: v }));

  const validate = () => {
    const errors: string[] = [];
    if (!form.fullName.trim()) errors.push(`${t("fullName")} ${t("required").toLowerCase()}`);
    if (phoneDigits(form.phone).length < 10) errors.push(`${t("phone")} ${t("required").toLowerCase()}`);
    if (!form.smsOk) errors.push(`${t("smsConsent")} ${t("required").toLowerCase()}`);
    if (!form.grossIncome.trim()) errors.push(`${t("grossIncome")} ${t("required").toLowerCase()}`);
    if (form.website) errors.push("Spam detected");
    return errors;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOk(null);
    setErr(null);
    const v = validate();
    if (v.length) {
      setErr(v.join(" • "));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/prequal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, lang }),
      });
      if (!res.ok) throw new Error("Bad response");
      setOk(t("success"));
      setForm({
        fullName: "",
        phone: "",
        email: "",
        contactPref: "text",
        hasDL: false,
        coSigner: false,
        dob: "",
        vinOrStock: "",
        year: "",
        make: "",
        model: "",
        down: "",
        budget: "",
        grossIncome: "",
        housing: "rent",
        housingPay: "",
        empType: "w2",
        timeAtJob: "lt6",
        notes: "",
        smsOk: false,
        softOk: true,
        website: "",
      });
    } catch (e) {
      setErr(t("error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <div className="flex items-center gap-2 text-sm">
          <label>{t("langLabel")}:</label>
          <select
            className="rounded-lg border px-2 py-1"
            value={lang}
            onChange={(e) => setLang(e.target.value as any)}
          >
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      <p className="mb-4 text-sm text-neutral-600">{t("subtitle")}</p>

      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4">
        {/* SECTION: Applicant */}
        <Section title={t("applicant")}> 
          <Field label={t("fullName")} required>
            <input
              className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              placeholder={lang === "es" ? "Tu nombre y apellido" : "Your first & last name"}
            />
          </Field>
          <Field label={t("phone")} required>
            <PhoneInput value={form.phone} onChange={(v) => set("phone", v)} />
          </Field>
          <Field label={t("emailK")}> 
            <input
              type="email"
              className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="you@example.com"
            />
          </Field>
          <Field label={t("contactPref")}> 
            <select
              className="w-full rounded-xl border px-3 py-2"
              value={form.contactPref}
              onChange={(e) => set("contactPref", e.target.value)}
            >
              <option value="call">{t("call")}</option>
              <option value="text">{t("text")}</option>
              <option value="email">{t("emailK")}</option>
            </select>
          </Field>
          <Field label={t("dl")}>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.hasDL} onChange={(e) => set("hasDL", e.target.checked)} />
              <span>{lang === "es" ? "Sí" : "Yes"}</span>
            </label>
          </Field>
          <Field label={t("cosigner")}>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.coSigner} onChange={(e) => set("coSigner", e.target.checked)} />
              <span>{lang === "es" ? "Sí" : "Yes"}</span>
            </label>
          </Field>
          <Field label={t("yymm")}> 
            <input
              type="date"
              className="w-full rounded-xl border px-3 py-2"
              value={form.dob}
              onChange={(e) => set("dob", e.target.value)}
            />
          </Field>
        </Section>

        {/* SECTION: Vehicle */}
        <Section title={t("vehicle")}>
          <Field label={t("vinOrStock")}>
            <input className="w-full rounded-xl border px-3 py-2" value={form.vinOrStock} onChange={(e) => set("vinOrStock", e.target.value)} />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label={t("year")}>
              <input className="w-full rounded-xl border px-3 py-2" value={form.year} onChange={(e) => set("year", e.target.value)} />
            </Field>
            <Field label={t("make")}>
              <input className="w-full rounded-xl border px-3 py-2" value={form.make} onChange={(e) => set("make", e.target.value)} />
            </Field>
            <Field label={t("model")}>
              <input className="w-full rounded-xl border px-3 py-2" value={form.model} onChange={(e) => set("model", e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label={t("down")}>
              <input
                className="w-full rounded-xl border px-3 py-2"
                value={form.down}
                onChange={(e) => set("down", e.target.value)}
                placeholder="$1,000"
              />
            </Field>
            <Field label={t("budget")}>
              <input
                className="w-full rounded-xl border px-3 py-2"
                value={form.budget}
                onChange={(e) => set("budget", e.target.value)}
                placeholder="$300"
              />
            </Field>
            <Field label={t("grossIncome")} required>
              <input
                className="w-full rounded-xl border px-3 py-2"
                value={form.grossIncome}
                onChange={(e) => set("grossIncome", e.target.value)}
                placeholder="$3,500"
              />
            </Field>
          </div>
        </Section>

        {/* SECTION: Income & Housing */}
        <Section title={t("income")}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t("housing")}>
              <select className="w-full rounded-xl border px-3 py-2" value={form.housing} onChange={(e) => set("housing", e.target.value)}>
                <option value="rent">{t("rent")}</option>
                <option value="own">{t("own")}</option>
                <option value="family">{t("family")}</option>
              </select>
            </Field>
            <Field label={t("housingPay")}>
              <input className="w-full rounded-xl border px-3 py-2" value={form.housingPay} onChange={(e) => set("housingPay", e.target.value)} placeholder="$1,200" />
            </Field>
          </div>
        </Section>

        {/* SECTION: Employment */}
        <Section title={t("employment")}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t("empType")}>
              <select className="w-full rounded-xl border px-3 py-2" value={form.empType} onChange={(e) => set("empType", e.target.value)}>
                <option value="w2">{t("w2")}</option>
                <option value="1099">{t("_1099")}</option>
                <option value="self">{t("self")}</option>
              </select>
            </Field>
            <Field label={t("timeAtJob")}>
              <select className="w-full rounded-xl border px-3 py-2" value={form.timeAtJob} onChange={(e) => set("timeAtJob", e.target.value)}>
                <option value="lt6">{t("lt6")}</option>
                <option value="6-12">{t("_612")}</option>
                <option value="1-2">{t("_1to2")}</option>
                <option value=">2">{t("_2plus")}</option>
              </select>
            </Field>
          </div>
          <Field label={t("notes")}>
            <textarea className="w-full rounded-xl border px-3 py-2" rows={4} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder={lang === "es" ? "Ej: Comprobante de ingresos por talón de pago" : "Eg: Paystubs available"} />
          </Field>
        </Section>

        {/* SECTION: Consent */}
        <Section title={t("consent")}>
          {/* Honeypot */}
          <input type="text" className="hidden" value={form.website} onChange={(e) => set("website", e.target.value)} tabIndex={-1} autoComplete="off" />

          <label className="flex items-start gap-3">
            <input type="checkbox" checked={form.smsOk} onChange={(e) => set("smsOk", e.target.checked)} />
            <span className="text-sm leading-5">{t("smsConsent")}</span>
          </label>
          <label className="flex items-start gap-3">
            <input type="checkbox" checked={form.softOk} onChange={(e) => set("softOk", e.target.checked)} />
            <span className="text-sm leading-5">{t("softCheck")}</span>
          </label>
          <p className="text-xs text-neutral-600">{t("legal")}</p>
        </Section>

        {err && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div>}
        {ok && <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{ok}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-black px-4 py-3 text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (lang === "es" ? "Enviando…" : "Submitting…") : t("submit")}
        </button>

        <div className="text-xs text-neutral-500">
          <p>
            {/* Texto informativo */}
            {lang === "es"
              ? "Consejo: Puedes colocar este formulario en /financing y añadir un botón 'Pre‑Califícate' en el header."
              : "Tip: Put this page at /financing and add a 'Get Pre‑Qualified' button in your header."}
          </p>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-medium">{title}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium">
        {label} {required && <span className="text-rose-600">*</span>}
      </span>
      {children}
    </label>
  );
}

// =============================================
// API ROUTE (App Router)
// Archivo sugerido: app/api/prequal/route.ts
// - Recibe JSON, valida básico y:
//   1) (DEMO) guarda en logs del servidor
//   2) (Opcional) envía email con Nodemailer
//   3) (Opcional) envía a Google Sheets / Airtable / CRM
// =============================================

// Coloca ESTE BLOQUE en app/api/prequal/route.ts (archivo separado)
// --- INICIO app/api/prequal/route.ts ---
// import { NextResponse } from "next/server";
// 
// type Payload = {
//   fullName: string;
//   phone: string;
//   email?: string;
//   contactPref?: string;
//   hasDL?: boolean;
//   coSigner?: boolean;
//   dob?: string;
//   vinOrStock?: string;
//   year?: string;
//   make?: string;
//   model?: string;
//   down?: string;
//   budget?: string;
//   grossIncome: string;
//   housing?: string;
//   housingPay?: string;
//   empType?: string;
//   timeAtJob?: string;
//   notes?: string;
//   smsOk: boolean;
//   softOk?: boolean;
//   website?: string; // honeypot
//   lang?: "es" | "en";
// };
// 
// export async function POST(req: Request) {
//   try {
//     const body = (await req.json()) as Payload;
//     // Anti‑spam
//     if (body.website) return NextResponse.json({ ok: false }, { status: 400 });
//     // Validación mínima
//     if (!body.fullName || !body.phone || !body.grossIncome || !body.smsOk) {
//       return NextResponse.json({ ok: false, msg: "Missing fields" }, { status: 400 });
//     }
// 
//     // Normaliza números
//     const digits = (v: string) => (v || "").replace(/[^0-9]/g, "");
//     const money = (v?: string) => (v ? Number(v.replace(/[^0-9.]/g, "")) : undefined);
// 
//     const record = {
//       receivedAt: new Date().toISOString(),
//       fullName: body.fullName.trim(),
//       phone: digits(body.phone),
//       email: body.email?.trim() || null,
//       contactPref: body.contactPref || null,
//       hasDL: !!body.hasDL,
//       coSigner: !!body.coSigner,
//       dob: body.dob || null,
//       vehicle: {
//         vinOrStock: body.vinOrStock || null,
//         year: body.year || null,
//         make: body.make || null,
//         model: body.model || null,
//       },
//       down: money(body.down),
//       budget: money(body.budget),
//       grossIncome: money(body.grossIncome),
//       housing: body.housing || null,
//       housingPay: money(body.housingPay),
//       empType: body.empType || null,
//       timeAtJob: body.timeAtJob || null,
//       notes: body.notes || null,
//       smsOk: !!body.smsOk,
//       softOk: !!body.softOk,
//       lang: body.lang || "es",
//     };
// 
//     // 1) DEMO: Log en servidor (ver en consola del server)
//     console.log("[PREQUAL]", record);
// 
//     // 2) OPCIONAL: Enviar por email (configura tus credenciales en env)
//     // import nodemailer from "nodemailer";
//     // const transporter = nodemailer.createTransport({
//     //   host: process.env.SMTP_HOST,
//     //   port: Number(process.env.SMTP_PORT || 587),
//     //   secure: false,
//     //   auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
//     // });
//     // await transporter.sendMail({
//     //   from: `Available Hybrid R&M <${process.env.SMTP_FROM}>`,
//     //   to: process.env.SALES_INBOX!,
//     //   subject: `Nueva Pre‑Calificación: ${record.fullName}`,
//     //   text: JSON.stringify(record, null, 2),
//     // });
// 
//     // 3) OPCIONAL: Google Sheets/Airtable/CRM
//     //   - Google Sheets: usar googleapis con Service Account
//     //   - Airtable: usar su SDK oficial
// 
//     return NextResponse.json({ ok: true });
//   } catch (e) {
//     console.error(e);
//     return NextResponse.json({ ok: false }, { status: 500 });
//   }
// }
// --- FIN app/api/prequal/route.ts ---

// =============================================
// EXTRA: Botón para tu header/nav
// Coloca esto donde tengas el menú principal
// =============================================
// <a
//   href="/financing"
//   className="inline-flex items-center rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
// >
//   {"Pre‑Califícate"}
// </a>
