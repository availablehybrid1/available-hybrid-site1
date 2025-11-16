// pages/[id].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { getInventory, type Car } from "../lib/getInventory";

// Helper para fotos (mismo que en index)
function parsePhotos(raw?: string | null): string[] {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(/\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
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

type DetailsProps = {
  vehicle: Vehicle | null;
};

export default function VehicleDetails({ vehicle }: DetailsProps) {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-100">
        Cargando vehículo…
      </main>
    );
  }

  if (!vehicle) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 text-neutral-100">
        <p className="mb-4 text-sm text-neutral-300">
          Este vehículo no fue encontrado.
        </p>
        <Link
          href="/"
          className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
        >
          Volver al inventario
        </Link>
      </main>
    );
  }

  const [activeIndex, setActiveIndex] = React.useState(0);
  const mainPhoto = vehicle.photos[activeIndex] ?? "";

  const whatsAppMessage = encodeURIComponent(
    `Hola, estoy interesado en el ${vehicle.title} (VIN: ${
      vehicle.vin || "N/A"
    }). ¿Sigue disponible?`
  );
  const whatsappLink = `https://wa.me/17473544098?text=${whatsAppMessage}`;

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

      {/* BODY */}
      <section className="mx-auto max-w-5xl px-4 pb-10">
        <button
          onClick={() => router.back()}
          className="mb-4 text-xs text-neutral-400 hover:text-neutral-200"
        >
          ← Back to inventory
        </button>

        <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
          {/* GALERÍA */}
          <div>
            <div className="relative mb-3 h-64 w-full overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900">
              {mainPhoto ? (
                <img
                  src={mainPhoto}
                  alt={vehicle.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-neutral-500">
                  Fotos próximamente
                </div>
              )}
            </div>

            {vehicle.photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {vehicle.photos.map((url, index) => (
                  <button
                    key={`${url}-${index}`}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`h-16 w-24 flex-shrink-0 overflow-hidden rounded border ${
                      index === activeIndex
                        ? "border-red-500"
                        : "border-neutral-700"
                    }`}
                  >
                    <img
                      src={url}
                      alt={`Photo ${index + 1}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* INFO VEHÍCULO */}
          <div className="space-y-3 rounded-lg border border-neutral-800 bg-neutral-900/70 p-4 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{vehicle.title}</h2>
                <p className="text-xs text-neutral-400">
                  {vehicle.year ?? "Año n/a"} · {vehicle.make || "Marca n/a"} ·{" "}
                  {vehicle.model || "Modelo n/a"}
                </p>
              </div>
              {vehicle.price != null && (
                <p className="text-lg font-semibold text-green-400">
                  ${vehicle.price.toLocaleString()}
                </p>
              )}
            </div>

            {vehicle.status && (
              <span className="inline-flex w-fit items-center rounded-full bg-emerald-600/15 px-2 py-[2px] text-[11px] font-medium text-emerald-400">
                {vehicle.status}
              </span>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs text-neutral-300">
              <div>
                <p className="text-[11px] text-neutral-500">Mileage</p>
                <p>
                  {vehicle.mileage != null
                    ? `${vehicle.mileage.toLocaleString()} mi`
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-neutral-500">Fuel</p>
                <p>{vehicle.fuel || "N/A"}</p>
              </div>
              <div>
                <p className="text-[11px] text-neutral-500">Transmission</p>
                <p>{vehicle.transmission || "N/A"}</p>
              </div>
              <div>
                <p className="text-[11px] text-neutral-500">Exterior</p>
                <p>{vehicle.exterior || "N/A"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[11px] text-neutral-500">VIN</p>
                <p className="font-mono text-[11px] uppercase">
                  {vehicle.vin || "N/A"}
                </p>
              </div>
            </div>

            {vehicle.description && (
              <div className="pt-2 text-xs text-neutral-300">
                <p>{vehicle.description}</p>
              </div>
            )}

            {/* BOTONES ACCIÓN */}
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="rounded bg-emerald-600 px-3 py-2 font-medium text-white hover:bg-emerald-500"
              >
                WhatsApp
              </a>
              <a
                href="tel:+17473544098"
                className="rounded border border-neutral-700 px-3 py-2 font-medium text-neutral-100 hover:border-red-500 hover:text-red-400"
              >
                Call Dealer
              </a>
              <Link
                href={`/financing?id=${encodeURIComponent(vehicle.id)}`}
                className="rounded border border-neutral-700 px-3 py-2 font-medium text-neutral-100 hover:border-amber-500 hover:text-amber-300"
              >
                Apply for Financing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

// ✅ Genera paths estáticos para cada vehículo
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
        params: { id: String(c.id) },
      })) ?? [];

  return {
    paths,
    fallback: true, // si agregas autos nuevos, Next los genera on-demand
  };
};

// ✅ Carga datos para un solo vehículo
export const getStaticProps: GetStaticProps<DetailsProps> = async (ctx) => {
  const { id } = ctx.params || {};
  let cars: Car[] = [];

  try {
    cars = await getInventory();
  } catch (err) {
    console.error("Error leyendo Google Sheet en getStaticProps:", err);
  }

  const found = cars.find((c) => String(c.id) === String(id)) || null;

  if (!found) {
    return {
      props: {
        vehicle: null,
      },
      revalidate: 60,
    };
  }

  const photos = parsePhotos((found as any).photos);

  const vehicle: Vehicle = {
    id: String(found.id ?? ""),
    title:
      `${found.year ?? ""} ${found.make ?? ""} ${found.model ?? ""}`.trim() ||
      String(found.id),
    year:
      found.year !== undefined && found.year !== null
        ? Number(found.year)
        : null,
    make: found.make ?? "",
    model: found.model ?? "",
    mileage:
      found.mileage !== undefined && found.mileage !== null
        ? Number(found.mileage)
        : null,
    price:
      found.price !== undefined && found.price !== null
        ? Number(found.price)
        : null,
    transmission: found.transmission ?? "",
    fuel: found.fuel ?? "",
    exterior: found.exterior ?? "",
    vin: found.vin ?? "",
    status: (found as any).status ?? "",
    description: found.description ?? "",
    photos,
  };

  return {
    props: {
      vehicle,
    },
    revalidate: 60,
  };
};
