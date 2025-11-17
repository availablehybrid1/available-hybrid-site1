// pages/inventory.tsx
import * as React from "react";
import type { GetStaticProps } from "next";
import Link from "next/link";
import { getInventory, type Car } from "../lib/getInventory";

/* ------------------------------
   📷 Convierte fotos de Drive
------------------------------ */
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

/* ------------------------------
   🚗 TYPE VEHICLE
------------------------------ */
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

/* ------------------------------
   🧠 COMPONENTE PRINCIPAL
------------------------------ */

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
      cars = cars.filter((c) =>
        [c.title, c.year, c.make, c.model, c.vin, c.description]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    cars.sort((a, b) => {
      const pa = a.price ?? 0;
      const pb = b.price ?? 0;
      return sortBy === "priceDesc" ? pb - pa : pa - pb;
    });

    return cars;
  }, [inventory, makeFilter, sortBy, search]);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 pb-16">

      {/* ----------------------------------------------------
          🟩 LOGO GRANDE — FRANJA IGUAL A LA PORTADA
      ---------------------------------------------------- */}
      <header className="w-full flex justify-center py-10 border-b border-white/10">
        <img
          src="/logo.%20available%20hybrid%20premium.png"
          alt="Available Hybrid R&M Inc."
          className="h-[140px] w-auto object-contain opacity-95"
        />
      </header>

      {/* ----------------------------------------------------
          📌 RESUMEN + FILTROS SUPERIORES
      ---------------------------------------------------- */}
      <div className="mx-auto max-w-6xl px-4 pt-8">

        <div className="flex flex-col gap-2 text-sm text-neutral-400 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {visible.length} vehicle{visible.length === 1 ? "" : "s"} available
          </span>

          {/* 🔍 Buscador elegante */}
          <div className="flex items-center gap-2 sm:justify-end">
            <span className="hidden text-[11px] text-neutral-500 sm:inline">
              Search
            </span>
            <div className="relative w-full max-w-xs">
              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-neutral-500">
                🔍
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Model, year, VIN…"
                className="w-full rounded-full border border-neutral-800 bg-neutral-900/80 pl-7 pr-3 py-1.5 text-xs text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-emerald-400"
              />
            </div>
          </div>
        </div>

        {/* 🔽 SELECTORES MAKE + SORT */}
        <div className="mt-6 flex flex-wrap items-center gap-6 text-sm">
          <div className="flex flex-col">
            <label className="text-[11px] text-neutral-500 mb-1">Make</label>
            <select
              value={makeFilter}
              onChange={(e) => setMakeFilter(e.target.value)}
              className="rounded-md bg-neutral-900 border border-neutral-700 px-2 py-1.5 text-xs focus:border-emerald-500"
            >
              <option value="ALL">All makes</option>
              {makes.map((mk) => (
                <option key={mk}>{mk}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-[11px] text-neutral-500 mb-1">Sort</label>
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "priceDesc" | "priceAsc")
              }
              className="rounded-md bg-neutral-900 border border-neutral-700 px-2 py-1.5 text-xs focus:border-emerald-500"
            >
              <option value="priceDesc">Price: High → Low</option>
              <option value="priceAsc">Price: Low → High</option>
            </select>
          </div>
        </div>

        {/* ----------------------------------------------------
            📦 INVENTORY GRID — TARJETAS MINIMALISTAS
        ---------------------------------------------------- */}
        <section className="mt-8 grid gap-6 sm:grid-cols-2">
          {visible.length === 0 ? (
            <p className="text-neutral-500 text-sm">No vehicles found.</p>
          ) : (
            visible.map((car) => {
              const mainPhoto = car.photos[0] ?? "/placeholder-car.jpg";
              return (
                <Link
                  key={car.id}
                  href={`/${car.id}`}
                  className="group rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900/70 hover:bg-neutral-900 hover:border-emerald-500/60 transition"
                >
                  {/* BADGE */}
                  <div className="flex justify-between px-4 pt-3 text-[10px] text-neutral-500">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      AVAILABLE HYBRID
                    </span>
                    {car.year}
                  </div>

                  {/* IMG */}
                  <div className="mt-2 h-44 w-full overflow-hidden bg-black">
                    <img
                      src={mainPhoto}
                      alt={car.title}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]"
                    />
                  </div>

                  {/* INFO */}
                  <div className="px-4 pt-3 pb-4 text-xs">
                    <div className="flex justify-between">
                      <p className="text-neutral-300 font-medium">
                        {car.year} {car.make}
                        <br />
                        <span className="text-neutral-400">{car.model}</span>
                      </p>
                      <p className="font-semibold text-emerald-400 text-sm">
                        {car.price
                          ? `$${car.price.toLocaleString()}`
                          : "Call"}
                      </p>
                    </div>

                    <p className="mt-2 text-[11px] text-neutral-500 line-clamp-2">
                      {car.description ||
                        `${car.mileage?.toLocaleString() ?? "--"} mi · ${
                          car.fuel
                        } · ${car.transmission}`}
                    </p>

                    <p className="mt-2 text-[10px] text-neutral-600 font-mono">
                      VIN: {car.vin}
                    </p>
                  </div>
                </Link>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}

/* ------------------------------
   🔁 GET STATIC PROPS
------------------------------ */

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
