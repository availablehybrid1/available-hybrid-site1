import * as React from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

/**
 * Elegant, conversion‑focused landing page for Available Hybrid R&M Inc.
 * - Full‑bleed hero with dark gradient over background image (/lux-hero.jpg)
 * - Clean, high‑contrast typography
 * - Primary CTA: Pre‑Califícate / Get Pre‑Qualified
 * - Secondary CTAs: Browse Inventory, WhatsApp
 * - Trust bar with quick facts (Hybrid specialists, DMV dealer, Warranty options)
 * - Mobile‑first, accessible, and SEO‑friendly
 */

export default function Home() {
  const whatsapp =
    "https://wa.me/17473544098?text=Hello!%20I'm%20interested%20in%20one%20of%20the%20vehicles%20you%20have%20available.%20/%20¡Hola!%20Estoy%20interesado%20en%20uno%20de%20los%20vehículos%20disponibles.";
  const phone = "+1 747-354-4098";

  return (
    <>
      <Head>
        <title>Available Hybrid R&M Inc. – Hybrid Specialists in Los Angeles</title>
        <meta
          name="description"
          content="Hybrid, Racing & Motorsport in Los Angeles. Curated Toyota Prius and more. Bilingual service (EN/ES), DMV dealer, and limited warranty options."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* HEADER */}
      <header className="fixed inset-x-0 top-0 z-40 backdrop-blur bg-black/30 border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-xl bg-white/10 ring-1 ring-white/20 grid place-items-center group-hover:bg-white/15 transition">
              <span className="text-white text-[10px] tracking-widest font-semibold">AH</span>
            </div>
            <div className="leading-tight">
              <p className="text-white font-semibold text-sm sm:text-base">Available Hybrid</p>
              <p className="text-white/70 text-[11px] sm:text-xs">R&M Inc.</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/inventory" className="text-white/80 hover:text-white">Inventory</Link>
            <Link href="/about" className="text-white/80 hover:text-white">About</Link>
            <a href={`tel:${phone.replace(/[^+\d]/g, "")}`} className="text-white/80 hover:text-white">{phone}</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/pre-qualification"
              className="hidden sm:inline-flex items-center justify-center rounded-2xl bg-white text-gray-900 px-4 py-2 font-semibold shadow-sm hover:shadow transition"
            >
              Pre‑Califícate
            </Link>
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-2xl border border-white/30 text-white px-3 py-2 text-sm hover:bg-white/10 transition"
            >
              WhatsApp
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
              src="/lux-hero.jpg" // make sure this exists in /public
              alt="Hybrid car at night in Los Angeles"
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
                Hybrid, Racing & Motorsport
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.05 }}
                className="mt-4 text-white/80 text-base sm:text-lg max-w-2xl"
              >
                We specialize in Hybrid, Racing & Motorsport vehicles — blending performance, efficiency, and style. Fully inspected inventory, bilingual service (EN/ES), licensed DMV dealer, and limited warranty options available.
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
                  Browse Inventory
                </Link>
                <Link
                  href="/pre-qualification"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/30 text-white px-5 py-3 font-semibold hover:bg-white/10 transition"
                >
                  Get Pre‑Qualified
                </Link>
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/30 text-white px-5 py-3 font-semibold hover:bg-white/10 transition"
                >
                  Chat on WhatsApp
                </a>
              </motion.div>

              {/* Trust bar */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3"
              >
                {[
                  { title: "Hybrid Experts", desc: "Prius and fuel‑efficient models" },
                  { title: "DMV Dealer", desc: "Paperwork guidance & ROS/TLP" },
                  { title: "Warranty Options", desc: "Limited coverage — tailored per vehicle" },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur px-4 py-3">
                    <p className="text-white font-medium text-sm">{item.title}</p>
                    <p className="text-white/70 text-xs">{item.desc}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Highlight card */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur p-4 sm:p-5 shadow-2xl">
                <div className="relative h-64 sm:h-72 w-full rounded-2xl overflow-hidden">
                  <Image src="/placeholder-car.jpg" alt="Featured vehicle" fill className="object-cover" />
                </div>
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-white font-semibold text-lg">Featured: Toyota Prius</h3>
                    <p className="text-white/70 text-sm">Great MPG • Clean title • Ready today</p>
                  </div>
                  <Link
                    href="/inventory"
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-xl bg-white text-gray-900 px-4 py-2 text-sm font-semibold shadow hover:shadow-md transition"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER PEEK */}
        <footer className="border-t border-white/10 bg-black">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-8 text-sm">
            <div>
              <p className="text-white font-semibold">Available Hybrid R&M Inc.</p>
              <p className="text-white/70">6726 Reseda Blvd Unit A7, Reseda, CA • Los Angeles</p>
            </div>
            <div>
              <p className="text-white/80">Hours</p>
              <p className="text-white/60">Mon–Sat • 10:00–6:00</p>
            </div>
            <div className="sm:text-right">
              <a href={`tel:${phone.replace(/[^+\d]/g, "")}`} className="text-white block hover:underline">{phone}</a>
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white">WhatsApp us</a>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
