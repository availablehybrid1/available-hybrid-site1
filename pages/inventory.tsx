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
  const [makeFilter, setMakeFilter] = React.useState<string>("ALL");
  const [yearFilter, setYearFilter] = React.useState<string>("ALL");
  const [sortBy, setSortBy] = React.useState<
    "priceDesc" | "priceAsc" | "yearDesc" | "yearAsc"
  >("priceDesc"); // 🔥 default: de más caro a más barato
  const [search, setSearch] = React.useState("");

  // lista de marcas únicas
  const makes = React.useMemo(() => {
    const set = new Set<string>();
    for (const car of inventory) {
      if (car.make) set.add(car.make);
    }
    return Array.from(set).sort();
  }, [inventory]);

  // lista de años únicos
  const years = React.useMemo(() => {
    const set = new Set<number>();
    for (const car of inventory) {
      if (car.year != null) set.add(car.year);
    }
    return Array.from(set).sort((a, b) => b - a); // de más nuevo a más viejo
  }, [inventory]);

  // Filtrado + orden + búsqueda
  const visible = React.useMemo(() => {
    let cars = [...inventory];

    // filtro por marca
    if (makeFilter !== "ALL") {
      cars = cars.filter(
        (c) => c.make.toLowerCase() === makeFilter.toLowerCase()
      );
    }

    // filtro por año
    if (yearFilter !== "ALL") {
      const y = Number(yearFilter);
      cars = cars.filter((c) => c.year === y);
    }

    // búsqueda simple por modelo / año / VIN / descripción
    if (search.trim()) {
      const q = search.toLowerCase();
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

    // sort
    cars.sort((a, b) => {
      const pa = a.price ?? 0;
      const pb = b.price ?? 0;
      const ya = a.year ?? 0;
      const yb = b.year ?? 0;

      switch (sortBy) {
        case "priceDesc":
          return pb - pa; // alto → bajo
        case "priceAsc":
          return pa - pb; // bajo → alto
        case "yearDesc":
          return yb - ya; // nuevo → viejo
        case "yearAsc":
          return ya - yb; // viejo → nuevo
        default:
          return 0;
      }
    });

    return cars;
  }, [inventory, makeFilter, yearFilter, sortBy, search]);

  const phone = "+1 747-354-4098";

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* HEADER: franja superior con SOLO el logo + dirección + call */}
      <header className="border-b border-neutral-900 bg-black/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/logo. available hybrid premium.png"
              alt="Available Hybrid R&M Inc. logo"
              className="h-[56px] w-auto object-contain"
            />
          </Link>
          <div className="flex flex-col items-end gap-1 text-right text-[11px] text-neutral-400">
            <span>6726 Reseda Blvd Suite A7 · Reseda, CA 91335</span>
            <a
              href={`tel:${phone.replace(/[^+\d]/g, "")}`}
              className="inline-flex items-center justify-center rounded-full border border-neutral-600 bg-neutral-900/60 px-4 py-1.5 text-[11px] font-medium tracking-[0.12em] text-neutral-100 hover:border-neutral-300"
            >
              CALL {phone}
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pb-12 pt-6">
        {/* Resumen + barra de búsqueda (tipo dealer grande) */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-neutral-400">
            {visible.length} vehicle{visible.length === 1 ? "" : "s"} available
          </p>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            {/* Filtros rápidos arriba (make / sort) en pantallas chicas */}
            <div className="flex flex-1 gap-2 sm:hidden">
              <select
                value={makeFilter}
                onChange={(e) => setMakeFilter(e.target.value)}
                className="w-full rounded-full border border-neutral-800 bg-neutral-900/90 px-3 py-1.5 text-xs text-neutral-100 outline-none focus:border-emerald-400"
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
                  setSortBy(
                    e.target.value as
                      | "priceDesc"
                      | "priceAsc"
                      | "yearDesc"
                      | "yearAsc"
                  )
                }
                className="w-full rounded-full border border-neutral-800 bg-neutral-900/90 px-3 py-1.5 text-xs text-neutral-100 outline-none focus:border-emerald-400"
              >
                <option value="priceDesc">Price · High to Low</option>
                <option value="priceAsc">Price · Low to High</option>
                <option value="yearDesc">Year · New to Old</option>
                <option value="yearAsc">Year · Old to New</option>
              </select>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-[260px]">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs text-neutral-500">
                🔍
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by model, year, VIN..."
                className="w-full rounded-full border border-neutral-800 bg-neutral-900/80 py-1.5 pl-7 pr-3 text-xs text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-emerald-400"
              />
            </div>
          </div>
        </div>

        {/* LAYOUT: filtros izquierda / cards derecha (estilo JS Autohaus pero más minimalista) */}
        <div className="grid gap-6 md:grid-cols-[260px,minmax(0,1fr)]">
          {/* FILTROS (desktop) */}
          <aside className="hidden flex-col gap-5 rounded-2xl border border-neutral-900 bg-black/40 p-4 text-xs md:flex">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-neutral-400">
              FILTERS
            </p>

            {/* Make */}
            <div className="space-y-1">
              <p className="text-[11px] text-neutral-500">Make</p>
              <select
                value={makeFilter}
                onChange={(e) => setMakeFilter(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-1.5 text-[11px] text-neutral-100 outline-none focus:border-emerald-400"
              >
                <option value="ALL">All makes</option>
                {makes.map((mk) => (
                  <option key={mk} value={mk}>
                    {mk}
                  </option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div className="space-y-1">
              <p className="text-[11px] text-neutral-500">Year</p>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-1.5 text-[11px] text-neutral-100 outline-none focus:border-emerald-400"
              >
                <option value="ALL">All years</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort by */}
            <div className="space-y-1">
              <p className="text-[11px] text-neutral-500">Sort by</p>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(
                    e.target.value as
                      | "priceDesc"
                      | "priceAsc"
                      | "yearDesc"
                      | "yearAsc"
                  )
                }
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-1.5 text-[11px] text-neutral-100 outline-none focus:border-emerald-400"
              >
                <option value="priceDesc">Price · High to Low</option>
                <option value="priceAsc">Price · Low to High</option>
                <option value="yearDesc">Year · New to Old</option>
                <option value="yearAsc">Year · Old to New</option>
              </select>
            </div>
          </aside>

          {/* GRID DE VEHÍCULOS */}
          <section className="grid gap-4 lg:grid-cols-2">
            {visible.length === 0 ? (
              <p className="text-sm text-neutral-400">
                No vehicles found with the selected filters. Try changing your
                search or filters.
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
                    className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-900 bg-black/40 transition hover:border-emerald-500/70 hover:bg-black/60"
                  >
                    {/* Badging superior */}
                    <div className="flex items-center justify-between px-4 pt-3 text-[10px] uppercase tracking-[0.18em] text-neutral-400">
                      <span className="inline-flex items-center gap-1 rounded-full border border-neutral-700 bg-black/60 px-2 py-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        AVAILABLE HYBRID
                      </span>
                      {car.year && (
                        <span className="text-neutral-500">{car.year}</span>
                      )}
                    </div>

                    {/* Imagen */}
                    <div className="mt-2 h-40 w-full overflow-hidden bg-neutral-900">
                      {mainPhoto ? (
                        <img
                          src={mainPhoto}
                          alt={car.title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[11px] text-neutral-500">
                          Photo coming soon
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex flex-1 flex-col px-4 pb-4 pt-3 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[11px] text-neutral-400">
                            {car.year} {car.make}
                          </p>
                          <h3 className="text-sm font-semibold text-neutral-50">
                            {car.model || car.title}
                          </h3>
                        </div>
                        <p className="whitespace-nowrap text-sm font-semibold text-emerald-300">
                          {priceLabel}
                        </p>
                      </div>

                      <p className="mt-2 line-clamp-2 text-[11px] text-neutral-400">
                        {car.description ||
                          `${car.mileage?.toLocaleString() || "—"} mi · ${
                            car.fuel || "Hybrid"
                          } · ${car.transmission || "Automatic"}`}
                      </p>

                      <p className="mt-2 text-[10px] font-mono uppercase text-neutral-500">
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
