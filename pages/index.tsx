// pages/index.tsx — Luxury + Filtros + Badges + Paginación/Chips (tema Negro + Dorado)
import * as React from "react";
import * as invMod from "../data/inventory";

// -------- Tipos --------
type Vehicle = {
  id: string;
  title?: string;
  year?: number;
  make?: string;
  model?: string;
  mileage?: number;
  price?: number;
  photos?: string[];
  tags?: string[]; // opcional
  status?: "just_arrived" | "pending_detail"; // opcional
};

// -------- Helpers filtros --------
function unique<T>(arr: T[]) { return Array.from(new Set(arr)); }
function getMeta(inv: Vehicle[]) {
  const makes = unique(inv.map(v => v.make).filter(Boolean) as string[]).sort();
  const models = unique(inv.map(v => `${v.make ?? ""} ${v.model ?? ""}`.trim()).filter(Boolean)).sort();
  const prices = inv.map(v => v.price ?? 0).filter(n => n > 0);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 50000;
  return { makes, models, minPrice, maxPrice };
}
const formatPrice = (p?: number) => (p || p === 0 ? `$${p.toLocaleString()}` : "Consultar");

// -------- UI helpers --------
function statusLabel(s?: Vehicle["status"]) {
  if (s === "just_arrived") return "Just Arrived";
  if (s === "pending_detail") return "Pending Detail";
  return "Exclusive Stock";
}
function statusClasses(s?: Vehicle["status"]) {
  if (s === "just_arrived") return "bg-emerald-600/80 text-white ring-emerald-400/30"; // mantenemos verde para diferenciar estado
  if (s === "pending_detail") return "bg-yellow-500/80 text-black ring-yellow-300/40";
  return "bg-black/60 text-white/80 ring-white/10";
}

