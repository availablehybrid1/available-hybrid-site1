// pages/pre-qualification.tsx
import * as React from "react";
import Head from "next/head";

export default function PreQualification() {
  const [submitting, setSubmitting] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // 🔹 Si el usuario viene desde /inventory?id=xxxx autollenamos el vehículo
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
        setError(err?.message || "There was a problem sending your info.");
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
          <h1 className="text-3xl font-bold tracking-tight">
            Get Pre-Qualified
          </h1>
          <p className="mt-2 text-white/70">
            Fill out this short form and we’ll handle your application in
            DealerCenter. <b>Bilingual EN/ES</b>. No hard credit pull.
          </p>

          {!sent ? (
            <form
              onSubmit={handleSubmit}
              className="mt-8 grid gap-5 rounded-2xl bg-white/5 p-6 ring-1 ring-white/10"
            >
              {/* NAME + PHONE */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full Name *" name="name" required placeholder="John Doe" />
                <Field label="Phone *" name="phone" required placeholder="(818) 555-1234" />
              </div>

              {/* EMAIL + LANGUAGE */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email" name="email" type="email" placeholder="you@email.com" />
                <Select
                  label="Preferred Language"
                  name="language"
                  options={["English", "Español"]}
                />
              </div>

              {/* VEHICLE + VIN */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Vehicle of Interest" name="vehicle" placeholder="2013 Toyota Prius" />
                <Field label="VIN" name="vin" placeholder="JTDKN3DU..." />
              </div>

              {/* DOWNPAYMENT + BUDGET */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Down Payment" name="downPayment" placeholder="$2,000" />
                <Field label="Monthly Budget" name="monthlyBudget" placeholder="$350" />
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
                />
                <Field label="Monthly Income" name="monthlyIncome" placeholder="$4,000" />
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
                <label className="text-sm text-white/80">Notes</label>
                <textarea
                  name="notes"
                  rows={3}
                  className="rounded-xl bg-white/10 px-3 py-2 outline-none ring-1 ring-white/20 focus:ring-white/40"
                  placeholder="Anything else we should know?"
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                disabled={submitting}
                className="rounded-2xl bg-white text-gray-900 px-5 py-3 font-semibold shadow hover:shadow-lg disabled:opacity-60"
              >
                {submitting ? "Sending…" : "Send my info"}
              </button>
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
}: any) {
  return (
    <div className="grid gap-2">
      <label className="text-sm text-white/80">{label}</label>
      <input
        name={name}
        required={required}
        type={type}
        placeholder={placeholder}
        className="rounded-xl bg-white/10 px-3 py-2 outline-none ring-1 ring-white/20 focus:ring-white/40"
      />
    </div>
  );
}

function Select({ label, name, options }: any) {
  return (
    <div className="grid gap-2">
      <label className="text-sm text-white/80">{label}</label>
      <select
        name={name}
        className="rounded-xl bg-white/10 px-3 py-2 outline-none ring-1 ring-white/20 focus:ring-white/40"
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

function SuccessBox() {
  return (
    <div className="mt-10 rounded-2xl bg-emerald-600/10 p-8 text-center ring-1 ring-emerald-500/30">
      <h2 className="text-2xl font-bold text-emerald-400">
        ✅ Information Sent!
      </h2>
      <p className="mt-3 text-white/80">
        Thank you! We’ve received your information. We will contact you shortly.
      </p>
      <a
        href="/pre-qualification"
        className="mt-5 inline-block rounded-xl bg-white/10 px-5 py-2 text-sm hover:bg-white/20"
      >
        Send another request
      </a>
    </div>
  );
}
