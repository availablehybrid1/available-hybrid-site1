// pages/pre-qualification.tsx
import * as React from "react";
import Head from "next/head";

const RECEIVER_EMAIL = "availablehybrid@gmail.com"; // cámbialo si usas otro

export default function PreQualification() {
  const [submitting, setSubmitting] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const name = (form.get("name") as string)?.trim();
    const phone = (form.get("phone") as string)?.trim();

    if (!name || !phone) {
      setSubmitting(false);
      setError("Please enter at least your name and phone number.");
      return;
    }

    const subject = encodeURIComponent(
      `Pre-Qualification – ${name || "New Applicant"}`
    );

    const body = encodeURIComponent(
      [
        `Name: ${name}`,
        `Phone: ${phone}`,
        `Email: ${form.get("email") || "—"}`,
        `Preferred language: ${form.get("language") || "EN"}`,
        `Vehicle of interest: ${form.get("vehicle") || "—"}`,
        `VIN: ${form.get("vin") || "—"}`,
        `Down payment: ${form.get("downPayment") || "—"}`,
        `Monthly budget: ${form.get("monthlyBudget") || "—"}`,
        `Employment: ${form.get("employment") || "—"}`,
        `Monthly income: ${form.get("monthlyIncome") || "—"}`,
        `Housing: ${form.get("housing") || "—"}`,
        `Notes: ${form.get("notes") || "—"}`,
        "",
        "Consent to be contacted: Yes",
        "",
        "(Copy this into DealerCenter when processing.)",
      ].join("\n")
    );

    const mailto = `mailto:${RECEIVER_EMAIL}?subject=${subject}&body=${body}`;

    // Abre el correo y muestra confirmación
    window.open(mailto);
    setSubmitting(false);
    setSent(true);
    (e.currentTarget as HTMLFormElement).reset();
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
            DealerCenter. Bilingual service available (EN/ES).
          </p>

          {!sent ? (
            <form
              onSubmit={handleSubmit}
              className="mt-8 grid gap-5 rounded-2xl bg-white/5 p-6 ring-1 ring-white/10"
            >
              {/* Contact */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm text-white/80">Full Name *</label>
                  <input
                    name="name"
                    required
                    className="rounded-xl bg-white/10 px-3 py-2 outline-none ring-1 ring-white/20 focus:ring-white/40"
                    placeholder="John Doe"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm text-white/80">Phone *</label>
                  <input
                    name="phone"
                    required
                    className="rounded-xl bg-white/10 px-3 py-2 outline-none ring-1 ring-white/20 focus:ring-white/40"
                    placeholder="(818) 555-1234"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm text-white/80">Email</label>
                  <input
                    name="email"
                    type="email"
                    className="rounded-xl bg-white/10 px-3 py-2 outline-none ring-1 ring-white/20 focus:ring-white/40"
                    placeholder="you@email.com"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm text-white/80">
                    Preferred language
                  </label>
                  <select
                    name="language"
                    className="rounded-xl bg-white/10 px-3 py-2 outline-none ring-1 ring-white/20 focus:ring-white/40"
                  >
                    <option value="EN">English</option>
                    <option value="ES">Español</option>
                  </select>
                </div>
              </div>

              {/* Vehicle */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm text-white/80">
                    Vehicle of Interest
                  </label>
                  <input
                    name="vehicle"
                    className="rounded-xl bg-white/10 px-3 py-2 outline-none ring-1 ring-white/20 focus:ring-white/40"
                    placeholder="2013 Toyota Prius"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm text-white/80">VIN</label>
                  <input
                    name="vin"
                    className="rounded-xl bg-white/10 px-3 py-2 outline-none ring-1 ring-white/20 focus:ring-white/40"
                    placeholder="JTDKN3DU..."
                  />
                </div>
              </div>

              {/* Financial */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm text-white/80">Down Payment</label>
                  <input
                    name="downPayment"
                    className="rounded-xl bg-white/10 px-3 py-2 outline-none ring-1 ring-white/20 focus:ring-white/40"
                    placeholder="$2,000"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm text-white/80">Monthly Budget</label>
                  <input
                    name="monthlyBudget"
                    className="rounded-xl bg-white/10 px-3 py-2 outline-none ring-1 ring-white/20 focus:ring-white/40"
                    placeholder="$350"
                  />
                </div>
              </div>

              {/* Employment */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm text-white/80">Employment</label>
                  <select
                    name="employment"
                    className="rounded-xl bg-white/10 px-3 py-2 outline-none ring-1 ring-white/20 focus:ring-white/40"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Self-employed">Self-employed</option>
                    <option value="Unemployed">Unemployed</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm text-white/80">Monthly Income</label>
                  <input
                    name="monthlyIncome"
                    className="rounded-xl bg-white/10 px-3 py-2 outline-none ring-1 ring-white/20 focus:ring-white/40"
                    placeholder="$4,000"
                  />
                </div>
              </div>

              {/* Notes */}
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
                {submitting ? "Sending..." : "Send my info"}
              </button>
            </form>
          ) : (
            <div className="mt-10 rounded-2xl bg-emerald-600/10 p-8 text-center ring-1 ring-emerald-500/30">
              <h2 className="text-2xl font-bold text-emerald-400">
                ✅ Information Sent!
              </h2>
              <p className="mt-3 text-white/80">
                Thank you! Your message has been opened in your email app.
                Please make sure to press “Send” so we receive your info.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-5 rounded-xl bg-white/10 px-5 py-2 text-sm hover:bg-white/20"
              >
                Send another form
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