function VehicleCard({ v }: { v: Vehicle }) {
  const photo = v?.photos?.[0] || "/placeholder-car.jpg";
  const tags = v?.tags ?? [];
  return (
    <a
      href={`/${v.id}`} // cambia a `/inventory/${v.id}` si tu detalle está ahí
      className="group relative overflow-hidden rounded-2xl border border-amber-500/20 bg-[radial-gradient(100%_100%_at_50%_0%,rgba(255,255,255,0.06),rgba(0,0,0,0.3))] shadow-[0_10px_30px_rgba(0,0,0,0.45)] ring-1 ring-white/5 transition hover:-translate-y-0.5"
    >
      <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-3 py-2">
        <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ${statusClasses(v.status)}`}>
          {statusLabel(v.status)}
        </span>
        <span className="rounded-md bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold text-black shadow">
          {formatPrice(v.price)}
        </span>
      </div>

      <div className="relative aspect-[16/10] w-full">
        <img src={photo} alt={v.title || `${v.year ?? ""} ${v.make ?? ""} ${v.model ?? ""}`} className="h-full w-full object-cover brightness-95 contrast-110 transition duration-500 group-hover:scale-[1.03]" />
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

        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags.slice(0, 4).map((t) => (
              <span key={t} className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/80">
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="mt-2 flex items-center justify-between text-xs text-white/60">
          <span>{v.mileage ? `${v.mileage.toLocaleString()} mi` : "—"}</span>
          <span className="uppercase tracking-wide">Financing Available</span>
        </div>
      </div>
    </a>
  );
}

export default function Home() {
  // Búsqueda/orden
  const [query, setQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState<"price_desc" | "price_asc" | "year_desc" | "year_asc">("price_desc");

  // Filtros
  const [make, setMake] = React.useState<string>("");
  const [model, setModel] = React.useState<string>("");
  const [pmin, setPmin] = React.useState<number>(0);
  const [pmax, setPmax] = React.useState<number>(0);

  // Paginación
  const [page, setPage] = React.useState<number>(1);
  const [perPage, setPerPage] = React.useState<number>(12);

  // Inventario
  const invAny: any = invMod as any;
  const inventory: Vehicle[] = (invAny.inventory ?? invAny.vehicles ?? invAny.rawInventory ?? invAny.default ?? []) as Vehicle[];

  // Meta + rangos de precio
  const meta = React.useMemo(() => getMeta(inventory), [inventory]);
  React.useEffect(() => {
    if (!inventory?.length) return;
    setPmin(meta.minPrice);
    setPmax(meta.maxPrice);
  }, [inventory]);

  // Filtros + orden
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = inventory.filter((v) => {
      const txt = `${v.title ?? ""} ${v.year ?? ""} ${v.make ?? ""} ${v.model ?? ""}`.toLowerCase();
      if (q && !txt.includes(q)) return false;
      if (make && (v.make ?? "").toLowerCase() !== make.toLowerCase()) return false;
      if (model) {
        const mm = `${v.make ?? ""} ${v.model ?? ""}`.trim().toLowerCase();
        if (mm !== model.toLowerCase()) return false;
      }
      const price = v.price ?? 0;
      const minOk = pmin ? price >= pmin : true;
      const maxOk = pmax ? price <= pmax : true;
      if (!(minOk && maxOk)) return false;
      return true;
    });

    arr.sort((a, b) => {
      const ap = a?.price ?? 0, bp = b?.price ?? 0;
      const ay = a?.year ?? 0, by = b?.year ?? 0;
      switch (sortBy) {
        case "price_asc": return ap - bp;
        case "year_desc": return by - ay;
        case "year_asc": return ay - by;
        default: return bp - ap;
      }
    });
    return arr;
  }, [inventory, query, sortBy, make, model, pmin, pmax]);

  // Paginación
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  React.useEffect(() => { setPage(1); }, [query, make, model, pmin, pmax, sortBy, perPage]);
  const start = (page - 1) * perPage;
  const end = Math.min(start + perPage, total);
  const pageItems = filtered.slice(start, end);

  // Chips de filtros activos
  const chips: Array<{ key: string; label: string; onClear: () => void }> = [];
  if (query) chips.push({ key: "q", label: `“${query}”`, onClear: () => setQuery("") });
  if (make) chips.push({ key: "make", label: make, onClear: () => setMake("") });
  if (model) chips.push({ key: "model", label: model, onClear: () => setModel("") });
  if (pmin) chips.push({ key: "pmin", label: `Min $${pmin.toLocaleString()}`, onClear: () => setPmin(meta.minPrice) });
  if (pmax && pmax !== meta.maxPrice) chips.push({ key: "pmax", label: `Max $${pmax.toLocaleString()}`, onClear: () => setPmax(meta.maxPrice) });
  const clearAll = () => {
    setQuery(""); setMake(""); setModel("");
    setPmin(meta.minPrice); setPmax(meta.maxPrice);
    setSortBy("price_desc");
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* HERO / TOP */}
      <div className="relative isolate">
        <div className="absolute inset-0 -z-10">
          <img
            src="/lux-hero.jpg"
            alt="Exotic luxury car"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            className="h-[56vh] w-full object-cover opacity-55"
          />
          {/* Dorado cálido */}
          <div className="absolute inset-0 bg-[radial-gradient(80%_80%_at_50%_20%,rgba(245,158,11,0.35),transparent_60%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-neutral-950" />
        </div>

        <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <a href="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/5 ring-1 ring-white/10 grid place-content-center">
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                <path fill="currentColor" d="M5 11l2-4h10l2 4h1a2 2 0 012 2v3a1 1 0 01-1 1h-1v1a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H7v1a1 1 0 01-1 1H5a1 1 0 01-1-1v-1H3a1 1 0 01-1-1v-3a2 2 0 012-2h1zm3.5 4a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
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
          <a href="tel:+18184223567" className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-black shadow hover:bg-amber-400">
            Call (818) 422-3567
          </a>
        </header>

        {/* SEARCH / FILTER / SORT */}
        <div className="mx-auto -mb-10 max-w-7xl px-4">
          <div className="rounded-2xl border border-white/10 bg-black/50 p-3 ring-1 ring-white/10 backdrop-blur">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
              {/* Búsqueda */}
              <div className="lg:col-span-4 flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
                <span className="text-white/60">🔎</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search model, make, year…"
                  className="w-full bg-transparent text-sm text-white placeholder-white/40 outline-none"
                />
              </div>

              {/* Marca */}
              <div className="lg:col-span-2">
                <select
                  value={make}
                  onChange={(e) => { setMake(e.target.value); setModel(""); }}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="">All makes</option>
                  {meta.makes.map((m) => (<option key={m} value={m}>{m}</option>))}
                </select>
              </div>

              {/* Modelo */}
              <div className="lg:col-span-3">
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                >
                  <option value="">All models</option>
                  {meta.models
                    .filter(mm => (make ? mm.toLowerCase().startsWith(make.toLowerCase()) : true))
                    .map((mm) => (<option key={mm} value={mm}>{mm}</option>))}
                </select>
              </div>

              {/* Precio */}
              <div className="lg:col-span-3 flex items-center gap-2">
                <input type="number" value={pmin} onChange={(e) => setPmin(Number(e.target.value || 0))}
                  placeholder={`Min ${meta.minPrice}`} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 outline-none" />
                <span className="text-white/50 text-xs">—</span>
                <input type="number" value={pmax} onChange={(e) => setPmax(Number(e.target.value || 0))}
                  placeholder={`Max ${meta.maxPrice}`} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 outline-none" />
              </div>

              {/* Sort */}
              <div className="lg:col-span-12 flex items-center justify-end gap-2">
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

            {/* Chips de filtros activos */}
            {(chips.length > 0) && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs text-white/60">Filters:</span>
                {chips.map(c => (
                  <button
                    key={c.key}
                    onClick={(e) => { e.preventDefault(); c.onClear(); }}
                    className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 hover:bg-white/10"
                    title="Remove filter"
                  >
                    {c.label} <span aria-hidden>✕</span>
                  </button>
                ))}
                <button
                  onClick={(e) => { e.preventDefault(); clearAll(); }}
                  className="ml-1 rounded-full border border-white/10 bg-amber-500/20 px-3 py-1 text-xs text-amber-200 hover:bg-amber-500/30"
                >
                  Clear all
                </button>
                <div className="ml-auto flex items-center gap-2">
                  <label className="text-xs text-white/60">Per page</label>
                  <select
                    value={perPage}
                    onChange={(e) => setPerPage(Number(e.target.value))}
                    className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white outline-none"
                  >
                    <option value={8}>8</option>
                    <option value={12}>12</option>
                    <option value={16}>16</option>
                    <option value={24}>24</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* INVENTORY */}
      <section id="inventory" className="mx-auto max-w-7xl px-4 pb-16 pt-16">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-white/70">
            {total === 0
              ? "No vehicles found."
              : <>Mostrando <strong>{start + 1}</strong>–<strong>{end}</strong> de <strong>{total}</strong> vehículos ({totalPages} páginas)</>}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/80 disabled:opacity-40"
              >
                ‹ Prev
              </button>
              {/* números */}
              {Array.from({ length: totalPages }).slice(0, 7).map((_, i) => {
                const n = i + 1;
                const active = n === page;
                return (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`rounded-lg px-3 py-1 text-sm ${active ? "bg-amber-500 text-black" : "border border-white/10 bg-white/5 text-white/80 hover:bg-white/10"}`}
                  >
                    {n}
                  </button>
                );
              })}
              {totalPages > 7 && <span className="px-2 text-white/50">…</span>}
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/80 disabled:opacity-40"
              >
                Next ›
              </button>
            </div>
          )}
        </div>

        {pageItems.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-white/70">
            No vehicles found. Try different filters.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pageItems.map((v) => (<VehicleCard key={v.id} v={v} />))}
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
              <input name="name" required placeholder="Name" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm placeholder-white/40 outline-none focus:border-amber-500/40" />
              <input name="phone" placeholder="Phone" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm placeholder-white/40 outline-none focus:border-amber-500/40" />
              <input name="email" type="email" placeholder="Email" className="sm:col-span-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm placeholder-white/40 outline-none focus:border-amber-500/40" />
              <textarea name="message" rows={4} placeholder="Tell us what you’re looking for" className="sm:col-span-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm placeholder-white/40 outline-none focus:border-amber-500/40" />
            </div>
            <div className="mt-4 flex justify-end">
              <button type="submit" className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-black shadow hover:bg-amber-400">Send</button>
            </div>
          </form>
        </div>
      </section>

      {/* FOOTER */}
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
