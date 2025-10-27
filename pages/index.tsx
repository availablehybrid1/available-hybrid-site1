// pages/index.tsx — Home minimal (barra compacta + precios 0–50,000)
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

// -------- Helpers --------
function unique<T>(arr: T[]) {
  return Array.from(new Set(arr));
}
const formatPrice = (p?: number) =>
  p || p === 0 ? `$${p.toLocaleString()}` : "Consultar";

// Para combos de marca/modelo
function getMeta(inv: Vehicle[]) {
  const makes = unique(inv.map(v => v.make).filter(Boolean) as string[]).sort();
  const models = unique(
    inv.map(v => `${v.make ?? ""} ${v.model ?? ""}`.trim()).filter(Boolean)
  ).sort();
  return { makes, models };
}

// -------- Card --------
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

  // Nueva URL dinámica para financiar este vehículo
  const prequalUrl = `/financing?vin=${encodeURIComponent(v.vin ?? v.id)}&year=${encodeURIComponent(
    String(v.year ?? "")
  )}&make=${encodeURIComponent(v.make ?? "")}&model=${encodeURIComponent(
    v.model ?? ""
  )}&price=${encodeURIComponent(String(v.price ?? ""))}`;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-red-600/20 bg-[radial-gradient(100%_100%_at_50%_0%,rgba(255,255,255,0.06),rgba(0,0,0,0.3))] shadow-[0_10px_30px_rgba(0,0,0,0.45)] ring-1 ring-white/5 transition hover:-translate-y-0.5">
      <a href={`/${v.id}`}>
        <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-2 py-1.5">
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ${statusClasses(
              v.status
            )}`}
          >
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

        {/* 🔹 Botón nuevo para pre-calificación */}
        <a
          href={prequalUrl}
          className="mt-1 inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-1.5 text-[11px] font-semibold uppercase text-white shadow hover:bg-red-500 transition"
        >
          Pre-Califícate
        </a>
      </div>
    </div>
  );
}

// -------- Página --------
export default function Home() {
  const invAny: any = invMod as any;
  const inventory: Vehicle[] = (invAny.inventory ?? invAny.default ?? []) as Vehicle[];
  const meta = React.useMemo(() => getMeta(inventory), [inventory]);

  const [query, setQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState<
    "price_desc" | "price_asc" | "year_desc" | "year_asc"
  >("price_desc");
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
      const ap = a?.price ?? 0,
        bp = b?.price ?? 0;
      const ay = a?.year ?? 0,
        by = b?.year ?? 0;
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
  }, [inventory, query, sortBy, make, model, pmin, pmax]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  React.useEffect(() => {
    setPage(1);
  }, [query, make, model, pmin, pmax, sortBy, perPage]);
  const start = (page - 1) * perPage;
  const end = Math.min(start + perPage, total);
  const pageItems = filtered.slice(start, end);

  const chips: Array<{ key: string; label: string; onClear: () => void }> = [];
  if (query) chips.push({ key: "q", label: `“${query}”`, onClear: () => setQuery("") });
  if (make) chips.push({ key: "make", label: make, onClear: () => setMake("") });
  if (model) chips.push({ key: "model", label: model, onClear: () => setModel("") });
  if (pmin !== 0)
    chips.push({ key: "pmin", label: `Min $${pmin.toLocaleString()}`, onClear: () => setPmin(0) });
  if (pmax !== 50000)
    chips.push({
      key: "pmax",
      label: `Max $${pmax.toLocaleString()}`,
      onClear: () => setPmax(50000),
    });
  const clearAll = () => {
    setQuery("");
    setMake("");
    setModel("");
    setPmin(0);
    setPmax(50000);
    setSortBy("price_desc");
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* ...todo tu header y filtros igual... */}

      <section id="inventory" className="mx-auto max-w-6xl px-4 pb-14 pt-14">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-white/70">
          {total === 0
            ? "No vehicles found."
            : (
              <>
                Showing <strong>{start + 1}</strong>–<strong>{end}</strong> of <strong>{total}</strong> vehicles ({totalPages} pages)
              </>
            )}
        </div>

        {pageItems.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-white/70">
            No vehicles found. Try different filters.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pageItems.map(v => (
              <VehicleCard key={v.id} v={v} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
