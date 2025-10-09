// pages/[id].tsx — Detalle con galería (SSR) y tamaño controlado
import * as React from "react";
import type { GetServerSideProps } from "next";
import * as invMod from "../data/inventory";

type Vehicle = {
  id: string;
  title?: string;
  year?: number;
  make?: string;
  model?: string;
  mileage?: number;
  transmission?: string;
  fuel?: string;
  vin?: string;
  exterior?: string;
  interior?: string;
  price?: number;
  description?: string;
  photos?: string[];
  tags?: string[];
  status?: "just_arrived" | "pending_detail";
};

const formatPrice = (p?: number) =>
  p || p === 0 ? `$${p.toLocaleString()}` : "Consultar";

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const { id } = params as { id: string };

  // Acepta inventory, default, etc.
  const anyInv: any = invMod as any;
  const inventory: Vehicle[] =
    (anyInv.inventory ?? anyInv.default ?? []) as Vehicle[];

  const vehicle = inventory.find((v) => v.id === id) || null;

  if (!vehicle) {
    return { notFound: true };
  }

  return { props: { vehicle } };
};

export default function VehiclePage({ vehicle }: { vehicle: Vehicle }) {
  const photos =
    (vehicle?.photos?.filter(Boolean) as string[] | undefined)?.length
      ? (vehicle.photos as string[])
      : ["/placeholder-car.jpg"];

  const [idx, setIdx] = React.useState(0);
  const next = () => setIdx((i) => (i + 1) % photos.length);
  const prev = () => setIdx((i) => (i - 1 + photos.length) % photos.length);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* HEADER */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <a
          href="/"
          className="rounded-xl bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
        >
          ← Back
        </a>
        <a
          href="tel:+18184223567"
          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-500"
        >
          Call (818) 422-3567
        </a>
      </header>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 pb-16 md:grid-cols-3">
        {/* Galería */}
        <div className="md:col-span-2">
          {/* Contenedor con relación de aspecto para que NO salga gigante */}
          <div className="relative w-full overflow-hidden rounded-2xl ring-1 ring-white/10 bg-black/30 aspect-[16/10]">
            <img
              key={photos[idx]}
              src={photos[idx]}
              alt={`${vehicle.title || vehicle.id} photo ${idx + 1}`}
              className="h-full w-full object-contain" /* evita que se desborde */
            />

            {photos.length > 1 && (
              <>
                <button
                  onClick={prev}
                  aria-label="Prev"
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-3 py-1 text-white hover:bg-black/70"
                >
                  ◀
                </button>
                <button
                  onClick={next}
                  aria-label="Next"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-3 py-1 text-white hover:bg-black/70"
                >
                  ▶
                </button>

                <div className="pointer-events-none absolute bottom-2 left-0 right-0 text-center text-xs text-white/80">
                  {idx + 1} / {photos.length}
                </div>
              </>
            )}
          </div>

          {/* Miniaturas */}
          {photos.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {photos.map((src, i) => {
                const active = i === idx;
                return (
                  <button
                    key={src + i}
                    onClick={() => setIdx(i)}
                    className={`relative h-16 w-28 flex-shrink-0 overflow-hidden rounded-md ring-1 ${
                      active ? "ring-red-500" : "ring-white/15"
                    }`}
                    title={`Photo ${i + 1}`}
                  >
                    <img
                      src={src}
                      alt={`thumb ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Panel lateral */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h1 className="text-xl font-semibold">
              {vehicle.title ||
                `${vehicle.year ?? ""} ${vehicle.make ?? ""} ${
                  vehicle.model ?? ""
                }`.trim()}
            </h1>
            <div className="mt-2 text-white/70">
              {vehicle.mileage
                ? `${vehicle.mileage.toLocaleString()} miles`
                : "Mileage —"}
            </div>

            <div className="mt-4 text-3xl font-bold">
              {formatPrice(vehicle.price)}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-white/80">
              <InfoBox label="Year" value={vehicle.year ?? "—"} />
              <InfoBox label="Make" value={vehicle.make ?? "—"} />
              <InfoBox label="Model" value={vehicle.model ?? "—"} />
              <InfoBox
                label="Mileage"
                value={
                  vehicle.mileage ? `${vehicle.mileage.toLocaleString()} mi` : "—"
                }
              />
              <InfoBox label="Transmission" value={vehicle.transmission ?? "—"} />
              <InfoBox label="Fuel" value={vehicle.fuel ?? "—"} />
              <InfoBox label="Exterior" value={vehicle.exterior ?? "—"} />
              <InfoBox label="Interior" value={vehicle.interior ?? "—"} />
              <InfoBox label="VIN" value={vehicle.vin ?? "—"} />
            </div>

            <div className="mt-4 flex gap-2">
              <a
                href={`https://wa.me/18184223567?text=${encodeURIComponent(
                  `Hola, me interesa el ${
                    vehicle.year ?? ""
                  } ${vehicle.make ?? ""} ${vehicle.model ?? ""} (${
                    vehicle.id
                  }). ¿Sigue disponible?`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-xl bg-green-500 px-4 py-2 text-center font-semibold text-white hover:bg-green-400"
              >
                WhatsApp
              </a>
              <a
                href="tel:+18184223567"
                className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-center font-semibold text-white hover:bg-red-500"
              >
                Call now
              </a>
            </div>
          </div>

          {vehicle.description && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/80">
              <h3 className="mb-2 text-white">About this vehicle</h3>
              <p>{vehicle.description}</p>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}

function InfoBox({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-black/30 p-3 ring-1 ring-white/10">
      <div className="text-xs text-white/50">{label}</div>
      <div>{value}</div>
    </div>
  );
}
