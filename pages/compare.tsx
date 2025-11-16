// pages/compare.tsx
import * as React from "react";
import type { GetStaticProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { getInventory, type Car } from "../lib/getInventory";

// Reusar parsePhotos si quieres mostrar fotos
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

type CompareProps = {
  inventory: Vehicle[];
};

export default function ComparePage({ inventory }: CompareProps) {
  const router = useRouter();
  const baseId =
    typeof router.query.base === "string" ? router.query.base : undefined;

  const [id1, setId1] = React.useState<string>(
    () => baseId || (inventory[0]?.id ?? "")
  );
  const [id2, setId2] = React.useState<string>(() =>
    inventory[1]?.id
      ? inventory[1].id
      : baseId
      ? inventory.find((c) => c.id !== baseId)?.id ?? baseId
      : inventory[0]?.id ?? ""
  );

  React.useEffect(() => {
    if (baseId) {
      setId1(baseId);
    }
  }, [baseId]);

  const car1 = inventory.find((c) => c.id === id1) ?? null;
  const car2 = inventory.find((c) => c.id === id2) ?? null;

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

      <div className="mx-auto max-w-5xl px-4 pb-12">
        <Link
          href="/"
          className="mb-4 inline-flex text-xs text-neutral-400 underline-offset-2 hover:underline"
        >
          ← Back to inventory
        </Link>

        <h2 className="mb-4 text-lg font-semibold">Compare Vehicles</h2>

        {/* SELECTORES */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 text-xs">
            <p className="text-neutral-400">Vehicle 1</p>
            <select
              value={id1}
              onChange={(e) => setId1(e.target.value)}
              className="w-full rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-emerald-500"
            >
              {inventory.map((car) => (
                <option key={car.id} value={car.id}>
                  {car.year} {car.make} {car.model}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1 text-xs">
            <p className="text-neutral-400">Vehicle 2</p>
            <select
              value={id2}
              onChange={(e) => setId2(e.target.value)}
              className="w-full rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-emerald-500"
            >
              {inventory.map((car) => (
                <option key={car.id} value={car.id}>
                  {car.year} {car.make} {car.model}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* TABLA COMPARATIVA */}
        <div className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900/70 text-[11px]">
          <div className="grid grid-cols-3 border-b border-neutral-800 bg-neutral-900/80">
            <div className="px-3 py-2 text-neutral-400">Spec</div>
            <div className="px-3 py-2 text-neutral-200">
              {car1 ? (
                <Link
                  href={`/${encodeURIComponent(car1.id)}`}
                  className="underline-offset-2 hover:underline"
                >
                  {car1.year} {car1.make} {car1.model}
                </Link>
              ) : (
                "-"
              )}
            </div>
            <div className="px-3 py-2 text-neutral-200">
              {car2 ? (
                <Link
                  href={`/${encodeURIComponent(car2.id)}`}
                  className="underline-offset-2 hover:underline"
                >
                  {car2.year} {car2.make} {car2.model}
                </Link>
              ) : (
                "-"
              )}
            </div>
          </div>

          {[
            {
              label: "Price",
              v1: car1?.price != null
                ? `$${car1.price.toLocaleString()}`
                : "N/A",
              v2: car2?.price != null
                ? `$${car2.price.toLocaleString()}`
                : "N/A",
            },
            {
              label: "Mileage",
              v1:
                car1?.mileage != null
                  ? `${car1.mileage.toLocaleString()} mi`
                  : "N/A",
              v2:
                car2?.mileage != null
                  ? `${car2.mileage.toLocaleString()} mi`
                  : "N/A",
            },
            {
              label: "Fuel",
              v1: car1?.fuel || "N/A",
              v2: car2?.fuel || "N/A",
            },
            {
              label: "Transmission",
              v1: car1?.transmission || "N/A",
              v2: car2?.transmission || "N/A",
            },
            {
              label: "Exterior",
              v1: car1?.exterior || "N/A",
              v2: car2?.exterior || "N/A",
            },
            {
              label: "Status",
              v1: car1?.status || "N/A",
              v2: car2?.status || "N/A",
            },
            {
              label: "VIN",
              v1: car1?.vin || "N/A",
              v2: car2?.vin || "N/A",
            },
          ].map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-3 border-t border-neutral-800"
            >
              <div className="px-3 py-2 text-neutral-400">{row.label}</div>
              <div className="px-3 py-2 text-neutral-100">{row.v1}</div>
              <div className="px-3 py-2 text-neutral-100">{row.v2}</div>
            </div>
          ))}

          {/* DESCRIPCIÓN CORTA */}
          <div className="grid grid-cols-3 border-t border-neutral-800">
            <div className="px-3 py-2 text-neutral-400">Description</div>
            <div className="px-3 py-2 text-neutral-100">
              {car1?.description || "N/A"}
            </div>
            <div className="px-3 py-2 text-neutral-100">
              {car2?.description || "N/A"}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// Cargar inventario para comparar
export const getStaticProps: GetStaticProps<CompareProps> = async () => {
  let cars: Car[] = [];

  try {
    cars = await getInventory();
  } catch (err) {
    console.error("Error leyendo Google Sheet en compare:", err);
  }

  const cleaned = (cars || []).filter(
    (c) => c && (c.id || c.make || c.model || c.year)
  );

  const inventory: Vehicle[] = cleaned.map((c, index) => {
    const photoStrings = Object.entries(c as any)
      .filter(
        ([key, value]) =>
          typeof key === "string" &&
          key.toLowerCase().startsWith("photo") &&
          value != null
      )
      .map(([, value]) => String(value));
    const rawPhotos = photoStrings.join(" ");
    const photos = parsePhotos(rawPhotos);

    const safeId =
      (c.id && String(c.id).trim()) ||
      `${c.year ?? ""}-${c.make ?? ""}-${c.model ?? ""}` ||
      `vehicle-${index}`;

    const titleBase = `${c.year ?? ""} ${c.make ?? ""} ${c.model ?? ""}`.trim();

    return {
      id: safeId,
      title: titleBase || String(c.id ?? `Vehicle ${index + 1}`),
      year:
        c.year !== undefined && c.year !== null ? Number(c.year) : null,
      make: c.make ?? "",
      model: c.model ?? "",
      mileage:
        c.mileage !== undefined && c.mileage !== null
          ? Number(c.mileage)
          : null,
      price:
        c.price !== undefined && c.price !== null
          ? Number(c.price)
          : null,
      transmission: c.transmission ?? "",
      fuel: c.fuel ?? "",
      exterior: c.exterior ?? "",
      vin: c.vin ?? "",
      status: (c as any).status ?? "",
      description: (c as any).description ?? "",
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
