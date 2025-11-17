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
  const [sortBy, setSortBy] = React.useState<"priceDesc" | "priceAsc">(
    "priceDesc"
  );
  const [search, setSearch] = React.useState("");

  const makes = React.useMemo(() => {
    const set = new Set<string>();
    for (const car of inventory) {
      if (car.make) set.add(car.make);
    }
    return Array.from(set).sort();
  }, [inventory]);

  const visible = React.useMemo(() => {
    let cars = [...inventory];
    if (makeFilter !== "ALL") {
      cars = cars.filter(
        (c) => c.make.toLowerCase() === makeFilter.toLowerCase()
      );
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
      if (sortBy === "priceDesc") return pb - pa;
      return pa - pb;
    });

    return cars;
  }, [inventory, makeFilter, sortBy, search]);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 pb-12">
      {/* HEADER – YA CORREGIDO */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
        <Link href="/" className="flex items-center">
          <img
            src="/logo. available hybrid premium.png"
            alt="Available Hybrid"
            className="h-[70px] w-[220px] object-contain"
          />
        </Link>

        <div className="flex flex-col items-end gap-2 text-right text-xs">
          <span className="text-[11px] text-neutral-500">
            6726 Reseda Blvd Suite A7 · Reseda, CA 91335
          </span>
          <a
            href="tel:+17473544098"
            className="rounded-full border border-neutral-600 px-4 py-1.5 text-[11px] font-medium hover:border-neutral-300 hover:text-white"
          >
            CALL +1 747-354-4098
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4">
        {/* Resumen superior */}
        <div className="mb-6 flex flex-col gap-2 text-sm text-neutral-400 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {visible.length} vehicle{visible.length === 1 ? "" : "s"} available
          </span>

          <div className="flex items-center gap-2 sm:justify-end">
            <span className="hidden text-[11px] text-neutral-500 sm:inline">
              Search
            </span>
            <div className="relative w-full max-w-xs">
              <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-xs text-neutral-500">
                🔍
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Model, year, VIN..."
                className="w-full rounded-full border border-neutral-800 bg-neutral-900/80 pl-7 pr-3 py-1.5 text-xs outline-none placeholder:text-neutral-500 focus:border-neutral-400"
              />
            </div>
          </div>
        </div>

        {/* Filtros + Inventario */}
        <div className="grid gap-6 md:grid-cols-[220px,1fr]">

          {/* FILTROS (MINIMAL) */}
          <aside className="rounded-xl border border-neutral-900 bg-neutral-900/60 p-4 text-xs">
            <p className="mb-2 text-[11px] tracking-wide text-neutral-400">
              FILTERS
            </p>

            <label className="block text-[11px] text-neutral-500 mb-1">
              Make
            </label>
            <select
              value={makeFilter}
              onChange={(e) => setMakeFilter(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-[11px] outline-none"
            >
              <option value="ALL">All makes</option>
              {makes.map((mk) => (
                <option key={mk}>{mk}</option>
              ))}
            </select>

            <label className="block text-[11px] text-neutral-500 mt-4 mb-1">
              Sort
            </label>
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "priceDesc" | "priceAsc")
              }
              className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-[11px] outline-none"
            >
              <option value="priceDesc">Price · High → Low</option>
              <option value="priceAsc">Price · Low → High</option>
            </select>
          </aside>

          {/* GRID VEHÍCULOS */}
          <section className="grid gap-4 sm:grid-cols-2">
            {visible.length === 0 ? (
              <p className="text-sm text-neutral-400">
                No vehicles match your search.
              </p>
            ) : (
              visible.map((car) => {
                const photo = car.photos[0];
                return (
                  <Link
                    key={car.id}
                    href={`/${encodeURIComponent(car.id)}`}
                    className="group rounded-2xl border border-neutral-800 bg-neutral-900/60 overflow-hidden hover:border-neutral-400 transition"
                  >
                    {/* TARJETA */}
                    <div className="px-4 pt-3 flex justify-between text-[10px] text-neutral-500 uppercase">
                      <span className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        AVAILABLE HYBRID
                      </span>
                      {car.year}
                    </div>

                    <div className="h-40 overflow-hidden bg-neutral-800">
                      {photo ? (
                        <img
                          src={photo}
                          className="h-full w-full object-cover transition group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-xs text-neutral-500">
                          Photo coming soon
                        </div>
                      )}
                    </div>

                    <div className="px-4 py-3">
                      <p className="text-xs text-neutral-400">
                        {car.year} {car.make}
                      </p>
                      <p className="text-sm font-semibold">{car.model}</p>

                      <p className="mt-1 text-sm font-semibold text-emerald-400">
                        {car.price ? `$${car.price.toLocaleString()}` : "Call"}
                      </p>

                      <p className="mt-1 text-[11px] text-neutral-500 line-clamp-2">
                        {car.description || "Hybrid · Automatic · Clean title"}
                      </p>

                      <p className="mt-2 text-[10px] text-neutral-600">
                        VIN: {car.vin}
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
