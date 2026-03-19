import * as React from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const copy = {
  EN: {
    pageTitle: "AVAILABLE HYBRID R&M INC.",
    metaDescription:
      "Premium hybrid, performance and specialty vehicles in Los Angeles. DMV licensed dealer.",

    navInventory: "Inventory",
    navPrequal: "Pre-Qualify",

    heroTitle: "HYBRID, RACING AND MOTORSPORT",
    heroSubtitle:
      "Premium selection of hybrid, performance and specialty vehicles in Los Angeles. DMV licensed dealer. Bilingual service and flexible financing options available.",

    ctaInventory: "View Inventory",
    ctaPrequal: "Get Pre-Qualified",
    ctaWhatsapp: "WhatsApp",

    trust: [
      { title: "Specialty Vehicles", desc: "Hybrid · Performance · Motorsport" },
      { title: "DMV Licensed", desc: "ROS, TLP, compliant operations" },
      { title: "Flexible Financing", desc: "In-house & structured plans" },
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
      "Vehículos híbridos, deportivos y especiales en Los Ángeles.",

    navInventory: "Inventario",
    navPrequal: "Pre-Calificación",

    heroTitle: "HYBRID, RACING AND MOTORSPORT",
    heroSubtitle:
      "Selección premium de vehículos híbridos, deportivos y especiales en Los Ángeles.",

    ctaInventory: "Ver inventario",
    ctaPrequal: "Pre-Calificación",
    ctaWhatsapp: "WhatsApp",

    trust: [
      { title: "Vehículos Especiales", desc: "Híbridos · Performance · Motorsport" },
      { title: "Dealer DMV", desc: "Procesos legales completos" },
      { title: "Financiamiento", desc: "Opciones internas flexibles" },
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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/">
            <Image
              src="/logo. available hybrid premium.png"
              alt="logo"
              width={220}
              height={70}
            />
          </Link>

          <div className="flex items-center gap-3">
            {/* WhatsApp */}
            <a href={whatsapp} target="_blank" rel="noreferrer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/[0.03]">
              <img src="/whatsapp-green.png" className="h-4 w-4" />
            </a>

            {/* Phone */}
            <a href={`tel:${phone.replace(/[^+\d]/g, "")}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/[0.03] text-white/80">
              📞
            </a>

            {/* Instagram */}
            <a href="https://www.instagram.com/availablehybridrm/" target="_blank" rel="noreferrer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/[0.03] text-white/80">
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

          <div className="relative w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-10 items-center pt-28 pb-20">
            <div className="lg:col-span-7">
              <h1 className="text-white text-5xl font-semibold tracking-[-0.02em]">
                {t.heroTitle}
              </h1>

              <p className="mt-4 text-white/80 max-w-xl">
                {t.heroSubtitle}
              </p>

              <div className="mt-8 flex gap-3">
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
      </main>
    </>
  );
}
