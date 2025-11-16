import * as React from "react";
import type { GetStaticProps } from "next";
import { getSheetInventory, type Car } from "../lib/getInventory";

// Tipo de vehículo que usamos en la UI
type Vehicle = {
  id: string;
  title: string;
  price: number | null;
  year: number | null;
  mileage: number | null;
  fuel: string | null;
  transmission: string | null;
  exterior: string | null;
  status: string | null;
  thumbnail: string | null;
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
            {inventory.map((car) => (
              <article
                key={car.id}
                className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-4"
              >
                {car.thumbnail && (
                  <div className="mb-3 overflow-hidden rounded-md border border-neutral-800 bg-black">
                    <img
                      src={car.thumbnail}
                      alt={car.title}
                      className="h-40 w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}

                <h3 className="text-sm font-semibold">{car.title}</h3>

                <p className="mt-1 text-xs text-neutral-400">
                  {car.year ?? "Year N/A"} ·{" "}
                  {car.mileage != null
                    ? `${car.mileage.toLocaleString()} miles`
                    : "Mileage N/A"}{" "}
                  · {car.fuel || "Fuel N/A"}
                </p>

                <p className="mt-1 text-xs text-neutral-200">
                  {car.price != null
                    ? `$${car.price.toLocaleString()}`
                    : "Consultar precio"}
                </p>

                {car.status && (
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-green-400">
                    {car.status}
                  </p>
                )}
              </article>
            ))}
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
    cars = await getSheetInventory();
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

    const year =
      c.year !== undefined && c.year !== null && c.year !== ""
        ? Number(c.year)
        : null;

    const mileage =
      c.mileage !== undefined && c.mileage !== null && c.mileage !== ""
        ? Number(c.mileage)
        : null;

    const price =
      c.price !== undefined && c.price !== null && c.price !== ""
        ? Number(c.price)
        : null;

    // Extraer links de la columna "photos" (aunque estén pegados)
    const rawPhotos = c.photos ? String(c.photos) : "";
    const links = rawPhotos.match(/https?:\/\/\S+/g) ?? [];
    const thumbnail = links.length > 0 ? links[0] : null;

    return {
      id: safeId,
      title: titleBase || String(c.id ?? `Vehicle ${index + 1}`),
      price,
      year,
      mileage,
      fuel: c.fuel ?? null,
      transmission: c.transmission ?? null,
      exterior: c.exterior ?? null,
      status: c.status ?? null,
      thumbnail,
    };
  });

  return {
    props: {
      inventory,
    },
    revalidate: 60,
  };
};
