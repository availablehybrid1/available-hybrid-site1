import * as React from "react";

type SellYourCarModalProps = {
  open: boolean;
  onClose: () => void;
  lang: "en" | "es";
  whatsappDigits?: string;
};

type FormState = {
  name: string;
  phone: string;
  email: string;
  year: string;
  make: string;
  model: string;
  mileage: string;
  vin: string;
  titleStatus: string;
  condition: string;
  askingPrice: string;
  payoff: string;
  notes: string;
};

const emptyForm: FormState = {
  name: "",
  phone: "",
  email: "",
  year: "",
  make: "",
  model: "",
  mileage: "",
  vin: "",
  titleStatus: "",
  condition: "",
  askingPrice: "",
  payoff: "",
  notes: "",
};

export default function SellYourCarModal({
  open,
  onClose,
  lang,
  whatsappDigits = "17473544098",
}: SellYourCarModalProps) {
  const [form, setForm] = React.useState<FormState>(emptyForm);

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const isEN = lang === "en";
  const update = (key: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = [
      isEN ? "Hi, I would like to sell my vehicle." : "Hola, me gustaría vender mi vehículo.",
      "",
      isEN ? "SELLER INFORMATION" : "INFORMACIÓN DEL VENDEDOR",
      `${isEN ? "Name" : "Nombre"}: ${form.name || "-"}`,
      `${isEN ? "Phone" : "Teléfono"}: ${form.phone || "-"}`,
      `Email: ${form.email || "-"}`,
      "",
      isEN ? "VEHICLE INFORMATION" : "INFORMACIÓN DEL VEHÍCULO",
      `${isEN ? "Year" : "Año"}: ${form.year || "-"}`,
      `${isEN ? "Make" : "Marca"}: ${form.make || "-"}`,
      `${isEN ? "Model" : "Modelo"}: ${form.model || "-"}`,
      `${isEN ? "Mileage" : "Millas"}: ${form.mileage || "-"}`,
      `VIN: ${form.vin || "-"}`,
      `${isEN ? "Title status" : "Título"}: ${form.titleStatus || "-"}`,
      `${isEN ? "Condition" : "Condición"}: ${form.condition || "-"}`,
      `${isEN ? "Asking price" : "Precio solicitado"}: ${form.askingPrice || "-"}`,
      `${isEN ? "Loan / payoff" : "Saldo de préstamo"}: ${form.payoff || "-"}`,
      `${isEN ? "Notes" : "Notas"}: ${form.notes || "-"}`,
      "",
      isEN
        ? "I can send vehicle photos here on WhatsApp."
        : "Puedo enviar las fotos del vehículo por este WhatsApp.",
    ];

    window.open(
      `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(lines.join("\n"))}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const fieldClass =
    "mt-1.5 w-full rounded-xl border border-white/15 bg-white/[0.05] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/45";

  const yearOptions = Array.from({ length: 48 }, (_, index) => String(2027 - index));
  const makeOptions = [
    "Acura", "Audi", "BMW", "Buick", "Cadillac", "Chevrolet", "Chrysler",
    "Dodge", "Ford", "Genesis", "GMC", "Honda", "Hyundai", "Infiniti",
    "Jeep", "Kia", "Lexus", "Lincoln", "Mazda", "Mercedes-Benz", "MINI",
    "Mitsubishi", "Nissan", "Porsche", "Ram", "Subaru", "Tesla", "Toyota",
    "Volkswagen", "Volvo"
  ];
  const titleOptions = isEN
    ? ["Clean", "Salvage", "Rebuilt", "Lien", "Other"]
    : ["Limpio", "Salvage", "Rebuilt", "Con préstamo / lien", "Otro"];
  const conditionOptions = isEN
    ? ["Excellent", "Good", "Fair", "Needs repairs", "Not running"]
    : ["Excelente", "Buena", "Regular", "Necesita reparaciones", "No enciende"];
  const labelClass = "text-xs font-medium text-white/70";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/75 px-4 py-6 backdrop-blur-sm sm:py-10"
      role="dialog"
      aria-modal="true"
      aria-label={isEN ? "Sell your car" : "Vende tu auto"}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-white/15 bg-neutral-950 shadow-2xl">
        <div className="flex items-start justify-between border-b border-white/10 px-5 py-4 sm:px-7">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/45">
              {isEN ? "Vehicle appraisal" : "Evaluación de vehículo"}
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-white">
              {isEN ? "Sell Your Car" : "Vende Tu Auto"}
            </h2>
            <p className="mt-1 text-sm text-white/55">
              {isEN
                ? "Complete the information below and send it directly to us on WhatsApp."
                : "Completa la información y envíanosla directamente por WhatsApp."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-lg text-white/70 hover:border-white/35 hover:text-white"
            aria-label={isEN ? "Close" : "Cerrar"}
          >
            ×
          </button>
        </div>

        <form onSubmit={submit} className="space-y-6 px-5 py-5 sm:px-7 sm:py-6">
          <section>
            <h3 className="text-sm font-semibold text-white">
              {isEN ? "Your information" : "Tu información"}
            </h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <label className={labelClass}>
                {isEN ? "Name" : "Nombre"} *
                <input required value={form.name} onChange={update("name")} className={fieldClass} />
              </label>
              <label className={labelClass}>
                {isEN ? "Phone" : "Teléfono"} *
                <input required value={form.phone} onChange={update("phone")} inputMode="tel" className={fieldClass} />
              </label>
              <label className={labelClass}>
                Email
                <input value={form.email} onChange={update("email")} type="email" className={fieldClass} />
              </label>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-white">
              {isEN ? "Vehicle details" : "Datos del vehículo"}
            </h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className={labelClass}>
                {isEN ? "Year" : "Año"} *
                <input
                  required
                  list="sell-car-years"
                  value={form.year}
                  onChange={update("year")}
                  inputMode="numeric"
                  placeholder={isEN ? "Select or type year" : "Selecciona o escribe el año"}
                  className={fieldClass}
                />
                <datalist id="sell-car-years">
                  {yearOptions.map((year) => <option key={year} value={year} />)}
                </datalist>
              </label>
              <label className={labelClass}>
                {isEN ? "Make" : "Marca"} *
                <input
                  required
                  list="sell-car-makes"
                  value={form.make}
                  onChange={update("make")}
                  placeholder={isEN ? "Select or type make" : "Selecciona o escribe la marca"}
                  className={fieldClass}
                />
                <datalist id="sell-car-makes">
                  {makeOptions.map((make) => <option key={make} value={make} />)}
                </datalist>
              </label>
              <label className={labelClass}>
                {isEN ? "Model" : "Modelo"} *
                <input
                  required
                  value={form.model}
                  onChange={update("model")}
                  placeholder={isEN ? "Type model" : "Escribe el modelo"}
                  className={fieldClass}
                />
              </label>
              <label className={labelClass}>
                {isEN ? "Mileage" : "Millas"} *
                <input required value={form.mileage} onChange={update("mileage")} inputMode="numeric" className={fieldClass} />
              </label>
              <label className={labelClass}>
                VIN
                <input value={form.vin} onChange={update("vin")} maxLength={17} className={fieldClass} />
              </label>
              <label className={labelClass}>
                {isEN ? "Title status" : "Estado del título"} *
                <input
                  required
                  list="sell-car-title-status"
                  value={form.titleStatus}
                  onChange={update("titleStatus")}
                  placeholder={isEN ? "Select or type" : "Selecciona o escribe"}
                  className={fieldClass}
                />
                <datalist id="sell-car-title-status">
                  {titleOptions.map((option) => <option key={option} value={option} />)}
                </datalist>
              </label>
              <label className={labelClass}>
                {isEN ? "Vehicle condition" : "Condición"} *
                <input
                  required
                  list="sell-car-condition"
                  value={form.condition}
                  onChange={update("condition")}
                  placeholder={isEN ? "Select or describe" : "Selecciona o describe"}
                  className={fieldClass}
                />
                <datalist id="sell-car-condition">
                  {conditionOptions.map((option) => <option key={option} value={option} />)}
                </datalist>
              </label>
              <label className={labelClass}>
                {isEN ? "Asking price" : "Precio solicitado"}
                <input value={form.askingPrice} onChange={update("askingPrice")} inputMode="numeric" placeholder="$" className={fieldClass} />
              </label>
              <label className={labelClass}>
                {isEN ? "Loan / payoff balance" : "Saldo de préstamo"}
                <input value={form.payoff} onChange={update("payoff")} inputMode="numeric" placeholder="$" className={fieldClass} />
              </label>
            </div>
          </section>

          <label className={labelClass}>
            {isEN ? "Additional details" : "Detalles adicionales"}
            <textarea
              value={form.notes}
              onChange={update("notes")}
              rows={4}
              placeholder={
                isEN
                  ? "Mechanical issues, cosmetic damage, recent repairs, options, etc."
                  : "Problemas mecánicos, daños, reparaciones recientes, equipamiento, etc."
              }
              className={fieldClass}
            />
          </label>

          <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-white/45">
              {isEN
                ? "After submitting, WhatsApp will open with all the information. You can send photos there."
                : "Al enviar, WhatsApp abrirá con toda la información. Allí podrás enviar las fotos."}
            </p>
            <button
              type="submit"
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              {isEN ? "Send Vehicle Info" : "Enviar Información"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
