// pages/index.tsx — Luxury / Legendary style (Next.js + Tailwind)
import React from "react";
// 👇 CAMBIO 1: importar TODO el módulo, no “default”
import * as invMod from "../data/inventory";

type Vehicle = {
  id: string;
  title?: string;
  year?: number;
  make?: string;
  model?: string;
  mileage?: number;
  price?: number;
  photos?: string[];
};

const formatPrice = (p?: number) => (p || p === 0 ? `$${p.toLocaleString()}` : "Consultar");

function VehicleCard({ v }: { v: Vehicle }) {
  const photo = v?.photos?.[0] || "/placeholder-car.jpg";
  return (
    <a
      href={`/${v.id}`} // usa tu [id].tsx en /pages
      className="group relative overflow-hidden rounded-2xl border border-red-600/20 bg-[radial-gradient(100%_100%_at_50%_0%,rgba(255,255,255,0.06),rgba(0,0,0,0.3))] shadow-[0_10px_30px_rgba(0,0,0,0.45)] ring-1 ring-white/5 transition hover:-translate-y-0.5"
    >
      <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-3 py-2">
        <span className="rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/80 ring-1 ring-white/10">
          Exclusive Stock
        </span>
        <span className="rounded-md bg-red-600/80 px-2 py-0.5 text-[10px] font-bold text-white shadow">
          {formatPrice(v.price)}
        </span>
      </div>

      <div className="relative aspect-[16/10] w-full">
        <img
          src={photo}
          alt={v.title || `${v.year ?? ""} ${v.make ?? ""} ${v.model ?? ""}`}
          className="h-full w-full object-cover brightness-95 contrast-110 transition duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-70" />
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-base font-semibold tracking-tight text-white">
            {v.title || `${v.year ?? ""} ${v.make ?? ""} ${v.model ?? ""}`}
          </h3>
          <span className="rounded-md bg-white/5 px-2 py-1 text-[10px] font-medium text-white/70 ring-1 ring-white/10">
            {v.year ?? "—"}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-white/60">
          <span>{v.mileage ? `${v.mileage.toLocaleString()} mi` : "—"}</span>
          <span className="uppercase tracking-wide">Hybrid • Finance</span>
        </div>
      </div>
    </a>
  );
}

