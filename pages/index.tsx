// pages/index.tsx
import * as React from "react";
import type { GetStaticProps } from "next";
import Link from "next/link";
import { getInventory, type Car } from "../lib/getInventory";

// 🖼 Convierte links de Drive (separados por ; o espacios) en links válidos de imagen
function parsePhotos(raw?: string | null): string[] {
  if (!raw || typeof raw !== "string") return [];

  return raw
    .split(/[\s;]+/) // separa por ; y espacios
    .map((u) => u.trim())
    .filter((u) => u.length > 0 && u.startsWith("http"))
    .map((u) => {
      // si ya es link directo de lh3, se deja igual
      if (u.includes("lh3.googleusercontent.com")) return u;

      // si es link de Google Drive, lo convertimos
      if (u.includes("drive.google.com")) {
        // formato: https://drive.google.com/file/d/ID/view?...
        const byD = u.match(/\/d\/([^/]+)/);
        const id = byD?.[1];
        if (id) {
          // link directo que sirve en <img>
          return `https://lh3.googleusercontent.com/d/${id}=w1600`;
        }
      }

      // cualquier otro link se deja igual
      return u;
    });
}

// Tipo de vehículo que usamos en la UI
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

type HomeProps = {
  inventory: Vehicle[];
};

export default function Home({ inventory }: HomeProps) {
  // ---------- ESTIMADOR BHPH ----------
  const [selectedId, setSelectedId] = React.useState(
    inventory[0]?.id ?? ""
  );
  const [creditTier, setCreditTier] = React.useState<
    "low" | "midLow" | "midHigh" | "high"
  >("low");
  const [downPayment, setDownPayment] = React.useState(2000);
  const [termMonths, setTermMonths] = React.useState(24);

  const selectedCar = inventory.find((c) => c.id === selectedId) ?? inventory[0];

  // APR según score
  const apr =
    creditTier === "low"
      ? 22
      : creditTier === "midLow"
      ? 17.99
      : creditTier === "midHigh"
      ? 12.99
      : 6.99;

  const price = selectedCar?.price ?? 0;
  const cleanDown = isNaN(downPayment) ? 0 : Math.max(downPayment, 0);
  const financed = Math.max(price - cleanDown, 0);
  const months = Math.max(termMonths, 1);

  let monthlyPayment = 0;
  if (financed > 0) {
    const monthlyRate = apr / 100 / 12;
    if (monthlyRate > 0) {
      monthlyPayment =
        (financed * monthlyRate) /
        (1 - Math.pow(1 + monthlyRate, -months));
    } else {
      monthlyPayment = financed / months;
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* HEADER */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <div>
          {/* 🔙 LOGO / TEXTO AZUL CLICABLE QUE REGRESA AL HOME */}
          <Link href="/" className="group inline-block">
            <p className="text-[10px] tracking-[0.25em] text-red-500 group-hover:text-red-400">
              AVAILABLE HYBRID
            </p>
            <h1 className="text-xl font-semibold group-hover:underline">
              R&amp;M Inc.
            </h1>
          </Link>
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
        {/* ---------- PORTADA / HERO SIMPLE ---------- */}
        <div className="mb-6 rounded-lg border border-neutral-800 bg-gradient-to-r from-neutral-900/90 to-neutral-900/40 p-5">
          <h2 className="text-lg font-semibold">
            Buy Here Pay Here · Easy financing for hybrid vehicles
          </h2>
          <p className="mt-2 text-sm text-neutral-300">
            Escoge tu vehículo, calcula un pago estimado según tu crédito y
            contáctanos para una aprobación rápida. Todos los cálculos son
            aproximados y sujetos a aprobación final.
          </p>
        </div>

        {/* ---------- ESTIMADOR BHPH ---------- */}
        {inventory.length > 0 && (
          <div className="mb-8 grid gap-4 rounded-lg border border-neutral-800 bg-neutral-900/70 p-4 text-xs sm:grid-cols-[1.4fr,1fr] sm:p-5">
            <div className="space-y-3">
              <p className="text-[11px] font-semibold text-neutral-200">
                BHPH Payment Estimator
              </p>

              {/* Selección de vehículo */}
              <div className="space-y-1">
                <label className="block text-[11px] text-neutral-400">
                  Select vehicle
                </label>
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-emerald-500"
                >
                  {inventory.map((car) => (
                    <option key={car.id} value={car.id}>
                      {car.year} {car.make} {car.model}{" "}
                      {car.price != null ? `- $${car.price.toLocaleString()}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Crédito */}
              <div className="space-y-1">
                <label className="block text-[11px] text-neutral-400">
                  Approx. credit score
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="creditTier"
                      value="low"
                      checked={creditTier === "low"}
                      onChange={() => setCreditTier("low")}
                    />
                    <span className="text-[11px]">
                      &lt; 600 or no credit · 22% APR
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="creditTier"
                      value="midLow"
                      checked={creditTier === "midLow"}
                      onChange={() => setCreditTier("midLow")}
                    />
                    <span className="text-[11px]">
                      600–649 · 17.99% APR
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="creditTier"
                      value="midHigh"
                      checked={creditTier === "midHigh"}
                      onChange={() => setCreditTier("midHigh")}
                    />
                    <span className="text-[11px]">
                      650–699 · 12.99% APR
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="creditTier"
                      value="high"
                      checked={creditTier === "high"}
                      onChange={() => setCreditTier("high")}
                    />
                    <span className="text-[11px]">
                      700+ · 6.99% APR
                    </span>
                  </label>
                </div>
              </div>

              {/* Down + plazo */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-[11px] text-neutral-400">
                    Down payment (USD)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={downPayment}
                    onChange={(e) =>
                      setDownPayment(parseFloat(e.target.value) || 0)
                    }
                    className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] text-neutral-400">
                    Term (months)
                  </label>
                  <input
                    type="number"
                    min={6}
                    value={termMonths}
                    onChange={(e) =>
                      setTermMonths(parseInt(e.target.value || "0", 10) || 1)
                    }
                    className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Resultado */}
            <div className="space-y-2 rounded-lg border border-neutral-800 bg-neutral-950/70 p-3">
              <p className="text-[11px] font-semibold text-neutral-200">
                Estimated terms
              </p>

              <dl className="space-y-1 text-[11px] text-neutral-300">
                <div className="flex justify-between">
                  <dt className="text-neutral-400">Vehicle price</dt>
                  <dd>
                    {price > 0
                      ? `$${price.toLocaleString()}`
                      : "Ask dealer"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-400">Down payment</dt>
                  <dd>${cleanDown.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-400">Amount financed</dt>
                  <dd>${financed.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-400">APR (estimated)</dt>
                  <dd>{apr.toFixed(2)}%</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-400">Term</dt>
                  <dd>{months} months</dd>
                </div>
                <div className="mt-2 flex justify-between text-[12px] font-semibold">
                  <dt>Estimated monthly payment</dt>
                  <dd>
                    {monthlyPayment > 0
                      ? `$${monthlyPayment.toFixed(2)}`
                      : "$0.00"}
                  </dd>
                </div>
              </dl>

              <p className="mt-2 text-[10px] text-neutral-500">
                * This is only an estimate and does not constitute a final
                offer. Payments and interest may change after full credit
                review and approval.
              </p>

              <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                <a
                  href="https://wa.me/14352564487"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded bg-emerald-500 px-3 py-1 font-medium text-neutral-900 hover:bg-emerald-400"
                >
                  Pre-qualify by WhatsApp
                </a>
                <a
                  href="tel:+17473544098"
                  className="rounded bg-neutral-800 px-3 py-1 font-medium text-neutral-100 hover:bg-neutral-700"
                >
                  Call dealer
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ---------- INVENTARIO ---------- */}
        <h2 className="mb-4 text-lg font-semibold">Available Inventory</h2>

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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            {inventory.map((car) => {
              const mainPhoto = car.photos[0] ?? "";

              return (
                <article
                  key={car.id}
                  className="flex flex-col overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900/70"
                >
                  {/* IMAGEN */}
                  <div className="relative h-40 w-full bg-neutral-800">
                    {mainPhoto ? (
                      <img
                        src={mainPhoto}
                        alt={car.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-neutral-500">
                        Foto próximamente
                      </div>
                    )}
                  </div>

                  {/* CONTENIDO CARD */}
                  <div className="flex flex-1 flex-col p-4 text-xs">
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-sm font-semibold">{car.title}</h3>
                      {car.price != null && (
                        <p className="text-sm font-semibold text-green-400">
                          ${car.price.toLocaleString()}
                        </p>
                      )}
                    </div>

                    <p className="mt-1 text-[11px] text-neutral-400">
                      {car.mileage != null
                        ? `${car.mileage.toLocaleString()} mi`
                        : "Mileage n/a"}{" "}
                      · {car.fuel || "Fuel n/a"} ·{" "}
                      {car.transmission || "Transmission n/a"} ·{" "}
                      {car.exterior || "Color n/a"}
                    </p>

                    {car.status && (
                      <span className="mt-2 inline-flex w-fit items-center rounded-full bg-emerald-600/15 px-2 py-[2px] text-[10px] font-medium text-emerald-400">
                        {car.status}
                      </span>
                    )}

                    {car.description && (
                      <p className="mt-2 line-clamp-2 text-[11px] text-neutral-300">
                        {car.description}
                      </p>
                    )}

                    {car.vin && (
                      <p className="mt-2 text-[10px] uppercase tracking-wide text-neutral-500">
                        VIN: {car.vin}
                      </p>
                    )}

                    {/* BOTONES */}
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                      <Link
                        href={`/pre-qualification?id=${encodeURIComponent(
                          car.id
                        )}`}
                        className="rounded border border-neutral-700 px-3 py-1 font-medium text-neutral-100 hover:border-emerald-500 hover:text-emerald-400"
                      >
                        Pre-Qualify
                      </Link>

                      <Link
                        href={`/${encodeURIComponent(car.id)}`}
                        className="rounded bg-red-600 px-3 py-1 font-medium text-white hover:bg-red-500"
                      >
                        Details
                      </Link>
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

// ✅ getStaticProps: lee la hoja, saca fotos y limpia descripción
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
    // Tomamos columnas que empiecen por "photo"
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

    // Descripción SIN links
    const rawDescription = (c as any).description ?? "";
    let description =
      typeof rawDescription === "string"
        ? rawDescription
        : String(rawDescription ?? "");

    description = description
      .replace(/https?:\/\/\S+/g, "") // quita cualquier URL
      .replace(/usp=drive_link/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim();

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
      description,
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
