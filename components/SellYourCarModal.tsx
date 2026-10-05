import * as React from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  lang: "en" | "es";
  whatsappDigits?: string;
};

type Estimate = {
  low: number;
  high: number;
  vehicle?: {
    year: number;
    make: string;
    model: string;
    trim?: string;
  };
};

export default function SellYourCarModal({
  open,
  onClose,
  lang,
  whatsappDigits = "17473544098",
}: Props) {
  const isEN = lang === "en";
  const [step, setStep] = React.useState(1);
  const [vin, setVin] = React.useState("");
  const [mileage, setMileage] = React.useState("");
  const [titleStatus, setTitleStatus] = React.useState("clean");
  const [condition, setCondition] = React.useState("good");
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [estimate, setEstimate] = React.useState<Estimate | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  React.useEffect(() => {
    if (!open) {
      setStep(1);
      setEstimate(null);
      setError("");
    }
  }, [open]);

  if (!open) return null;

  const field =
    "w-full rounded-xl border border-white/15 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/40";
  const select =
    "w-full rounded-xl border border-white/15 bg-neutral-900 px-4 py-3 text-sm text-white outline-none focus:border-white/40";
  const cleanVin = vin.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "");

  async function getEstimate() {
    const miles = Number(mileage.replace(/[^0-9]/g, ""));

    if (cleanVin.length !== 17) {
      setError(isEN ? "Enter a valid 17-character VIN." : "Ingresa un VIN válido de 17 caracteres.");
      return;
    }
    if (!miles || miles < 1) {
      setError(isEN ? "Enter the current mileage." : "Ingresa las millas actuales.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/vehicle-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vin: cleanVin, mileage: miles, titleStatus, condition }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Estimate unavailable");

      setEstimate({
        low: Number(data.low),
        high: Number(data.high),
        vehicle: data.vehicle,
      });
      setStep(3);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isEN
          ? "We couldn't calculate an estimate right now."
          : "No pudimos calcular el estimado en este momento."
      );
    } finally {
      setLoading(false);
    }
  }

  function sendFinalOffer() {
    if (!estimate || !name.trim() || !phone.trim()) return;
    const miles = Number(mileage.replace(/[^0-9]/g, ""));
    const lines = [
      isEN ? "Hi, I would like a final offer for my vehicle." : "Hola, quisiera una oferta final por mi vehículo.",
      "",
      "VIN: " + cleanVin,
      (isEN ? "Mileage: " : "Millas: ") + miles.toLocaleString(),
      (isEN ? "Title: " : "Título: ") + titleStatus,
      (isEN ? "Condition: " : "Condición: ") + condition,
      (isEN ? "Online estimate: $" : "Estimado online: $") +
        estimate.low.toLocaleString() + " – $" + estimate.high.toLocaleString(),
      "",
      (isEN ? "Name: " : "Nombre: ") + name,
      (isEN ? "Phone: " : "Teléfono: ") + phone,
      "",
      isEN
        ? "I understand this is a preliminary estimate and the final offer is subject to inspection and verification."
        : "Entiendo que este es un estimado preliminar y la oferta final está sujeta a inspección y verificación.",
    ];

    window.open(
      "https://wa.me/" + whatsappDigits + "?text=" + encodeURIComponent(lines.join("\n")),
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/75 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={isEN ? "Sell your car" : "Vende tu auto"}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/15 bg-neutral-950 shadow-2xl">
        <div className="flex items-start justify-between border-b border-white/10 px-5 py-5 sm:px-7">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/45">
              {isEN ? "Instant estimate" : "Estimado rápido"}
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-white">
              {isEN ? "Sell Your Car" : "Vende Tu Auto"}
            </h2>
            <p className="mt-1 text-sm text-white/55">
              {isEN
                ? "Get a preliminary dealer offer range in just a few steps."
                : "Recibe un rango preliminar de oferta en pocos pasos."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-lg text-white/70 hover:border-white/35 hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-5 sm:px-7 sm:py-6">
          <div className="mb-5 flex gap-2">
            {[1, 2, 3].map((number) => (
              <div
                key={number}
                className={"h-1 flex-1 rounded-full " + (number <= step ? "bg-white" : "bg-white/15")}
              />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/70">VIN</label>
                <input
                  value={vin}
                  onChange={(e) => setVin(e.target.value.toUpperCase())}
                  maxLength={17}
                  placeholder="17-character VIN"
                  className={field}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/70">
                  {isEN ? "Current mileage" : "Millas actuales"}
                </label>
                <input
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value.replace(/[^0-9]/g, ""))}
                  inputMode="numeric"
                  placeholder="85000"
                  className={field}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (cleanVin.length !== 17 || !Number(mileage)) {
                    setError(isEN ? "Enter VIN and mileage to continue." : "Ingresa VIN y millas para continuar.");
                    return;
                  }
                  setError("");
                  setStep(2);
                }}
                className="inline-flex w-full items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
              >
                {isEN ? "Continue" : "Continuar"}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/70">
                  {isEN ? "Title status" : "Estado del título"}
                </label>
                <select value={titleStatus} onChange={(e) => setTitleStatus(e.target.value)} className={select}>
                  <option value="clean">{isEN ? "Clean title" : "Título limpio"}</option>
                  <option value="rebuilt">Rebuilt</option>
                  <option value="salvage">Salvage</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-white/70">
                  {isEN ? "Vehicle condition" : "Condición del vehículo"}
                </label>
                <select value={condition} onChange={(e) => setCondition(e.target.value)} className={select}>
                  <option value="excellent">{isEN ? "Excellent — no known issues" : "Excelente — sin problemas conocidos"}</option>
                  <option value="good">{isEN ? "Good — normal wear, drives well" : "Buena — desgaste normal, maneja bien"}</option>
                  <option value="fair">{isEN ? "Fair — minor issues" : "Regular — detalles menores"}</option>
                  <option value="needs_repair">{isEN ? "Needs repairs" : "Necesita reparaciones"}</option>
                  <option value="not_running">{isEN ? "Not running" : "No enciende / no maneja"}</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-white/15 px-4 text-sm text-white/75 hover:border-white/30 hover:text-white"
                >
                  {isEN ? "Back" : "Atrás"}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={getEstimate}
                  className="inline-flex min-h-11 flex-[2] items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-60"
                >
                  {loading
                    ? isEN ? "Calculating..." : "Calculando..."
                    : isEN ? "See Estimate" : "Ver estimado"}
                </button>
              </div>
            </div>
          )}

          {step === 3 && estimate && (
            <div>
              <div className="rounded-2xl border border-white/15 bg-white/[0.04] px-5 py-6 text-center">
                {estimate.vehicle && (
                  <p className="mb-2 text-sm font-medium text-white/75">
                    {[estimate.vehicle.year, estimate.vehicle.make, estimate.vehicle.model, estimate.vehicle.trim]
                      .filter(Boolean)
                      .join(" ")}
                  </p>
                )}
                <p className="text-xs uppercase tracking-[0.18em] text-white/45">
                  {isEN ? "Preliminary estimated offer" : "Oferta preliminar estimada"}
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {"$" + estimate.low.toLocaleString() + " – $" + estimate.high.toLocaleString()}
                </p>
                <p className="mt-3 text-xs leading-5 text-white/45">
                  {isEN
                    ? "Free preliminary estimate based on the VIN information, age, mileage, title and condition you provided. Final offer requires inspection and vehicle-history verification."
                    : "Estimado preliminar gratuito basado en VIN, antigüedad, millas, título y condición indicada. La oferta final requiere inspección y verificación del historial."}
                </p>
              </div>

              <div className="mt-5 space-y-3">
                <p className="text-sm font-medium text-white">
                  {isEN ? "Want a final offer?" : "¿Quieres una oferta final?"}
                </p>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder={isEN ? "Your name" : "Tu nombre"} className={field} />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder={isEN ? "Phone number" : "Número de teléfono"} className={field} />
                <button
                  type="button"
                  disabled={!name.trim() || !phone.trim()}
                  onClick={sendFinalOffer}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isEN ? "Get Final Offer" : "Obtener oferta final"}
                </button>
              </div>
            </div>
          )}

          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  );
}
