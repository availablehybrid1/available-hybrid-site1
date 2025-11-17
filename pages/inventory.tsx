// pages/inventory.tsx
import * as React from "react";
import type { GetStaticProps } from "next";
import Link from "next/link";
import Image from "next/image";
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
  >("priceDesc");
  const [search, setSearch] = React.useState("");

  // Marcas únicas
  const makes = React.useMemo(() => {
    const set = new Set<string>();
    for (const car of inventory) {
      if (car.make) set.add(car.make);
    }
    return Array.from(set).sort();
  }, [inventory]);

  // Años únicos
  const years = React.useMemo(() => {
    const set = new Set<number>();
    for (const car of inventory) {
      if (typeof car.year === "number") set.add(car.year);
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [inventory]);

  // Filtrado + orden + búsqueda
  const visible = React.useMemo(() => {
    let cars = [...inventory];

    if (makeFilter !== "ALL") {
      cars = cars.filter(
        (c) => c.make.toLowerCase() === makeFilter.toLowerCase()
      );
    }

    if (yearFilter !== "ALL") {
      const y = Number(yearFilter);
      cars = cars.filter((c) => c.year === y);
    }

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

    cars.sort((a, b) => {
      const pa = a.price ?? 0;
      const pb = b.price ?? 0;
      const ya = a.year ?? 0;
      const yb = b.year ?? 0;

      switch (sortBy) {
        case "priceAsc":
          return pa - pb;
        case "priceDesc":
          return pb - pa;
        case "yearAsc":
          return ya - yb;
        case "yearDesc":
          return yb - ya;
        default:
          return pb - pa;
      }
    });

    return cars;
  }, [inventory, makeFilter, yearFilter, sortBy, search]);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* 🔹 FRANJA SUPERIOR – LOGO GRANDE COMO EN LA PORTADA */}
      <header className="border-b border-neutral-900 bg-black/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          {/* Logo grande (MISMO ARCHIVO Y TAMAÑO DE LA PORTADA) */}
          <Link href="/" className="flex items-center">
            <div className="relative h-[70px] w-[220px]">
              <Image
                src="/logo.%20available%20hybrid%20premium.png"
                alt="Available Hybrid R&M Inc."
                fill
                priority
                className="object-contain"
              />
            </div>
          </Link>

          {/* Dirección + botón de llamada */}
          <div className="hidden text-right text-[11px] text-neutral-400 sm:block">
            <p>6726 Reseda Blvd Suite A7 · Reseda, CA 91335</p>
            <a
              href="tel:+17473544098"
              className="mt-2 inline-flex items-center justify-center rounded-full border border-white/25 bg-white/5 px-4 py-1.5 font-medium uppercase tracking-[0.16em] text-white hover:bg-white/10"
            >
              Call +1 747-354-4098
            </a>
          </div>
        </div>
      </header>

      {/* 🔹 CONTENIDO PRINCIPAL – ESTILO DEALER CON SIDEBAR */}
      <div className="mx-auto max-w-6xl px-4 pb-12 pt-6">
        {/* Resumen + buscador arriba, tipo J&S */}
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-neutral-400">
            {visible.length} vehicle{visible.length === 1 ? "" : "s"} available
          </p>

          <div className="flex flex-1 flex-col items-stretch gap-3 md:flex-row md:items-center md:justify-end">
            <div className="relative w-full max-w-md">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs text-neutral-500">
                🔍
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by model, year, VIN..."
                className="w-full rounded-full border border-neutral-800 bg-neutral-900/80 pl-8 pr-3 py-2 text-xs text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-emerald-400"
              />
            </div>

            <div className="flex items-center gap-2 text-[11px] text-neutral-400">
              <span className="hidden md:inline">Sort</span>
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
                className="rounded-full border border-neutral-800 bg-neutral-900/80 px-3 py-1.5 text-[11px] text-neutral-100 outline-none focus:border-emerald-400"
              >
                <option value="priceDesc">Price · High to Low</option>
                <option value="priceAsc">Price · Low to High</option>
                <option value="yearDesc">Year · New to Old</option>
                <option value="yearAsc">Year · Old to New</option>
              </select>
            </div>
          </div>
        </div>

        {/* Layout con sidebar de filtros + grid de vehículos */}
        <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
          {/* 🔹 SIDEBAR – VISUAL TIPO J&S (Price, Year, Make...) */}
          <aside className="hidden rounded-2xl border border-neutral-900 bg-black/40 p-4 text-xs lg:block">
            <p className="mb-4 text-[11px] font-semibold tracking-[0.22em] text-neutral-500 uppercase">
              Filters
            </p>

            <div className="space-y-4">
              {/* Price (solo visual por ahora) */}
              <div className="border-b border-neutral-900 pb-3">
                <button
                  type="button"
                  className="flex w-full items-center justify-between text-[12px] font-medium text-neutral-200"
                >
                  <span>Price</span>
                  <span className="text-neutral-500">&rsaquo;</span>
                </button>
                <p className="mt-1 text-[11px] text-neutral-500">
                  Adjust at dealership – ask for BHPH options.
                </p>
              </div>

              {/* Year */}
              <div className="border-b border-neutral-900 pb-3">
                <p className="mb-1 text-[11px] font-medium text-neutral-200">
                  Year
                </p>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-2 text-[11px] text-neutral-100 outline-none focus:border-emerald-400"
                >
                  <option value="ALL">All years</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              {/* Make */}
              <div className="border-b border-neutral-900 pb-3">
                <p className="mb-1 text-[11px] font-medium text-neutral-200">
                  Make
                </p>
                <select
                  value={makeFilter}
                  onChange={(e) => setMakeFilter(e.target.value)}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-2 text-[11px] text-neutral-100 outline-none focus:border-emerald-400"
                >
                  <option value="ALL">All makes</option>
                  {makes.map((mk) => (
                    <option key={mk} value={mk}>
                      {mk}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bloques vacíos solo para parecerse más al diseño J&S */}
              <div className="border-b border-neutral-900 pb-3">
                <button
                  type="button"
                  className="flex w-full items-center justify-between text-[12px] font-medium text-neutral-200"
                >
                  <span>Model</span>
                  <span className="text-neutral-500">&rsaquo;</span>
                </button>
              </div>

              <div className="border-b border-neutral-900 pb-3">
                <button
                  type="button"
                  className="flex w-full items-center justify-between text-[12px] font-medium text-neutral-200"
                >
                  <span>Trim</span>
                  <span className="text-neutral-500">&rsaquo;</span>
                </button>
              </div>

              <div>
                <button
                  type="button"
                  className="flex w-full items-center justify-between text-[12px] font-medium text-neutral-200"
                >
                  <span>See all filters</span>
                  <span className="text-neutral-500">&rsaquo;</span>
                </button>
              </div>
            </div>
          </aside>

          {/* 🔹 GRID DE VEHÍCULOS */}
          <section className="space-y-4">
            {visible.length === 0 ? (
              <p className="text-sm text-neutral-400">
                No vehicles found with the selected filters. Try changing your
                search or filters.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {visible.map((car) => {
                  const mainPhoto = car.photos[0] ?? "";
                  const priceLabel =
                    car.price != null
                      ? `$${car.price.toLocaleString()}`
                      : "Call for price";

                  return (
                    <Link
                      key={car.id}
                      href={`/${encodeURIComponent(car.id)}`}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-900 bg-black/55 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] transition hover:border-emerald-500/70 hover:bg-black/75"
                    >
                      {/* Badging superior */}
                      <div className="flex items-center justify-between px-4 pt-3 text-[10px] uppercase tracking-[0.18em] text-neutral-400">
                        <span className="inline-flex items-center gap-1 rounded-full border border-neutral-700 bg-black/60 px-2 py-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          Available Hybrid
                        </span>
                        {car.year && (
                          <span className="text-neutral-500">{car.year}</span>
                        )}
                      </div>

                      {/* Imagen grande */}
                      <div className="mt-2 h-44 w-full overflow-hidden bg-neutral-900 md:h-52">
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
                })}
              </div>
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
