import * as React from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import SellYourCarModal from "../components/SellYourCarModal";
import { architectsDaughter } from "../lib/fonts";

const copy = {
  EN: {
    pageTitle: "AVAILABLE HYBRID R&M INC. – Hybrid & Fuel Efficient Vehicles",
    metaDescription:
      "Specialized in hybrid and fuel-efficient vehicles in Reseda, CA.",

    navInventory: "Inventory",
    navPrequal: "Pre-Qualify",

    heroTitle: "HYBRID, RACING AND MOTORSPORT",
    heroSubtitle:
  "Hybrid, performance and specialty vehicles in Los Angeles. Service, diagnostics and repairs.",

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
  "Vehículos híbridos, deportivos y especiales en Los Ángeles. Servicio, diagnóstico y reparación.",

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
  const [sellOpen, setSellOpen] = React.useState(false);

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
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-black/55 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4">
          {/* Desktop */}
          <div className="hidden h-[104px] grid-cols-[1fr_auto_1fr] items-center gap-4 sm:grid">
            <div className="flex items-center justify-start gap-3">
              <a
                href={whatsapp}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-transparent"
                aria-label="WhatsApp"
              >
                <img src="/whatsapp-green.png" alt="WhatsApp" className="h-full w-full object-contain" />
              </a>

              <a
                href={`tel:${phone.replace(/[^+\\d]/g, "")}`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/[0.03] text-white/80 transition-all duration-300 hover:border-white hover:bg-white/[0.08] hover:text-white"
                aria-label="Call"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.9.32 1.77.6 2.6a2 2 0 0 1-.45 2.11L8 9.91a16 16 0 0 0 6.09 6.09l1.48-1.21a2 2 0 0 1 2.11-.45c.83.28 1.7.48 2.6.6A2 2 0 0 1 22 16.92z" />
                </svg>
              </a>

              <a
                href="https://www.instagram.com/availablehybridrm/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/[0.03] text-white/80 transition-all duration-300 hover:border-white hover:bg-white/[0.08] hover:text-white"
                aria-label="Instagram"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                  <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
                  <path d="M16 11.37a4 4 0 1 1-7.75 1.26 4 4 0 0 1 7.75-1.26z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
            </div>

            <Link href="/" className="flex items-center justify-center" aria-label="Available Hybrid R&M home">
              <div className="relative h-[92px] w-[330px]">
                <img
                  src="/logo. available hybrid premium.png"
                  alt="Available Hybrid R&M Inc. logo"
                  className="h-full w-full object-contain"
                />
              </div>
            </Link>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSellOpen(true)}
                className={`${architectsDaughter.className} inline-flex min-h-10 items-center justify-center rounded-full border border-white/35 px-5 text-sm uppercase tracking-[0.08em] text-white transition hover:border-white hover:bg-white hover:text-black`}
              >
                {lang === "EN" ? "Sell Your Car" : "Vende Tu Auto"}
              </button>

              <button
                type="button"
                onClick={() => setLang(lang === "EN" ? "ES" : "EN")}
                className="rounded-full border border-neutral-700 bg-neutral-900/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-200 hover:border-neutral-300 hover:bg-neutral-800"
                aria-label={lang === "EN" ? "Cambiar a español" : "Switch to English"}
              >
                {lang === "EN" ? "ES" : "EN"}
              </button>
            </div>
          </div>

          {/* Mobile */}
          <div className="flex flex-col gap-1 py-2 sm:hidden">
            <Link href="/" className="flex items-center justify-center" aria-label="Available Hybrid R&M home">
              <div className="relative h-16 w-52">
                <img
                  src="/logo. available hybrid premium.png"
                  alt="Available Hybrid R&M Inc. logo"
                  className="h-full w-full object-contain"
                />
              </div>
            </Link>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex h-8 w-8 items-center justify-center rounded-full" aria-label="WhatsApp">
                  <img src="/whatsapp-green.png" alt="WhatsApp" className="h-full w-full object-contain" />
                </a>
                <a href={`tel:${phone.replace(/[^+\\d]/g, "")}`} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white/80" aria-label="Call">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.9.32 1.77.6 2.6a2 2 0 0 1-.45 2.11L8 9.91a16 16 0 0 0 6.09 6.09l1.48-1.21a2 2 0 0 1 2.11-.45c.83.28 1.7.48 2.6.6A2 2 0 0 1 22 16.92z" />
                  </svg>
                </a>
                <a href="https://www.instagram.com/availablehybridrm/" target="_blank" rel="noreferrer" className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white/80" aria-label="Instagram">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                    <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
                    <path d="M16 11.37a4 4 0 1 1-7.75 1.26 4 4 0 0 1 7.75-1.26z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSellOpen(true)}
                  className={`${architectsDaughter.className} inline-flex min-h-9 items-center justify-center rounded-full border border-white/35 px-3 text-xs uppercase tracking-[0.06em] text-white`}
                >
                  {lang === "EN" ? "Sell Your Car" : "Vende Tu Auto"}
                </button>
                <button
                  type="button"
                  onClick={() => setLang(lang === "EN" ? "ES" : "EN")}
                  className="rounded-full border border-neutral-700 bg-neutral-900/80 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-200"
                >
                  {lang === "EN" ? "ES" : "EN"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* HERO */}
      <main className="relative">
        <section className="relative min-h-[88vh] flex items-stretch">

          <div className="absolute inset-0 -z-10">
            <Image
              src="/lux-hero.jpg"
              alt="hero"
              fill
              className="object-cover object-[68%_center] sm:object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/25 to-black/60 sm:hidden" />
            <div className="absolute inset-0 hidden bg-black/70 sm:block" />
          </div>

          <div className="relative mx-auto flex w-full max-w-7xl items-start px-4 pb-12 pt-44 sm:items-center sm:px-6 sm:pb-20 sm:pt-28 lg:px-8">
            <div className="w-full max-w-3xl">
              <h1 className={`${architectsDaughter.className} max-w-[22rem] text-[2rem] leading-[1.08] tracking-[0.02em] text-white sm:max-w-none sm:text-5xl lg:text-6xl`}>
                {t.heroTitle}
              </h1>
              <p className="mt-4 max-w-[21rem] text-sm leading-6 text-white/75 sm:mt-6 sm:max-w-xl sm:text-base sm:leading-7">
                {t.heroSubtitle}
              </p>
              <nav
                aria-label={lang === "EN" ? "Explore our services" : "Explora nuestros servicios"}
                className="mt-6 flex max-w-[22rem] flex-col items-start gap-3 sm:mt-9 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-8 sm:gap-y-4"
              >
                <Link
                  href="/inventory"
                  className={`${architectsDaughter.className} inline-flex min-h-11 w-full items-center justify-center border border-white bg-white px-4 py-2.5 text-[15px] text-black transition sm:w-auto sm:min-w-[176px] sm:px-7 hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white`}
                >
                  {t.ctaInventory}
                </Link>

                <Link
                  href="/service"
                  className={`${architectsDaughter.className} group inline-flex min-h-11 items-center gap-2 text-[15px] text-white/90 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white`}
                >
                  <span>{t.ctaService}</span>
                  <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                </Link>

                <Link
                  href="/car-rental"
                  className={`${architectsDaughter.className} group inline-flex min-h-11 items-center gap-2 text-[15px] text-white/90 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white`}
                >
                  <span>Car Rental</span>
                  <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                </Link>

              </nav>
            </div>
          </div>
        </section>

        {/* FOOTER (SIN LINEA BLANCA) */}
        <footer className="bg-black">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-7 text-sm text-white/65 sm:py-10 sm:text-base sm:text-white/70">
            <span className="max-w-[17rem] sm:max-w-none">{t.footerAddress}</span>
            <Link href="/sold" className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-medium text-white/80 transition hover:border-white/50 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              {t.ctaSold}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </footer>

      </main>

      <SellYourCarModal
        open={sellOpen}
        onClose={() => setSellOpen(false)}
        lang={lang === "EN" ? "en" : "es"}
      />
    </>
  );
}
