import * as React from "react";
import type { GetStaticProps } from "next";
import Link from "next/link";
import { getInventory, type Car } from "../lib/getInventory";

///////////////  UTILITY → DRIVE URL FIX  ///////////////
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

//////////////////////////////////////////////////////////

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

  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const [lang, setLang] = React.useState<"en" | "es">("en");

  const phone = "+1 747-354-4098";
  const whatsappDigits = "17473544098";

  const text = {
    inventoryNav: lang === "en" ? "Inventory" : "Inventario",
    prequalifyNav: lang === "en" ? "Pre-Qualify" : "Pre-Calificar",
    available: lang === "en" ? "AVAILABLE HYBRID" : "HÍBRIDO DISPONIBLE",
    estPayment: lang === "en" ? "Est. payment" : "Pago estimado",
  };

  //////////////////////////////////////////////////////////////////
  // FILTERING
  //////////////////////////////////////////////////////////////////
  const years = React.useMemo(() => {
    return [...new Set(inventory.map((c) => c.year!).filter(Boolean))].sort(
      (a, b) => Number(b) - Number(a)
    );
  }, [inventory]);

  const makes = React.useMemo(() => {
    return [...new Set(inventory.map((c) => c.make).filter(Boolean))].sort();
  }, [inventory]);

  const visible = React.useMemo(() => {
    let cars = [...inventory];
    if (yearFilter !== "ALL") {
      cars = cars.filter((c) => String(c.year) === yearFilter);
    }
    if (makeFilter !== "ALL") {
      cars = cars.filter((c) => c.make === makeFilter);
    }
    cars.sort((a, b) => {
      const pa = a.price ?? 0;
      const pb = b.price ?? 0;
      return sortBy === "priceDesc" ? pb - pa : pa - pb;
    });
    return cars;
  }, [inventory, yearFilter, makeFilter, sortBy]);

  //////////////////////////////////////////////////////////////////
  // SEARCH MODAL RESULT LIST
  //////////////////////////////////////////////////////////////////
  const searchResults = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return inventory.filter((c) =>
      `${c.year} ${c.make} ${c.model} ${c.vin}`.toLowerCase().includes(q)
    );
  }, [inventory, searchQuery]);

  //////////////////////////////////////////////////////////////////
  // MONTHLY CALC → 12 MONTHS ONLY
  //////////////////////////////////////////////////////////////////
  const getMonthly = (price?: number | null) => {
    if (!price) return null;
    return Math.round((price * 1.18) / 12); // 18% interest, 12 months
  };

  //////////////////////////////////////////////////////////////////
  // HEADER (FULLY RESPONSIVE)
  //////////////////////////////////////////////////////////////////

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 pb-20">

      {/* ⭐⭐⭐ HEADER ⭐⭐⭐ */}
      <header className="border-b border-neutral-900 bg-black/90">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          
          {/* LOGO */}
          <Link href="/" className="flex justify-center w-full sm:w-auto">
            <div className="relative h-16 w-40 sm:h-[120px] sm:w-[360px]">
              <img
                src="/logo. available hybrid premium.png"
                className="h-full w-full object-contain"
                alt="Available Hybrid Logo"
              />
            </div>
          </Link>

          {/* NAV (DESKTOP ONLY) */}
          <nav className="hidden sm:flex gap-8 text-xs font-medium text-neutral-300">
            <Link href="/inventory" className="hover:text-white">
              {text.inventoryNav}
            </Link>
            <Link href="/pre-qualification" className="hover:text-white">
              {text.prequalifyNav}
            </Link>
          </nav>

          {/* RIGHT SIDE */}
          <div className="flex flex-col items-end w-full sm:w-auto gap-2 text-[11px]">
            
            {/* ADDRESS ONLY DESKTOP */}
            <span className="hidden sm:block text-neutral-400">
              6726 Reseda Blvd Suite A7 · Reseda, CA 91335
            </span>

            <div className="flex items-center justify-end gap-3 w-full">

              {/* WHATSAPP ICON */}
              <a
                href={`https://wa.me/${whatsappDigits}`}
                target="_blank"
                rel="noreferrer"
                className="h-8 w-8"
              >
                <img
                  src="/whatsapp.png"
                  className="h-full w-full object-contain"
                  alt="WhatsApp"
                />
              </a>

              {/* PHONE */}
              <a
                href={`tel:${phone.replace(/[^+\d]/g, "")}`}
                className="rounded-full border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-[10px] tracking-[0.16em] hover:border-neutral-300 hover:bg-neutral-800"
              >
                {phone}
              </a>

              {/* LANG SWITCH */}
              <button
                onClick={() => setLang(lang === "en" ? "es" : "en")}
                className="rounded-full border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-[10px] tracking-[0.18em] hover:border-neutral-300 hover:bg-neutral-800"
              >
                {lang === "en" ? "ES" : "EN"}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* filters + grid */}
      {/* ========================================================= */}

      <div className="mx-auto mt-8 max-w-6xl grid gap-8 px-4 md:grid-cols-[260px,1fr]">

        {/* LEFT SIDEBAR FILTERS */}
        <aside className="rounded-2xl border border-neutral-900 bg-neutral-950/70 p-4 text-xs">
          <p className="text-neutral-400 font-semibold tracking-[0.2em] mb-4">
            Filters
          </p>

          {/* PRICE */}
          <label className="text-[11px] text-neutral-300">Price</label>
          <div className="flex gap-2 mt-1">
            <input
              type="number"
              placeholder="Min"
              value={yearFilter}
              className="w-full rounded bg-black/60 px-2 py-1 border border-neutral-800"
            />
          </div>

          {/* YEAR */}
          <label className="text-[11px] text-neutral-300 mt-3 block">Year</label>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="w-full bg-black/60 border border-neutral-800 px-2 py-1 rounded"
          >
            <option value="ALL">All years</option>
            {years.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>

          {/* MAKE */}
          <label className="text-[11px] text-neutral-300 mt-3 block">Make</label>
          <select
            value={makeFilter}
            onChange={(e) => setMakeFilter(e.target.value)}
            className="w-full bg-black/60 border border-neutral-800 px-2 py-1 rounded"
          >
            <option value="ALL">All makes</option>
            {makes.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </aside>

        {/* GRID CARS */}
        <section className="grid gap-6 md:grid-cols-2">
          {visible.map((car) => {
            const img = car.photos[0] ?? "/placeholder-car.jpg";
            const monthly = getMonthly(car.price);

            return (
              <div
                key={car.id}
                className="group rounded-2xl border border-neutral-900 bg-neutral-950 shadow-xl overflow-hidden"
              >
                <Link href={`/${car.id}`}>
                  <div className="h-48 bg-black overflow-hidden">
                    <img
                      src={img}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition"
                    />
                  </div>
                </Link>

                <div className="p-4 text-xs">

                  {/* BADGE */}
                  <p className="text-[10px] tracking-[0.18em] text-neutral-400 mb-1 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {text.available} · {car.year}
                  </p>

                  {/* TITLE */}
                  <p className="font-semibold text-neutral-100 text-sm">
                    {car.year} {car.make} {car.model}
                  </p>

                  {/* SPECS */}
                  <p className="text-[11px] mt-1 text-neutral-400">
                    {car.mileage?.toLocaleString()} mi · {car.fuel} ·{" "}
                    {car.transmission}
                  </p>

                  {/* PRICE */}
                  <div className="flex justify-between items-center mt-3">
                    <p className="font-semibold text-neutral-100">
                      ${car.price?.toLocaleString()}
                    </p>

                    {/* MONTHLY WITH ? TOOLTIP */}
                    {monthly && (
                      <div className="relative">
                        <p className="text-emerald-400 font-semibold">
                          ${monthly}/mo
                        </p>

                        <div className="absolute right-[-6px] bottom-[-4px] text-[12px] text-neutral-400">
                          ❔
                          <div className="absolute hidden group-hover:block w-60 p-3 rounded-xl bg-black border border-neutral-800 text-[11px]">
                            Payment sample based on 12 payments + 18% APR.
                            Amount may vary. Only for approved customers.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}

//////////////////////////////////////////////////////////////////////////
// STATIC PROPS
//////////////////////////////////////////////////////////////////////////

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
