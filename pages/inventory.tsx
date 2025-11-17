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
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        {/* Header con logo */}
        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-neutral-900/80 ring-1 ring-white/10">
              <Image
                src="/logo. available hybrid premium.png"
                alt="Available Hybrid R&M Inc. logo"
                fill
                className="object-contain"
              />
            </div>
            <div className="leading-tight">
              <p className="text-[10px] uppercase tracking-[0.25em] text-red-500">
                Available Hybrid
              </p>
              <p className="text-sm font-semibold">R&amp;M Inc.</p>
              <p className="text-[11px] text-neutral-400">
                Hybrid &amp; fuel-efficient vehicles in Reseda, CA.
              </p>
            </div>
          </div>

          <div className="hidden text-right text-[11px] text-neutral-400 sm:block">
            <p>6726 Reseda Blvd Suite A7 · Reseda, CA 91335</p>
            <a
              href="tel:+17473544098"
              className="mt-1 inline-flex rounded-full bg-red-600 px-3 py-1 font-semibold text-white hover:bg-red-500"
            >
              Call (747) 354-4098
            </a>
          </div>
        </header>

        <h1 className="text-2xl font-semibold tracking-tight">
          Available Inventory
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          Click any vehicle to see full photos, VIN and financing options.
        </p>

        {inventory.length === 0 ? (
          <p className="mt-6 text-neutral-400">
            Inventory is being updated. Please check back soon.
          </p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {inventory.map((car) => {
              const mainPhoto = car.photos[0] ?? "";

              return (
                <Link
                  key={car.id}
                  href={`/${encodeURIComponent(car.id)}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/70 shadow-sm transition hover:-translate-y-0.5 hover:border-neutral-500 hover:shadow-xl"
                >
                  {/* IMAGE */}
                  <div className="relative h-44 w-full overflow-hidden bg-neutral-800">
                    {mainPhoto ? (
                      <>
                        <img
                          src={mainPhoto}
                          alt={car.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {/* Logo watermark pequeño */}
                        <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1">
                          <div className="relative h-5 w-5">
                            <Image
                              src="/logo. available hybrid premium.png"
                              alt="Available Hybrid logo"
                              fill
                              className="object-contain opacity-80"
                            />
                          </div>
                          <span className="text-[9px] font-medium tracking-[0.16em] text-neutral-100">
                            AVAILABLE HYBRID
                          </span>
                        </div>
                        {/* Gradiente inferior con título y precio */}
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pb-3 pt-10">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-neutral-50">
                              {car.title}
                            </p>
                            {car.mileage != null && (
                              <p className="text-[11px] text-neutral-300">
                                {car.mileage.toLocaleString()} mi ·{" "}
                                {car.fuel || "Hybrid"} ·{" "}
                                {car.transmission || "Automatic"}
                              </p>
                            )}
                          </div>
                          {car.price != null && (
                            <p className="ml-2 shrink-0 text-sm font-semibold text-emerald-400">
                              ${car.price.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-neutral-500">
                        Photo coming soon
                      </div>
                    )}
                  </div>

                  {/* INFO */}
                  <div className="flex flex-1 flex-col gap-1 px-4 py-3 text-[11px]">
                    <p className="line-clamp-2 text-neutral-300">
                      {car.description ||
                        "Well-maintained hybrid with excellent fuel economy. Financing options available, subject to approval."}
                    </p>

                    <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-neutral-500">
                      VIN: {car.vin || "Available upon request"}
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
