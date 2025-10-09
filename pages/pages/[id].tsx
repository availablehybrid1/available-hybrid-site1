// pages/[id].tsx — Detalle de vehículo (Next.js pages router)
import * as React from "react";
import Head from "next/head";
import type { GetStaticPaths, GetStaticProps } from "next";
import * as invMod from "../data/inventory";

// Tipos (alineados con index.tsx)
type Vehicle = {
  id: string;
  title?: string;
  year?: number;
  make?: string;
  model?: string;
  mileage?: number;
  price?: number;
  photos?: string[];
  tags?: string[];
  status?: "just_arrived" | "pending_detail";
};

const formatPrice = (p?: number) => (p || p === 0 ? `$${p.toLocaleString()}` : "Consultar");

// --- Genera rutas estáticas para cada id del inventario ---
export const getStaticPaths: GetStaticPaths = async () => {
  const anyInv: any = invMod as any;
  const inventory: Vehicle[] =
    (anyInv.inventory ?? anyInv.vehicles ?? anyInv.rawInventory ?? anyInv.default ?? []) as Vehicle[];
  const paths = inventory.map((v) => ({ params: { id: v.id } }));
  return { paths, fallback: "blocking" };
};

// --- Pasa el vehículo como prop según el id ---
export const getStaticProps: GetStaticProps = async (ctx) => {
  const { id } = ctx.params as { id: string };
  const anyInv: any = invMod as any;
  const inventory: Vehicle[] =
    (anyInv.inventory ?? anyInv.vehicles ?? anyInv.rawInventory ?? anyInv.default ?? []) as Vehicle[];
  const vehicle = inventory.find((v) => v.id === id) || null;

  if (!vehicle) return { notFound: true };

  return { props: { vehicle }, revalidate: 60 };
};

// --- Página de detalle ---
export default function VehiclePage({ vehicle }: { vehicle: Vehicle }) {
  const photos = vehicle.photos && vehicle.photos.length ? vehicle.photos : ["/placeholder-car.jpg"];
  const mainPhoto = photos[0];

  const title =
    vehicle.title || `${vehicle.year ?? ""} ${vehicle.make ?? ""} ${vehicle.model ?? ""}`.trim() || "Vehicle";

  const waText = `Hola, me interesa el ${vehicle.year ?? ""} ${vehicle.make ?? ""} ${vehicle.model ?? ""} (${vehicle.id}). ¿Sigue disponible?`;
  const waHref = `https://wa.me/18184223567?text=${encodeURIComponent(waText)}`;

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <Head>
        <title>{title} | Available Hybrid</title>
        <meta name="description" content={`Detalle del vehículo ${title}`} />
      </Head>

      {/* HERO */}
      <div className="relative isolate">
        <div className="absolute inset-0 -z-10">
          <img
            src={mainPhoto}
            alt={title}
            className="h-[56vh] w-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-neutral-950" />
        </div>

        <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <a href="/" className="rounded-xl bg-white/10 px-3 py-2 text-sm hover:bg-white/15">← Back</a>
          <a
            href="tel:+18184223567"
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-500"
          >
            Call (818) 422-3567
          </a>
        </header>

        <div className="mx-auto max-w-7xl px-4 pb-8 pt-20">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="mt-2 text-white/70">
            {vehicle.mileage ? `${vehicle.mileage.toLocaleString()} miles` : "Mileage —"}
          </p>
        </div>
      </div>

      {/* BODY */}
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-3">
        {/* Galería sencilla */}
        <div className="md:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <img src={mainPhoto} alt="Main photo" className="w-full object-cover" />
          </div>

          {photos.length > 1 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {photos.slice(1, 7).map((p, i) => (
                <img key={i} src={p} className="h-24 w-full rounded-lg object-cover ring-1 ring-white/10" />
              ))}
            </div>
          )}
        </div>

        {/* Panel lateral */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-3xl font-bold">{formatPrice(vehicle.price)}</div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-white/80">
              <div className="rounded-lg bg-black/30 p-3 ring-1 ring-white/10">
                <div className="text-white/50 text-xs">Year</div>
                <div>{vehicle.year ?? "—"}</div>
              </div>
              <div className="rounded-lg bg-black/30 p-3 ring-1 ring-white/10">
                <div className="text-white/50 text-xs">Make</div>
                <div>{vehicle.make ?? "—"}</div>
              </div>
              <div className="rounded-lg bg-black/30 p-3 ring-1 ring-white/10">
                <div className="text-white/50 text-xs">Model</div>
                <div>{vehicle.model ?? "—"}</div>
              </div>
              <div className="rounded-lg bg-black/30 p-3 ring-1 ring-white/10">
                <div className="text-white/50 text-xs">Mileage</div>
                <div>{vehicle.mileage ? `${vehicle.mileage.toLocaleString()} mi` : "—"}</div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <a
                href={waHref}
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

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/80">
            <h3 className="mb-2 text-white">About this vehicle</h3>
            <p>Clean title. Financing available. Trade-ins welcome. Contact us for more details.</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
