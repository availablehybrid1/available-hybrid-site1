// pages/inventory.tsx
import * as React from "react";
import type { GetStaticProps } from "next";
import Link from "next/link";
import { getInventory, type Car } from "../lib/getInventory";

// Convierte fotos de Drive a imágenes visibles
function parsePhotos(raw?: string | null): string[] {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(/[\s;]+/)
    .map((u) => u.trim())
    .filter((u) => u.startsWith("http"))
    .map((u) => {
      if (u.includes("lh3.googleusercontent.com")) return u;
      const match = u.match(/\/d\/([^/]+)/);
      if (match) return `https://lh3.googleusercontent.com/d/${match[1]}=w1600`;
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
  vin: string;
  fuel: string;
  transmission: string;
  exterior: string;
  photos: string[];
  description: string;
};

type InventoryProps = { inventory: Vehicle[] };

export default function Inventory({ inventory }: InventoryProps) {
  const [yearFilter, setYearFilter] = React.useState<string>("ALL");
  const [makeFilter, setMakeFilter] = React.useState<string>("ALL");
  const [sortBy, setSortBy] = React.useState<"priceDesc" | "priceAsc">(
    "priceDesc"
  );

  // rango de precio
  const [priceMin, setPriceMin] = React.useState<number | null>(null);
  const [priceMax, setPriceMax] = React.useState<number | null>(null);

  // idioma EN / ES
  const [lang, setLang] = React.useState<"en" | "es">("en");

  const text = lang === "en"
    ? {
        filtersLabel: "Filters",
        inventoryNav: "Inventory",
        prequalifyNav: "Pre-Qualify",
        vehiclesAvailable: "vehicles available",
        allInventory: "All inventory",
        sort: "Sort",
        sortHighLow: "Price · High to Low",
        sortLowHigh: "Price · Low to High",
        price: "Price",
        adjustInStore: "Adjust in-store",
        year: "Year",
        allYears: "All years",
        make: "Make",
        allMakes: "All makes",
        model: "Model",
        comingSoon: "Coming soon",
        estPayment: "Est. payment",
        paymentDisclaimer:
          "Example based on up to 12 monthly payments. Amount may vary. Only for approved customers.",
        tooltipTitlePrefix: "Monthly payment of",
        getPrequalified: "Get Pre-Qualified",
        noVehicles:
          "No vehicles found with the selected filters. Try another make or year.",
        modalTitle: "Search all inventory",
        modalPlaceholder: "Search by model, year, VIN…",
        modalNoResults: "No results for",
        priceLabel: "Price",
        searchOpenLabel: "Open search",
      }
    : {
        filtersLabel: "Filtros",
        inventoryNav: "Inventario",
        prequalifyNav: "Pre-Calificar",
        vehiclesAvailable: "vehículos disponibles",
        allInventory: "Todo el inventario",
        sort: "Ordenar",
        sortHighLow: "Precio · Mayor a menor",
        sortLowHigh: "Precio · Menor a mayor",
        price: "Precio",
        adjustInStore: "Ajustar en el dealer",
        year: "Año",
        allYears: "Todos los años",
        make: "Marca",
        allMakes: "Todas las marcas",
        model: "Modelo",
        comingSoon: "Próximamente",
        estPayment: "Pago estimado",
        paymentDisclaimer:
          "Ejemplo basado en hasta 12 pagos mensuales. El monto puede variar. Solo para clientes aprobados.",
        tooltipTitlePrefix: "Pago mensual de",
        getPrequalified: "Solicitar pre-calificación",
        noVehicles:
          "No se encontraron vehículos con estos filtros. Prueba otra marca o año.",
        modalTitle: "Buscar en todo el inventario",
        modalPlaceholder: "Busca por modelo, año, VIN…",
        modalNoResults: "Sin resultados para",
        priceLabel: "Precio",
        searchOpenLabel: "Abrir búsqueda",
      };

  // modal de búsqueda con la lupa
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // años únicos
  const years = React.useMemo(() => {
    const set = new Set<number>();
    for (const car of inventory) {
      if (car.year != null) set.add(car.year);
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [inventory]);

  // marcas únicas
  const makes = React.useMemo(() => {
    const set = new Set<string>();
    for (const car of inventory) {
      if (car.make) set.add(car.make);
    }
    return Array.from(set).sort();
  }, [inventory]);

  // stats de precio para placeholder
  const priceStats = React.useMemo(() => {
    const prices = inventory
      .map((c) => c.price)
      .filter((p): p is number => typeof p === "number" && p > 0);
    if (!prices.length) return { min: 0, max: 0 };
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [inventory]);

  // Filtrado + orden para el grid principal
  const visible = React.useMemo(() => {
    let cars = [...inventory];

    if (yearFilter !== "ALL") {
      cars = cars.filter((c) => (c.year ?? "").toString() === yearFilter);
    }

    if (makeFilter !== "ALL") {
      cars = cars.filter(
        (c) => c.make.toLowerCase() === makeFilter.toLowerCase()
      );
    }

    if (priceMin != null) {
      cars = cars.filter((c) => (c.price ?? 0) >= priceMin);
    }
    if (priceMax != null) {
      cars = cars.filter((c) => (c.price ?? 0) <= priceMax);
    }

    cars.sort((a, b) => {
      const pa = a.price ?? 0;
      const pb = b.price ?? 0;
      if (sortBy === "priceDesc") return pb - pa;
      return pa - pb;
    });

    return cars;
  }, [inventory, yearFilter, makeFilter, sortBy, priceMin, priceMax]);

  // Resultados para el modal de búsqueda
  const searchResults = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return inventory.filter((c) => {
      const haystack = [
        c.title,
        c.year?.toString() ?? "",
        c.make,
        c.model,
        c.vin,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [inventory, searchQuery]);

  // Recomendados por defecto (top 10 por precio)
  const recommended = React.useMemo(() => {
    const cars = [...inventory];
    cars.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    return cars.slice(0, 10);
  }, [inventory]);

  const phone = "+1 747-354-4098";
  const whatsappDigits = "17473544098";

  return (
    <main className="min-h-screen bg-[#050505] text-neutral-100 pb-16">
      {/* HEADER */}
      <header className="border-b border-neutral-900 bg-black/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 gap-4">
          <Link href="/" className="flex items-center gap-3">
            {/* Logo grande */}
            <div className="relative h-[120px] w-[360px]">
              <img
                src="/logo. available hybrid premium.png"
                alt="Available Hybrid R&M Inc. logo"
                className="h-full w-full object-contain"
              />
            </div>
          </Link>

          {/* navegación (inventario + pre-qualify) */}
          <nav className="hidden flex-1 items-center justify-center gap-6 text-xs font-medium text-neutral-300 sm:flex">
            <Link
              href="/inventory"
              className="hover:text-white transition-colors"
            >
              {text.inventoryNav}
            </Link>
            <Link
              href="/pre-qualification"
              className="hover:text-white transition-colors"
            >
              {text.prequalifyNav}
            </Link>
          </nav>

          <div className="flex flex-col items-end text-right text-[11px] text-neutral-400 gap-2">
            <span>6726 Reseda Blvd Suite A7 · Reseda, CA 91335</span>
            <div className="flex items-center gap-3">
              {/* WhatsApp solo icono */}
              <a
                href={`https://wa.me/${whatsappDigits}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald-500 bg-emerald-500 text-[14px] font-semibold text-black shadow hover:bg-emerald-400 hover:border-emerald-400"
                aria-label="WhatsApp"
              >
                {/* pseudo-logo simple */}
                🟢
              </a>

              {/* Teléfono solo número */}
              <a
                href={`tel:${phone.replace(/[^+\d]/g, "")}`}
                className="inline-flex items-center justify-center rounded-full border border-neutral-700 bg-neutral-950 px-4 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-neutral-100 hover:border-neutral-300 hover:bg-neutral-800"
              >
                {phone}
              </a>

              {/* Toggle EN / ES */}
              <button
                type="button"
                onClick={() => setLang(lang === "en" ? "es" : "en")}
                className="rounded-full border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-200 hover:border-neutral-300 hover:bg-neutral-800"
              >
                {lang === "en" ? "ES" : "EN"}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* LAYOUT PRINCIPAL: sidebar + contenido */}
      <div className="mx-auto flex max-w-6xl gap-6 px-4 pt-6">
        {/* SIDEBAR IZQUIERDO */}
        <aside className="hidden w-60 flex-shrink-0 flex-col text-sm text-neutral-100 lg:flex">
          {/* Botón header de filtros */}
          <div className="mb-5">
            <button className="w-full rounded-lg bg-neutral-900 px-3 py-2 text-xs font-semibold text-white shadow-sm">
              {text.filtersLabel}
            </button>
          </div>

          {/* Filtros */}
          <div className="space-y-3 text-[13px]">
            {/* Price con rango editable */}
            <div className="rounded-lg border border-neutral-800 bg-[#050505] px-3 py-3">
              <div className="flex items-center justify-between">
                <span>{text.price}</span>
                <span className="text-[11px] text-neutral-500">
                  {text.adjustInStore}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2 text-[11px]">
                <div className="flex-1 rounded-md border border-neutral-800 bg-black/70 px-2 py-1.5">
                  <p className="text-[10px] text-neutral-500">Min</p>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={priceMin ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (!v) return setPriceMin(null);
                      const n = Number(v);
                      if (!Number.isNaN(n)) setPriceMin(n);
                    }}
                    placeholder={
                      priceStats.min
                        ? priceStats.min.toString()
                        : "0"
                    }
                    className="w-full bg-transparent text-neutral-100 outline-none text-[11px]"
                  />
                </div>
                <div className="flex-1 rounded-md border border-neutral-800 bg-black/70 px-2 py-1.5 text-right">
                  <p className="text-[10px] text-neutral-500">Max</p>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={priceMax ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (!v) return setPriceMax(null);
                      const n = Number(v);
                      if (!Number.isNaN(n)) setPriceMax(n);
                    }}
                    placeholder={
                      priceStats.max
                        ? priceStats.max.toString()
                        : "30000"
                    }
                    className="w-full bg-transparent text-neutral-100 outline-none text-[11px] text-right"
                  />
                </div>
              </div>
            </div>

            {/* Year */}
            <div className="rounded-lg border border-neutral-800 bg-[#050505] px-3 py-3">
              <div className="flex items-center justify-between">
                <span>{text.year}</span>
                <span className="text-xs text-neutral-500">
                  {yearFilter === "ALL" ? text.allYears : yearFilter}
                </span>
              </div>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="mt-2 w-full rounded-md border border-neutral-800 bg-black/70 px-2 py-1.5 text-[11px] text-neutral-100 outline-none focus:border-neutral-400"
              >
                <option value="ALL">{text.allYears}</option>
                {years.map((y) => (
                  <option key={y} value={y.toString()}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Make */}
            <div className="rounded-lg border border-neutral-800 bg-[#050505] px-3 py-3">
              <div className="flex items-center justify-between">
                <span>{text.make}</span>
                <span className="text-xs text-neutral-500">
                  {makeFilter === "ALL" ? text.allMakes : makeFilter}
                </span>
              </div>
              <select
                value={makeFilter}
                onChange={(e) => setMakeFilter(e.target.value)}
                className="mt-2 w-full rounded-md border border-neutral-800 bg-black/70 px-2 py-1.5 text-[11px] text-neutral-100 outline-none focus:border-neutral-400"
              >
                <option value="ALL">{text.allMakes}</option>
                {makes.map((mk) => (
                  <option key={mk} value={mk}>
                    {mk}
                  </option>
                ))}
              </select>
            </div>

            {/* Model solo informativo */}
            <div className="rounded-lg border border-neutral-800 bg-[#050505] px-3 py-2">
              <div className="flex items-center justify-between">
                <span>{text.model}</span>
                <span className="text-xs text-neutral-600">
                  {text.comingSoon}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <section className="flex-1">
          {/* contador de vehículos */}
          <p className="text-xs text-neutral-400">
            {visible.length} {text.vehiclesAvailable}
          </p>

          {/* Chips de marcas */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMakeFilter("ALL")}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
                makeFilter === "ALL"
                  ? "bg-neutral-100 text-black"
                  : "bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
              }`}
            >
              {text.allInventory}
            </button>
            {makes.map((mk) => (
              <button
                key={mk}
                type="button"
                onClick={() => setMakeFilter(mk)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium ${
                  makeFilter.toLowerCase() === mk.toLowerCase()
                    ? "bg-neutral-100 text-black"
                    : "bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
                }`}
              >
                {mk}
              </button>
            ))}
          </div>

          {/* fila derecha: lupa + sort */}
          <div className="mt-5 flex items-center justify-end gap-3">
            {/* Lupa sola que abre el modal */}
            <button
              type="button"
              onClick={() => {
                setIsSearchOpen(true);
                setSearchQuery("");
              }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-800 bg-neutral-950 text-sm text-neutral-300 hover:border-neutral-400 hover:bg-neutral-900"
              aria-label={text.searchOpenLabel}
            >
              🔍
            </button>

            {/* sort */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-neutral-500">{text.sort}</span>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "priceDesc" | "priceAsc")
                }
                className="rounded-full border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-[11px] text-neutral-100 outline-none hover:border-neutral-500"
              >
                <option value="priceDesc">{text.sortHighLow}</option>
                <option value="priceAsc">{text.sortLowHigh}</option>
              </select>
            </div>
          </div>

          {/* GRID DE VEHÍCULOS */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visible.length === 0 ? (
              <p className="text-sm text-neutral-400">{text.noVehicles}</p>
            ) : (
              visible.map((car) => {
                const mainPhoto = car.photos[0] ?? "/placeholder-car.jpg";
                const priceLabel =
                  car.price != null
                    ? `$${car.price.toLocaleString()}`
                    : lang === "en"
                    ? "Call for price"
                    : "Llama para precio";

                // pago estimado basado en 12 meses
                const monthly =
                  car.price != null
                    ? Math.round(car.price / 12)
                    : null;

                return (
                  <Link
                    key={car.id}
                    href={`/${encodeURIComponent(car.id)}`}
                    className="group flex flex-col overflow-hidden rounded-xl border border-neutral-900 bg-neutral-900/70 shadow-[0_10px_30px_rgba(0,0,0,0.65)] transition hover:-translate-y-0.5 hover:border-neutral-500 hover:bg-neutral-900"
                  >
                    {/* Imagen principal + badges */}
                    <div className="relative h-52 w-full overflow-hidden bg-neutral-950">
                      <img
                        src={mainPhoto}
                        alt={car.title}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                      />
                      <div className="absolute left-3 top-3 flex gap-2 text-[10px] uppercase tracking-[0.16em]">
                        <span className="inline-flex items-center gap-1 rounded-full bg-black/80 px-2 py-0.5 text-neutral-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          Available Hybrid
                        </span>
                        {car.year && (
                          <span className="rounded-full bg-black/80 px-2 py-0.5 text-neutral-300">
                            {car.year}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Info principal */}
                    <div className="flex flex-1 flex-col px-4 pb-3 pt-3 text-xs">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-400">
                        {car.make || "Hybrid"}
                      </p>
                      <h3 className="mt-1 text-sm font-semibold text-neutral-50">
                        {car.model || car.title}
                      </h3>

                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-neutral-400">
                        {car.mileage != null && (
                          <span>{car.mileage.toLocaleString()} mi</span>
                        )}
                        {car.fuel && <span>· {car.fuel}</span>}
                        {car.transmission && <span>· {car.transmission}</span>}
                        {car.exterior && <span>· {car.exterior}</span>}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
                        {car.vin && (
                          <span className="rounded-full border border-neutral-800 bg-neutral-950 px-2 py-0.5 font-mono uppercase text-neutral-400">
                            VIN {car.vin.slice(0, 8)}…
                          </span>
                        )}
                        {car.fuel && (
                          <span className="rounded-full border border-neutral-800 bg-neutral-950 px-2 py-0.5 text-neutral-300">
                            Hybrid
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Barra inferior precio + cuadro negro de pago mensual + ? */}
                    <div className="mt-auto bg-black/80 px-4 py-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] text-neutral-500">
                            {text.priceLabel}
                          </p>
                          <p className="font-semibold text-neutral-50">
                            {priceLabel}
                          </p>
                        </div>

                        {monthly && (
                          <div className="flex items-center gap-2">
                            {/* Cuadro negro con pago mensual en verde */}
                            <div className="rounded-md bg-neutral-900 px-3 py-1.5 text-right">
                              <p className="text-[10px] text-neutral-400">
                                {text.estPayment}
                              </p>
                              <p className="text-[13px] font-semibold text-emerald-400">
                                ${monthly.toLocaleString()}/mo
                              </p>
                            </div>

                            {/* Icono ? con tooltip */}
                            <div className="relative group/payment">
                              <button
                                type="button"
                                onClick={(e) => e.preventDefault()}
                                className="flex h-6 w-6 items-center justify-center rounded-full border border-neutral-500 bg-neutral-900 text-xs font-bold text-neutral-100 hover:border-neutral-300"
                              >
                                ?
                              </button>
                              <div className="pointer-events-none absolute right-0 top-full z-20 mt-2 w-64 rounded-md border border-neutral-700 bg-black px-3 py-2 text-[11px] opacity-0 shadow-xl transition-opacity group-hover/payment:opacity-100 group-hover/payment:pointer-events-auto">
                                <p className="text-xs font-semibold text-neutral-100">
                                  {text.tooltipTitlePrefix} $
                                  {monthly.toLocaleString()}
                                </p>
                                <p className="mt-1 text-[11px] text-neutral-300">
                                  {text.paymentDisclaimer}
                                </p>
                                <Link
                                  href="/pre-qualification"
                                  onClick={(e) => e.stopPropagation()}
                                  className="mt-2 inline-flex w-full items-center justify-center rounded-sm bg-neutral-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-black hover:bg-neutral-200"
                                >
                                  {text.getPrequalified}
                                </Link>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* MODAL DE BÚSQUEDA (lupa) */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justifycenter bg-black/70 px-4 pt-16">
          <div className="w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-950/95 shadow-xl">
            {/* header modal */}
            <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
              <p className="text-xs font-medium text-neutral-200">
                {text.modalTitle}
              </p>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="text-sm text-neutral-400 hover:text-neutral-100"
              >
                ✕
              </button>
            </div>

            {/* input búsqueda */}
            <div className="px-4 py-3">
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-neutral-500">
                  🔍
                </span>
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={text.modalPlaceholder}
                  className="w-full rounded-full border border-neutral-800 bg-neutral-950 px-3 py-2 pl-7 text-sm text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-neutral-300"
                />
              </div>
            </div>

            {/* resultados */}
            <div className="max-h-[60vh] overflow-y-auto px-2 pb-3">
              {searchQuery.trim() && searchResults.length === 0 && (
                <p className="px-2 py-2 text-xs text-neutral-500">
                  {text.modalNoResults} “{searchQuery.trim()}”.
                </p>
              )}

              {(searchQuery.trim() ? searchResults : recommended).map((car) => {
                const thumb = car.photos[0] ?? "/placeholder-car.jpg";
                const price =
                  car.price != null
                    ? `$${car.price.toLocaleString()}`
                    : lang === "en"
                    ? "Call for price"
                    : "Llama para precio";

                return (
                  <Link
                    key={car.id}
                    href={`/${encodeURIComponent(car.id)}`}
                    onClick={() => setIsSearchOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-2 py-2 text-xs text-neutral-100 hover:bg-neutral-900"
                  >
                    <div className="h-14 w-20 overflow-hidden rounded bg-neutral-900">
                      <img
                        src={thumb}
                        alt={car.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] text-neutral-400">
                        {car.year} {car.make}
                      </p>
                      <p className="text-sm font-semibold">
                        {car.model || car.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-neutral-500">
                        {car.vin ? `VIN ${car.vin}` : ""}
                      </p>
                    </div>
                    <p className="whitespace-nowrap text-sm font-semibold text-emerald-400">
                      {price}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export const getStaticProps: GetStaticProps<InventoryProps> = async () => {
  const data = await getInventory();

  const inventory: Vehicle[] = data.map((c) => {
    const photoStrings = Object.entries(c as any)
      .filter(([k, v]) => k.toLowerCase().startsWith("photo") && v)
      .map(([, v]) => String(v));

    return {
      id: String(c.id),
      title: `${c.year ?? ""} ${c.make ?? ""} ${c.model ?? ""}`.trim(),
      year: c.year ? Number(c.year) : null,
      make: c.make ?? "",
      model: c.model ?? "",
      mileage: c.mileage ? Number(c.mileage) : null,
      price: c.price ? Number(c.price) : null,
      vin: c.vin ?? "",
      fuel: c.fuel ?? "",
      transmission: c.transmission ?? "",
      exterior: c.exterior ?? "",
      photos: parsePhotos(photoStrings.join(" ")),
      description: (c as any).description ?? "",
    };
  });

  return { props: { inventory }, revalidate: 60 };
};
