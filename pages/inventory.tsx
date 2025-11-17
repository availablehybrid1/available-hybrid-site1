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
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 px-4 py-10">
      <div className="mx-auto max-w-5xl">
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
                  className="rounded-xl border border-neutral-800 bg-neutral-900/60 hover:border-neutral-500 transition"
                >
                  {/* IMAGE */}
                  <div className="h-40 w-full overflow-hidden rounded-t-xl bg-neutral-800">
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
