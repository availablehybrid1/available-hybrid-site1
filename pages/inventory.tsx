// pages/inventory.tsx
import * as React from "react";
import type { GetStaticProps } from "next";
import Link from "next/link";
import { getInventory, type Car } from "../lib/getInventory";

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
    for (const c of inventory) if (c.make) set.add(c.make);
    return [...set].sort();
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
        [
          c.title,
          c.model,
          c.make,
          c.year,
          c.vin,
          c.description,
        ]
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
    <main className="min-h-screen bg-neutral-950 text-neutral-100 pb-12">

      {/* 🔥 NEW — SAME LOGO STYLE AS HERO SECTION */}
      <header className="w-full flex justify-center py-6">
        <Link href="/" className="block">
          <img
            src="/logo. available hybrid premium.png"
            alt="Available Hybrid"
            className="h-[70px] w-[220px] object-contain opacity-90 hover:opacity-100 transition"
          />
        </Link>
      </header>

      <div className="mx-auto max-w-6xl px-4 pt-2">
        <div className="mb-6 flex flex-col gap-2 text-sm text-neutral-400 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {visible.length} vehicle{visible.length === 1 ? "" : "s"} available
          </span>

          <div className="flex items-center gap-3">
            <select
              value={makeFilter}
              onChange={(e) => setMakeFilter(e.target.value)}
              className="rounded-full bg-neutral-900 border border-neutral-700 px-3 py-1.5 text-[11px]"
            >
              <option value="ALL">All makes</option>
              {makes.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target
                  .value as "priceAsc" | "priceDesc")
              }
              className="rounded-full bg-neutral-900 border border-neutral-700 px-3 py-1.5 text-[11px]"
            >
              <option value="priceDesc">Price · High to Low</option>
              <option value="priceAsc">Price · Low to High</option>
            </select>

            <input
              className="rounded-full bg-neutral-900 border border-neutral-700 px-3 py-1.5 text-[11px] w-40"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2">
          {visible.map((car) => {
            const img = car.photos[0] ?? "/placeholder-car.jpg";

            return (
              <Link
                key={car.id}
                href={`/${car.id}`}
                className="rounded-xl border border-neutral-800 bg-neutral-900 hover:border-emerald-500 transition overflow-hidden"
              >
                <img
                  src={img}
                  className="h-40 w-full object-cover opacity-90 group-hover:opacity-100"
                />

                <div className="p-4 text-xs">
                  <p className="text-neutral-400">
                    {car.year} {car.make}
                  </p>
                  <p className="text-sm font-semibold">{car.model}</p>
                  <p className="mt-1 text-emerald-400 font-semibold">
                    {car.price
                      ? `$${car.price.toLocaleString()}`
                      : "Call for price"}
                  </p>
                </div>
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const data = await getInventory();

  return {
    props: {
      inventory: data.map((c) => ({
        ...c,
        photos: parsePhotos(
          Object.entries(c)
            .filter(([k, v]) => k.toLowerCase().startsWith("photo") && v)
            .map(([, v]) => String(v))
            .join(" ")
        ),
      })),
    },
    revalidate: 60,
  };
};
