import * as React from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const copy = {
  EN: {
    pageTitle: "AVAILABLE HYBRID R&M INC. – Hybrid & Fuel Efficient Vehicles",
    metaDescription:
      "Specialized in hybrid and fuel-efficient vehicles in Reseda, CA.",

    navInventory: "Inventory",
    navPrequal: "Pre-Qualify",

    heroTitle: "HYBRID, RACING AND MOTORSPORT",
    heroSubtitle:
  "Hybrid, performance and specialty vehicles in Los Angeles. Hybrid service, diagnostics and repairs for all vehicles.",

    ctaInventory: "View Inventory",
    ctaSold: "Sold",
    ctaPrequal: "Get Pre-Qualified",
    ctaWhatsapp: "WhatsApp",
ctaService: "Schedule Service",
    trust: [
      { title: "Hybrid Specialists", desc: "Toyota Prius · Lexus CT200h · More" },
      { title: "DMV Dealer", desc: "Temporary plates, ROS/TLP online" },
      { title: "BHPH Options", desc: "In-house payment plans" },
    ],

    featuredTitle: "Featured: Toyota Prius",
    featuredSubtitle: "Clean title • 50+ MPG • Ready today",
    featuredButton: "View more",

    footerDealerName: "AVAILABLE HYBRID R&M INC.",
    footerAddress: "6726 Reseda Blvd Unit A7, Reseda, CA 91335",
    footerHoursLabel: "Hours",
    footerHoursValue: "Mon–Sat • 10:00–6:00",
  },

  ES: {
    pageTitle: "AVAILABLE HYBRID R&M INC.",
    metaDescription: "Vehículos híbridos en Los Ángeles.",

    navInventory: "Inventario",
    navPrequal: "Pre-Calificación",

    heroTitle: "HYBRID, RACING AND MOTORSPORT",
    heroSubtitle:
  "Vehículos híbridos, deportivos y especiales en Los Ángeles. Servicio híbrido, diagnóstico y reparación para todo tipo de vehículos.",

    ctaInventory: "Ver inventario",
    ctaSold: "Vendidos",
    ctaPrequal: "Pre-Calificación",
    ctaWhatsapp: "WhatsApp",
ctaService: "Agenda tu servicio",
    trust: [
      { title: "Especialistas", desc: "Prius · Lexus · Más" },
      { title: "Dealer DMV", desc: "Procesos completos" },
      { title: "BHPH", desc: "Planes flexibles" },
    ],

    featuredTitle: "Destacado",
    featuredSubtitle: "Listo hoy",
    featuredButton: "Ver más",

    footerDealerName: "AVAILABLE HYBRID R&M INC.",
    footerAddress: "6726 Reseda Blvd Unit A7, Reseda, CA 91335",
    footerHoursLabel: "Horario",
    footerHoursValue: "Lun–Sáb • 10:00–6:00",
  },
} as const;

export default function Home() {
  const [lang, setLang] = React.useState<"EN" | "ES">("EN");

  const t = copy[lang];

  const whatsapp =
    "https://wa.me/17473544098";
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

          <Image src="/logo. available hybrid premium.png" alt="logo" width={220} height={70} />

          <div className="flex items-center gap-3">
<div className="flex items-center rounded-full border border-white/30 bg-black/40 px-1 py-0.5 text-[11px] mr-2">
  <button
    type="button"
    onClick={() => setLang("EN")}
    className={`px-2 py-0.5 rounded-full ${
      lang === "EN"
        ? "bg-white text-black"
        : "text-white/70 hover:text-white"
    }`}
  >
    EN
  </button>

  <button
    type="button"
    onClick={() => setLang("ES")}
    className={`px-2 py-0.5 rounded-full ${
      lang === "ES"
        ? "bg-white text-black"
        : "text-white/70 hover:text-white"
    }`}
  >
    ES
  </button>
</div>
            {/* WhatsApp (igual que tenías) */}
            <a href={whatsapp} target="_blank" rel="noreferrer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-transparent">
              <img src="/whatsapp-green.png" className="h-full w-full object-contain" />
            </a>

            {/* Phone limpio */}
            <a
  href={`tel:${phone.replace(/[^+\d]/g, "")}`}
  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/80 hover:border-white hover:text-white"
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
            <a href="https://www.instagram.com/availablehybridrm/" target="_blank" rel="noreferrer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/80 hover:border-white hover:text-white">
              IG
            </a>

          </div>
        </div>
      </header>

      {/* HERO */}
      <main className="relative">
        <section className="relative min-h-[88vh] flex items-stretch">

          <div className="absolute inset-0 -z-10">
            <Image src="/lux-hero.jpg" alt="hero" fill className="object-cover" />
            <div className="absolute inset-0 bg-black/70" />
          </div>

          <div className="relative mx-auto flex w-full max-w-7xl items-center px-4 pb-20 pt-28 sm:px-6 lg:px-8">
            <div className="w-full max-w-3xl">
              <h1 className="text-4xl font-medium leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
                {t.heroTitle}
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-white/75">
                {t.heroSubtitle}
              </p>
              <nav aria-label={lang === "EN" ? "Explore our services" : "Explora nuestros servicios"} className="mt-8 flex flex-wrap gap-3">
                <Link href="/inventory" className="inline-flex min-h-12 items-center justify-center rounded-sm border border-white bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                  {t.ctaInventory}
                </Link>
                <Link href="/service" className="inline-flex min-h-12 items-center justify-center rounded-sm border border-white/40 px-6 py-3 text-sm font-medium text-white transition hover:border-white/70 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                  {t.ctaService}
                </Link>
                <Link href="/car-rental" className="inline-flex min-h-12 items-center justify-center rounded-sm border border-white/40 px-6 py-3 text-sm font-medium text-white transition hover:border-white/70 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                  Car Rental
                </Link>
              </nav>
            </div>
          </div>
        </section>

        {/* FOOTER (SIN LINEA BLANCA) */}
        <footer className="bg-black">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-10 text-white/70">
            <span>{t.footerAddress}</span>
            <Link href="/sold" className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-medium text-white/80 transition hover:border-white/50 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              {t.ctaSold}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </footer>

      </main>
    </>
  );
}
