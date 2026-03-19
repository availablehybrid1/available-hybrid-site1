import * as React from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";

const copy = {
  EN: {
    pageTitle: "AVAILABLE HYBRID R&M INC.",
    metaDescription:
      "Premium hybrid, performance and specialty vehicles in Los Angeles. DMV licensed dealer.",

    heroTitle: "HYBRID, RACING AND MOTORSPORT",
    heroSubtitle:
      "Premium selection of hybrid, performance and specialty vehicles in Los Angeles. DMV licensed dealer. Bilingual service and flexible financing options available.",

    ctaInventory: "View Inventory",
    ctaPrequal: "Get Pre-Qualified",
  },
  ES: {
    pageTitle: "AVAILABLE HYBRID R&M INC.",
    metaDescription:
      "Vehículos híbridos, deportivos y especiales en Los Ángeles.",

    heroTitle: "HYBRID, RACING AND MOTORSPORT",
    heroSubtitle:
      "Selección premium de vehículos híbridos, deportivos y especiales en Los Ángeles.",

    ctaInventory: "Ver inventario",
    ctaPrequal: "Pre-Calificación",
  },
} as const;

export default function Home() {
  const [lang, setLang] = React.useState<"EN" | "ES">("EN");
  const t = copy[lang];

  const whatsapp =
    "https://wa.me/17473544098?text=Hello,%20I'm%20interested%20in%20a%20vehicle.";
  const phone = "+1 747-354-4098";

  return (
    <>
      <Head>
        <title>{t.pageTitle}</title>
        <meta name="description" content={t.metaDescription} />
      </Head>

      {/* HEADER */}
      <header className="fixed inset-x-0 top-0 z-40 backdrop-blur bg-black/30 border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
          <Image
            src="/logo. available hybrid premium.png"
            alt="logo"
            width={200}
            height={60}
          />

          <div className="flex items-center gap-3">
            {/* WhatsApp */}
            <a
              href={whatsapp}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/[0.03]"
            >
              <img src="/whatsapp-green.png" className="h-4 w-4" />
            </a>

            {/* Phone */}
            <a
              href={`tel:${phone.replace(/[^+\d]/g, "")}`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/[0.03] text-white/80"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.9.32 1.77.6 2.6a2 2 0 0 1-.45 2.11L8 9.91a16 16 0 0 0 6.09 6.09l1.48-1.21a2 2 0 0 1 2.11-.45c.83.28 1.7.48 2.6.6A2 2 0 0 1 22 16.92z"
                />
              </svg>
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com/availablehybridrm/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/[0.03] text-white/80"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
              >
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <path d="M16 11.37a4 4 0 1 1-7.75 1.26" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <main>
        <section className="relative min-h-[88vh] flex items-stretch">
          {/* Background */}
          <div className="absolute inset-0 -z-10">
            <Image
              src="/lux-hero.jpg"
              alt="hero"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/70" />
          </div>

          <div className="w-full max-w-7xl mx-auto px-4 pt-28 pb-20">
            <h1 className="text-white text-5xl font-semibold tracking-[-0.02em]">
              {t.heroTitle}
            </h1>

            <p className="mt-4 text-white/80 max-w-xl">
              {t.heroSubtitle}
            </p>

            <div className="mt-6 flex gap-3">
              <Link
                href="/inventory"
                className="bg-white text-black px-5 py-3 rounded-xl"
              >
                {t.ctaInventory}
              </Link>

              <Link
                href="/pre-qualification"
                className="border border-white/20 px-5 py-3 rounded-xl text-white"
              >
                {t.ctaPrequal}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
