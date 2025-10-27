// pages/index.tsx — Home con botón “Pre-Califícate” (único) en el header
import * as React from "react";
import * as invMod from "../data/inventory";

type Vehicle = {
  id: string;
  title?: string;
  year?: number;
  make?: string;
  model?: string;
  mileage?: number;
  transmission?: string;
  fuel?: string;
  vin?: string;
  exterior?: string;
  interior?: string;
  price?: number;
  description?: string;
  photos?: string[];
  tags?: string[];
  status?: "just_arrived" | "pending_detail";
};

function unique<T>(arr: T[]) { return Array.from(new Set(arr)); }
const formatPrice = (p?: number) => (p || p === 0 ? `$${p.toLocaleString()}` : "Consultar");

function getMeta(inv: Vehicle[]) {
  const makes = unique(inv.map(v => v.make).filter(Boolean) as string[]).sort();
  const models = unique(
    inv.map(v => `${v.make ?? ""} ${v.model ?? ""}`.trim()).filter(Boolean)
  ).sort();
  return { makes, models };
}

function statusLabel(s?: Vehicle["status"]) {
  if (s === "just_arrived") return "Just Arrived";
  if (s === "pending_detail") return "Pending Detail";
  return "Exclusive Stock";
}
function statusClasses(s?: Vehicle["status"]) {
  if (s === "just_arrived") return "bg-emerald-600/80 text-white ring-emerald-400/30";
  if (s === "pending_detail") return "bg-yellow-500/80 text-black ring-yellow-300/40";
  return "bg-black/60 text-white/80 ring-white/10";
}

function VehicleCard({ v }: { v: Vehicle }) {
  const photo = v?.photos?.[0] || "/placeholder-car.jpg";

  return (
    <div className="group relative overflow-hidden rounded-xl border border-red-600/20 bg-[radial-gradient(100%_100%_at_50%_0%,rgba(255,255,255,0.06),rgba(0,0,0,0.3))] shadow-[0_10px_30px_rgba(0,0,0,0.45)] ring-1 ring-white/5 transition hover:-translate-y-0.5">
      <a href={`/${v.id}`}>
        <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-2 py-1.5">
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ${statusClasses(v.status)}`}>
            {statusLabel(v.status)}
          </span>
          <span className="rounded bg-red-600/80 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
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
      </a>

      <div className="p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-[15px] font-semibold tracking-tight text-white">
            {v.title || `${v.year ?? ""} ${v.make ?? ""} ${v.model ?? ""}`}
          </h3>
          <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-white/70 ring-1 ring-white/10">
            {v.year ?? "—"}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-white/60">
          <span>{v.mileage ? `${v.mileage.toLocaleString()} mi` : "—"}</span>
          <span className="uppercase tracking-wide text-white/80">Financing</span>
        </div>
        {/* Sin botón aquí — el único botón vive en el header */}
      </div>
    </div>
  );
}

export default function Home() {
  const invAny: any = invMod as any;
  const inventory: Vehicle[] = (invAny.inventory ?? invAny.default ?? []) as Vehicle[];
  const meta = React.useMemo(() => getMeta(inventory), [inventory]);

  const [query, setQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState<"price_desc" | "price_asc" | "year_desc" | "year_asc">("price_desc");
  const [make, setMake] = React.useState<string>("");
  const [model, setModel] = React.useState<string>("");

  const [pmin, setPmin] = React.useState<number>(0);
  const [pmax, setPmax] = React.useState<number>(50000);

  const [page, setPage] = React.useState<number>(1);
  const [perPage, setPerPage] = React.useState<number>(12);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = inventory.filter(v => {
      const txt = `${v.title ?? ""} ${v.year ?? ""} ${v.make ?? ""} ${v.model ?? ""}`.toLowerCase();
      if (q && !txt.includes(q)) return false;
      if (make && (v.make ?? "").toLowerCase() !== make.toLowerCase()) return false;
      if (model) {
        const mm = `${v.make ?? ""} ${v.model ?? ""}`.trim().toLowerCase();
        if (mm !== model.toLowerCase()) return false;
      }
      const price = v.price ?? 0;
      if (price < pmin || price > pmax) return false;
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

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  React.useEffect(() => { setPage(1); }, [query, make, model, pmin, pmax, sortBy, perPage]);
  const start = (page - 1) * perPage;
  const end = Math.min(start + perPage, total);
  const pageItems = filtered.slice(start, end);

  // URL Standalone de DealerCenter (ID 9 dígitos y SIN frameId)
  const DC_URL =
    "https://dwssecuredforms.dealercenter.net/CreditApplication/index/288160657?themecolor=0d0d0d&formtype=l&standalone=true&ls=Other";

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="relative isolate">
        <div className="absolute inset-0 -z-10">
          <img
            src="/lux-hero.jpg"
            alt="Luxury background"
            className="h-[42vh] w-full object-cover opacity-55"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(80%_80%_at_50%_20%,rgba(220,38,38,0.35),transparent_60%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-neutral-950" />
        </div>

        {/* HEADER */}
        <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a href="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-content-center rounded-lg bg-white/5 ring-1 ring-white/10">
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                <path fill="currentColor" d="M5 11l2-4h10l2 4h1a2 2 0 012 2v3a1 1 0 01-1 1h-1v1a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H7v1a1 1 0 01-1 1H5a1 1 0 01-1-1v-1H3a1 1 0 01-1-1v-3a2 2 0 012-2h1zm3.5 4a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
              </svg>
            </div>
            <div className="leading-tight">
              <p className="text-[10px] tracking-[0.25em] text-white/70">AVAILABLE HYBRID</p>
              <p className="text-[15px] font-semibold">R&M Inc.</p>
            </div>
          </a>

          <nav className="hidden gap-4 md:flex text-xs">
            <a className="opacity-80 hover:opacity-100" href="#inventory">Inventory</a>
            <a className="opacity-80 hover:opacity-100" href="#contact">Contact</a>
          </nav>

          <div className="flex items-center gap-2">
            {/* ÚNICO BOTÓN: abre el Standalone de DealerCenter en nueva pestaña (con referrer) */}
            <a
              href={DC_URL}
              target="_blank"
              rel="noopener" /* NO usar 'noreferrer' para que se envíe el referrer */
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-red-500"
            >
              Pre-Califícate
            </a>

            {/* Call */}
            <a
              href="tel:+18184223567"
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-red-500"
            >
              Call (818) 422-3567
            </a>
          </div>
        </header>
      </div>

      {/* INVENTORY */}
      <section id="inventory" className="mx-auto max-w-6xl px-4 pb-14 pt-14">
        {pageItems.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-white/70">
            No vehicles found.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pageItems.map(v => (<VehicleCard key={v.id} v={v} />))}
          </div>
        )}
      </section>
    </main>
  );
}
