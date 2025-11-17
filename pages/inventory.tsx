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
  // Filtros
  const [yearFilter, setYearFilter] = React.useState<string>("ALL");
  const [makeFilter, setMakeFilter] = React.useState<string>("ALL");
  const [sortBy, setSortBy] = React.useState<"priceDesc" | "priceAsc">(
    "priceDesc" // default: de más caro a más barato
  );

  // Búsqueda global (se controla desde el modal)
  const [searchText, setSearchText] = React.useState("");

  // Modal de búsqueda
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [searchModalText, setSearchModalText] = React.useState("");

  // listas únicas para filtros
  const years = React.useMemo(() => {
    const set = new Set<number>();
    for (const car of inventory) {
      if (car.year) set.add(car.year);
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [inventory]);

  const makes = React.useMemo(() => {
    const set = new Set<string>();
    for (const car of inventory) {
      if (car.make) set.add(car.make);
    }
    return Array.from(set).sort();
  }, [inventory]);

  // Filtrado + orden + búsqueda (para el grid principal)
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

    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      cars = cars.filter((c) => {
        const haystack = [
          c.title,
          c.year?.toString() ?? "",
          c.make,
          c.model,
          c.vin,
          c.description,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }

    cars.sort((a, b) => {
      const pa = a.price ?? 0;
      const pb = b.price ?? 0;
      if (sortBy === "priceDesc") return pb - pa;
      return pa - pb;
    });

    return cars;
  }, [inventory, yearFilter, makeFilter, sortBy, searchText]);

  // resultados usados dentro del modal (buscan sobre todo el inventario)
  const modalResults = React.useMemo(() => {
    const q = searchModalText.trim().toLowerCase();
    if (!q) return inventory;

    return inventory.filter((c) => {
      const haystack = [
        c.title,
        c.year?.toString() ?? "",
        c.make,
        c.model,
        c.vin,
        c.description,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [inventory, searchModalText]);

  // cuando se cierra el modal, aplicamos el texto al filtro global
  const applyModalSearch = () => {
    setSearchText(searchModalText);
    setIsSearchOpen(false);
  };

  const phone = "+1 747-354-4098";

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 pb-12">
      {/* HEADER tipo franja, logo grande como en portada */}
      <header className="border-b border-neutral-900 bg-black/40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center">
            <img
              src="/logo. available hybrid premium.png"
              alt="Available Hybrid R&M Inc."
              className="h-auto w-[220px] md:w-[440px] object-contain"
            />
          </Link>
          <div className="flex flex-col items-end gap-1 text-right text-[11px] text-neutral-400">
            <span>6726 Reseda Blvd Suite A7 · Reseda, CA 91335</span>
            <a
              href={`tel:${phone.replace(/[^+\d]/g, "")}`}
              className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/5 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-white hover:bg-white/10"
            >
              CALL {phone}
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pt-6">
        {/* Resumen + controles superiores */}
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <span className="text-sm text-neutral-400">
            {visible.length} vehicle{visible.length === 1 ? "" : "s"} available
          </span>

          <div className="flex flex-wrap items-center gap-3 md:justify-end">
            {/* Filtros rápidos arriba a la derecha */}
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="h-8 rounded-full border border-neutral-700 bg-neutral-950 px-3 text-xs text-neutral-100 outline-none focus:border-neutral-300"
            >
              <option value="ALL">All years</option>
              {years.map((y) => (
                <option key={y} value={y.toString()}>
                  {y}
                </option>
              ))}
            </select>

            <select
              value={makeFilter}
              onChange={(e) => setMakeFilter(e.target.value)}
              className="h-8 rounded-full border border-neutral-700 bg-neutral-950 px-3 text-xs text-neutral-100 outline-none focus:border-neutral-300"
            >
              <option value="ALL">All makes</option>
              {makes.map((mk) => (
                <option key={mk} value={mk}>
                  {mk}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "priceDesc" | "priceAsc")
              }
              className="h-8 rounded-full border border-neutral-700 bg-neutral-950 px-3 text-xs text-neutral-100 outline-none focus:border-neutral-300"
            >
              <option value="priceDesc">Price · High to Low</option>
              <option value="priceAsc">Price · Low to High</option>
            </select>

            {/* Botón de búsqueda tipo lupa */}
            <button
              type="button"
              onClick={() => {
                setSearchModalText(searchText);
                setIsSearchOpen(true);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-700 bg-neutral-950 text-xs text-neutral-300 hover:bg-neutral-900"
              aria-label="Search inventory"
            >
              🔍
            </button>
          </div>
        </div>

        {/* LAYOUT: filtros izquierda / cards derecha */}
        <div className="grid gap-6 md:grid-cols-[240px,1fr]">
          {/* FILTROS LATERALES (solo diseño, simple y elegante) */}
          <aside className="hidden md:block rounded-2xl border border-neutral-900 bg-neutral-950/80 p-4 text-xs">
            <p className="mb-3 text-[11px] font-semibold tracking-[0.15em] text-neutral-400">
              FILTERS
            </p>

            {/* Price (solo texto informativo) */}
            <div className="mb-4 border-b border-neutral-900 pb-3">
              <h3 className="mb-1 text-[11px] font-medium text-neutral-300">
                Price
              </h3>
              <p className="text-[11px] text-neutral-500">
                Adjust at dealership — ask for BHPH options.
              </p>
            </div>

            {/* Year */}
            <div className="mb-4 border-b border-neutral-900 pb-3">
              <h3 className="mb-1 text-[11px] font-medium text-neutral-300">
                Year
              </h3>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-[11px] text-neutral-100 outline-none focus:border-neutral-300"
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
            <div className="mb-4 border-b border-neutral-900 pb-3">
              <h3 className="mb-1 text-[11px] font-medium text-neutral-300">
                Make
              </h3>
              <select
                value={makeFilter}
                onChange={(e) => setMakeFilter(e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-[11px] text-neutral-100 outline-none focus:border-neutral-300"
              >
                <option value="ALL">All makes</option>
                {makes.map((mk) => (
                  <option key={mk} value={mk}>
                    {mk}
                  </option>
                ))}
              </select>
            </div>

            <p className="mt-2 text-[11px] text-neutral-500">
              More filters (model, trim, etc.) coming soon — keeping it simple
              while you grow inventory.
            </p>
          </aside>

          {/* GRID DE VEHÍCULOS */}
          <section className="grid gap-4 sm:grid-cols-2">
            {visible.length === 0 ? (
              <p className="text-sm text-neutral-400">
                No vehicles found with the selected filters. Try changing your
                filters or search.
              </p>
            ) : (
              visible.map((car) => {
                const mainPhoto = car.photos[0] ?? "";
                const priceLabel =
                  car.price != null
                    ? `$${car.price.toLocaleString()}`
                    : "Call for price";

                return (
                  <Link
                    key={car.id}
                    href={`/${encodeURIComponent(car.id)}`}
                    className="flex flex-col overflow-hidden rounded-2xl border border-neutral-900 bg-neutral-950/80 shadow-[0_0_0_1px_rgba(0,0,0,0.6)] transition hover:bg-neutral-900/90"
                  >
                    {/* Cabecera pequeña con badge + año */}
                    <div className="flex items-center justify-between px-4 pt-3 text-[10px] uppercase tracking-[0.18em] text-neutral-400">
                      <span className="inline-flex items-center gap-1 rounded-full border border-neutral-700 bg-black/60 px-2 py-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        AVAILABLE HYBRID
                      </span>
                      {car.year && (
                        <span className="text-neutral-500">{car.year}</span>
                      )}
                    </div>

                    {/* IMAGEN PRINCIPAL */}
                    <div className="mt-2 h-44 w-full overflow-hidden bg-neutral-800">
                      {mainPhoto ? (
                        <img
                          src={mainPhoto}
                          alt={car.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[11px] text-neutral-500">
                          Photo coming soon
                        </div>
                      )}
                    </div>

                    {/* CUERPO DE INFORMACIÓN */}
                    <div className="flex flex-1 flex-col px-4 pb-4 pt-3 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[11px] text-neutral-400">
                            {car.make}
                          </p>
                          <h3 className="text-sm font-semibold text-neutral-50">
                            {car.model || car.title}
                          </h3>
                        </div>
                        <p className="whitespace-nowrap text-sm font-semibold text-emerald-300">
                          {priceLabel}
                        </p>
                      </div>

                      {/* Fila de especificaciones simple, tipo “barra de info” */}
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-neutral-400">
                        {car.mileage != null && (
                          <span>
                            {car.mileage.toLocaleString()} mi
                          </span>
                        )}
                        {car.fuel && <span>· {car.fuel}</span>}
                        {car.transmission && <span>· {car.transmission}</span>}
                      </div>

                      {/* Descripción corta / frase */}
                      {car.description && (
                        <p className="mt-2 line-clamp-2 text-[11px] text-neutral-400">
                          {car.description}
                        </p>
                      )}

                      {/* VIN */}
                      <p className="mt-3 border-t border-neutral-900 pt-2 text-[10px] font-mono uppercase text-neutral-500">
                        VIN: {car.vin || "N/A"}
                      </p>
                    </div>
                  </Link>
                );
              })
            )}
          </section>
        </div>
      </div>

      {/* MODAL DE BÚSQUEDA */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/70 px-4 pt-16">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-900 px-4 py-3">
              <div className="flex flex-1 items-center gap-2">
                <span className="text-sm text-neutral-400">🔍</span>
                <input
                  autoFocus
                  value={searchModalText}
                  onChange={(e) => setSearchModalText(e.target.value)}
                  placeholder="Search all inventory…"
                  className="w-full bg-transparent text-sm text-neutral-100 outline-none placeholder:text-neutral-500"
                />
              </div>
              <button
                type="button"
                onClick={applyModalSearch}
                className="ml-3 rounded-full border border-neutral-700 bg-neutral-900 px-3 py-1 text-xs font-medium text-neutral-100 hover:bg-neutral-800"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="ml-2 text-xs text-neutral-500 hover:text-neutral-200"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[420px] overflow-y-auto">
              {modalResults.length === 0 ? (
                <p className="px-4 py-4 text-sm text-neutral-400">
                  No vehicles match your search.
                </p>
              ) : (
                modalResults.map((car) => {
                  const thumb = car.photos[0] ?? "/placeholder-car.jpg";
                  const priceLabel =
                    car.price != null
                      ? `$${car.price.toLocaleString()}`
                      : "Call for price";

                  return (
                    <Link
                      key={car.id}
                      href={`/${encodeURIComponent(car.id)}`}
                      className="flex items-center gap-3 border-b border-neutral-900 px-4 py-2.5 text-sm text-neutral-100 hover:bg-neutral-900"
                      onClick={() => setIsSearchOpen(false)}
                    >
                      <div className="h-12 w-16 flex-none overflow-hidden rounded bg-neutral-800">
                        <img
                          src={thumb}
                          alt={car.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-[13px] font-medium">
                          {car.year} {car.make} {car.model}
                        </p>
                        <p className="text-[11px] text-neutral-400">
                          VIN {car.vin || "N/A"}
                        </p>
                      </div>
                      <p className="whitespace-nowrap text-[13px] font-semibold text-emerald-300">
                        {priceLabel}
                      </p>
                    </Link>
                  );
                })
              )}
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
      .filter(([k, v]) => typeof k === "string" && k.toLowerCase().startsWith("photo") && v)
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
