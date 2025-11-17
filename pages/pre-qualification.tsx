// pages/pre-qualification.tsx
import * as React from "react";
import Head from "next/head";

export default function PreQualification() {
  const [submitting, setSubmitting] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [uiLang, setUiLang] = React.useState<"EN" | "ES">("EN"); // idioma UI
  const [hasLicenseValue, setHasLicenseValue] = React.useState<string>("");
  const [heardAbout, setHeardAbout] = React.useState<string>("");

  // Autollenar vehículo cuando viene desde /pre-qualification?id=...
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const v = params.get("id");
    if (v) {
      const input = document.querySelector(
        "input[name='vehicle']"
      ) as HTMLInputElement | null;
      if (input) input.value = v.replace(/-/g, " ").trim();
    }
  }, []);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const fd = new FormData(e.currentTarget);

    const name = (fd.get("name") as string)?.trim();
    const phone = (fd.get("phone") as string)?.trim();

    if (!name || !phone) {
      setSubmitting(false);
      setError(
        uiLang === "EN"
          ? "⚠️ Please enter at least your full name and phone number."
          : "⚠️ Por favor ingresa al menos tu nombre completo y número de teléfono."
      );
      return;
    }

    const body = {
      name,
      phone,
      email: (fd.get("email") as string) || "",
      language: uiLang, // idioma de la UI
      vehicle: (fd.get("vehicle") as string) || "",
      vin: (fd.get("vin") as string) || "",
      downPayment: (fd.get("downPayment") as string) || "",
      monthlyBudget: (fd.get("monthlyBudget") as string) || "",
      employment: (fd.get("employment") as string) || "",
      monthlyIncome: (fd.get("monthlyIncome") as string) || "",
      hasLicense: (fd.get("hasLicense") as string) || "",
      licenseNumber: (fd.get("licenseNumber") as string) || "",
      proofIncome: (fd.get("proofIncome") as string) || "",
      contactMethod: (fd.get("contactMethod") as string) || "",
      heardAbout: (fd.get("heardAbout") as string) || "",
      referralName: (fd.get("referralName") as string) || "",
      addressStreet: (fd.get("addressStreet") as string) || "",
      addressCity: (fd.get("addressCity") as string) || "",
      addressState: (fd.get("addressState") as string) || "",
      addressZip: (fd.get("addressZip") as string) || "",
      notes: (fd.get("notes") as string) || "",
      page_url: typeof window !== "undefined" ? window.location.href : "",
    };

    fetch("/api/prequal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(async (r) => {
        const data = await r.json().catch(() => null);
        if (!r.ok) throw new Error(data?.msg || "Request failed");

        setSent(true);
        (e.currentTarget as HTMLFormElement).reset();
        setHasLicenseValue("");
        setHeardAbout("");
      })
      .catch((err) => {
        console.error(err);
        setError(
          uiLang === "EN"
            ? err?.message ||
              "There was a problem sending your info. Please try again."
            : err?.message ||
              "Hubo un problema enviando tu información. Intenta nuevamente."
        );
      })
      .finally(() => setSubmitting(false));
  }

  const isEN = uiLang === "EN";

  return (
    <>
      <Head>
        <title>
          {isEN
            ? "Get Pre-Qualified – Available Hybrid R&M Inc."
            : "Pre-Califícate – Available Hybrid R&M Inc."}
        </title>
      </Head>

      <main className="min-h-screen bg-neutral-950 text-white px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-neutral-500">
                {isEN ? "PRE-QUALIFICATION" : "PRE-CALIFICACIÓN"}
              </p>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {isEN ? "Get Pre-Qualified" : "Pre-Califícate"}
              </h1>
              <p className="text-sm text-neutral-400">
                {isEN
                  ? "Fill out this short form and we’ll review your application in DealerCenter. Bilingual EN/ES. No hard credit pull."
                  : "Llena este formulario corto y revisaremos tu solicitud en DealerCenter. Bilingüe EN/ES. No hacemos hard credit pull."}
              </p>
            </div>

            {/* Toggle de idioma */}
            <div className="mt-2 flex items-center gap-2 self-start rounded-full border border-neutral-700 bg-neutral-900 px-2 py-1 text-[11px] sm:self-auto">
              <span className="text-neutral-400">
                {isEN ? "Language" : "Idioma"}
              </span>
              <button
                type="button"
                onClick={() => setUiLang("EN")}
                className={`rounded-full px-3 py-1 ${
                  isEN
                    ? "bg-white text-neutral-900"
                    : "text-neutral-300 hover:bg-neutral-800"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setUiLang("ES")}
                className={`rounded-full px-3 py-1 ${
                  !isEN
                    ? "bg-white text-neutral-900"
                    : "text-neutral-300 hover:bg-neutral-800"
                }`}
              >
                ES
              </button>
            </div>
          </header>

          {!sent ? (
            <form
              onSubmit={handleSubmit}
              className="mt-8 grid gap-5 rounded-3xl border border-neutral-800 bg-neutral-900/80 p-6 shadow-xl sm:p-8"
            >
              {/* NAME + PHONE */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label={isEN ? "Full Name *" : "Nombre completo *"}
                  name="name"
                  required
                  placeholder={isEN ? "John Doe" : "Juan Pérez"}
                />
                <Field
                  label={isEN ? "Phone *" : "Teléfono *"}
                  name="phone"
                  required
                  placeholder="(818) 555-1234"
                />
              </div>

              {/* ADDRESS */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label={isEN ? "Street Address" : "Dirección (calle y número)"}
                  name="addressStreet"
                  placeholder={
                    isEN ? "6726 Reseda Blvd Suite A7" : "6726 Reseda Blvd Suite A7"
                  }
                />
                <Field
                  label={isEN ? "City" : "Ciudad"}
                  name="addressCity"
                  placeholder="Reseda"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label={isEN ? "State" : "Estado"}
                  name="addressState"
                  placeholder="CA"
                />
                <Field
                  label={isEN ? "ZIP Code" : "Código ZIP"}
                  name="addressZip"
                  placeholder="91335"
                />
              </div>

              {/* EMAIL + VEHICLE */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label={isEN ? "Email" : "Correo electrónico"}
                  name="email"
                  type="email"
                  placeholder="you@email.com"
                />
                <Field
                  label={isEN ? "Vehicle of Interest" : "Vehículo de interés"}
                  name="vehicle"
                  placeholder="2013 Toyota Prius"
                />
              </div>

              {/* VIN opcional + DOWN PAYMENT */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label={isEN ? "VIN (optional)" : "VIN (opcional)"}
                  name="vin"
                  placeholder="JTDKN3DU..."
                  help={
                    isEN
                      ? "Vehicle Identification Number (17 characters). You can find it on the registration, title or at the base of the windshield."
                      : "Número de identificación del vehículo (17 caracteres). Lo encuentras en la registración, el título o en la base del parabrisas."
                  }
                />
                <Field
                  label={isEN ? "Down Payment" : "Pago inicial"}
                  name="downPayment"
                  placeholder="$2,000"
                  help={
                    isEN
                      ? "Amount you can pay today as initial payment."
                      : "Cantidad que puedes pagar hoy como pago inicial."
                  }
                />
              </div>

              {/* BUDGET + INCOME */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label={isEN ? "Monthly Budget" : "Presupuesto mensual"}
                  name="monthlyBudget"
                  placeholder="$350"
                  help={
                    isEN
                      ? "Max monthly car payment you feel comfortable with (without insurance)."
                      : "Pago mensual máximo con el que te sientes cómodo (sin incluir seguro)."
                  }
                />
                <Field
                  label={isEN ? "Monthly Income" : "Ingreso mensual"}
                  name="monthlyIncome"
                  placeholder="$4,000"
                  help={
                    isEN
                      ? "Approximate income per month before taxes."
                      : "Ingreso aproximado al mes antes de impuestos."
                  }
                />
              </div>

              {/* EMPLOYMENT + LICENSE */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label={isEN ? "Employment" : "Situación laboral"}
                  name="employment"
                  options={
                    isEN
                      ? ["Full-time", "Part-time", "Self-employed", "Unemployed"]
                      : [
                          "Tiempo completo",
                          "Medio tiempo",
                          "Independiente",
                          "Desempleado",
                        ]
                  }
                  help={
                    isEN
                      ? "Your current work situation."
                      : "Tu situación laboral actual."
                  }
                />

                {/* Driver License select con estado */}
                <div className="grid gap-2">
                  <div className="flex items-center gap-1">
                    <label className="text-sm text-neutral-200">
                      {isEN
                        ? "Do you have a driver's license?"
                        : "¿Tienes licencia de conducir?"}
                    </label>
                  </div>
                  <select
                    name="hasLicense"
                    value={hasLicenseValue}
                    onChange={(e) => setHasLicenseValue(e.target.value)}
                    className="rounded-2xl border border-neutral-700 bg-neutral-900 text-sm text-white px-3 py-2.5 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40 transition"
                  >
                    <option value="">
                      {isEN ? "Select…" : "Selecciona…"}
                    </option>
                    <option value="yes">
                      {isEN
                        ? "Yes, I have a valid license"
                        : "Sí, tengo licencia vigente"}
                    </option>
                    <option value="no">
                      {isEN ? "No license" : "No tengo licencia"}
                    </option>
                    <option value="expired">
                      {isEN ? "Expired license" : "Licencia vencida"}
                    </option>
                  </select>
                </div>
              </div>

              {/* License number condicional */}
              {hasLicenseValue === "yes" && (
                <Field
                  label={
                    isEN
                      ? "Driver's License Number"
                      : "Número de licencia de conducir"
                  }
                  name="licenseNumber"
                  placeholder={isEN ? "D1234567" : "D1234567"}
                />
              )}

              {/* PROOF OF INCOME + CONTACT METHOD */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label={
                    isEN
                      ? "Proof of Income Available?"
                      : "¿Tienes prueba de ingresos?"
                  }
                  name="proofIncome"
                  options={
                    isEN
                      ? ["Yes", "No", "Self-employed / No documents"]
                      : ["Sí", "No", "Independiente / Sin documentos"]
                  }
                  help={
                    isEN
                      ? "Pay stubs, bank statements or any document that shows your income."
                      : "Recibos de pago, estados de cuenta bancarios u otro documento que muestre tus ingresos."
                  }
                />
                <Select
                  label={
                    isEN
                      ? "How do you want us to contact you?"
                      : "¿Cómo prefieres que te contactemos?"
                  }
                  name="contactMethod"
                  options={
                    isEN
                      ? ["Phone Call", "WhatsApp", "Text Message", "Email"]
                      : ["Llamada", "WhatsApp", "Mensaje de texto", "Email"]
                  }
                />
              </div>

              {/* HOW DID YOU HEAR ABOUT US */}
              <div className="grid gap-2">
                <div className="flex items-center gap-1">
                  <label className="text-sm text-neutral-200">
                    {isEN
                      ? "How did you hear about us?"
                      : "¿Cómo nos conociste?"}
                  </label>
                  <InfoDot
                    text={
                      isEN
                        ? "This helps us understand where our clients are coming from."
                        : "Esto nos ayuda a entender de dónde llegan nuestros clientes."
                    }
                  />
                </div>
                <select
                  name="heardAbout"
                  value={heardAbout}
                  onChange={(e) => setHeardAbout(e.target.value)}
                  className="rounded-2xl border border-neutral-700 bg-neutral-900 text-sm text-white px-3 py-2.5 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40 transition"
                >
                  <option value="">
                    {isEN ? "Select…" : "Selecciona…"}
                  </option>
                  <option value="online">
                    {isEN
                      ? "Online (website / marketplace)"
                      : "En línea (página web / marketplace)"}
                  </option>
                  <option value="friend">
                    {isEN
                      ? "Friend / Family recommended"
                      : "Recomendado por amigo / familia"}
                  </option>
                  <option value="driveby">
                    {isEN
                      ? "Drove by / Saw location"
                      : "Pasé por el lugar / Vi la ubicación"}
                  </option>
                  <option value="social">
                    {isEN ? "Social Media" : "Redes sociales"}
                  </option>
                  <option value="other">
                    {isEN ? "Other" : "Otro"}
                  </option>
                </select>
              </div>

              {heardAbout === "friend" && (
                <Field
                  label={
                    isEN
                      ? "Who referred you?"
                      : "¿Quién te recomendó?"
                  }
                  name="referralName"
                  placeholder={
                    isEN ? "Friend's name" : "Nombre de la persona"
                  }
                />
              )}

              {/* NOTES */}
              <div className="grid gap-2">
                <label className="text-sm text-neutral-200">
                  {isEN ? "Notes" : "Notas"}
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  className="rounded-2xl border border-neutral-700 bg-neutral-900/80 px-3 py-2.5 text-sm text-white placeholder:text-neutral-500 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40 transition"
                  placeholder={
                    isEN
                      ? "Anything else we should know? (Co-signer, job type, schedule, etc.)"
                      : "¿Algo más que debamos saber? (Co-signer, tipo de trabajo, horario, etc.)"
                  }
                />
              </div>

              {error && (
                <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {error}
                </p>
              )}

              <button
                disabled={submitting}
                className="mt-2 inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-neutral-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? isEN
                    ? "Sending…"
                    : "Enviando…"
                  : isEN
                  ? "Send my info"
                  : "Enviar mi información"}
              </button>

              <p className="text-[11px] text-neutral-500">
                {isEN
                  ? "By submitting this form you agree to be contacted by phone, text, WhatsApp or email based on your preferred contact method."
                  : "Al enviar este formulario aceptas que te contactemos por llamada, texto, WhatsApp o correo electrónico según tu método preferido."}
              </p>
            </form>
          ) : (
            <SuccessBox uiLang={uiLang} />
          )}
        </div>
      </main>
    </>
  );
}

/* -------------------------------------------- */
/* 📦 COMPONENTES REUTILIZABLES                 */
/* -------------------------------------------- */

function Field({
  label,
  name,
  placeholder,
  required,
  type = "text",
  help,
}: any) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-1">
        <label className="text-sm text-neutral-200">{label}</label>
        {help && <InfoDot text={help} />}
      </div>
      <input
        name={name}
        required={required}
        type={type}
        placeholder={placeholder}
        className="rounded-2xl border border-neutral-700 bg-neutral-900/80 px-3 py-2.5 text-sm text-white placeholder:text-neutral-500 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40 transition"
      />
    </div>
  );
}

function Select({ label, name, options, help }: any) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-1">
        <label className="text-sm text-neutral-200">{label}</label>
        {help && <InfoDot text={help} />}
      </div>
      <select
        name={name}
        className="rounded-2xl border border-neutral-700 bg-neutral-900 text-sm text-white px-3 py-2.5 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40 transition"
      >
        <option value="">Select…</option>
        {options.map((v: string) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
    </div>
  );
}

function InfoDot({ text }: { text: string }) {
  return (
    <div className="group relative flex h-4 w-4 items-center justify-center rounded-full border border-neutral-500 text-[10px] text-neutral-300">
      i
      <div className="pointer-events-none absolute left-1/2 top-5 z-20 hidden w-64 -translate-x-1/2 rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-[11px] text-neutral-100 shadow-xl group-hover:block">
        {text}
      </div>
    </div>
  );
}

function SuccessBox({ uiLang }: { uiLang: "EN" | "ES" }) {
  const isEN = uiLang === "EN";
  return (
    <div className="mt-10 rounded-3xl border border-emerald-500/40 bg-emerald-900/20 p-8 text-center shadow-lg">
      <h2 className="text-2xl font-bold text-emerald-400">
        {isEN ? "✅ Information Sent!" : "✅ ¡Información enviada!"}
      </h2>
      <p className="mt-3 text-sm text-neutral-100">
        {isEN
          ? "Thank you! We’ve received your information and will contact you shortly with the next steps."
          : "¡Gracias! Hemos recibido tu información y te contactaremos pronto con los siguientes pasos."}
      </p>
      <a
        href="/pre-qualification"
        className="mt-5 inline-block rounded-2xl border border-emerald-400 bg-transparent px-5 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/10"
      >
        {isEN ? "Send another request" : "Enviar otra solicitud"}
      </a>
    </div>
  );
}