export default function Home() {
  const [query, setQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState<"price_desc" | "price_asc" | "year_desc" | "year_asc">("price_desc");

  // 👇 CAMBIO 2: tomar el arreglo sin importar el nombre del export en data/inventory.ts
  // Acepta: export const inventory | vehicles | rawInventory | default
  const invAny: any = invMod as any;
  const inventory: Vehicle[] =
    (invAny.inventory ??
      invAny.vehicles ??
      invAny.rawInventory ??
      invAny.default ??
      []) as Vehicle[];

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = inventory.filter((v) => {
      if (!q) return true;
      const text = `${v.title ?? ""} ${v.year ?? ""} ${v.make ?? ""} ${v.model ?? ""}`.toLowerCase();
      return text.includes(q);
    });
    arr.sort((a, b) => {
      const ap = a?.price ?? 0;
      const bp = b?.price ?? 0;
      const ay = a?.year ?? 0;
      const by = b?.year ?? 0;
      switch (sortBy) {
        case "price_asc":
          return ap - bp;
        case "year_desc":
          return by - ay;
        case "year_asc":
          return ay - by;
        default:
          return bp - ap;
      }
    });
    return arr;
  }, [inventory, query, sortBy]);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* HERO / TOP */}
      <div className="relative isolate">
        <div className="absolute inset-0 -z-10">
          <img
            src="/lux-hero.jpg"
            alt="Exotic red sports car"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
            className="h-[56vh] w-full object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-[radial-gradient(80%_80%_at_50%_20%,rgba(220,38,38,0.35),transparent_60%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-neutral-950" />
        </div>

        <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <a href="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/5 ring-1 ring-white/10 grid place-content-center">
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                <path
                  fill="currentColor"
                  d="M5 11l2-4h10l2 4h1a2 2 0 012 2v3a1 1 0 01-1 1h-1v1a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H7v1a1 1 0 01-1 1H5a1 1 0 01-1-1v-1H3a1 1 0 01-1-1v-3a2 2 0 012-2h1zm3.5 4a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
                />
              </svg>
            </div>
            <div className="leading-tight">
              <p className="text-[11px] tracking-[0.25em] text-white/70">AVAILABLE HYBRID</p>
              <p className="text-xl font-semibold">R&M Inc.</p>
            </div>
          </a>
          <nav className="hidden gap-6 md:flex text-sm">
            <a className="opacity-80 hover:opacity-100" href="#inventory">Inventory</a>
            <a className="opacity-80 hover:opacity-100" href="#contact">Contact</a>
          </nav>
          <a href="tel:+18184223567" className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-500">
            Call (818) 422-3567
          </a>
        </header>

        {/* SEARCH / SORT BAR */}
        <div className="mx-auto -mb-10 max-w-7xl px-4">
          <div className="rounded-2xl border border-white/10 bg-black/50 p-3 ring-1 ring-white/10 backdrop-blur">
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-2 rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
                <span className="text-white/60">🔎</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search model, make, year…"
                  className="w-full bg-transparent text-sm text-white placeholder-white/40 outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-white/60">Sort</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="price_desc">Price: High → Low</option>
                  <option value="price_asc">Price: Low → High</option>
                  <option value="year_desc">Year: New → Old</option>
                  <option value="year_asc">Year: Old → New</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* INVENTORY */}
      <section id="inventory" className="mx-auto max-w-7xl px-4 pb-16 pt-16">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Exclusive Stock</h2>
            <p className="text-sm text-white/70">High-efficiency hybrids curated for Los Angeles drivers.</p>
          </div>
          <a href="/inventory" className="text-sm font-medium text-red-400 hover:text-red-300">View All →</a>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-white/70">
            No vehicles found. Try a different search.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((v) => (
              <VehicleCard key={v.id} v={v} />
            ))}
          </div>
        )}
      </section>

      {/* CONTACT */}
      <section id="contact" className="mx-auto max-w-7xl px-4 pb-24">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="text-xl font-semibold">Contact</h3>
            <p className="mt-1 text-sm text-white/75">San Fernando Valley · Los Angeles, CA</p>
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">📞</span>
                <a href="tel:+18184223567" className="hover:underline">(818) 422-3567</a>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">✉️</span>
                <a href="mailto:availablehybrid@gmail.com" className="hover:underline">availablehybrid@gmail.com</a>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">🌐</span>
                <a href="https://hybridrm.com" className="hover:underline">hybridrm.com</a>
              </div>
            </div>
          </div>

          <form action="/contact" method="post" className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="text-xl font-semibold">Send a message</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <input name="name" required placeholder="Name" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm placeholder-white/40 outline-none focus:border-red-400/40" />
              <input name="phone" placeholder="Phone" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm placeholder-white/40 outline-none focus:border-red-400/40" />
              <input name="email" type="email" placeholder="Email" className="sm:col-span-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm placeholder-white/40 outline-none focus:border-red-400/40" />
              <textarea name="message" rows={4} placeholder="Tell us what you’re looking for" className="sm:col-span-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm placeholder-white/40 outline-none focus:border-red-400/40" />
            </div>
            <div className="mt-4 flex justify-end">
              <button type="submit" className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-red-500">Send</button>
            </div>
          </form>
        </div>
      </section>

      <footer className="border-t border-white/10 py-10 text-sm text-white/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
          <p>© {new Date().getFullYear()} Available Hybrid R&M Inc. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="/privacy" className="hover:text-white/80">Privacy</a>
            <a href="/terms" className="hover:text-white/80">Terms</a>
            <a href="/dmv" className="hover:text-white/80">DMV Notices</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
