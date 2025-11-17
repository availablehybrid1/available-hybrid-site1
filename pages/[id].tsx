// pages/[id].tsx 
import * as React from "react";
import type { GetStaticPaths, GetStaticProps } from "next";
import Link from "next/link";
import { getInventory, type Car } from "../lib/getInventory";

// misma función que en index.tsx para convertir links de Drive a imágenes
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

type VinDecoded = {
  make?: string | null;
  model?: string | null;
  modelYear?: string | null;
  trim?: string | null;
  bodyClass?: string | null;
  engineCylinders?: string | null;
  engineDisplacementL?: string | null;
  transmission?: string | null;
  driveType?: string | null;
};

type DetailProps = {
  car: Vehicle | null;
  suggestions: Vehicle[];
};

export default function VehicleDetail({ car, suggestions }: DetailProps) {
  const [current, setCurrent] = React.useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);

  // zoom dentro del modal
  const [isZoomed, setIsZoomed] = React.useState(false);
  const [zoomOrigin, setZoomOrigin] = React.useState<{ x: string; y: string }>(
    {
      x: "50%",
      y: "50%",
    }
  );

  // VIN decoding
  const [vinInfo, setVinInfo] = React.useState<VinDecoded | null>(null);
  const [vinLoading, setVinLoading] = React.useState(false);
  const [vinError, setVinError] = React.useState<string | null>(null);

  // Panel derecho (tabs)
  const [activePanel, setActivePanel] = React.useState<
    "availability" | "estimate" | "offer" | "testdrive"
  >("availability");

  // BHPH estimator UI
  const [creditTier, setCreditTier] = React.useState<
    "low" | "midLow" | "midHigh" | "high"
  >("low");
  const [termMonths, setTermMonths] = React.useState(24);
  const [downPayment, setDownPayment] = React.useState(2000);

  // ⌨️ Navegación con flechas izquierda/derecha y cerrar con ESC
  React.useEffect(() => {
    if (!car || !car.photos.length) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        setCurrent((prev) => (prev + 1) % car.photos.length);
      } else if (e.key === "ArrowLeft") {
        setCurrent((prev) =>
          prev === 0 ? car.photos.length - 1 : prev - 1
        );
      } else if (e.key === "Escape") {
        setIsLightboxOpen(false);
        setIsZoomed(false);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [car]);

  // 🧠 Decodificar VIN automáticamente
  React.useEffect(() => {
    if (!car?.vin) return;

    setVinLoading(true);
    setVinError(null);

    fetch(`/api/decode-vin?vin=${encodeURIComponent(car.vin)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.error) {
          setVinError(data.error);
        } else {
          setVinInfo(data);
        }
      })
      .catch(() => {
        setVinError("Could not decode VIN");
      })
      .finally(() => {
        setVinLoading(false);
      });
  }, [car?.vin]);

  if (!car) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <p className="text-sm text-neutral-400">Vehicle not found.</p>
          <Link
            href="/"
            className="mt-4 inline-flex text-sm text-neutral-300 underline-offset-2 hover:underline"
          >
            ← Back to inventory
          </Link>
        </div>
      </main>
    );
  }

  const mainPhoto = car.photos[current] ?? "";

  // APR según rango de crédito
  const apr = React.useMemo(() => {
    switch (creditTier) {
      case "low":
        return 22.0;
      case "midLow":
        return 17.99;
      case "midHigh":
        return 12.99;
      case "high":
        return 6.99;
      default:
        return 22.0;
    }
  }, [creditTier]);

  const vehiclePrice = car.price ?? 0;
  const amountFinanced = Math.max(vehiclePrice - downPayment, 0);

  const monthlyPayment = React.useMemo(() => {
    if (!vehiclePrice || !amountFinanced || termMonths <= 0 || apr <= 0)
      return 0;

    const r = apr / 100 / 12; // interés mensual
    const n = termMonths;
    const payment = (amountFinanced * r) / (1 - Math.pow(1 + r, -n));
    return payment;
  }, [amountFinanced, termMonths, apr, vehiclePrice]);

  // 💵 Estimación de taxes + fees (ejemplo simple LA County)
  const taxRate = 0.1025; // ~10.25%
  const fixedFees = 85 + 58 + 65 + 21; // doc + reg + title + smog aprox
  const estimatedTax = vehiclePrice * taxRate;
  const estimatedFees = vehiclePrice ? estimatedTax + fixedFees : 0;

  // 💌 Confirm availability
  const handleAvailabilitySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const firstName = (formData.get("firstName") || "").toString();
    const lastName = (formData.get("lastName") || "").toString();
    const phone = (formData.get("phone") || "").toString();
    const email = (formData.get("email") || "").toString();
    const comments = (formData.get("comments") || "").toString();

    const subject = `Availability for ${car.year ?? ""} ${car.make} ${
      car.model
    } (ID: ${car.id})`;
    const bodyLines = [
      `Vehicle: ${car.year ?? ""} ${car.make} ${car.model}`,
      `ID: ${car.id}`,
      car.vin ? `VIN: ${car.vin}` : "",
      "",
      `Name: ${firstName} ${lastName}`.trim(),
      `Phone: ${phone}`,
      email ? `Email: ${email}` : "",
      "",
      "Comments:",
      comments || "(No comments)",
    ].filter(Boolean);

    const mailto = `mailto:availablehybrid@gmail.com?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(bodyLines.join("\n"))}`;

    window.location.href = mailto;
  };

  // 💰 Manejar submit de "Make an Offer"
  const handleMakeOfferSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const name = (formData.get("name") || "").toString();
    const phone = (formData.get("phone") || "").toString();
    const email = (formData.get("email") || "").toString();
    const offer = (formData.get("offer") || "").toString();
    const message = (formData.get("message") || "").toString();

    const subject = `Offer for ${car.year ?? ""} ${car.make} ${
      car.model
    } (ID: ${car.id})`;
    const bodyLines = [
      `Vehicle: ${car.year ?? ""} ${car.make} ${car.model}`,
      `ID: ${car.id}`,
      car.vin ? `VIN: ${car.vin}` : "",
      "",
      `Name: ${name}`,
      `Phone: ${phone}`,
      email ? `Email: ${email}` : "",
      `Offer: ${offer ? `$${offer}` : "Not specified"}`,
      "",
      "Message:",
      message || "(No message)",
    ].filter(Boolean);

    const mailto = `mailto:availablehybrid@gmail.com?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(bodyLines.join("\n"))}`;

    window.location.href = mailto;
  };

  // 🚗 Manejar submit de "Schedule Test Drive"
  const handleTestDriveSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const name = (formData.get("name") || "").toString();
    const phone = (formData.get("phone") || "").toString();
    const email = (formData.get("email") || "").toString();
    const preferred = (formData.get("preferred") || "").toString(); // Text / Email / WhatsApp
    const date = (formData.get("date") || "").toString();
    const time = (formData.get("time") || "").toString();
    const comments = (formData.get("comments") || "").toString();

    const subject = `Test Drive Request - ${car.year ?? ""} ${car.make} ${
      car.model
    } (ID: ${car.id})`;
    const bodyLines = [
      `Vehicle: ${car.year ?? ""} ${car.make} ${car.model}`,
      `ID: ${car.id}`,
      car.vin ? `VIN: ${car.vin}` : "",
      "",
      `Name: ${name}`,
      `Phone: ${phone}`,
      email ? `Email: ${email}` : "",
      `Preferred contact: ${preferred || "Not specified"}`,
      "",
      `Requested date: ${date || "Not specified"}`,
      `Requested time: ${time || "Not specified"}`,
      "",
      "Comments:",
      comments || "(No comments)",
    ].filter(Boolean);

    const mailto = `mailto:availablehybrid@gmail.com?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(bodyLines.join("\n"))}`;

    window.location.href = mailto;
  };

  // 👆 Click en la imagen dentro del modal: zoom al punto exacto
  const handleLightboxImageClick = (
    e: React.MouseEvent<HTMLImageElement, MouseEvent>
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    const xPercent = (offsetX / rect.width) * 100;
    const yPercent = (offsetY / rect.height) * 100;

    setZoomOrigin({
      x: `${xPercent.toFixed(1)}%`,
      y: `${yPercent.toFixed(1)}%`,
    });

    setIsZoomed((prev) => !prev);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    setIsZoomed(false);
  };

  const phone = "+1 747-354-4098";
  const hasMultiplePhotos = car.photos.length > 1;

  const goPrev = () => {
    setCurrent((prev) =>
      prev === 0 ? car.photos.length - 1 : prev - 1
    );
    setIsZoomed(false);
  };

  const goNext = () => {
    setCurrent((prev) => (prev + 1) % car.photos.length);
    setIsZoomed(false);
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* HEADER ELEGANTE */}
      <header className="border-b border-neutral-900 bg-black/90">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/inventory" className="flex items-center gap-3 group">
            <div className="relative h-10 w-10 overflow-hidden rounded-2xl bg-neutral-900/80 ring-1 ring-white/15 group-hover:ring-white/40 transition sm:h-12 sm:w-12">
              <img
                src="/logo.%20available%20hybrid%20premium.png"
                alt="Available Hybrid R&M Inc. logo"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="leading-tight">
              <p className="text-[10px] font-semibold tracking-[0.26em] text-neutral-400 group-hover:text-neutral-200">
                AVAILABLE HYBRID
              </p>
              <p className="text-sm font-semibold text-neutral-50">
                R&amp;M Inc.
              </p>
              <p className="hidden text-[11px] text-neutral-500 sm:block">
                Hybrid &amp; fuel-efficient vehicles in Reseda, CA.
              </p>
            </div>
          </Link>

          <div className="flex flex-col items-end gap-1 text-right text-[11px] text-neutral-400">
            <span>6726 Reseda Blvd Suite A7 · Reseda, CA 91335</span>
            <div className="flex items-center gap-2">
              <a
                href="https://wa.me/17473544098"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-transparent"
                aria-label="WhatsApp"
              >
                <img
                  src="/whatsapp-green.png"
                  alt="WhatsApp"
                  className="h-full w-full object-contain"
                />
              </a>
              <a
                href={`tel:${phone.replace(/[^+\d]/g, "")}`}
                className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/5 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-white hover:bg-white/10"
              >
                {phone}
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <div className="mx-auto max-w-6xl px-4 pb-12 pt-4 space-y-6">
        {/* Fila superior: galería + panel derecho */}
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Galería */}
          <section className="flex-1">
            <Link
              href="/inventory"
              className="mb-3 inline-flex text-xs text-neutral-400 underline-offset-2 hover:underline"
            >
              ← Back to inventory
            </Link>

            <div className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900/70">
              {/* Foto principal (ajustada, sin miniaturas) */}
              <div className="relative flex h-[220px] w-full items-center justify-center bg-neutral-800 sm:h-[280px] lg:h-[320px]">
                {mainPhoto ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsLightboxOpen(true)}
                      className="group flex h-full w-full items-center justify-center"
                    >
                      <img
                        src={mainPhoto}
                        alt={car.title}
                        className="max-h-full max-w-full max-w-[520px] object-contain"
                      />
                      <span className="pointer-events-none absolute bottom-2 right-2 rounded bg-black/60 px-2 py-1 text-[10px] text-neutral-100">
                        Click to enlarge
                      </span>
                    </button>

                    {hasMultiplePhotos && (
                      <button
                        type="button"
                        onClick={goPrev}
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-2 py-1 text-xs text-neutral-100 hover:bg-black"
                      >
                        ‹
                      </button>
                    )}
                    {hasMultiplePhotos && (
                      <button
                        type="button"
                        onClick={goNext}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-2 py-1 text-xs text-neutral-100 hover:bg-black"
                      >
                        ›
                      </button>
                    )}
                  </>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-neutral-500">
                    Photo coming soon
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Panel derecho tipo J&S */}
          <section className="flex-1 rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 text-xs sm:p-5">
            {/* Título + precio */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                  Available Hybrid
                </p>
                <h1 className="mt-1 text-base font-semibold text-neutral-50 sm:text-lg">
                  {car.year} {car.make} {car.model}
                </h1>
                <p className="mt-1 text-[11px] text-neutral-400">
                  Hybrid &amp; fuel-efficient vehicles in Reseda, CA.
                </p>
              </div>
              {car.price != null && (
                <div className="text-right">
                  <p className="text-[11px] text-neutral-500">Our Price</p>
                  <p className="text-xl font-semibold text-emerald-400 sm:text-2xl">
                    ${car.price.toLocaleString()}
                  </p>
                  {estimatedFees > 0 && (
                    <div className="mt-1 text-[10px] text-neutral-400">
                      <p>
                        Est. taxes &amp; fees:{" "}
                        <span className="font-semibold text-neutral-200">
                          ${estimatedFees.toFixed(0)}
                        </span>
                      </p>
                      <p className="text-[9px] text-neutral-500">
                        *Approximate for Los Angeles, may vary by city and
                        credit.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {car.status && (
              <span className="mt-3 inline-flex items-center rounded-full bg-emerald-600/15 px-2 py-[2px] text-[10px] font-medium text-emerald-400">
                {car.status}
              </span>
            )}

            {/* Specs rápidos */}
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

            {/* Tabs de acciones */}
            <div className="mt-5 grid grid-cols-4 gap-1 text-[11px]">
              {[
                { id: "availability", label: "Confirm Availability" },
                { id: "estimate", label: "Estimated Payment" },
                { id: "offer", label: "Make an Offer" },
                { id: "testdrive", label: "Schedule Test Drive" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() =>
                    setActivePanel(
                      tab.id as
                        | "availability"
                        | "estimate"
                        | "offer"
                        | "testdrive"
                    )
                  }
                  className={`rounded-sm px-2 py-1.5 text-center font-semibold ${
                    activePanel === tab.id
                      ? "bg-neutral-100 text-black"
                      : "bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Panel: Confirm Availability */}
            {activePanel === "availability" && (
              <form
                onSubmit={handleAvailabilitySubmit}
                className="mt-4 space-y-3 rounded-lg border border-neutral-800 bg-neutral-950/80 p-3"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="block text-[11px] text-neutral-400">
                      First Name
                    </label>
                    <input
                      name="firstName"
                      required
                      className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] text-neutral-400">
                      Last Name
                    </label>
                    <input
                      name="lastName"
                      required
                      className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] text-neutral-400">
                      Phone Number
                    </label>
                    <input
                      name="phone"
                      required
                      className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] text-neutral-400">
                      Email Address (optional)
                    </label>
                    <input
                      name="email"
                      type="email"
                      className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] text-neutral-400">
                    Comments (optional)
                  </label>
                  <textarea
                    name="comments"
                    rows={3}
                    className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-2 w-full rounded bg-neutral-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-black hover:bg-neutral-200"
                >
                  Confirm Availability
                </button>
              </form>
            )}

            {/* Panel: Estimated Payment (BHPH) */}
            {activePanel === "estimate" && (
              <div className="mt-4 rounded-lg border border-neutral-800 bg-neutral-950/80 p-3 space-y-4">
                <p className="text-[11px] font-semibold text-neutral-200">
                  Estimate your payment (example only)
                </p>

                {!vehiclePrice ? (
                  <p className="text-[11px] text-neutral-400">
                    Price is not set for this vehicle. Please contact the dealer
                    for financing options.
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 text-[11px]">
                    <div className="space-y-3">
                      <div>
                        <p className="text-neutral-500">Vehicle price*</p>
                        <p className="text-sm font-semibold text-neutral-100">
                          ${vehiclePrice.toLocaleString()}
                        </p>
                        <p className="mt-1 text-[10px] text-neutral-500">
                          *Price excludes taxes, DMV fees and dealer charges.
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-neutral-500">Approx. credit score</p>
                        <div className="space-y-1">
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="creditTier"
                              className="h-3 w-3"
                              checked={creditTier === "low"}
                              onChange={() => setCreditTier("low")}
                            />
                            <span>{"<"} 600 or no credit · 22% APR</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="creditTier"
                              className="h-3 w-3"
                              checked={creditTier === "midLow"}
                              onChange={() => setCreditTier("midLow")}
                            />
                            <span>600–649 · 17.99% APR</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="creditTier"
                              className="h-3 w-3"
                              checked={creditTier === "midHigh"}
                              onChange={() => setCreditTier("midHigh")}
                            />
                            <span>650–699 · 12.99% APR</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="creditTier"
                              className="h-3 w-3"
                              checked={creditTier === "high"}
                              onChange={() => setCreditTier("high")}
                            />
                            <span>700+ · 6.99% APR</span>
                          </label>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-neutral-500">
                          Down payment (USD)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={downPayment}
                          onChange={(e) =>
                            setDownPayment(
                              Number(e.target.value) >= 0
                                ? Number(e.target.value)
                                : 0
                            )
                          }
                          className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-neutral-500">
                          Term (months)
                        </label>
                        <input
                          type="number"
                          min={6}
                          max={60}
                          value={termMonths}
                          onChange={(e) =>
                            setTermMonths(
                              Number(e.target.value) > 0
                                ? Number(e.target.value)
                                : 1
                            )
                          }
                          className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 rounded border border-neutral-800 bg-neutral-900 p-3">
                      <p className="text-[11px] font-semibold text-neutral-200">
                        Estimated terms
                      </p>
                      <div className="space-y-1 text-[11px] text-neutral-300">
                        <div className="flex justify-between">
                          <span>Vehicle price</span>
                          <span>
                            $
                            {vehiclePrice.toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Down payment</span>
                          <span>
                            -$
                            {downPayment.toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Amount financed</span>
                          <span>
                            $
                            {amountFinanced.toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>APR (estimated)</span>
                          <span>{apr.toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Term</span>
                          <span>{termMonths} months</span>
                        </div>
                      </div>

                      <div className="mt-3 rounded bg-neutral-950 p-3 text-[11px]">
                        <p className="text-neutral-500">Estimated payment</p>
                        <p className="text-lg font-semibold text-emerald-400">
                          {monthlyPayment
                            ? `$${monthlyPayment.toFixed(2)} / mo`
                            : "--"}
                        </p>
                        <p className="mt-1 text-[10px] text-neutral-500">
                          Example only. Does not include taxes, DMV fees or
                          dealer charges. Not all customers will qualify for
                          these terms. Subject to credit approval and signed
                          contract.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Panel: Make an Offer */}
            {activePanel === "offer" && (
              <form
                onSubmit={handleMakeOfferSubmit}
                className="mt-4 space-y-3 rounded-lg border border-neutral-800 bg-neutral-950/80 p-3"
              >
                <p className="text-[11px] font-semibold text-neutral-200">
                  Make an Offer
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="block text-[11px] text-neutral-400">
                      Name
                    </label>
                    <input
                      name="name"
                      required
                      className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] text-neutral-400">
                      Phone
                    </label>
                    <input
                      name="phone"
                      required
                      className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] text-neutral-400">
                      Email (optional)
                    </label>
                    <input
                      name="email"
                      type="email"
                      className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] text-neutral-400">
                      Offer amount (USD)
                    </label>
                    <input
                      name="offer"
                      type="number"
                      min={0}
                      className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] text-neutral-400">
                    Message
                  </label>
                  <textarea
                    name="message"
                    rows={3}
                    className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-2 w-full rounded bg-neutral-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-black hover:bg-neutral-200"
                >
                  Send Offer
                </button>
              </form>
            )}

            {/* Panel: Schedule Test Drive */}
            {activePanel === "testdrive" && (
              <form
                onSubmit={handleTestDriveSubmit}
                className="mt-4 space-y-3 rounded-lg border border-neutral-800 bg-neutral-950/80 p-3"
              >
                <p className="text-[11px] font-semibold text-neutral-200">
                  Schedule Test Drive
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="block text-[11px] text-neutral-400">
                      Name
                    </label>
                    <input
                      name="name"
                      required
                      className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] text-neutral-400">
                      Phone
                    </label>
                    <input
                      name="phone"
                      required
                      className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] text-neutral-400">
                      Email (optional)
                    </label>
                    <input
                      name="email"
                      type="email"
                      className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] text-neutral-400">
                      Preferred contact
                    </label>
                    <select
                      name="preferred"
                      className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-emerald-500"
                    >
                      <option value="">Select</option>
                      <option value="Text">Text</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Email">Email</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="block text-[11px] text-neutral-400">
                      Preferred date
                    </label>
                    <input
                      type="date"
                      name="date"
                      className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] text-neutral-400">
                      Preferred time
                    </label>
                    <input
                      type="time"
                      name="time"
                      className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-neutral-400">
                    Comments
                  </label>
                  <textarea
                    name="comments"
                    rows={3}
                    className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  className="mt-2 w-full rounded bg-neutral-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-black hover:bg-neutral-200"
                >
                  Send Request
                </button>
              </form>
            )}
          </section>
        </div>

        {/* SECCIONES INFERIORES */}
        <section className="space-y-4">
          {/* Basic information + VIN extra */}
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 text-[11px] sm:p-5">
            <p className="mb-3 text-sm font-semibold text-neutral-100">
              Basic information
            </p>
            <div className="grid gap-x-6 gap-y-2 sm:grid-cols-3">
              <div>
                <p className="text-neutral-500">Condition</p>
                <p className="text-neutral-200">Used</p>
              </div>
              <div>
                <p className="text-neutral-500">Mileage</p>
                <p className="text-neutral-200">
                  {car.mileage != null
                    ? `${car.mileage.toLocaleString()} mi`
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-neutral-500">Engine</p>
                <p className="text-neutral-200">
                  {vinInfo?.engineCylinders
                    ? `${vinInfo.engineCylinders} cyl${
                        vinInfo.engineDisplacementL
                          ? ` · ${vinInfo.engineDisplacementL}L`
                          : ""
                      }`
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-neutral-500">Body Type</p>
                <p className="text-neutral-200">
                  {vinInfo?.bodyClass || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-neutral-500">Transmission</p>
                <p className="text-neutral-200">
                  {vinInfo?.transmission || car.transmission || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-neutral-500">Drivetrain</p>
                <p className="text-neutral-200">
                  {vinInfo?.driveType || "N/A"}
                </p>
              </div>
            </div>

            <div className="mt-4 border-t border-neutral-800 pt-3">
              <p className="mb-2 text-[11px] font-semibold text-neutral-200">
                VIN decoded details
              </p>
              {vinLoading && (
                <p className="text-neutral-400">Decoding VIN…</p>
              )}
              {vinError && (
                <p className="text-[11px] text-red-400">{vinError}</p>
              )}
              {!vinLoading && !vinError && vinInfo && (
                <div className="grid gap-x-6 gap-y-1 text-[11px] text-neutral-300 sm:grid-cols-3">
                  {vinInfo.trim && (
                    <div>
                      <p className="text-neutral-500">Trim</p>
                      <p>{vinInfo.trim}</p>
                    </div>
                  )}
                  {vinInfo.make && (
                    <div>
                      <p className="text-neutral-500">Make</p>
                      <p>{vinInfo.make}</p>
                    </div>
                  )}
                  {vinInfo.model && (
                    <div>
                      <p className="text-neutral-500">Model</p>
                      <p>{vinInfo.model}</p>
                    </div>
                  )}
                </div>
              )}
              {!vinLoading && !vinError && !vinInfo && (
                <p className="text-neutral-500 text-[11px]">
                  No extra VIN data available.
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          {car.description && (
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 text-[11px] sm:p-5">
              <p className="mb-2 text-sm font-semibold text-neutral-100">
                Description
              </p>
              <p className="leading-relaxed text-neutral-300">
                {car.description}
              </p>
            </div>
          )}

          {/* Vehicle location */}
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 text-[11px] sm:p-5">
            <p className="mb-2 text-sm font-semibold text-neutral-100">
              Vehicle Location
            </p>
            <p className="text-neutral-300">
              Available Hybrid R&amp;M Inc.
              <br />
              6726 Reseda Blvd Suite A7
              <br />
              Reseda, CA 91335
            </p>
            <Link
              href="https://maps.app.goo.gl/"
              target="_blank"
              className="mt-3 inline-flex text-[11px] text-emerald-400 underline-offset-2 hover:underline"
            >
              View directions
            </Link>
          </div>

          {/* YOU MAY ALSO LIKE */}
          {suggestions.length > 0 && (
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 text-[11px] sm:p-5">
              <p className="mb-3 text-sm font-semibold text-neutral-100">
                You may also like
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {suggestions.map((s) => {
                  const thumb = s.photos[0] ?? "/placeholder-car.jpg";
                  return (
                    <Link
                      key={s.id}
                      href={`/${encodeURIComponent(s.id)}`}
                      className="group rounded-md border border-neutral-800 bg-neutral-950/70 p-2 hover:border-neutral-400"
                    >
                      <div className="h-24 w-full overflow-hidden rounded bg-neutral-900">
                        <img
                          src={thumb}
                          alt={s.title}
                          className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform"
                        />
                      </div>
                      <p className="mt-2 text-[11px] text-neutral-400">
                        {s.year} {s.make}
                      </p>
                      <p className="text-xs font-semibold text-neutral-50 line-clamp-1">
                        {s.model || s.title}
                      </p>
                      {s.price != null && (
                        <p className="mt-1 text-[11px] font-semibold text-emerald-400">
                          ${s.price.toLocaleString()}
                        </p>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* LIGHTBOX / MODAL DE IMAGEN GRANDE CON ZOOM POR CLICK */}
      {isLightboxOpen && mainPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
          onClick={closeLightbox}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeLightbox}
              className="absolute -top-3 -right-3 rounded-full bg-black/80 px-2 py-1 text-xs text-neutral-100 hover:bg-black"
            >
              ✕
            </button>

            {hasMultiplePhotos && (
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-2 py-1 text-xs text-neutral-100 hover:bg-black"
              >
                ‹
              </button>
            )}
            {hasMultiplePhotos && (
              <button
                type="button"
                onClick={goNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-2 py-1 text-xs text-neutral-100 hover:bg-black"
              >
                ›
              </button>
            )}

            <img
              src={mainPhoto}
              alt={car.title}
              onClick={handleLightboxImageClick}
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain transition-transform duration-300"
              style={{
                transformOrigin: `${zoomOrigin.x} ${zoomOrigin.y}`,
                transform: isZoomed ? "scale(2)" : "scale(1)",
                cursor: isZoomed ? "zoom-out" : "zoom-in",
              }}
            />
          </div>
        </div>
      )}
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

// Carga datos de un vehículo por ID + sugerencias
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
        suggestions: [],
      },
      revalidate: 60,
    };
  }

  const mapCarToVehicle = (c: Car): Vehicle => {
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

    const titleBase = `${c.year ?? ""} ${c.make ?? ""} ${
      c.model ?? ""
    }`.trim();

    return {
      id: String(c.id).trim(),
      title: titleBase || String(c.id),
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
  };

  const car = mapCarToVehicle(raw);

  // sugerencias: mismo make si es posible, si no cualquier otro, máximo 3
  const others = cars.filter((c) => String(c.id).trim() !== id);
  const sameMake = others.filter(
    (c) =>
      c.make &&
      raw.make &&
      c.make.toLowerCase().trim() === raw.make.toLowerCase().trim()
  );

  const pool = (sameMake.length ? sameMake : others).slice(0, 3);
  const suggestions = pool.map(mapCarToVehicle);

  return {
    props: {
      car,
      suggestions,
    },
    revalidate: 60,
  };
};
