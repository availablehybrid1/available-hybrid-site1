import * as React from "react";
import Head from "next/head";

export default function ServicePage() {
  const phone = "+1 747-354-4098";
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState("");

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
      vehicle: String(formData.get("vehicle") || ""),
      service: String(formData.get("service") || ""),
      message: String(formData.get("message") || ""),
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
      setError("There was a problem sending your request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Schedule Service | AVAILABLE HYBRID R&M INC.</title>
        <meta
          name="description"
          content="Schedule maintenance, diagnostics, hybrid battery service and repairs."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen bg-neutral-950 text-white">
        <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-10">
            <p className="text-sm uppercase tracking-[0.2em] text-white/50">
              Service Department
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Schedule Service or Diagnostic
            </h1>
            <p className="mt-4 max-w-2xl text-white/70">
              We specialize in hybrid systems, battery diagnostics and repairs,
              while also offering maintenance and service for all types of
              vehicles.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm text-white/70"
                  >
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-white/30"
                    placeholder="Your name"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-2 block text-sm text-white/70"
                    >
                      Phone Number
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
                      Email
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
                    Vehicle
                  </label>
                  <input
                    id="vehicle"
                    name="vehicle"
                    type="text"
                    required
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-white/30"
                    placeholder="Year, Make, Model"
                  />
                </div>

                <div>
                  <label
                    htmlFor="service"
                    className="mb-2 block text-sm text-white/70"
                  >
                    Service Needed
                  </label>
                  <select
                    id="service"
                    name="service"
                    required
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-white/30"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select a service
                    </option>
                    <option value="Diagnostic">Diagnostic</option>
                    <option value="Oil Change">Oil Change</option>
                    <option value="Hybrid Battery Service">
                      Hybrid Battery Service
                    </option>
                    <option value="Brake Service">Brake Service</option>
                    <option value="General Maintenance">
                      General Maintenance
                    </option>
                    <option value="Repair">Repair</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="mb-2 block text-sm text-white/70"
                  >
                    Describe the issue or request
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-white/30"
                    placeholder="Tell us what your vehicle needs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Sending..." : "Submit Request"}
                </button>

                {success && (
                  <p className="text-sm text-green-400">
                    Your request was sent successfully.
                  </p>
                )}

                {error && <p className="text-sm text-red-400">{error}</p>}
              </form>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
              <h2 className="text-lg font-semibold">Need immediate help?</h2>
              <p className="mt-3 text-sm text-white/70">
                If you prefer immediate assistance, contact us directly by phone
                or WhatsApp.
              </p>

              <div className="mt-6 space-y-3">
                <a
                  href={`tel:${phone.replace(/[^+\d]/g, "")}`}
                  className="flex items-center justify-center rounded-xl border border-white/15 px-4 py-3 text-sm font-medium text-white/90 transition hover:border-white/30 hover:bg-white/[0.04]"
                >
                  Call Us
                </a>

                <a
                  href="https://wa.me/17473544098?text=Hello,%20I%20would%20like%20to%20schedule%20a%20service%20or%20diagnostic."
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center rounded-xl border border-white/15 px-4 py-3 text-sm font-medium text-white/90 transition hover:border-white/30 hover:bg-white/[0.04]"
                >
                  Message on WhatsApp
                </a>
              </div>

              <div className="mt-8 border-t border-white/10 pt-6">
                <p className="text-sm text-white/50">Service Categories</p>
                <ul className="mt-3 space-y-2 text-sm text-white/75">
                  <li>Hybrid diagnostics</li>
                  <li>Hybrid battery service</li>
                  <li>Oil changes</li>
                  <li>Brake service</li>
                  <li>General maintenance</li>
                  <li>Vehicle repairs</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
