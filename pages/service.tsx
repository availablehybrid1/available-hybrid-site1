import * as React from "react";
import Head from "next/head";
import Link from "next/link";

const copy = {
  EN: {
    pageTitle: "Schedule Service | AVAILABLE HYBRID R&M INC.",
    metaDescription:
      "Schedule maintenance, diagnostics, hybrid battery service and repairs.",
    backHome: "← Back to Home",
    department: "Service Department",
    title: "Schedule Service or Diagnostic",
    subtitle:
      "We specialize in hybrid systems, battery diagnostics and repairs, while also offering maintenance and service for all types of vehicles.",
    immediateHelpTitle: "Need immediate help?",
    immediateHelpText:
      "If you prefer immediate assistance, contact us directly by phone or WhatsApp.",
    callUs: "Call Us",
    whatsapp: "Message on WhatsApp",
    categories: "Service Categories",
    fullName: "Full Name",
    yourName: "Your name",
    phoneNumber: "Phone Number",
    email: "Email",
    vehicle: "Vehicle",
    vehiclePlaceholder: "Year, Make, Model",
    serviceNeeded: "Service Needed",
    selectService: "Select a service",
    diagnostic: "Diagnostic",
    oilChange: "Oil Change",
    hybridBattery: "Hybrid Battery Service",
    brakeService: "Brake Service",
    generalMaintenance: "General Maintenance",
    repair: "Repair",
    other: "Other",
    describeIssue: "Describe the issue or request",
    describePlaceholder: "Tell us what your vehicle needs",
    sending: "Sending...",
    submit: "Submit Request",
    success: "Your request was sent successfully.",
    error: "There was a problem sending your request. Please try again.",
    categoryList: [
      "Hybrid diagnostics",
      "Hybrid battery service",
      "Oil changes",
      "Brake service",
      "General maintenance",
      "Vehicle repairs",
    ],
  },
  ES: {
    pageTitle: "Agenda tu servicio | AVAILABLE HYBRID R&M INC.",
    metaDescription:
      "Agenda mantenimiento, diagnóstico, servicio de batería híbrida y reparaciones.",
    backHome: "← Volver al inicio",
    department: "Departamento de Servicio",
    title: "Agenda Servicio o Diagnóstico",
    subtitle:
      "Nos especializamos en sistemas híbridos, diagnóstico y reparación de baterías, además de ofrecer mantenimiento y servicio para todo tipo de vehículos.",
    immediateHelpTitle: "¿Necesita ayuda inmediata?",
    immediateHelpText:
      "Si prefiere atención inmediata, contáctenos directamente por teléfono o WhatsApp.",
    callUs: "Llámanos",
    whatsapp: "Escríbenos por WhatsApp",
    categories: "Categorías de Servicio",
    fullName: "Nombre completo",
    yourName: "Tu nombre",
    phoneNumber: "Número de teléfono",
    email: "Correo electrónico",
    vehicle: "Vehículo",
    vehiclePlaceholder: "Año, marca y modelo",
    serviceNeeded: "Servicio requerido",
    selectService: "Seleccione un servicio",
    diagnostic: "Diagnóstico",
    oilChange: "Cambio de aceite",
    hybridBattery: "Servicio de batería híbrida",
    brakeService: "Servicio de frenos",
    generalMaintenance: "Mantenimiento general",
    repair: "Reparación",
    other: "Otro",
    describeIssue: "Describa el problema o servicio",
    describePlaceholder: "Cuéntenos qué necesita su vehículo",
    sending: "Enviando...",
    submit: "Enviar solicitud",
    success: "Su solicitud fue enviada correctamente.",
    error: "Hubo un problema al enviar su solicitud. Inténtelo nuevamente.",
    categoryList: [
      "Diagnóstico híbrido",
      "Servicio de batería híbrida",
      "Cambios de aceite",
      "Servicio de frenos",
      "Mantenimiento general",
      "Reparaciones",
    ],
  },
} as const;

