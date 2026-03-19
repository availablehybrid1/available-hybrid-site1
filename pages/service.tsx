import React from "react";

export default function Service() {
  const phone = "+1 747-354-4098";

  return (
    <main className="min-h-screen bg-black text-white px-4 py-24">
      <div className="max-w-3xl mx-auto">

        <h1 className="text-3xl font-semibold tracking-tight">
          Schedule Service
        </h1>

        <p className="mt-3 text-white/70">
          Book maintenance, diagnostics or hybrid system service. We specialize in hybrid vehicles while servicing all types of cars.
        </p>

        {/* FORM */}
        <form className="mt-8 space-y-4">

          <input
            type="text"
            placeholder="Full Name"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none"
          />

          <input
            type="tel"
            placeholder="Phone Number"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none"
          />

          <input
            type="text"
            placeholder="Vehicle (Year, Make, Model)"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none"
          />

          <textarea
            placeholder="Describe the service or issue"
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none"
          />

          <button
            type="submit"
            className="w-full bg-white text-black rounded-lg py-3 font-semibold"
          >
            Submit Request
          </button>
        </form>

        {/* QUICK CONTACT */}
        <div className="mt-10 border-t border-white/10 pt-6 text-center">
          <p className="text-white/70 text-sm">
            Prefer immediate assistance?
          </p>

          <div className="mt-4 flex justify-center gap-4">

            <a
              href={`tel:${phone.replace(/[^+\d]/g, "")}`}
              className="border border-white/20 px-4 py-2 rounded-lg hover:bg-white/10"
            >
              Call
            </a>

            <a
              href="https://wa.me/17473544098"
              target="_blank"
              className="border border-white/20 px-4 py-2 rounded-lg hover:bg-white/10"
            >
              WhatsApp
            </a>

          </div>
        </div>

      </div>
    </main>
  );
}
