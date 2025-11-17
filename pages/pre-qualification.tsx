// pages/pre-qualification.tsx
import * as React from "react";
import Head from "next/head";

export default function PreQualification() {
  const [submitting, setSubmitting] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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
      setError("⚠️ Please enter at least your full name & phone.");
      return;
    }

    const body = {
      name,
      phone,
      email: (fd.get("email") as string) || "",
      language: (fd.get("language") as string) || "",
      vehicle: (fd.get("vehicle") as string) || "",
      vin: (fd.get("vin") as string) || "",
      downPayment: (fd.get("downPayment") as string) || "",
      monthlyBudget: (fd.get("monthlyBudget") as string) || "",
      employment: (fd.get("employment") as string) || "",
      monthlyIncome: (fd.get("monthlyIncome") as string) || "",
      hasLicense: (fd.get("hasLicense") as string) || "",
      proofIncome: (fd.get("proofIncome") as string) || "",
      contactMethod: (fd.get("contactMethod") as string) || "",
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
      })
      .catch((err) => {
        console.error(err);
        setError(
          err?.message || "There was a problem sending your info. Please try again."
        );
      })
      .finally(() => setSubmitting(false));
  }

  return (
    <>
      <Head>
        <title>Get Pre-Qualified – Available Hybrid R&M Inc.</title>
      </Head>

      <main className="min-h-screen bg-neutral-950 text-white px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <header className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-neutral-500">
              PRE-QUALIFICATION
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Get Pre-Qualified
            </h1>
            <p className="text-sm text-neutral-400">
              Fill out this short form and we’ll review your application in DealerCenter.{" "}
              <span className="font-medium text-neutral-200">Bilingual EN/ES.</span>{" "}
              No hard credit pull.
            </p>
          </header>

          {!sent ? (
            <form
              onSubmit={handleSubmit}
              className="mt-8 grid gap-5 rounded-3xl border border-neutral-800 bg-neutral-900/80 p-6 shadow-xl sm:p-8"
            >
              {/* NAME + PHONE */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Full Name *"
                  name="name"
                  required
                  placeholder="John Doe"
                />
                <Field
                  label="Phone *"
                  name="phone"
                  required
                  placeholder="(818) 555-1234"
                />
              </div>

              {/* EMAIL + LANGUAGE */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Email"
                  name="email"
                  type="email"
                  placeholder="you@email.com"
                />
                <Select
                  label="Preferred Language"
                  name="language"
                  options={["English", "Español"]}
                />
              </div>

              {/* VEHICLE + VIN */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Vehicle of Interest"
                  name="vehicle"
                  placeholder="2013 Toyota Prius"
                />
                <Field
                  label="VIN (optional / opcional)"
                  name="vin"
                  placeholder="JTDKN3DU..."
                />
              </div>

              {/* DOWNPAYMENT + BUDGET */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Down Payment"
                  name="downPayment"
                  placeholder="$2,000"
                  help="Amount you can pay today as initial payment. / Cantidad que puedes pagar hoy como pago inicial."
                />
                <Field
                  label="Monthly Budget"
                  name="monthlyBudget"
                  placeholder="$350"
                  help="Maximum car payment per month you feel comfortable with (without insurance). / Pago mensual máximo con el que te sientas cómodo (sin incluir seguro)."
                />
              </div>

              {/* EMPLOYMENT + INCOME */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Employment"
                  name="employment"
                  options={[
                    "Full-time",
                    "Part-time",
                    "Self-employed",
                    "Unemployed",
                  ]}
                  help="Your current work situation. / Tu situación laboral actual."
                />
                <Field
                  label="Monthly Income"
                  name="monthlyIncome"
                  placeholder="$4,000"
                  help="Approximate income per month before taxes. / Ingreso aproximado al mes antes de impuestos."
                />
              </div>

              {/* NEW FIELDS */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Driver License?"
                  name="hasLicense"
                  options={["Yes", "No", "Expired"]}
                />
                <Select
                  label="Proof of Income Available?"
                  name="proofIncome"
                  options={["Yes", "No", "Self-employed / No documents"]}
                />
              </div>

              {/* CONTACT METHOD */}
              <Select
                label="How do you want us to contact you?"
                name="contactMethod"
                options={["Phone Call", "WhatsApp", "Text Message", "Email"]}
              />

              {/* NOTES */}
              <div className="grid gap-2">
                <label className="text-sm text-neutral-200">Notes</label>
                <textarea
                  name="notes"
                  rows={3}
                  className="rounded-2xl border border-neutral-700 bg-neutral-900/80 px-3 py-2.5 text-sm text-white placeholder:text-neutral-500 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40 transition"
                  placeholder="Anything else we should know? (Co-signer, job type, schedule, etc.)"
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
                {submitting ? "Sending…" : "Send my info"}
              </button>

              <p className="text-[11px] text-neutral-500">
                By submitting this form you agree to be contacted by phone, text,
                WhatsApp or email based on your preferred contact method.
              </p>
            </form>
          ) : (
            <SuccessBox />
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

function SuccessBox() {
  return (
    <div className="mt-10 rounded-3xl border border-emerald-500/40 bg-emerald-900/20 p-8 text-center shadow-lg">
      <h2 className="text-2xl font-bold text-emerald-400">
        ✅ Information Sent!
      </h2>
      <p className="mt-3 text-sm text-neutral-100">
        Thank you! We’ve received your information and will contact you shortly
        with the next steps.
      </p>
      <a
        href="/pre-qualification"
        className="mt-5 inline-block rounded-2xl border border-emerald-400 bg-transparent px-5 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/10"
      >
        Send another request
      </a>
    </div>
  );
}
