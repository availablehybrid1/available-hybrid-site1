import * as React from "react";
import type { GetStaticProps } from "next";
import { getInventory, type Car } from "../lib/getInventory";

// Tipo de vehículo que usamos en la UI
type Vehicle = {
  id: string;
  title: string;
  price: number | null;
  year: number | null;
  mileage: number | null;
  fuel: string;
  transmission: string;
  exterior: string;
  vin: string;
  description: string;
  status: string;
  photos: string[];
};

type HomeProps = {
  inventory: Vehicle[];
};

// ✅ Componente principal de la página
export default function Home({ inventory }: HomeProps) {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* HEADER SIMPLE */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <div>
          <p className="text-[10px] tracking-[0.25em] text-red-500">
            AVAILABLE HYBRID
          </p>
          <h1 className="text-xl font-semibold">R&amp;M Inc.</h1>
          <p className="text-sm text-neutral-400">
            Hybrid &amp; fuel-efficient vehicles in Reseda, CA.
          </p>
        </div>

        <div className="flex flex-col items-end gap-1 text-right text-xs">
          <a
            href="tel:+17473544098"
            className="rounded bg-red-600 px-3 py-1 font-semibold text-white hover:bg-red-500"
          >
            Call (747) 354-4098
          </a>
          <span className="text-[11px] text-neutral-400">
            6726 Reseda Blvd Suite A7 · Reseda, CA 91335
          </span>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <section className="mx-auto max-w-5xl px-4 pb-12">
        <h2 className="mb-3 text-lg font-semibold">Available Inventory</h2>

        {inventory.length === 0 ? (
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-6 text-sm text-neutral-300">
            <p>
              El inventario en línea está en preparación. Muy pronto podrás ver
              aquí todos los vehículos disponibles.
            </p>
            <p className="mt-2">
              Mientras tanto, llámanos o envíanos un mensaje para consultar el
              inventario actual.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {inventory.map((car) => {
              const mainPhoto = car.photos[0] ?? "";

              return (
                <article
                  key={car.id}
                  className="flex flex-col rounded-lg border border-neutral-800 bg-neutral-900/60 p-4"
                >
                  {/* FOTO PRINCIPAL */}
                  {mainPhoto && (
                    <div className="mb-3 aspect-video w-full overflow-hidden rounded-md bg-neutral-800">
                      <img
                        src={mainPhoto}
                        alt={car.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}

                  {/* TÍTULO Y PRECIO */}
                  <h3 className="text-sm font-semibold">{car.title}</h3>
                  <p className="mt-1 text-xs text-neutral-300">
                    {car.price != null
                      ? `$${car.price.toLocaleString()}`
                      : "Consultar precio"}
                  </p>

                  {/* INFO RÁPIDA */}
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-neutral-400">
                    {car.mileage != null && (
                      <span>{car.mileage.toLocaleString()} mi</span>
                    )}
                    {car.fuel && <span>• {car.fuel}</span>}
                    {car.transmission && <span>• {car.transmission}</span>}
                    {car.exterior && <span>• {car.exterior}</span>}
                  </div>

                  {/* STATUS */}
                  {car.status && (
                    <span className="mt-2 inline-flex w-fit items-center rounded-full border border-emerald-700/60 bg-emerald-900/40 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                      {car.status}
                    </span>
                  )}

                  {/* DESCRIPCIÓN CORTA */}
                  {car.description && (
                    <p className="mt-2 line-clamp-2 text-[11px] text-neutral-400">
                      {car.description}
                    </p>
                  )}

                  {/* VIN + ACCIONES */}
                  <div className="mt-3 flex flex-col gap-2 text-[11px] text-neutral-400">
                    {car.vin && (
                      <span className="text-neutral-500">VIN: {car.vin}</span>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <a
                        href={`/financing?id=${encodeURIComponent(car.id)}`}
                        className="rounded border border-neutral-700 px-2 py-1 hover:bg-neutral-800"
                      >
                        Financing
                      </a>
                      <a
                        href={`/pre-qualification?id=${encodeURIComponent(
                          car.id
                        )}`}
                        className="rounded border border-neutral-700 px-2 py-1 hover:bg-neutral-800"
                      >
                        Pre-Qualify
                      </a>
                      <a
                        href={`/${encodeURIComponent(car.id)}`}
                        className="rounded bg-red-600 px-2 py-1 font-medium text-white hover:bg-red-500"
                      >
                        Details
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

// ✅ getStaticProps: lee la hoja y asegura que nada sea `undefined`
export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  let cars: Car[] = [];

  try {
    cars = await getInventory();
  } catch (err) {
    console.error("Error leyendo Google Sheet:", err);
  }

  const cleaned = (cars || []).filter(
    (c) => c && (c.id || c.make || c.model || c.year)
  );

  const inventory: Vehicle[] = cleaned.map((c, index) => {
    const safeId =
      (c.id && String(c.id).trim()) ||
      `${c.year ?? ""}-${c.make ?? ""}-${c.model ?? ""}` ||
      `vehicle-${index}`;

    const titleBase = `${c.year ?? ""} ${c.make ?? ""} ${c.model ?? ""}`.trim();

    const photos =
      c.photos
        ?.toString()
        .split(/\s+/)
        .map((p) => p.trim())
        .filter(Boolean) ?? [];

    return {
      id: safeId,
      title: titleBase || String(c.id ?? `Vehicle ${index + 1}`),
      price:
        c.price !== undefined && c.price !== null ? Number(c.price) : null,
      year:
        c.year !== undefined && c.year !== null ? Number(c.year) : null,
      mileage:
        c.mileage !== undefined && c.mileage !== null
          ? Number(c.mileage)
          : null,
      fuel: c.fuel ?? "",
      transmission: c.transmission ?? "",
      exterior: c.exterior ?? "",
      vin: c.vin ?? "",
      description: c.description ?? "",
      status: c.status ?? "",
      photos,
    };
  });

  return {
    props: {
      inventory,
    },
    revalidate: 60,
  };
};
