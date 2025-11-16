// pages/[id].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps } from "next";
import Link from "next/link";
import { getInventory, type Car } from "../lib/getInventory";

// misma función de antes
function parsePhotos(raw?: string | null): string[] {
  if (!raw || typeof raw !== "string") return [];

  return raw
    .split(/[\s;]+/)
    .map((u) => u.trim())
    .filter((u) => u.length > 0 && u.startsWith("http"))
    .map((u) => {
      if (u.includes("lh3.googleusercontent.com")) return u;

      if (u.includes("drive.google.com")) {
        const byD = u.match(/\/d\/([^/]+)/);
        const id = byD?.[1];
        if (id) {
          return `https://lh3.googleusercontent.com/d/${id}=w1600`;
        }
      }

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
  transmission: string;
  fuel: string;
  exterior: string;
  vin: string;
  status: string;
  description: string;
  photos: string[];
};

type DetailProps = {
  car: Vehicle | null;
};

export default function VehicleDetail({ car }: DetailProps) {
  const [current, setCurrent] = React.useState(0);

  if (!car) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <p className="text-sm text-neutral-400">Vehicle not found.</p>
          <Link
            href="/"
            className="mt-4 inline-flex text-sm text-red-400 underline-offset-2 hover:underline"
          >
            ← Back to inventory
          </Link>
        </div>
      </main>
    );
  }

  const mainPhoto = car.photos[current] ?? "";

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* HEADER */}
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

      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 pb-12 pt-2 lg:flex-row">
        {/* IMAGEN GRANDE + MINIATURAS */}
        <section className="flex-1">
          <Link
            href="/"
            className="mb-3 inline-flex text-xs text-neutral-400 underline-offset-2 hover:underline"
          >
            ← Back to inventory
          </Link>

          <div className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900/70">
            <div className="relative h-64 w-full bg-neutral-800 sm:h-80">
              {mainPhoto ? (
                <img
                  src={mainPhoto}
                  alt={car.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-neutral-500">
                  Foto próximamente
                </div>
              )}
            </div>

            {car.photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto border-t border-neutral-800 bg-neutral-900/80 p-2">
                {car.photos.map((photo, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrent(idx)}
                    className={`h-14 w-20 flex-none overflow-hidden rounded border ${
                      idx === current
                        ? "border-red-500"
                        : "border-neutral-700"
                    }`}
                  >
                    <img
                      src={photo}
                      alt={`${car.title} ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* INFO DEL VEHÍCULO */}
        <section className="flex-1 rounded-lg border border-neutral-800 bg-neutral-900/70 p-4 text-xs sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-base font-semibold">
                {car.year} {car.make} {car.model}
              </h1>
              <p className="mt-1 text-[11px] text-neutral-400">
                Marca n/a · Prius V
              </p>
            </div>
            {car.price != null && (
              <p className="text-lg font-semibold text-green-400">
                ${car.price.toLocaleString()}
              </p>
            )}
          </div>

          {car.status && (
            <span className="mt-3 inline-flex w-fit items-center rounded-full bg-emerald-600/15 px-2 py-[2px] text-[10px] font-medium text-emerald-400">
              {car.status}
            </span>
          )}

          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-[11px] text-neutral-300">
            <div>
              <dt className="text-neutral-500">Mileage</dt>
              <dd>
                {car.mileage != null
                  ? `${car.mileage.toLocaleString()} mi`
                  : "N/A"}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500">Fuel</dt>
              <dd>{car.fuel || "N/A"}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Transmission</dt>
              <dd>{car.transmission || "N/A"}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Exterior</dt>
              <dd>{car.exterior || "N/A"}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-neutral-500">VIN</dt>
              <dd className="font-mono text-[10px] uppercase">
                {car.vin || "N/A"}
              </dd>
            </div>
          </dl>

          {car.description && (
            <p className="mt-4 text-[11px] leading-relaxed text-neutral-300">
              {car.description}
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-2 text-[11px]">
            <a
              href="https://wa.me/14352564487"
              target="_blank"
              rel="noreferrer"
              className="rounded bg-emerald-500 px-3 py-1 font-medium text-neutral-900 hover:bg-emerald-400"
            >
              WhatsApp
            </a>
            <a
              href="tel:+17473544098"
              className="rounded bg-neutral-800 px-3 py-1 font-medium text-neutral-100 hover:bg-neutral-700"
            >
              Call Dealer
            </a>
            <Link
              href={`/financing?id=${encodeURIComponent(car.id)}`}
              className="rounded border border-neutral-700 px-3 py-1 font-medium text-neutral-100 hover:border-red-500 hover:text-red-400"
            >
              Apply for Financing
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

// 🔁 Genera rutas estáticas usando los IDs de la hoja
export const getStaticPaths: GetStaticPaths = async () => {
  let cars: Car[] = [];

  try {
    cars = await getInventory();
  } catch (err) {
    console.error("Error leyendo Google Sheet en getStaticPaths:", err);
  }

  const paths =
    cars
      ?.filter((c) => c && c.id)
      .map((c) => ({
        params: { id: String(c.id).trim() },
      })) ?? [];

  return {
    paths,
    fallback: false,
  };
};

// Carga datos de un vehículo por ID
export const getStaticProps: GetStaticProps<DetailProps> = async (ctx) => {
  const id = ctx.params?.id as string;

  let cars: Car[] = [];
  try {
    cars = await getInventory();
  } catch (err) {
    console.error("Error leyendo Google Sheet en getStaticProps:", err);
  }

  const raw = cars.find((c) => String(c.id).trim() === id) ?? null;

  if (!raw) {
    return {
      props: {
        car: null,
      },
      revalidate: 60,
    };
  }

  const photoStrings = Object.entries(raw as any)
    .filter(
      ([key, value]) =>
        typeof key === "string" &&
        key.toLowerCase().startsWith("photo") &&
        value != null
    )
    .map(([, value]) => String(value));
  const rawPhotos = photoStrings.join(" ");
  const photos = parsePhotos(rawPhotos);

  const titleBase = `${raw.year ?? ""} ${raw.make ?? ""} ${
    raw.model ?? ""
  }`.trim();

  const car: Vehicle = {
    id: String(raw.id).trim(),
    title: titleBase || String(raw.id),
    year:
      raw.year !== undefined && raw.year !== null ? Number(raw.year) : null,
    make: raw.make ?? "",
    model: raw.model ?? "",
    mileage:
      raw.mileage !== undefined && raw.mileage !== null
        ? Number(raw.mileage)
        : null,
    price:
      raw.price !== undefined && raw.price !== null
        ? Number(raw.price)
        : null,
    transmission: raw.transmission ?? "",
    fuel: raw.fuel ?? "",
    exterior: raw.exterior ?? "",
    vin: raw.vin ?? "",
    status: (raw as any).status ?? "",
    description: (raw as any).description ?? "",
    photos,
  };

  return {
    props: {
      car,
    },
    revalidate: 60,
  };
};
