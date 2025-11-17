// pages/inventory.tsx
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
  const [yearFilter, setYearFilter] = React.useState<string>("ALL");
  const [makeFilter, setMakeFilter] = React.useState<string>("ALL");
  const [sortBy, setSortBy] = React.useState<"priceDesc" | "priceAsc">(
    "priceDesc"
  );

  // estado para el modal de búsqueda tipo lupa
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // años únicos
  const years = React.useMemo(() => {
    const set = new Set<number>();
    for (const car of inventory) {
      if (car.year != null) set.add(car.year);
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [inventory]);

  // marcas únicas
  const makes = React.useMemo(() => {
    const set = new Set<string>();
    for (const car of inventory) {
      if (car.make) set.add(car.make);
    }
    return Array.from(set).sort();
  }, [inventory]);

  // Filtrado + orden para el grid principal (sin texto de búsqueda)
  const visible = React.useMemo(() => {
    let cars = [...inventory];

    if (yearFilter !== "ALL") {
      cars = cars.filter((c) => (c.year ?? "").toString() === yearFilter);
    }

    if (makeFilter !== "ALL") {
      cars = cars.filter(
        (c) => c.make.toLowerCase() === makeFilter.toLowerCase()
      );
    }

    cars.sort((a, b) => {
      const pa = a.price ?? 0;
      const pb = b.price ?? 0;
      if (sortBy === "priceDesc") return pb - pa;
      return pa - pb;
    });

    return cars;
  }, [inventory, yearFilter, makeFilter, sortBy]);

  // Resultados para el modal de búsqueda
  const searchResults = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return inventory.filter((c) => {
      const haystack = [
        c.title,
        c.year?.toString() ?? "",
        c.make,
        c.model,
        c.vin,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [inventory, searchQuery]);

  const phone = "+1 747-354-4098";

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 pb-16">
      {/* BARRA SUPERIOR TIPO PORTADA (logo grande) */}
      <header className="border-b border-neutral-900 bg-gradient-to-b from-black to-neutral-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
          <Link href="/" className="flex items-center gap-4">
            {/* Logo ~320 x 100 (confirmado) */}
            <div className="relative h-[100px] w-[320px]">
              <img
                src="/logo. available hybrid premium.png"
                alt="Available Hybrid R&M Inc. logo"
                className="h-full w-full object-contain"
              />
            </div>
          </Link>

          <div className="hidden flex-col items-end gap-2 text-right text-[11px] text-neutral-400 sm:flex">
            <span>6726 Reseda Blvd Suite A7 · Reseda, CA 91335</span>
            <a
              href={`tel:${phone.replace(/[^+\d]/g, "")}`}
              className="inline-flex items-center justify-center rounded-full border border-neutral-600 bg-neutral-900/60 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-100 hover:border-neutral-300 hover:bg-neutral-800"
            >
              Call {phone}
            </a>
          </div>
        </div>

        {/* Fila de filtros rápidos arriba + lupa de búsqueda */}
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-neutral-400">
            {visible.length} vehicle{visible.length === 1 ? "" : "s"} available
          </p>

          <div className="flex flex-1 flex-wrap items-center justify-start gap-3 sm:justify-end">
            {/* Año */}
            <div className="flex items-center gap-1 rounded-full border border-neutral-800 bg-neutral-900/80 px-3 py-1.5 text-[11px]">
              <span className="text-neutral-500">Year</span>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="bg-transparent text-neutral-100 outline-none"
              >
                <option value="ALL">All years</option>
                {years.map((y) => (
                  <option key={y} value={y.toString()}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Make */}
            <div className="flex items-center gap-1 rounded-full border border-neutral-800 bg-neutral-900/80 px-3 py-1.5 text-[11px]">
              <span className="text-neutral-500">Make</span>
              <select
                value={makeFilter}
                onChange={(e) => setMakeFilter(e.target.value)}
                className="bg-transparent text-neutral-100 outline-none"
              >
                <option value="ALL">All makes</option>
                {makes.map((mk) => (
                  <option key={mk} value={mk}>
                    {mk}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-1 rounded-full border border-neutral-800 bg-neutral-900/80 px-3 py-1.5 text-[11px]">
              <span className="text-neutral-500">Sort</span>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "priceDesc" | "priceAsc")
                }
                className="bg-transparent text-neutral-100 outline-none"
              >
                <option value="priceDesc">Price · High to Low</option>
                <option value="priceAsc">Price · Low to High</option>
              </select>
            </div>

            {/* Botón de lupa (abre modal de búsqueda) */}
            <button
              type="button"
              onClick={() => {
                setIsSearchOpen(true);
                setSearchQuery("");
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-800 bg-neutral-900/80 text-sm text-neutral-300 hover:border-neutral-300 hover:bg-neutral-800"
              aria-label="Search inventory"
            >
              🔍
            </button>
          </div>
        </div>
      </header>

      {/* CUERPO: filtros laterales + tarjetas */}
      <div className="mx-auto mt-6 grid max-w-6xl gap-6 px-4 md:grid-cols-[260px,1fr]">
        {/* FILTROS LATERALES */}
        <aside className="rounded-2xl border border-neutral-900 bg-neutral-950/80 p-4 text-xs shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
          <p className="mb-3 text-[11px] font-semibold tracking-[0.18em] text-neutral-400">
            FILTERS
          </p>

          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-neutral-300">Price</p>
              <p className="text-[11px] text-neutral-500">
                Adjust at dealership — ask for BHPH options.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-neutral-400">Year</label>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-1.5 text-[11px] text-neutral-100 outline-none focus:border-neutral-400"
              >
                <option value="ALL">All years</option>
                {years.map((y) => (
                  <option key={y} value={y.toString()}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-neutral-400">Make</label>
              <select
                value={makeFilter}
                onChange={(e) => setMakeFilter(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-1.5 text-[11px] text-neutral-100 outline-none focus:border-neutral-400"
              >
                <option value="ALL">All makes</option>
                {makes.map((mk) => (
                  <option key={mk} value={mk}>
                    {mk}
                  </option>
                ))}
              </select>
            </div>

            <p className="mt-6 text-[11px] text-neutral-500">
              More filters (model, trim, etc.) coming soon — keeping it simple
              while you grow inventory.
            </p>
          </div>
        </aside>

        {/* GRID DE VEHÍCULOS */}
        <section className="grid gap-4 md:grid-cols-2">
          {visible.length === 0 ? (
            <p className="text-sm text-neutral-400">
              No vehicles found with the selected filters. Try another make or
              year.
            </p>
          ) : (
            visible.map((car) => {
              const mainPhoto = car.photos[0] ?? "/placeholder-car.jpg";
              const priceLabel =
                car.price != null
                  ? `$${car.price.toLocaleString()}`
                  : "Call for price";

              return (
                <Link
                  key={car.id}
                  href={`/${encodeURIComponent(car.id)}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-900 bg-neutral-950/80 shadow-[0_10px_30px_rgba(0,0,0,0.55)] transition hover:-translate-y-0.5 hover:border-neutral-500 hover:bg-neutral-950"
                >
                  {/* Badging superior */}
                  <div className="flex items-center justify-between px-4 pt-3 text-[10px] uppercase tracking-[0.18em] text-neutral-400">
                    <span className="inline-flex items-center gap-1 rounded-full border border-neutral-800 bg-black/60 px-2 py-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      AVAILABLE HYBRID
                    </span>
                    {car.year && (
                      <span className="text-neutral-500">{car.year}</span>
                    )}
                  </div>

                  {/* Foto */}
                  <div className="mt-2 h-44 w-full overflow-hidden bg-neutral-900">
                    <img
                      src={mainPhoto}
                      alt={car.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  </div>

                  {/* Info básica */}
                  <div className="flex flex-1 flex-col px-4 pb-4 pt-3 text-xs">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] text-neutral-400">
                          {car.year} {car.make}
                        </p>
                        <h3 className="text-sm font-semibold text-neutral-50">
                          {car.model || car.title}
                        </h3>
                      </div>
                      <p className="whitespace-nowrap text-sm font-semibold text-emerald-400">
                        {priceLabel}
                      </p>
                    </div>

                    {/* Línea de specs */}
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-neutral-400">
                      {car.mileage != null && (
                        <span>{car.mileage.toLocaleString()} mi</span>
                      )}
                      {car.fuel && <span>· {car.fuel}</span>}
                      {car.transmission && <span>· {car.transmission}</span>}
                      {car.exterior && <span>· {car.exterior}</span>}
                    </div>

                    {/* Píldoras de info */}
                    <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
                      {car.fuel && (
                        <span className="rounded-full border border-neutral-800 bg-neutral-950 px-2 py-0.5 text-neutral-300">
                          Fuel: {car.fuel}
                        </span>
                      )}
                      {car.transmission && (
                        <span className="rounded-full border border-neutral-800 bg-neutral-950 px-2 py-0.5 text-neutral-300">
                          {car.transmission}
                        </span>
                      )}
                      {car.mileage != null && (
                        <span className="rounded-full border border-neutral-800 bg-neutral-950 px-2 py-0.5 text-neutral-300">
                          {car.mileage.toLocaleString()} mi
                        </span>
                      )}
                      {car.vin && (
                        <span className="rounded-full border border-neutral-800 bg-neutral-950 px-2 py-0.5 font-mono uppercase text-neutral-400">
                          VIN {car.vin.slice(0, 8)}…
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </section>
      </div>

      {/* MODAL DE BÚSQUEDA (lupa) */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-16">
          <div className="w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-950/95 shadow-xl">
            {/* header modal */}
            <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
              <p className="text-xs font-medium text-neutral-200">
                Search all inventory
              </p>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="text-sm text-neutral-400 hover:text-neutral-100"
              >
                ✕
              </button>
            </div>

            {/* input búsqueda */}
            <div className="px-4 py-3">
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-neutral-500">
                  🔍
                </span>
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by model, year, VIN…"
                  className="w-full rounded-full border border-neutral-800 bg-neutral-950 px-3 py-2 pl-7 text-sm text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-neutral-300"
                />
              </div>
            </div>

            {/* resultados */}
            <div className="max-h-[60vh] overflow-y-auto px-2 pb-3">
              {searchQuery.trim() && searchResults.length === 0 && (
                <p className="px-2 py-2 text-xs text-neutral-500">
                  No results for “{searchQuery.trim()}”.
                </p>
              )}

              {searchResults.map((car) => {
                const thumb = car.photos[0] ?? "/placeholder-car.jpg";
                const price =
                  car.price != null
                    ? `$${car.price.toLocaleString()}`
                    : "Call for price";

                return (
                  <Link
                    key={car.id}
                    href={`/${encodeURIComponent(car.id)}`}
                    onClick={() => setIsSearchOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-2 py-2 text-xs text-neutral-100 hover:bg-neutral-900"
                  >
                    <div className="h-14 w-20 overflow-hidden rounded bg-neutral-900">
                      <img
                        src={thumb}
                        alt={car.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] text-neutral-400">
                        {car.year} {car.make}
                      </p>
                      <p className="text-sm font-semibold">
                        {car.model || car.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-neutral-500">
                        {car.vin ? `VIN ${car.vin}` : ""}
                      </p>
                    </div>
                    <p className="whitespace-nowrap text-sm font-semibold text-emerald-400">
                      {price}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
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
