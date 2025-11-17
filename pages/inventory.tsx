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

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        {/* HEADER ELEGANTE CON LOGO GRANDE */}
        <header className="mb-8 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-11 w-11 sm:h-12 sm:w-12 overflow-hidden rounded-2xl bg-neutral-900/80 ring-1 ring-white/15 group-hover:ring-white/40 transition">
              <img
                src="/logo.%20available%20hybrid%20premium.png"
                alt="Available Hybrid R&M Inc. logo"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="leading-tight hidden sm:block">
              <p className="text-[10px] font-semibold tracking-[0.26em] text-neutral-400 group-hover:text-neutral-200">
                AVAILABLE HYBRID
              </p>
              <p className="text-sm font-semibold text-neutral-50">
                R&amp;M Inc.
              </p>
              <p className="text-[11px] text-neutral-500">
                Hybrid &amp; fuel-efficient vehicles in Reseda, CA.
              </p>
            </div>
          </Link>

          <div className="flex flex-col items-end gap-1 text-right text-[11px] text-neutral-400">
            <span>6726 Reseda Blvd Suite A7 · Reseda, CA 91335</span>
            <a
              href={`tel:${phone.replace(/[^+\d]/g, "")}`}
              className="mt-1 inline-flex items-center justify-center rounded-full border border-white/25 bg-white/5 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-white hover:bg-white/10"
            >
              Call {phone}
            </a>
          </div>
        </header>

        {/* TÍTULO DE INVENTARIO */}
        <h1 className="text-3xl font-bold tracking-tight">Available Inventory</h1>
        <p className="mt-1 text-neutral-400">
          Click any vehicle to see full photos, VIN and financing options.
        </p>

        {inventory.length === 0 ? (
          <p className="mt-6 text-neutral-400">
            Inventory is being updated. Please check back soon.
          </p>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {inventory.map((car) => {
              const mainPhoto = car.photos[0] ?? "";

              return (
                <Link
                  key={car.id}
                  href={`/${encodeURIComponent(car.id)}`}
                  className="relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/60 hover:border-neutral-500 transition"
                >
                  {/* IMAGE */}
                  <div className="h-40 w-full overflow-hidden bg-neutral-800">
                    {mainPhoto ? (
                      <img
                        src={mainPhoto}
                        alt={car.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-neutral-500 text-sm">
                        No photo
                      </div>
                    )}
                  </div>

                  {/* PEQUEÑO LOGO/BADGE SOBRE LA FOTO */}
                  <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.18em] text-neutral-100">
                    <div className="h-4 w-4 overflow-hidden rounded-full bg-neutral-900/80 ring-1 ring-white/20">
                      <img
                        src="/logo.%20available%20hybrid%20premium.png"
                        alt="AH logo"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <span>Available Hybrid</span>
                  </div>

                  {/* INFO */}
                  <div className="p-4 space-y-1">
                    <h3 className="font-medium text-sm">{car.title}</h3>

                    {car.price && (
                      <p className="font-semibold text-emerald-400">
                        ${car.price.toLocaleString()}
                      </p>
                    )}

                    <p className="text-[11px] text-neutral-400">
                      {car.mileage ? `${car.mileage.toLocaleString()} mi · ` : ""}
                      {car.fuel} · {car.transmission}
                    </p>

                    <p className="text-[10px] text-neutral-500 uppercase">
                      VIN: {car.vin}
                    </p>

                    {car.description && (
                      <p className="mt-1 line-clamp-2 text-[11px] text-neutral-400">
                        {car.description}
                      </p>
                    )}
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
