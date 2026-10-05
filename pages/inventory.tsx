// pages/inventory.tsx
import * as React from "react";
import type { GetStaticProps } from "next";
import Link from "next/link";
import Image from "next/image";
import { getInventory, type Car } from "../lib/getInventory";
import SellYourCarModal from "../components/SellYourCarModal";
import { architectsDaughter } from "../lib/fonts";

// Convierte fotos de Drive a imágenes visibles
function parsePhotos(raw?: string | null): string[] {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(/[\s,;]+/)
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
  cardHoverPhoto: string;
  studioCover: string;
};


function vehicleOnlyDescription(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ").replace(/&amp;/gi, "&").replace(/&nbsp;/gi, " ")
    .replace(/(?:available at|offered by|for sale at|disponible en|a la venta en)\s+Available\s+Hybrid\s+R\s*&?\s*M(?:\s+Inc\.?)?[.!]?/gi, "")
    .split(/\r?\n|(?<=[.!?])\s+/)
    .filter(part => !/available\s+hybrid|hybridrm\.com|\b(?:visit us|contact us|call us|financing available|our dealership)\b|(?:ll[aá]manos|vis[ií]tanos)/i.test(part))
    .map(part => part.trim()).filter(Boolean).join("\n").replace(/[ \t]+/g, " ").trim();
}

function inventoryExcerpt(car: Vehicle): string {
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-záéíóúñ0-9]+/g, "");
  const escape = (value: string) => value.replace(/[.*+?^$()|[\]\{}]/g, "\\$&");
  const titles = [
    car.title,
    [car.year, car.make, car.model].filter(Boolean).join(" "),
    [car.make, car.model, car.year].filter(Boolean).join(" "),
  ].filter(Boolean);
  const titlePrefix = new RegExp("^(?:" + titles.map(escape).join("|") + ")(?=\\s|[.,:;–—-]|$)[\\s.,:;–—-]*", "i");
  const specs = new Set([
    ...titles, car.make, car.model, String(car.year ?? ""), car.vin,
    car.fuel, car.transmission, car.exterior, "Automatic", "Automática",
    "Automatic transmission", "Transmisión automática",
    "CVT", "Continuously Variable Transmission (CVT)",
  ].map(normalize).filter(Boolean));

  const parts = vehicleOnlyDescription(car.description || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&")
    .split(/\r?\n|(?<=[.!?])\s+|[|;]|\s+[•·]\s+/)
    .map(part => part.trim().replace(/^[•✓✔✅*\s-]+/, "").replace(titlePrefix, "").trim())
    .filter(part => {
      if (!part || specs.has(normalize(part))) return false;
      if (/^(?:vin|mileage|miles|millaje|millas|price|precio|year|año|make|marca|model|modelo|transmission|transmisión|fuel|combustible|exterior|color)\s*[:=]/i.test(part)) return false;
      if (/^(?:\d[\d,.\s]*\s*(?:mi|miles|millas)|\$\s*[\d,.]+)[.!]?$/.test(part)) return false;
      return true;
    });
  const excerpt = parts.join(" ").replace(/\s+/g, " ").trim();
  if (excerpt.length <= 180) return excerpt;
  const shortened = excerpt.slice(0, 177);
  const wordEnd = shortened.lastIndexOf(" ");
  return shortened.slice(0, wordEnd > 120 ? wordEnd : 177).replace(/[,:;\s]+$/, "") + "…";
}

type InventoryProps = { inventory: Vehicle[] };

