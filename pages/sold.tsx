import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import type { GetStaticProps } from "next";
import { listStoredVehicles } from "../lib/blobInventory";

type SoldVehicle = {
  id: string;
  title: string;
  photo: string;
  mileage: string;
  fuel: string;
  exterior: string;
};
type Props = { vehicles: SoldVehicle[]; loadError: boolean };

export default function Sold({ vehicles, loadError }: Props) {
  const [theme, setTheme] = React.useState<"dark" | "light">("dark");
  const [lang, setLang] = React.useState<"EN" | "ES">("EN");
  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem("hybridrm-inventory-theme");
      if (saved === "dark" || saved === "light") setTheme(saved);
    } catch {}
  }, []);
  const selectTheme = (value: "dark" | "light") => {
    setTheme(value);
    try { window.localStorage.setItem("hybridrm-inventory-theme", value); } catch {}
  };
  const es = lang === "ES";
  return (
    <main data-theme={theme} className="sold-page min-h-screen">
      <Head>
        <title>{es ? "Vehículos vendidos" : "Sold Vehicles"} | Available Hybrid R&amp;M</title>
        <meta name="description" content={es ? "Vehículos vendidos anteriormente por Available Hybrid R&M Inc. en Reseda, California." : "Previously sold vehicles at Available Hybrid R&M Inc. in Reseda, California."} />
      </Head>
      <header className="bg-black text-white">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" aria-label="Available Hybrid R&M home">
            <img src="/logo.%20available%20hybrid%20premium.png" alt="Available Hybrid R&M" className="h-12 w-36 object-contain" />
          </Link>
          <div className="flex gap-1 text-xs">
            {(["EN", "ES"] as const).map(value => (
              <button type="button" key={value} aria-pressed={lang === value} onClick={() => setLang(value)} className={`rounded-full px-3 py-2 ${lang === value ? "bg-white text-black" : "text-white/70"}`}>{value}</button>
            ))}
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <Link href="/" aria-label={es ? "Volver al inicio" : "Back to home"} className="inline-flex h-11 w-11 items-center justify-center hover:opacity-70">
          <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m6-6-6 6 6 6" /></svg>
        </Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="text-3xl font-semibold uppercase tracking-wide sm:text-4xl">{es ? "Vendidos" : "Sold"}</h1>
            <p className="mt-3 text-sm text-[color:var(--sold-muted)]">{es ? "Una selección de vehículos vendidos anteriormente." : "A selection of our previously sold vehicles."}</p>
          </div>
          <div role="group" aria-label={es ? "Apariencia" : "Appearance"} className="flex rounded-full border border-[var(--sold-border)] p-1 text-xs">
            {(["dark", "light"] as const).map(value => (
              <button type="button" key={value} aria-pressed={theme === value} onClick={() => selectTheme(value)} className={`min-h-9 rounded-full px-3 ${theme === value ? "bg-[var(--sold-text)] text-[color:var(--sold-page)]" : "text-[color:var(--sold-muted)]"}`}>
                {value === "dark" ? es ? "Oscuro" : "Dark" : es ? "Claro" : "Light"}
              </button>
            ))}
          </div>
        </div>
        {vehicles.length > 0 ? (
          <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-3">
            {vehicles.map(vehicle => (
              <article key={vehicle.id}>
                <div className="aspect-[16/10] overflow-hidden bg-[var(--sold-surface)]">
                  {vehicle.photo ? <img src={vehicle.photo} alt={vehicle.title} loading="lazy" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-[color:var(--sold-muted)]">{es ? "Foto no disponible" : "Photo unavailable"}</div>}
                </div>
                <div className="pt-4">
                  <h2 className="text-base font-semibold uppercase tracking-wide lg:text-lg">{vehicle.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--sold-muted)]">{[vehicle.mileage ? `${Number(vehicle.mileage).toLocaleString("en-US")} mi` : "", vehicle.fuel, vehicle.exterior].filter(Boolean).join(" · ")}</p>
                  <p className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--sold-muted)]">{es ? "Vendido" : "Sold"}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="py-16 text-center text-sm text-[color:var(--sold-muted)]">
            {loadError ? es ? "No pudimos cargar los vehículos. Intenta de nuevo más tarde." : "We couldn't load the vehicles. Please try again later." : es ? "Aquí aparecerán los vehículos que marquemos como vendidos." : "Vehicles marked as sold will appear here."}
          </p>
        )}
        <div className="mt-12 border-t border-[var(--sold-border)] pt-8 text-center">
          <Link href="/inventory" className="inline-flex min-h-11 items-center justify-center border border-[var(--sold-border)] px-6 py-3 text-sm font-medium transition hover:bg-[var(--sold-surface)]">{es ? "Ver inventario disponible" : "View Available Inventory"}<span aria-hidden="true" className="ml-3">→</span></Link>
        </div>
      </div>
      <style jsx>{`
        .sold-page {--sold-page:#050505;--sold-text:#f5f5f5;--sold-muted:#a3a3a3;--sold-border:#262626;--sold-surface:#171717;background:var(--sold-page);color:var(--sold-text);color-scheme:dark;}
        .sold-page[data-theme="light"] {--sold-page:#ffffff;--sold-text:#171717;--sold-muted:#5c5c5c;--sold-border:#dedede;--sold-surface:#f5f5f5;color-scheme:light;}
        header {color-scheme:dark;}
      `}</style>
    </main>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  try {
    const stored = await listStoredVehicles();
    const vehicles = stored
      .filter(vehicle => vehicle?.id && String(vehicle.status || "").trim().toLowerCase() === "sold")
      .sort((a, b) => Number(b.year || 0) - Number(a.year || 0))
      .map(vehicle => {
        const photo = Object.entries(vehicle)
          .filter(([key, value]) => /^photo\d+$/i.test(key) && typeof value === "string" && /^https?:\/\//.test(value))
          .sort(([a], [b]) => Number(a.slice(5)) - Number(b.slice(5)))[0]?.[1] || "";
        return {
          id: String(vehicle.id),
          title: [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" "),
          photo,
          mileage: Number.isFinite(Number(vehicle.mileage)) && Number(vehicle.mileage) > 0 ? String(vehicle.mileage) : "",
          fuel: vehicle.fuel || "",
          exterior: vehicle.exterior || "",
        };
      });
    return { props: { vehicles, loadError: false }, revalidate: 60 };
  } catch {
    return { props: { vehicles: [], loadError: true }, revalidate: 60 };
  }
};
