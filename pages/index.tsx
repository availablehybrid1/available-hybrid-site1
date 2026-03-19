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
      "Premium selection of hybrid, performance and specialty vehicles in Los Angeles.",

    ctaInventory: "View Inventory",
    ctaPrequal: "Get Pre-Qualified",
    ctaWhatsapp: "WhatsApp",

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
    heroSubtitle: "Selección premium de vehículos en Los Ángeles.",

    ctaInventory: "Ver inventario",
    ctaPrequal: "Pre-Calificación",
    ctaWhatsapp: "WhatsApp",

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

            {/* WhatsApp (igual que tenías) */}
            <a href={whatsapp} target="_blank" rel="noreferrer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-transparent">
              <img src="/whatsapp-green.png" className="h-full w-full object-contain" />
            </a>

            {/* Phone limpio */}
            <a href={`tel:${phone.replace(/[^+\d]/g, "")}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/80 hover:border-white hover:text-white">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2..." />
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

          <div className="relative w-full mx-auto max-w-7xl px-4 grid lg:grid-cols-12 gap-10 items-center pt-28 pb-20">

            <div className="lg:col-span-7">
              <h1 className="text-white text-5xl font-semibold tracking-tight">
                {t.heroTitle}
              </h1>

              <p className="mt-4 text-white/80 max-w-xl">
                {t.heroSubtitle}
              </p>

              <div className="mt-6 flex gap-3">
                <Link href="/inventory" className="bg-white text-black px-5 py-3 rounded-xl">
                  {t.ctaInventory}
                </Link>

                <Link href="/pre-qualification" className="border border-white/20 px-5 py-3 rounded-xl text-white">
                  {t.ctaPrequal}
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <Image src="/placeholder-car.jpg" alt="car" width={500} height={300} className="rounded-xl" />
              </div>
            </div>

          </div>
        </section>

        {/* FOOTER (SIN LINEA BLANCA) */}
        <footer className="bg-black">
          <div className="mx-auto max-w-7xl px-4 py-10 text-white/70">
            {t.footerAddress}
          </div>
        </footer>

      </main>
    </>
  );
}
