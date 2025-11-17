import * as React from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

// 👇 Textos en ambos idiomas
const copy = {
  EN: {
    pageTitle: "AVAILABLE HYBRID R&M INC. – Hybrid & Fuel Efficient Vehicles",
    metaDescription:
      "Specialized in hybrid and fuel-efficient vehicles in Reseda, CA. DMV licensed dealer with BHPH and pre-qualification options. Bilingual service and ROS/TLP online plates.",

    navInventory: "Inventory",
    navPrequal: "Pre-Qualify",

    heroTitle: "Hybrid & Fuel-Efficient Vehicles",
    heroSubtitle:
      "Experience the best selection of hybrid vehicles in Los Angeles. DMV licensed dealer, bilingual service, BHPH and pre-qualification options in minutes.",

    ctaInventory: "View Inventory",
    ctaPrequal: "Get Pre-Qualified",
    ctaWhatsapp: "WhatsApp",

    trust: [
      {
        title: "Hybrid Specialists",
        desc: "Toyota Prius · Lexus CT200h · More",
      },
      {
        title: "DMV Dealer",
        desc: "Temporary plates, ROS/TLP online",
      },
      {
        title: "BHPH Options",
        desc: "In-house payment plans",
      },
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
    pageTitle: "AVAILABLE HYBRID R&M INC. – Vehículos Híbridos y Eficientes",
    metaDescription:
      "Especialistas en vehículos híbridos y de bajo consumo en Reseda, CA. Dealer licenciado por el DMV con opciones BHPH y pre-calificación. Servicio bilingüe y placas temporales ROS/TLP.",

    navInventory: "Inventario",
    navPrequal: "Pre-Calificación",

    heroTitle: "Vehículos Híbridos y de Bajo Consumo",
    heroSubtitle:
      "Descubre la mejor selección de vehículos híbridos en Los Ángeles. Dealer licenciado por el DMV, servicio bilingüe, BHPH y pre-calificación en minutos.",

    ctaInventory: "Ver inventario",
    ctaPrequal: "Pre-Calificación",
    ctaWhatsapp: "WhatsApp",

    trust: [
      {
        title: "Especialistas en híbridos",
        desc: "Toyota Prius · Lexus CT200h · Más",
      },
      {
        title: "Dealer DMV",
        desc: "Placas temporales, ROS/TLP virtual",
      },
      {
        title: "Opciones BHPH",
        desc: "Planes de pago in-house",
      },
    ],

    featuredTitle: "Destacado: Toyota Prius",
    featuredSubtitle: "Clean title • 50+ MPG • Listo hoy",
    featuredButton: "Ver más",

    footerDealerName: "AVAILABLE HYBRID R&M INC.",
    footerAddress: "6726 Reseda Blvd Unit A7, Reseda, CA 91335",
    footerHoursLabel: "Horario",
    footerHoursValue: "Lun–Sáb • 10:00–6:00",
  },
} as const;

export default function Home() {
  const [lang, setLang] = React.useState<"EN" | "ES">("EN");

  // 🧠 Leer idioma guardado
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("ah-lang");
    if (stored === "EN" || stored === "ES") {
      setLang(stored);
    }
  }, []);

  // 💾 Guardar idioma al cambiar
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("ah-lang", lang);
  }, [lang]);

  const t = copy[lang];

  const whatsapp =
    "https://wa.me/17473544098?text=Hola!%20Estoy%20interesado%20en%20un%20veh%C3%ADculo,%20podr%C3%ADamos%20hablar%20m%C3%A1s.%20/%20Hello!%20I'd%20like%20more%20info%20on%20one%20of%20your%20vehicles.";
  const phone = "+1 747-354-4098";

  return (
    <>
      <Head>
        <title>{t.pageTitle}</title>
        <meta name="description" content={t.metaDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* HEADER */}
      <header className="fixed inset-x-0 top-0 z-40 backdrop-blur bg-black/30 border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-xl bg-white/10 ring-1 ring-white/20 grid place-items-center group-hover:bg-white/15 transition">
              <span className="text-white text-[10px] tracking-widest font-semibold">
                AH
              </span>
            </div>
            <div className="leading-tight">
              <p className="text-white font-semibold text-sm sm:text-base">
                AVAILABLE HYBRID
              </p>
              <p className="text-white/70 text-[11px] sm:text-xs">R&M INC.</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/inventory" className="text-white/80 hover:text-white">
              {t.navInventory}
            </Link>
            <Link
              href="/pre-qualification"
              className="text-white/80 hover:text-white"
            >
              {t.navPrequal}
            </Link>
            <a
              href={`tel:${phone.replace(/[^+\d]/g, "")}`}
              className="text-white/80 hover:text-white"
            >
              {phone}
            </a>
          </nav>

          <div className="flex items-center gap-2">
            {/* Toggle idioma */}
            <div className="flex items-center rounded-full border border-white/30 bg-black/40 px-1 py-0.5 text-[11px] mr-1">
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

            <Link
              href="/pre-qualification"
              className="hidden sm:inline-flex items-center justify-center rounded-2xl bg-white text-gray-900 px-4 py-2 font-semibold shadow-sm hover:shadow transition"
            >
              {lang === "EN" ? "Get Pre-Qualified" : "Pre-Califícate"}
            </Link>
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-2xl border border-white/30 text-white px-3 py-2 text-sm hover:bg-white/10 transition"
            >
              {t.ctaWhatsapp}
            </a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <main className="relative">
        <section className="relative min-h-[88vh] flex items-stretch">
          {/* Background image with dark gradient */}
          <div className="absolute inset-0 -z-10">
            <Image
              src="/lux-hero.jpg"
              alt="Hybrid vehicles in Los Angeles"
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
            <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_70%_10%,rgba(255,255,255,0.12),transparent)]" />
          </div>

          <div className="relative w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-10 items-center pt-28 pb-20">
            <div className="lg:col-span-7">
              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-white text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight"
              >
                {t.heroTitle}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.05 }}
                className="mt-4 text-white/80 text-base sm:text-lg max-w-2xl"
              >
                {t.heroSubtitle}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.12 }}
                className="mt-8 flex flex-col sm:flex-row gap-3"
              >
                <Link
                  href="/inventory"
                  className="inline-flex items-center justify-center rounded-2xl bg-white text-gray-900 px-5 py-3 font-semibold shadow hover:shadow-lg transition"
                >
                  {t.ctaInventory}
                </Link>
                <Link
                  href="/pre-qualification"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/30 text-white px-5 py-3 font-semibold hover:bg-white/10 transition"
                >
                  {t.ctaPrequal}
                </Link>
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/30 text-white px-5 py-3 font-semibold hover:bg-white/10 transition"
                >
                  {t.ctaWhatsapp}
                </a>
              </motion.div>

              {/* Trust bar */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3"
              >
                {t.trust.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur px-4 py-3"
                  >
                    <p className="text-white font-medium text-sm">
                      {item.title}
                    </p>
                    <p className="text-white/70 text-xs">{item.desc}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Featured vehicle */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur p-4 sm:p-5 shadow-2xl">
                <div className="relative h-64 sm:h-72 w-full rounded-2xl overflow-hidden">
                  <Image
                    src="/placeholder-car.jpg"
                    alt="Featured vehicle"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-white font-semibold text-lg">
                      {t.featuredTitle}
                    </h3>
                    <p className="text-white/70 text-sm">
                      {t.featuredSubtitle}
                    </p>
                  </div>
                  <Link
                    href="/inventory"
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-xl bg-white text-gray-900 px-4 py-2 text-sm font-semibold shadow hover:shadow-md transition"
                  >
                    {t.featuredButton}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-white/10 bg-black">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-8 text-sm">
            <div>
              <p className="text-white font-semibold">
                {t.footerDealerName}
              </p>
              <p className="text-white/70">{t.footerAddress}</p>
            </div>
            <div>
              <p className="text-white/80">{t.footerHoursLabel}</p>
              <p className="text-white/60">{t.footerHoursValue}</p>
            </div>
            <div className="sm:text-right">
              <a
                href={`tel:${phone.replace(/[^+\d]/g, "")}`}
                className="text-white block hover:underline"
              >
                {phone}
              </a>
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/80 hover:text-white"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
