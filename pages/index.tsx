import * as React from "react";
import type { GetStaticProps } from "next";

// Tipos básicos
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
                  {car.price != null ? `$${car.price.toLocaleString()}` : "Consultar precio"}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

// ✅ Datos estáticos (por ahora inventario vacío, para evitar errores)
export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  return {
    props: {
      inventory: [], // luego lo conectamos a Google Sheets
    },
    revalidate: 60,
  };
};