export default function Inventory({ inventory }: InventoryProps) {
  const [theme, setTheme] = React.useState<"dark" | "light">("dark");

  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem("hybridrm-inventory-theme");
      if (saved === "dark" || saved === "light") setTheme(saved);
    } catch {
      // The selector also works when browser storage is unavailable.
    }
  }, []);

  function selectTheme(next: "dark" | "light") {
    setTheme(next);
    try {
      window.localStorage.setItem("hybridrm-inventory-theme", next);
    } catch {
      // Keep the selection for this visit.
    }
  }

  const [yearFilter, setYearFilter] = React.useState<string>("ALL");
  const [makeFilter, setMakeFilter] = React.useState<string>("ALL");

  // opciones de orden
  const [sortBy, setSortBy] = React.useState<
    | "priceDesc"
    | "priceAsc"
    | "yearDesc"
    | "yearAsc"
    | "mileageDesc"
    | "mileageAsc"
    | "photosDesc"
    | "photosAsc"
    | "makeAsc"
    | "makeDesc"
  >("priceDesc");

  // rango de precio
  const [priceMin, setPriceMin] = React.useState<number | null>(null);
  const [priceMax, setPriceMax] = React.useState<number | null>(null);

  // idioma EN / ES
  const [lang, setLang] = React.useState<"en" | "es">("en");
  const [sellOpen, setSellOpen] = React.useState(false);

  const text =
    lang === "en"
      ? {
          filtersLabel: "Filters",
          inventoryNav: "Inventory",
          prequalifyNav: "Pre-Qualify",
          vehiclesAvailable: "vehicles available",
          allInventory: "All inventory",
          sort: "Sort",
          sortHighestPrice: "Highest Price",
          sortLowestPrice: "Lowest Price",
          sortNewestYear: "Newest Year",
          sortOldestYear: "Oldest Year",
          sortHighestMileage: "Highest Mileage",
          sortLowestMileage: "Lowest Mileage",
          sortMostImages: "Most Images",
          sortLeastImages: "Least Images",
          sortMakeAZ: "Make A–Z",
          sortMakeZA: "Make Z–A",
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
          filtersModalTitle: "Adjust filters",
          applyFilters: "Close",
          minLabel: "Min",
          maxLabel: "Max",
        }
      : {
          filtersLabel: "Filtros",
          inventoryNav: "Inventario",
          prequalifyNav: "Pre-Calificar",
          vehiclesAvailable: "vehículos disponibles",
          allInventory: "Todo el inventario",
          sort: "Ordenar",
          sortHighestPrice: "Precio más alto",
          sortLowestPrice: "Precio más bajo",
          sortNewestYear: "Año más nuevo",
          sortOldestYear: "Año más antiguo",
          sortHighestMileage: "Mayor kilometraje",
          sortLowestMileage: "Menor kilometraje",
          sortMostImages: "Más fotos",
          sortLeastImages: "Menos fotos",
          sortMakeAZ: "Marca A–Z",
          sortMakeZA: "Marca Z–A",
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
          filtersModalTitle: "Ajustar filtros",
          applyFilters: "Cerrar",
          minLabel: "Mín",
          maxLabel: "Máx",
        };

  // modal de búsqueda con la lupa
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // modal de filtros para móvil
  const [isFiltersOpen, setIsFiltersOpen] = React.useState(false);
  const [isSortOpen, setIsSortOpen] = React.useState(false);

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

    // helper para valores numéricos
    const num = (n: number | null | undefined) => (typeof n === "number" ? n : 0);

    cars.sort((a, b) => {
      switch (sortBy) {
        case "priceDesc":
          return num(b.price) - num(a.price);
        case "priceAsc":
          return num(a.price) - num(b.price);
        case "yearDesc":
          return num(b.year) - num(a.year);
        case "yearAsc":
          return num(a.year) - num(b.year);
        case "mileageDesc":
          return num(b.mileage) - num(a.mileage);
        case "mileageAsc":
          return num(a.mileage) - num(b.mileage);
        case "photosDesc":
          return (b.photos?.length ?? 0) - (a.photos?.length ?? 0);
        case "photosAsc":
          return (a.photos?.length ?? 0) - (b.photos?.length ?? 0);
        case "makeAsc":
          return (a.make || "").localeCompare(b.make || "");
        case "makeDesc":
          return (b.make || "").localeCompare(a.make || "");
        default:
          return num(b.price) - num(a.price);
      }
    });

    return cars;
  }, [
    inventory,
    yearFilter,
    makeFilter,
    sortBy,
    priceMin,
    priceMax,
  ]);

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
  const fullDetails = lang === "en" ? "Full Details" : "Ver detalles";
  function transmissionLabel(value: string) {
    return /\bcvt\b|continu(?:ous|ously)\s+variable|\bautomatic\b|autom[aá]tic[ao]/i.test(value)
      ? (lang === "en" ? "Automatic" : "Automática")
      : value;
  }

  return (
    <main data-theme={theme} className="min-h-screen bg-[var(--inv-page)] text-[color:var(--inv-text)] pb-16">
      {/* HEADER */}
      <header className="border-b border-neutral-900 bg-black/95">
        <div className="mx-auto max-w-7xl px-4">
          {/* Desktop: contact icons left, centered logo, sell CTA right */}
          <div className="hidden min-h-[150px] grid-cols-[1fr_auto_1fr] items-center gap-4 sm:grid">
            <div className="flex items-center justify-start gap-3">
              <a
                href={`https://wa.me/${whatsappDigits}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-transparent"
                aria-label="WhatsApp"
              >
                <img
                  src="/whatsapp-green.png"
                  alt="WhatsApp"
                  className="h-full w-full object-contain"
                />
              </a>

              <a
                href={`tel:${phone.replace(/[^+\\d]/g, "")}`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/[0.03] text-white/80 transition-all duration-300 hover:border-white hover:bg-white/[0.08] hover:text-white"
                aria-label="Call"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.9.32 1.77.6 2.6a2 2 0 0 1-.45 2.11L8 9.91a16 16 0 0 0 6.09 6.09l1.48-1.21a2 2 0 0 1 2.11-.45c.83.28 1.7.48 2.6.6A2 2 0 0 1 22 16.92z"
                  />
                </svg>
              </a>

              <a
                href="https://www.instagram.com/availablehybridrm/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/[0.03] text-white/80 transition-all duration-300 hover:border-white hover:bg-white/[0.08] hover:text-white"
                aria-label="Instagram"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-4 w-4"
                >
                  <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
                  <path d="M16 11.37a4 4 0 1 1-7.75 1.26 4 4 0 0 1 7.75-1.26z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
            </div>

            <Link href="/" className="flex items-center justify-center" aria-label="Available Hybrid R&M home">
              <div className="relative h-[132px] w-[420px]">
                <img
                  src="/logo. available hybrid premium.png"
                  alt="Available Hybrid R&M Inc. logo"
                  className="h-full w-full object-contain"
                />
              </div>
            </Link>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSellOpen(true)}
                className={`${architectsDaughter.className} inline-flex min-h-10 items-center justify-center rounded-full border border-white/35 px-5 text-sm uppercase tracking-[0.08em] text-white transition hover:border-white hover:bg-white hover:text-black"
              >
                {lang === "en" ? "Sell Your Car" : "Vende Tu Auto"}
              </button>

              <button
                type="button"
                onClick={() => setLang(lang === "en" ? "es" : "en")}
                className="rounded-full border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-200 hover:border-neutral-300 hover:bg-neutral-800"
              >
                {lang === "en" ? "ES" : "EN"}
              </button>
            </div>
          </div>

          {/* Mobile */}
          <div className="flex flex-col gap-1 py-3 sm:hidden">
            <Link href="/" className="flex items-center justify-center" aria-label="Available Hybrid R&M home">
              <div className="relative h-20 w-56">
                <img
                  src="/logo. available hybrid premium.png"
                  alt="Available Hybrid R&M Inc. logo"
                  className="h-full w-full object-contain"
                />
              </div>
            </Link>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <a
                  href={`https://wa.me/${whatsappDigits}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                  aria-label="WhatsApp"
                >
                  <img src="/whatsapp-green.png" alt="WhatsApp" className="h-full w-full object-contain" />
                </a>
                <a
                  href={`tel:${phone.replace(/[^+\\d]/g, "")}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white/80"
                  aria-label="Call"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.9.32 1.77.6 2.6a2 2 0 0 1-.45 2.11L8 9.91a16 16 0 0 0 6.09 6.09l1.48-1.21a2 2 0 0 1 2.11-.45c.83.28 1.7.48 2.6.6A2 2 0 0 1 22 16.92z" />
                  </svg>
                </a>
                <a
                  href="https://www.instagram.com/availablehybridrm/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white/80"
                  aria-label="Instagram"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                    <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
                    <path d="M16 11.37a4 4 0 1 1-7.75 1.26 4 4 0 0 1 7.75-1.26z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSellOpen(true)}
                  className={`${architectsDaughter.className} inline-flex min-h-9 items-center justify-center rounded-full border border-white/35 px-3 text-xs uppercase tracking-[0.06em] text-white"
                >
                  {lang === "en" ? "Sell Your Car" : "Vende Tu Auto"}
                </button>
                <button
                  type="button"
                  onClick={() => setLang(lang === "en" ? "es" : "en")}
                  className="rounded-full border border-neutral-700 bg-neutral-900 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-200"
                >
                  {lang === "en" ? "ES" : "EN"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* LAYOUT PRINCIPAL: sidebar + contenido */}
      <div className="mx-auto flex max-w-6xl gap-6 px-4 pt-6">
        {/* CONTENIDO PRINCIPAL */}
        <section className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/"
              aria-label={lang === "en" ? "Back to home" : "Volver al inicio"}
              className="inline-flex h-11 w-11 items-center justify-center text-[color:var(--inv-heading)] transition hover:bg-[var(--inv-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m6-6-6 6 6 6" />
              </svg>
            </Link>
            <div
              role="group"
              aria-label={lang === "en" ? "Inventory appearance" : "Apariencia del inventario"}
              className="inline-flex rounded-full border border-[var(--inv-border)] bg-[var(--inv-surface)] p-1"
            >
              {(["dark", "light"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={theme === mode}
                  onClick={() => selectTheme(mode)}
                  className={`inline-flex min-h-9 items-center gap-2 rounded-full px-3 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current ${
                    theme === mode
                      ? "bg-[var(--inv-active)] text-[color:var(--inv-on-active)]"
                      : "text-[color:var(--inv-muted)] hover:bg-[var(--inv-hover)]"
                  }`}
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
                    {mode === "dark" ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z" />
                    ) : (
                      <>
                        <circle cx="12" cy="12" r="4" />
                        <path strokeLinecap="round" d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
                      </>
                    )}
                  </svg>
                  {mode === "dark"
                    ? (lang === "en" ? "Dark" : "Oscuro")
                    : (lang === "en" ? "Light" : "Claro")}
                </button>
              ))}
            </div>
          </div>

          {/* Search, filters and sort */}
          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => { setIsSearchOpen(true); setSearchQuery(""); }}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--inv-border)] bg-[var(--inv-surface)] text-sm text-[color:var(--inv-secondary)] hover:border-[var(--inv-border-hover)] hover:bg-[var(--inv-raised)]"
              aria-label={text.searchOpenLabel}
            >
              🔍
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setIsFiltersOpen(true); setIsSortOpen(false); }}
                className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--inv-border)] bg-[var(--inv-surface)] px-3 text-xs text-[color:var(--inv-secondary)] hover:border-[var(--inv-border-hover)] hover:bg-[var(--inv-raised)]"
              >
                <span aria-hidden="true">⚙</span>
                <span>{text.filtersLabel}{makeFilter !== "ALL" ? ` · ${makeFilter}` : ""}</span>
              </button>
              <div className="relative z-30">
                <button
                  type="button"
                  onClick={() => setIsSortOpen((open) => !open)}
                  aria-expanded={isSortOpen}
                  aria-haspopup="menu"
                  className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--inv-border)] bg-[var(--inv-surface)] px-3 text-xs text-[color:var(--inv-secondary)] hover:border-[var(--inv-border-hover)] hover:bg-[var(--inv-raised)]"
                >
                  <span>{text.sort}</span><span aria-hidden="true">⌄</span>
                </button>
                {isSortOpen && (
                  <div role="menu" className="absolute right-0 top-full mt-2 max-h-[60vh] w-52 overflow-y-auto rounded-xl border border-[var(--inv-border-strong)] bg-[var(--inv-surface)] py-1 shadow-2xl">
                    <button type="button" role="menuitemradio" aria-checked={sortBy === "priceDesc"} onClick={() => { setSortBy("priceDesc"); setIsSortOpen(false); }} className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-xs hover:bg-[var(--inv-hover)] ${sortBy === "priceDesc" ? "text-[color:var(--inv-heading)]" : "text-[color:var(--inv-secondary)]"}`}>
                      <span>{text.sortHighestPrice}</span>{sortBy === "priceDesc" && <span aria-hidden="true">✓</span>}
                    </button>
                    <button type="button" role="menuitemradio" aria-checked={sortBy === "priceAsc"} onClick={() => { setSortBy("priceAsc"); setIsSortOpen(false); }} className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-xs hover:bg-[var(--inv-hover)] ${sortBy === "priceAsc" ? "text-[color:var(--inv-heading)]" : "text-[color:var(--inv-secondary)]"}`}>
                      <span>{text.sortLowestPrice}</span>{sortBy === "priceAsc" && <span aria-hidden="true">✓</span>}
                    </button>
                    <button type="button" role="menuitemradio" aria-checked={sortBy === "yearDesc"} onClick={() => { setSortBy("yearDesc"); setIsSortOpen(false); }} className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-xs hover:bg-[var(--inv-hover)] ${sortBy === "yearDesc" ? "text-[color:var(--inv-heading)]" : "text-[color:var(--inv-secondary)]"}`}>
                      <span>{text.sortNewestYear}</span>{sortBy === "yearDesc" && <span aria-hidden="true">✓</span>}
                    </button>
                    <button type="button" role="menuitemradio" aria-checked={sortBy === "yearAsc"} onClick={() => { setSortBy("yearAsc"); setIsSortOpen(false); }} className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-xs hover:bg-[var(--inv-hover)] ${sortBy === "yearAsc" ? "text-[color:var(--inv-heading)]" : "text-[color:var(--inv-secondary)]"}`}>
                      <span>{text.sortOldestYear}</span>{sortBy === "yearAsc" && <span aria-hidden="true">✓</span>}
                    </button>
                    <button type="button" role="menuitemradio" aria-checked={sortBy === "mileageDesc"} onClick={() => { setSortBy("mileageDesc"); setIsSortOpen(false); }} className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-xs hover:bg-[var(--inv-hover)] ${sortBy === "mileageDesc" ? "text-[color:var(--inv-heading)]" : "text-[color:var(--inv-secondary)]"}`}>
                      <span>{text.sortHighestMileage}</span>{sortBy === "mileageDesc" && <span aria-hidden="true">✓</span>}
                    </button>
                    <button type="button" role="menuitemradio" aria-checked={sortBy === "mileageAsc"} onClick={() => { setSortBy("mileageAsc"); setIsSortOpen(false); }} className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-xs hover:bg-[var(--inv-hover)] ${sortBy === "mileageAsc" ? "text-[color:var(--inv-heading)]" : "text-[color:var(--inv-secondary)]"}`}>
                      <span>{text.sortLowestMileage}</span>{sortBy === "mileageAsc" && <span aria-hidden="true">✓</span>}
                    </button>
                    <button type="button" role="menuitemradio" aria-checked={sortBy === "photosDesc"} onClick={() => { setSortBy("photosDesc"); setIsSortOpen(false); }} className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-xs hover:bg-[var(--inv-hover)] ${sortBy === "photosDesc" ? "text-[color:var(--inv-heading)]" : "text-[color:var(--inv-secondary)]"}`}>
                      <span>{text.sortMostImages}</span>{sortBy === "photosDesc" && <span aria-hidden="true">✓</span>}
                    </button>
                    <button type="button" role="menuitemradio" aria-checked={sortBy === "photosAsc"} onClick={() => { setSortBy("photosAsc"); setIsSortOpen(false); }} className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-xs hover:bg-[var(--inv-hover)] ${sortBy === "photosAsc" ? "text-[color:var(--inv-heading)]" : "text-[color:var(--inv-secondary)]"}`}>
                      <span>{text.sortLeastImages}</span>{sortBy === "photosAsc" && <span aria-hidden="true">✓</span>}
                    </button>
                    <button type="button" role="menuitemradio" aria-checked={sortBy === "makeAsc"} onClick={() => { setSortBy("makeAsc"); setIsSortOpen(false); }} className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-xs hover:bg-[var(--inv-hover)] ${sortBy === "makeAsc" ? "text-[color:var(--inv-heading)]" : "text-[color:var(--inv-secondary)]"}`}>
                      <span>{text.sortMakeAZ}</span>{sortBy === "makeAsc" && <span aria-hidden="true">✓</span>}
                    </button>
                    <button type="button" role="menuitemradio" aria-checked={sortBy === "makeDesc"} onClick={() => { setSortBy("makeDesc"); setIsSortOpen(false); }} className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-xs hover:bg-[var(--inv-hover)] ${sortBy === "makeDesc" ? "text-[color:var(--inv-heading)]" : "text-[color:var(--inv-secondary)]"}`}>
                      <span>{text.sortMakeZA}</span>{sortBy === "makeDesc" && <span aria-hidden="true">✓</span>}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* GRID DE VEHÍCULOS */}
          <div className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-3">
            {visible.length === 0 ? (
              <p className="text-sm text-[color:var(--inv-muted)]">{text.noVehicles}</p>
            ) : (
              visible.map((car) => {
                const mainPhoto = car.studioCover || car.photos[0] || "/placeholder-car.jpg";
                const hoverPhoto =
                  car.studioCover || car.cardHoverPhoto === "none"
                    ? null
                    : car.cardHoverPhoto || car.photos[1] || null;
                const priceLabel =
                  car.price != null
                    ? `$${car.price.toLocaleString()}`
                    : lang === "en"
                    ? "Call for price"
                    : "Llama para precio";

                const descriptionExcerpt = inventoryExcerpt(car);
                return (
                  <Link
                    key={car.id}
                    href={`/${encodeURIComponent(car.id)}`}
                    aria-label={`${fullDetails}: ${car.title}`}
                    className="group flex min-w-0 flex-col bg-transparent overflow-visible focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
                  >
                    {/* Fotos originales sin etiquetas */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-[var(--inv-surface)]">
                      <Image
                        src={mainPhoto}
                        alt={car.title}
                        fill
                        sizes="(max-width: 639px) 100vw, (max-width: 767px) 50vw, 33vw"
                        className="object-cover object-center transition duration-700 group-hover:scale-[1.025]"
                      />
                      {hoverPhoto && (
                        <Image
                          src={hoverPhoto}
                          alt=""
                          fill
                          sizes="(max-width: 639px) 100vw, (max-width: 767px) 50vw, 33vw"
                          className="object-cover object-center opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                        />
                      )}
                      <div className="vehicle-details-overlay pointer-events-none absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                        <span className="inline-flex min-h-11 items-center gap-3 border border-white px-6 py-3 text-sm font-semibold tracking-wide text-white">
                          {fullDetails}
                          <span aria-hidden="true">→</span>
                        </span>
                      </div>
                    </div>

                    {/* Info principal */}
                    <div className="flex flex-1 flex-col pb-3 pt-4 text-xs">
                      <h3 className="text-base font-semibold uppercase leading-snug tracking-wide text-[color:var(--inv-heading)] lg:text-lg">
                        {[car.make, car.model, car.year].filter(Boolean).join(" ") || car.title}
                      </h3>

                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-6 text-[color:var(--inv-muted)]">
                        {car.mileage != null && (
                          <span>{car.mileage.toLocaleString()} mi</span>
                        )}
                        {car.fuel && <span>• {car.fuel}</span>}
                        {car.transmission && <span>• {transmissionLabel(car.transmission)}</span>}
                        {car.exterior && <span>• {car.exterior}</span>}
                      </div>

                      {descriptionExcerpt && (
                        <p className="mt-3 text-sm leading-6 text-[color:var(--inv-secondary)]">
                          {descriptionExcerpt}
                        </p>
                      )}
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-3 py-3">
                      <p className="text-lg font-semibold text-[color:var(--inv-heading)]">
                        {priceLabel}
                      </p>
                      <span className="vehicle-details-touch items-center gap-2 text-sm font-medium text-[color:var(--inv-heading)]">
                        {fullDetails} <span aria-hidden="true">→</span>
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </section>
      </div>

      {isSortOpen && (
        <button type="button" aria-label="Close sort" className="fixed inset-0 z-20 cursor-default" onClick={() => setIsSortOpen(false)} />
      )}

      {/* MODAL DE FILTROS */}
      {isFiltersOpen && (
        <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-8 sm:pt-16">
          <div className="w-full max-w-md rounded-2xl border border-[var(--inv-border)] bg-[var(--inv-modal)] shadow-xl">
            {/* header */}
            <div className="flex items-center justify-between border-b border-[var(--inv-border)] px-4 py-3">
              <p className="text-xs font-medium text-[color:var(--inv-secondary)]">
                {text.filtersModalTitle}
              </p>
              <button
                type="button"
                onClick={() => setIsFiltersOpen(false)}
                className="text-sm text-[color:var(--inv-muted)] hover:text-[color:var(--inv-text)]"
              >
                ✕
              </button>
            </div>

            {/* contenido filtros */}
            <div className="space-y-4 px-4 py-4 text-[13px]">
              {/* Price */}
              <div className="rounded-lg border border-[var(--inv-border)] bg-[var(--inv-page)] px-3 py-3">
                <div className="flex items-center justify-between">
                  <span>{text.price}</span>
                  <span className="text-[11px] text-[color:var(--inv-muted-low)]">
                    {text.adjustInStore}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2 text-[11px]">
                  <div className="flex-1 rounded-md border border-[var(--inv-border)] bg-[var(--inv-black70)] px-2 py-1.5">
                    <p className="text-[10px] text-[color:var(--inv-muted-low)]">
                      {text.minLabel}
                    </p>
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
                        priceStats.min ? priceStats.min.toString() : "0"
                      }
                      className="w-full bg-transparent text-[color:var(--inv-text)] outline-none text-[11px]"
                    />
                  </div>
                  <div className="flex-1 rounded-md border border-[var(--inv-border)] bg-[var(--inv-black70)] px-2 py-1.5 text-right">
                    <p className="text-[10px] text-[color:var(--inv-muted-low)]">
                      {text.maxLabel}
                    </p>
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
                        priceStats.max ? priceStats.max.toString() : "30000"
                      }
                      className="w-full bg-transparent text-[color:var(--inv-text)] outline-none text-[11px] text-right"
                    />
                  </div>
                </div>
              </div>

              {/* Year */}
              <div className="rounded-lg border border-[var(--inv-border)] bg-[var(--inv-page)] px-3 py-3">
                <div className="flex items-center justify-between">
                  <span>{text.year}</span>
                  <span className="text-xs text-[color:var(--inv-muted-low)]">
                    {yearFilter === "ALL" ? text.allYears : yearFilter}
                  </span>
                </div>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="mt-2 w-full rounded-md border border-[var(--inv-border)] bg-[var(--inv-black70)] px-2 py-1.5 text-[11px] text-[color:var(--inv-text)] outline-none focus:border-[var(--inv-border-hover)]"
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
              <div className="rounded-lg border border-[var(--inv-border)] bg-[var(--inv-page)] px-3 py-3">
                <div className="flex items-center justify-between">
                  <span>{text.make}</span>
                  <span className="text-xs text-[color:var(--inv-muted-low)]">
                    {makeFilter === "ALL" ? text.allMakes : makeFilter}
                  </span>
                </div>
                <select
                  value={makeFilter}
                  aria-label={text.make}
                  onChange={(e) => setMakeFilter(e.target.value)}
                  className="mt-2 w-full rounded-md border border-[var(--inv-border)] bg-[var(--inv-black70)] px-2 py-1.5 text-[11px] text-[color:var(--inv-text)] outline-none focus:border-[var(--inv-border-hover)]"
                >
                  <option value="ALL">{text.allMakes}</option>
                  {makes.map((mk) => (
                    <option key={mk} value={mk}>
                      {mk}
                    </option>
                  ))}
                </select>
              </div>

              {/* Model info */}
              <div className="rounded-lg border border-[var(--inv-border)] bg-[var(--inv-page)] px-3 py-2">
                <div className="flex items-center justify-between">
                  <span>{text.model}</span>
                  <span className="text-xs text-[color:var(--inv-muted-low)]">
                    {text.comingSoon}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsFiltersOpen(false)}
                className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-[var(--inv-active)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--inv-on-active)] hover:bg-[var(--inv-active-hover)]"
              >
                {text.applyFilters}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE BÚSQUEDA (lupa) */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-16">
          <div className="w-full max-w-2xl rounded-2xl border border-[var(--inv-border)] bg-[var(--inv-modal)] shadow-xl">
            {/* header modal */}
            <div className="flex items-center justify-between border-b border-[var(--inv-border)] px-4 py-3">
              <p className="text-xs font-medium text-[color:var(--inv-secondary)]">
                {text.modalTitle}
              </p>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="text-sm text-[color:var(--inv-muted)] hover:text-[color:var(--inv-text)]"
              >
                ✕
              </button>
            </div>

            {/* input búsqueda */}
            <div className="px-4 py-3">
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-[color:var(--inv-muted-low)]">
                  🔍
                </span>
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={text.modalPlaceholder}
                  className="w-full rounded-full border border-[var(--inv-border)] bg-[var(--inv-surface)] px-3 py-2 pl-7 text-sm text-[color:var(--inv-text)] outline-none placeholder:text-[color:var(--inv-muted-low)] focus:border-[var(--inv-border-hover)]"
                />
              </div>
            </div>

            {/* resultados */}
            <div className="max-h-[60vh] overflow-y-auto px-2 pb-3">
              {searchQuery.trim() && searchResults.length === 0 && (
                <p className="px-2 py-2 text-xs text-[color:var(--inv-muted-low)]">
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
                    className="flex items-center gap-3 rounded-xl px-2 py-2 text-xs text-[color:var(--inv-text)] hover:bg-[var(--inv-raised)]"
                  >
                    <div className="h-14 w-20 overflow-hidden rounded bg-[var(--inv-raised)]">
                      <img
                        src={thumb}
                        alt={car.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] text-[color:var(--inv-muted)]">
                        {car.year} {car.make}
                      </p>
                      <p className="text-sm font-semibold">
                        {car.model || car.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[color:var(--inv-muted-low)]">
                        {car.vin ? `VIN ${car.vin}` : ""}
                      </p>
                    </div>
                    <p className="whitespace-nowrap text-sm font-semibold text-[color:var(--inv-accent)]">
                      {price}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <SellYourCarModal
        open={sellOpen}
        onClose={() => setSellOpen(false)}
        lang={lang}
        whatsappDigits={whatsappDigits}
      />

      <style jsx>{`
        main {
          color-scheme: dark;
          --inv-page: #050505;
          --inv-text: #f5f5f5;
          --inv-heading: #fafafa;
          --inv-secondary: #d4d4d4;
          --inv-muted: #a3a3a3;
          --inv-muted-low: #737373;
          --inv-surface: #0a0a0a;
          --inv-raised: #171717;
          --inv-hover: #262626;
          --inv-card: rgba(23, 23, 23, .7);
          --inv-modal: rgba(10, 10, 10, .95);
          --inv-black80: rgba(0, 0, 0, .8);
          --inv-black70: rgba(0, 0, 0, .7);
          --inv-active: #f5f5f5;
          --inv-active-hover: #e5e5e5;
          --inv-on-active: #000;
          --inv-border-subtle: #171717;
          --inv-border: #262626;
          --inv-border-strong: #404040;
          --inv-border-hover: #737373;
          --inv-accent: #34d399;
          --inv-card-shadow: 0 10px 30px rgba(0, 0, 0, .65);
        }
        main[data-theme="light"] {
          color-scheme: light;
          --inv-page: #fff;
          --inv-text: #171717;
          --inv-heading: #111;
          --inv-secondary: #404040;
          --inv-muted: #5c5c5c;
          --inv-muted-low: #6b6b6b;
          --inv-surface: #fff;
          --inv-raised: #f5f5f5;
          --inv-hover: #ebebeb;
          --inv-card: #fff;
          --inv-modal: #fff;
          --inv-black80: #f7f7f7;
          --inv-black70: #fafafa;
          --inv-active: #171717;
          --inv-active-hover: #333;
          --inv-on-active: #fff;
          --inv-border-subtle: #e5e5e5;
          --inv-border: #dedede;
          --inv-border-strong: #ccc;
          --inv-border-hover: #737373;
          --inv-accent: #047857;
          --inv-card-shadow: 0 6px 22px rgba(0, 0, 0, .06);
        }
        header {
          color-scheme: dark;
        }
        .vehicle-details-touch {
          display: none;
        }
        @media (hover: none) {
          .vehicle-details-overlay {
            display: none;
          }
          .vehicle-details-touch {
            display: inline-flex;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .vehicle-details-overlay {
            transition: none;
          }
        }
      `}</style>
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
      cardHoverPhoto: (c as any).cardHoverPhoto ?? "",
      studioCover: (c as any).studioCover ?? "",
    };
  });

  return { props: { inventory }, revalidate: 60 };
};

