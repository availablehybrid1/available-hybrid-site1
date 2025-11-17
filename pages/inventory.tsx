import * as React from "react";
import type { GetStaticProps } from "next";
import Link from "next/link";
import { getInventory, type Car } from "../lib/getInventory";

// Convierte fotos de Drive a imágenes visibles
function parsePhotos(raw?: string | null): string[] {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(/[\s;]+/)
    .map((u) => u.trim())
    .filter((u) => u.startsWith("http"))
    .map((u) => {
      if (u.includes("lh3.googleusercontent.com")) return u;
      const match = u.match(/\/d\/([^/]+)/);
      if (match) return `https://lh3.googleusercontent.com/d/${match[1]}=w1600`;
      return u;
    });
}

type Vehicle = {
  id: string;
  title: string;
  year: number | null;
  make: string;
  model: string;
  mileage: number | null;
  price: number | null;
  vin: string;
  fuel: string;
  transmission: string;
  exterior: string;
  photos: string[];
  description: string;
};

type InventoryProps = { inventory: Vehicle[] };

export default function Inventory({ inventory }: InventoryProps) {
  const phone = "+1 747-354-4098";

  // --- Filtros / sort ---
  const [search, setSearch] = React.useState("");
  const [makeFilter, setMakeFilter] = React.useState<string>("all");
  const [sortBy, setSortBy] = React.useState<
    "yearDesc" | "priceAsc" | "priceDesc" | "mileageAsc"
  >("yearDesc");

  const makes = React.useMemo(() => {
    const set = new Set<string>();
    inventory.forEach((v) => {
      if (v.make) set.add(v.make);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [inventory]);

  const filtered = React.useMemo(() => {
    let list = [...inventory];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((v) =>
        v.title.toLowerCase().includes(q)
      );
    }

    if (makeFilter !== "all") {
      list = list.filter(
        (v) => v.make.toLowerCase() === makeFilter.toLowerCase()
      );
    }

    list.sort((a, b) => {
      switch (sortBy) {
        case "priceAsc": {
          const pa = a.price ?? Infinity;
          const pb = b.price ?? Infinity;
          return pa - pb;
        }
        case "priceDesc": {
          const pa = a.price ?? 0;
          const pb = b.price ?? 0;
          return pb - pa;
        }
        case "mileageAsc": {
          const ma = a.mileage ?? Infinity;
          const mb = b.mileage ?? Infinity;
          return ma - mb;
        }
        case "yearDesc":
        default: {
          const ya = a.year ?? 0;
          const yb = b.year ?? 0;
          return yb - ya;
        }
      }
    });

    return list;
  }, [inventory, search, makeFilter, sortBy]);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 px-4 py-10">
      {/* HEADER CON LOGO */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-0 pb-6">
        <Link href="/" className="flex items-center gap-3 group">
          {/* Logo circular grande */}
          <div className="relative h-11 w-11 sm:h-12 sm:w-12 rounded-full border border-white/20 bg-white/5 p-[2px] shadow-lg shadow-black/60 transition group-hover:border-white/50 group-hover:bg-white/10">
            <div className="relative h-full w-full overflow-hidden rounded-full bg-black">
              <img
                src="/logo.%20available%20hybrid%20premium.png"
                alt="Available Hybrid R&M Inc."
                className="h-full w-full object-contain"
              />
            </div>
          </div>

          <div className="hidden sm:block leading-tight">
            <p className="text-[10px] tracking-[0.25em] text-neutral-400">
              AVAILABLE HYBRID
            </p>
            <p className="text-sm font-semibold text-neutral-50">
              R&amp;M Inc.
            </p>
            <p className="text-[11px] text-neutral-400">
              Hybrid &amp; fuel-efficient vehicles in Reseda, CA.
            </p>
          </div>
        </Link>

        <div className="hidden sm:flex flex-col items-end gap-1 text-right text-xs">
          <span className="text-[11px] text-neutral-400">
            6726 Reseda Blvd Suite A7 · Reseda, CA 91335
          </span>
          <a
            href={`tel:${phone.replace(/[^+\d]/g, "")}`}
            className="rounded-full border border-white/40 bg-white/5 px-4 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-white hover:bg-white/10"
          >
            CALL {phone}
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-5xl">
        {/* Título + contador */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Available Inventory
            </h1>
            <p className="mt-1 text-neutral-400 text-sm">
              Click any vehicle to see full photos, VIN and financing options.
            </p>
          </div>
          <p className="text-xs text-neutral-500">
            {filtered.length} vehicle{filtered.length === 1 ? "" : "s"} available
          </p>
        </div>

        {/* Barra de filtros estilo dealer grande */}
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="w-full sm:max-w-sm">
            <label className="block text-[11px] text-neutral-400 mb-1">
              Search
            </label>
            <div className="relative">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by model, year, etc."
                className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-emerald-500"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500">
                ⌕
              </span>
            </div>
          </div>

          {/* Make + Sort */}
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-end">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-[11px] text-neutral-400 mb-1">
                Make
              </label>
              <select
                value={makeFilter}
                onChange={(e) => setMakeFilter(e.target.value)}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-emerald-500"
              >
                <option value="all">All makes</option>
                {makes.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[140px]">
              <label className="block text-[11px] text-neutral-400 mb-1">
                Sort by
              </label>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as typeof sortBy)
                }
                className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-emerald-500"
              >
                <option value="yearDesc">Newest (Year)</option>
                <option value="priceAsc">Price · Low to High</option>
                <option value="priceDesc">Price · High to Low</option>
                <option value="mileageAsc">Mileage · Low to High</option>
              </select>
            </div>
          </div>
        </div>

        {/* GRID INVENTARIO */}
        {filtered.length === 0 ? (
          <p className="mt-8 text-neutral-400">
            No vehicles match your filters. Try clearing some options.
          </p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {filtered.map((car) => {
              const mainPhoto = car.photos[0] ?? "";

              return (
                <Link
                  key={car.id}
                  href={`/${encodeURIComponent(car.id)}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/70 hover:border-neutral-500 transition"
                >
                  {/* RIBBON */}
                  <div className="flex items-center gap-2 px-4 pt-3">
                    <span className="inline-flex items-center rounded-full bg-neutral-900/90 px-3 py-1 text-[10px] font-semibold tracking-[0.18em] text-neutral-200">
                      AVAILABLE HYBRID
                    </span>
                  </div>

                  {/* IMAGE */}
                  <div className="mt-2 h-44 w-full overflow-hidden bg-neutral-800">
                    {mainPhoto ? (
                      <img
                        src={mainPhoto}
                        alt={car.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-neutral-500 text-sm">
                        No photo
                      </div>
                    )}
                  </div>

                  {/* INFO */}
                  <div className="flex flex-1 flex-col p-4 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-neutral-50">
                          {car.title}
                        </h3>
                        <p className="mt-1 text-[11px] text-neutral-400">
                          {car.year ?? "—"} · {car.fuel} · {car.transmission}
                        </p>
                      </div>
                      {car.price && (
                        <p className="text-right text-emerald-400 font-semibold text-sm">
                          ${car.price.toLocaleString()}
                        </p>
                      )}
                    </div>

                    {car.mileage != null && (
                      <p className="mt-1 text-[11px] text-neutral-400">
                        {car.mileage.toLocaleString()} mi
                      </p>
                    )}

                    {car.description && (
                      <p className="mt-2 line-clamp-2 text-[11px] text-neutral-400">
                        {car.description}
                      </p>
                    )}

                    <p className="mt-3 text-[10px] text-neutral-500 uppercase">
                      VIN: {car.vin}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

export const getStaticProps: GetStaticProps<InventoryProps> = async () => {
  const data = await getInventory();
  const inventory: Vehicle[] = data.map((c) => {
    const photoStrings = Object.entries(c as any)
      .filter(([k, v]) => k.toLowerCase().startsWith("photo") && v)
      .map(([, v]) => String(v));

    return {
      id: String(c.id),
      title: `${c.year ?? ""} ${c.make ?? ""} ${c.model ?? ""}`.trim(),
      year: c.year ? Number(c.year) : null,
      make: c.make ?? "",
      model: c.model ?? "",
      mileage: c.mileage ? Number(c.mileage) : null,
      price: c.price ? Number(c.price) : null,
      vin: c.vin ?? "",
      fuel: c.fuel ?? "",
      transmission: c.transmission ?? "",
      exterior: c.exterior ?? "",
      photos: parsePhotos(photoStrings.join(" ")),
      description: (c as any).description ?? "",
    };
  });

  return { props: { inventory }, revalidate: 60 };
};
