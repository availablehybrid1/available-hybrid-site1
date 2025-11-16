import * as React from "react";
import type { GetStaticProps } from "next";
import { getSheetInventory, type Car } from "../lib/getInventory";

// Tipo muy simple para lo que mostramos en Home
type Vehicle = {
  id: string;
  title: string;
  price: number | null;
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
          <h1 className="text-xl font-semibold">R&M Inc.</h1>
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
                <h3 className="text-sm font-semibold">{car.title}</h3>
                <p className="mt-1 text-xs text-neutral-400">
                  {car.price != null
                    ? `$${car.price.toLocaleString()}`
                    : "Consultar precio"}
                </p>
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

    return {
      id: safeId,
      title: titleBase || String(c.id ?? `Vehicle ${index + 1}`),
      price:
        c.price !== undefined && c.price !== null
          ? Number(c.price)
          : null,
    };
  });

  return {
    props: {
      // 👇 Nunca mandamos `undefined` a los props (solo string / number / null)
      inventory,
    },
    revalidate: 60,
  };
};