export default function ServicePage() {
  const phone = "+1 747-354-4098";
  const [lang, setLang] = React.useState<"EN" | "ES">("EN");
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("ah-lang");
    if (stored === "EN" || stored === "ES") {
      setLang(stored);
    }
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("ah-lang", lang);
  }, [lang]);

  const t = copy[lang];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    const data = {
  name: String(formData.get("name") || ""),
  phone: String(formData.get("phone") || ""),
  email: String(formData.get("email") || ""),
  date: String(formData.get("date") || ""),
  vehicle: String(formData.get("vehicle") || ""),
  service: String(formData.get("service") || ""),
  message: String(formData.get("message") || ""),
  language: lang,
  page_url: typeof window !== "undefined" ? window.location.href : "",
};
    try {
      const res = await fetch("/api/service", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Request failed");
      }

      setSuccess(true);
      form.reset();
    } catch {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{t.pageTitle}</title>
        <meta name="description" content={t.metaDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen bg-neutral-950 text-white">
        <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between gap-4">
            <Link
              href="/"
              className="text-sm text-white/70 transition hover:text-white"
            >
              {t.backHome}
            </Link>

            <div className="flex items-center rounded-full border border-white/30 bg-black/40 px-1 py-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setLang("EN")}
                className={`px-2 py-0.5 rounded-full ${
                  lang === "EN"
                    ? "bg-white text-black"
                    : "text-white/70 hover:text-white"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang("ES")}
                className={`px-2 py-0.5 rounded-full ${
                  lang === "ES"
                    ? "bg-white text-black"
                    : "text-white/70 hover:text-white"
                }`}
              >
                ES
              </button>
            </div>
          </div>

          <div className="mb-10">
            <p className="text-sm uppercase tracking-[0.2em] text-white/50">
              {t.department}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              {t.title}
            </h1>
            <p className="mt-4 max-w-2xl text-white/70">{t.subtitle}</p>
          </div>

          <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <h2 className="text-lg font-semibold">{t.immediateHelpTitle}</h2>
            <p className="mt-3 text-sm text-white/70">{t.immediateHelpText}</p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={`tel:${phone.replace(/[^+\d]/g, "")}`}
                className="flex items-center justify-center rounded-xl border border-white/15 px-4 py-3 text-sm font-medium text-white/90 transition hover:border-white/30 hover:bg-white/[0.04]"
              >
                {t.callUs}
              </a>

              <a
                href="https://wa.me/17473544098?text=Hello,%20I%20would%20like%20to%20schedule%20a%20service%20or%20diagnostic."
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center rounded-xl border border-white/15 px-4 py-3 text-sm font-medium text-white/90 transition hover:border-white/30 hover:bg-white/[0.04]"
              >
                {t.whatsapp}
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm text-white/70"
                >
                  {t.fullName}
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-white/30"
                  placeholder={t.yourName}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm text-white/70"
                  >
                    {t.phoneNumber}
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-white/30"
                    placeholder="(747) 354-4098"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm text-white/70"
                  >
                    {t.email}
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-white/30"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="vehicle"
                  className="mb-2 block text-sm text-white/70"
                >
                  {t.vehicle}
                </label>
                <input
                  id="vehicle"
                  name="vehicle"
                  type="text"
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-white/30"
                  placeholder={t.vehiclePlaceholder}
                />
              </div>

              <div>
                <label
                  htmlFor="service"
                  className="mb-2 block text-sm text-white/70"
                >
                  {t.serviceNeeded}
                </label>
                <select
                  id="service"
                  name="service"
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-white/30"
                  defaultValue=""
                >
                  <option value="" disabled>
                    {t.selectService}
                  </option>
                  <option value="Diagnostic">{t.diagnostic}</option>
                  <option value="Oil Change">{t.oilChange}</option>
                  <option value="Hybrid Battery Service">
                    {t.hybridBattery}
                  </option>
                  <option value="Brake Service">{t.brakeService}</option>
                  <option value="General Maintenance">
                    {t.generalMaintenance}
                  </option>
                  <option value="Repair">{t.repair}</option>
                  <option value="Other">{t.other}</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="mb-2 block text-sm text-white/70"
                >
                  {t.describeIssue}
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-white/30"
                  placeholder={t.describePlaceholder}
                />
              </div>
<div>
  <label
    htmlFor="date"
    className="mb-2 block text-sm text-white/70"
  >
    {lang === "EN" ? "Preferred Date" : "Fecha preferida"}
  </label>
  <input
    id="date"
    name="date"
    type="date"
    required
    min={new Date().toISOString().split("T")[0]}
className="w-full rounded-xl border border-white/10 bg-white text-black px-4 py-3 outline-none"  />
</div>
              <div>
  <label
    htmlFor="time"
    className="mb-2 block text-sm text-white/70"
  >
    {lang === "EN" ? "Drop-off Time" : "Hora de entrega"}
  </label>

  <input
    id="time"
    name="time"
    type="time"
    required
    min="08:00"
    max="16:00"
    step="1800"
    className="w-full rounded-xl border border-white/10 bg-white text-black px-4 py-3 outline-none"
  />
</div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? t.sending : t.submit}
              </button>

              {success && (
                <p className="text-sm text-green-400">{t.success}</p>
              )}

              {error && <p className="text-sm text-red-400">{error}</p>}
            </form>
          </div>

          <div className="mt-10 border-t border-white/10 pt-6">
            <p className="text-sm text-white/50">{t.categories}</p>
            <ul className="mt-3 space-y-2 text-sm text-white/75">
              {t.categoryList.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </>
  );
}
