import * as React from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const copy = {
  EN: {
    pageTitle: "AVAILABLE HYBRID R&M INC.",
    metaDescription:
      "Premium hybrid, performance and specialty vehicles in Los Angeles. DMV licensed dealer. Bilingual service and financing options available.",

    navInventory: "Inventory",
    navPrequal: "Pre-Qualify",

    heroTitle: "HYBRID, RACING AND MOTORSPORT",
    heroSubtitle:
      "Premium selection of hybrid, performance and specialty vehicles in Los Angeles. DMV licensed dealer. Bilingual service and flexible financing options available.",

    ctaInventory: "View Inventory",
    ctaPrequal: "Get Pre-Qualified",
    ctaWhatsapp: "WhatsApp",

    trust: [
      {
        title: "Specialty Vehicles",
        desc: "Hybrid · Performance · Motorsport",
      },
      {
        title: "DMV Licensed",
        desc: "ROS, TLP, compliant operations",
      },
      {
        title: "Flexible Financing",
        desc: "In-house & structured plans",
      },
    ],

    featuredTitle: "Featured Unit",
    featuredSubtitle: "Clean title • Performance ready",
    featuredButton: "View more",

    footerDealerName: "AVAILABLE HYBRID R&M INC.",
    footerAddress: "6726 Reseda Blvd Unit A7, Reseda, CA 91335",
    footerHoursLabel: "Hours",
    footerHoursValue: "Mon–Sat • 10:00–6:00",
  },

  ES: {
    pageTitle: "AVAILABLE HYBRID R&M INC.",
    metaDescription:
      "Vehículos híbridos, deportivos y especiales en Los Ángeles. Dealer licenciado DMV. Servicio bilingüe y opciones de financiamiento.",

    navInventory: "Inventario",
    navPrequal: "Pre-Calificación",

    heroTitle: "HYBRID, RACING AND MOTORSPORT",
    heroSubtitle:
      "Selección premium de vehículos híbridos, deportivos y especiales en Los Ángeles. Dealer licenciado, servicio bilingüe y financiamiento flexible.",

    ctaInventory: "Ver inventario",
    ctaPrequal: "Pre-Calificación",
    ctaWhatsapp: "WhatsApp",

    trust: [
      {
        title: "Vehículos Especiales",
        desc: "Híbridos · Performance · Motorsport",
      },
      {
        title: "Dealer DMV",
        desc: "Procesos legales completos",
      },
      {
        title: "Financiamiento",
        desc: "Opciones internas flexibles",
      },
    ],

    featuredTitle: "Unidad Destacada",
    featuredSubtitle: "Listo • Excelente condición",
    featuredButton: "Ver más",

    footerDealerName: "AVAILABLE HYBRID R&M INC.",
    footerAddress: "6726 Reseda Blvd Unit A7, Reseda, CA 91335",
    footerHoursLabel: "Horario",
    footerHoursValue: "Lun–Sáb • 10:00–6:00",
  },
} as const;

export default function Home() {
  const [lang, setLang] = React.useState<"EN" | "ES">("EN");

  React.useEffect(() => {
    const stored = window.localStorage.getItem("ah-lang");
    if (stored === "EN" || stored === "ES") setLang(stored);
  }, []);

  React.useEffect(() => {
    window.localStorage.setItem("ah-lang", lang);
  }, [lang]);

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
            {/* ICONOS */}
            <a
              href={whatsapp}
              target="_blank"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/[0.03]"
            >
              <img src="/whatsapp-green.png" className="h-4 w-4" />
            </a>

            <a
              href={`tel:${phone.replace(/[^+\d]/g, "")}`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/[0.03]"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2..." />
              </svg>
            </a>

            <a
              href="https://www.instagram.com/availablehybridrm/"
              target="_blank"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/[0.03]"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
              >
                <rect x="3" y="3" width="18" height="18" rx="5" />
              </svg>
            </a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <main className="pt-24">
        <section className="min-h-[80vh] flex items-center">
          <div className="mx-auto max-w-7xl px-4">
            <h1 className="text-white text-5xl font-semibold tracking-[-0.02em]">
              {t.heroTitle}
            </h1>

            <p className="mt-4 text-white/70 max-w-xl">
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
