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

  // modal de búsqueda con la lupa
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

  // Filtrado + orden para el grid principal
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
    <main className="min-h-screen bg-[#050505] text-neutral-100 pb-16">
      {/* HEADER TIPO DEALER */}
      <header className="border-b border-neutral-900 bg-black/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            {/* Logo ~320x100 pero un poco más compacto visualmente */}
            <div className="relative h-[80px] w-[260px]">
              <img
                src="/logo. available hybrid premium.png"
                alt="Available Hybrid R&M Inc. logo"
                className="h-full w-full object-contain"
              />
            </div>
          </Link>

          {/* navegación simple tipo "Shop / Finance" */}
          <nav className="hidden items-center gap-6 text-xs font-medium text-neutral-300 sm:flex">
            <span className="cursor-default hover:text-white">Shop</span>
            <span className="cursor-default hover:text-white">
              Electric Vehicles
            </span>
            <span className="cursor-default hover:text-white">Sell / Trade</span>
            <span className="cursor-default hover:text-white">Finance</span>
            <span className="cursor-default hover:text-white">Service</span>
          </nav>

          <div className="hidden flex-col items-end text-right text-[11px] text-neutral-400 sm:flex">
            <span>6726 Reseda Blvd Suite A7 · Reseda, CA 91335</span>
            <a
              href={`tel:${phone.replace(/[^+\d]/g, "")}`}
              className="mt-1 inline-flex items-center justify-center rounded-full border border-neutral-700 bg-neutral-950 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-100 hover:border-neutral-300 hover:bg-neutral-800"
            >
              Call {phone}
            </a>
          </div>
        </div>
      </header>

      {/* LAYOUT PRINCIPAL: sidebar + contenido */}
      <div className="mx-auto flex max-w-6xl gap-6 px-4 pt-6">
        {/* SIDEBAR IZQUIERDO TIPO J&S */}
        <aside className="hidden w-60 flex-shrink-0 flex-col text-sm text-neutral-100 lg:flex">
          {/* Standard / AI mode */}
          <div className="mb-5 grid grid-cols-2 gap-2">
            <button className="rounded-lg bg-neutral-900 px-3 py-2 text-xs font-semibold text-white shadow-sm">
              Standard
            </button>
            <button className="rounded-lg bg-neutral-900/40 px-3 py-2 text-xs font-medium text-neutral-400">
              Ai Mode
            </button>
          </div>

          {/* “filtros” tipo lista (solo Year y Make son funcionales) */}
          <div className="space-y-2 text-[13px]">
            {/* Price - texto informativo */}
            <div className="rounded-lg bg-neutral-900/40 px-3 py-2">
              <div className="flex items-center justify-between">
                <span>Price</span>
                <span className="text-xs text-neutral-500">Adjust in-store</span>
              </div>
              <p className="mt-1 text-[11px] text-neutral-500">
                Ask for BHPH options.
              </p>
            </div>

            {/* Year (con select real) */}
            <div className="rounded-lg bg-neutral-900/40 px-3 py-2">
              <div className="flex items-center justify-between">
                <span>Year</span>
                <span className="text-xs text-neutral-500">
                  {yearFilter === "ALL" ? "All years" : yearFilter}
                </span>
              </div>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="mt-2 w-full rounded-md border border-neutral-800 bg-black/60 px-2 py-1.5 text-[11px] text-neutral-100 outline-none focus:border-neutral-400"
              >
                <option value="ALL">All years</option>
                {years.map((y) => (
                  <option key={y} value={y.toString()}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Make (con select real) */}
            <div className="rounded-lg bg-neutral-900/40 px-3 py-2">
              <div className="flex items-center justify-between">
                <span>Make</span>
                <span className="text-xs text-neutral-500">
                  {makeFilter === "ALL" ? "All makes" : makeFilter}
                </span>
              </div>
              <select
                value={makeFilter}
                onChange={(e) => setMakeFilter(e.target.value)}
                className="mt-2 w-full rounded-md border border-neutral-800 bg-black/60 px-2 py-1.5 text-[11px] text-neutral-100 outline-none focus:border-neutral-400"
              >
                <option value="ALL">All makes</option>
                {makes.map((mk) => (
                  <option key={mk} value={mk}>
                    {mk}
                  </option>
                ))}
              </select>
            </div>

            {/* Otros filtros solo visuales para parecerse al diseño */}
            <div className="rounded-lg bg-neutral-900/30 px-3 py-2">
              <div className="flex items-center justify-between">
                <span>Model</span>
                <span className="text-xs text-neutral-600">Coming soon</span>
              </div>
            </div>
            <div className="rounded-lg bg-neutral-900/30 px-3 py-2">
              <div className="flex items-center justify-between">
                <span>Trim</span>
                <span className="text-xs text-neutral-600">Coming soon</span>
              </div>
            </div>
            <div className="rounded-lg bg-neutral-900/30 px-3 py-2">
              <span>Body Type</span>
            </div>
            <div className="rounded-lg bg-neutral-900/30 px-3 py-2">
              <span>Body Subtype</span>
            </div>
            <div className="rounded-lg bg-neutral-900/30 px-3 py-2">
              <span>Drivetrain</span>
            </div>
            <button className="mt-2 text-left text-[11px] font-medium text-emerald-400 hover:text-emerald-300">
              See all filters
            </button>
          </div>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <section className="flex-1">
          {/* contador de vehículos */}
          <p className="text-xs text-neutral-400">
            {visible.length} vehicle{visible.length === 1 ? "" : "s"} available
          </p>

          {/* Chips de marcas tipo “Mercedes-Benz / BMW / Porsche” */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMakeFilter("ALL")}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
                makeFilter === "ALL"
                  ? "bg-neutral-100 text-black"
                  : "bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
              }`}
            >
              All inventory
            </button>
            {makes.map((mk) => (
              <button
                key={mk}
                type="button"
                onClick={() => setMakeFilter(mk)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium ${
                  makeFilter.toLowerCase() === mk.toLowerCase()
                    ? "bg-neutral-100 text-black"
                    : "bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
                }`}
              >
                {mk}
              </button>
            ))}
          </div>

          {/* fila: “Search X results on this page” + sort + lupa */}
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* barra de “search” (abre modal con la lupa) */}
            <button
              type="button"
              onClick={() => {
                setIsSearchOpen(true);
                setSearchQuery("");
              }}
              className="flex flex-1 items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/80 px-4 py-3 text-left text-xs text-neutral-400 hover:border-neutral-500 hover:bg-neutral-900"
            >
              <span>
                Search {visible.length} result
                {visible.length === 1 ? "" : "s"} on this page
              </span>
              <span className="text-sm">🔍</span>
            </button>

            {/* sort */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-neutral-500">Sort</span>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "priceDesc" | "priceAsc")
                }
                className="rounded-full border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-[11px] text-neutral-100 outline-none hover:border-neutral-500"
              >
                <option value="priceDesc">Price · High to Low</option>
                <option value="priceAsc">Price · Low to High</option>
              </select>
            </div>
          </div>

          {/* GRID DE VEHÍCULOS (3 columnas en desktop grande) */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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

                const monthly =
                  car.price != null
                    ? Math.round(car.price / 60) // cálculo sencillo solo para mostrar algo visual
                    : null;

                return (
                  <Link
                    key={car.id}
                    href={`/${encodeURIComponent(car.id)}`}
                    className="group flex flex-col overflow-hidden rounded-xl border border-neutral-900 bg-neutral-900/70 shadow-[0_10px_30px_rgba(0,0,0,0.65)] transition hover:-translate-y-0.5 hover:border-neutral-500 hover:bg-neutral-900"
                  >
                    {/* Imagen principal + badges arriba */}
                    <div className="relative h-52 w-full overflow-hidden bg-neutral-950">
                      <img
                        src={mainPhoto}
                        alt={car.title}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                      />
                      <div className="absolute left-3 top-3 flex gap-2 text-[10px] uppercase tracking-[0.16em]">
                        <span className="inline-flex items-center gap-1 rounded-full bg-black/80 px-2 py-0.5 text-neutral-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          Available Hybrid
                        </span>
                        {car.year && (
                          <span className="rounded-full bg-black/80 px-2 py-0.5 text-neutral-300">
                            {car.year}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Info principal */}
                    <div className="flex flex-1 flex-col px-4 pb-3 pt-3 text-xs">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-400">
                        {car.make || "Hybrid"}
                      </p>
                      <h3 className="mt-1 text-sm font-semibold text-neutral-50">
                        {car.model || car.title}
                      </h3>

                      {/* Specs cortos tipo “millas / fuel / transmisión” */}
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-neutral-400">
                        {car.mileage != null && (
                          <span>{car.mileage.toLocaleString()} mi</span>
                        )}
                        {car.fuel && <span>· {car.fuel}</span>}
                        {car.transmission && <span>· {car.transmission}</span>}
                        {car.exterior && <span>· {car.exterior}</span>}
                      </div>

                      {/* Pills pequeñas (VIN + auto) */}
                      <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
                        {car.vin && (
                          <span className="rounded-full border border-neutral-800 bg-neutral-950 px-2 py-0.5 font-mono uppercase text-neutral-400">
                            VIN {car.vin.slice(0, 8)}…
                          </span>
                        )}
                        {car.fuel && (
                          <span className="rounded-full border border-neutral-800 bg-neutral-950 px-2 py-0.5 text-neutral-300">
                            Hybrid
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Barra inferior tipo precio / mensual */}
                    <div className="mt-auto flex items-center justify-between bg-black/80 px-4 py-3 text-sm">
                      <div>
                        <p className="text-[11px] text-neutral-500">Price</p>
                        <p className="font-semibold text-neutral-50">
                          {priceLabel}
                        </p>
                      </div>
                      {monthly && (
                        <div className="text-right">
                          <p className="text-[11px] text-emerald-400/80">
                            Est. payment
                          </p>
                          <p className="font-semibold text-emerald-400">
                            ${monthly.toLocaleString()}/mo
                          </p>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })
            )}
          </div>
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
