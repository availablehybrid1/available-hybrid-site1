import * as React from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  lang: "EN" | "ES";
};

export default function ServiceModal({ open, onClose, lang }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState("");
  const [serviceType, setServiceType] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const en = lang === "EN";

  function formatLocalDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const today = formatLocalDate(new Date());
  const requiresLeadTime = ![
    "Diagnostic",
    "Oil Change",
    "General Maintenance",
  ].includes(serviceType);

  const leadTimeDate = (() => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + 5);
    return formatLocalDate(date);
  })();

  const minimumDate = serviceType && requiresLeadTime ? leadTimeDate : today;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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
      time: String(formData.get("time") || ""),
      vehicle: String(formData.get("vehicle") || ""),
      service: String(formData.get("service") || ""),
      message: String(formData.get("message") || ""),
      language: lang,
      page_url: typeof window !== "undefined" ? window.location.href : "",
    };

    try {
      const res = await fetch("/api/service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Request failed");
      setSuccess(true);
      form.reset();
      setServiceType("");
    } catch {
      setError(
        en
          ? "There was a problem sending your request. Please try again."
          : "Hubo un problema al enviar tu solicitud. Inténtalo nuevamente."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={en ? "Service request" : "Solicitud de servicio"}
    >
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/15 bg-neutral-950 p-5 text-white shadow-2xl sm:p-7">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-lg text-white/70 transition hover:border-white/35 hover:text-white"
          aria-label={en ? "Close" : "Cerrar"}
        >
          ×
        </button>

        <div className="pr-12">
          <p className="text-xs uppercase tracking-[0.22em] text-white/45">
            {en ? "Service Department" : "Departamento de Servicio"}
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            {en ? "Service Request" : "Solicitud de Servicio"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/60">
            {en
              ? "Tell us about your vehicle and what it needs. We’ll contact you to confirm the appointment."
              : "Cuéntanos sobre tu vehículo y lo que necesita. Te contactaremos para confirmar la cita."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              name="name"
              required
              placeholder={en ? "Full name" : "Nombre completo"}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/30"
            />
            <input
              name="phone"
              type="tel"
              required
              placeholder={en ? "Phone number" : "Número de teléfono"}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/30"
            />
          </div>

          <input
            name="email"
            type="email"
            placeholder={en ? "Email (optional)" : "Correo (opcional)"}
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/30"
          />

          <input
            name="vehicle"
            required
            placeholder={en ? "Vehicle — Year, Make, Model" : "Vehículo — Año, marca, modelo"}
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/30"
          />

          <select
            name="service"
            required
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-sm text-white outline-none focus:border-white/30"
          >
            <option value="" disabled>
              {en ? "Select service" : "Selecciona el servicio"}
            </option>
            <option value="Diagnostic">{en ? "Diagnostic" : "Diagnóstico"}</option>
            <option value="Oil Change">{en ? "Oil Change" : "Cambio de aceite"}</option>
            <option value="Hybrid Battery Service">
              {en ? "Hybrid Battery Service" : "Servicio de batería híbrida"}
            </option>
            <option value="Brake Service">{en ? "Brake Service" : "Servicio de frenos"}</option>
            <option value="General Maintenance">
              {en ? "General Maintenance" : "Mantenimiento general"}
            </option>
            <option value="Repair">{en ? "Repair" : "Reparación"}</option>
            <option value="Other">{en ? "Other" : "Otro"}</option>
          </select>

          <textarea
            name="message"
            rows={4}
            placeholder={en ? "Describe the issue or service needed" : "Describe el problema o servicio que necesitas"}
            className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/30"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs text-white/55">
                {en ? "Preferred date" : "Fecha preferida"}
              </label>
              <input
                name="date"
                type="date"
                required
                min={minimumDate}
                className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-sm text-black outline-none"
              />
              {serviceType && requiresLeadTime && (
                <p className="mt-1.5 text-[11px] leading-4 text-white/45">
                  {en
                    ? "This service requires at least 4 days of advance notice."
                    : "Este servicio requiere al menos 4 días de anticipación."}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-white/55">
                {en ? "Drop-off time" : "Hora de entrega"}
              </label>
              <input
                name="time"
                type="time"
                required
                min="08:00"
                max="16:00"
                step="1800"
                className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-sm text-black outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? en
                ? "Sending..."
                : "Enviando..."
              : en
              ? "Submit Request"
              : "Enviar solicitud"}
          </button>

          {success && (
            <p className="text-sm text-green-400">
              {en
                ? "Your request was sent successfully. We’ll contact you to confirm."
                : "Tu solicitud fue enviada correctamente. Te contactaremos para confirmar."}
            </p>
          )}
          {error && <p className="text-sm text-red-400">{error}</p>}
        </form>
      </div>
    </div>
  );
}
