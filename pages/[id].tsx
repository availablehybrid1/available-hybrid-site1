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
};

export default function VehicleDetail({ car }: DetailProps) {
  const [current, setCurrent] = React.useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);

  // zoom dentro del modal
  const [isZoomed, setIsZoomed] = React.useState(false);
  const [zoomOrigin, setZoomOrigin] = React.useState<{ x: string; y: string }>({
    x: "50%",
    y: "50%",
  });

  // VIN decoding
  const [vinInfo, setVinInfo] = React.useState<VinDecoded | null>(null);
  const [vinLoading, setVinLoading] = React.useState(false);
  const [vinError, setVinError] = React.useState<string | null>(null);

  // BHPH estimator UI
  const [showBhph, setShowBhph] = React.useState(false);
  const [creditTier, setCreditTier] = React.useState<
    "low" | "midLow" | "midHigh" | "high"
  >("low");
  const [termMonths, setTermMonths] = React.useState(24);
  const [downPayment, setDownPayment] = React.useState(2000);

  // Make an offer UI
  const [showOffer, setShowOffer] = React.useState(false);

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

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* HEADER CON LOGO GRANDE Y SIN ROJO */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/inventory" className="flex items-center gap-3 group">
          <div className="relative h-11 w-11 sm:h-12 sm:w-12 overflow-hidden rounded-2xl bg-neutral-900/80 ring-1 ring-white/15 group-hover:ring-white/40 transition">
            <img
              src="/logo.%20available%20hybrid%20premium.png"
              alt="Available Hybrid R&M Inc. logo"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="leading-tight hidden sm:block">
            <p className="text-[10px] font-semibold tracking-[0.26em] text-neutral-400 group-hover:text-neutral-200">
              AVAILABLE HYBRID
            </p>
            <p className="text-sm font-semibold text-neutral-50">
              R&amp;M Inc.
            </p>
            <p className="text-[11px] text-neutral-500">
              Hybrid &amp; fuel-efficient vehicles in Reseda, CA.
            </p>
          </div>
        </Link>

        <div className="flex flex-col items-end gap-1 text-right text-[11px] text-neutral-400">
          <span>6726 Reseda Blvd Suite A7 · Reseda, CA 91335</span>
          <a
            href={`tel:${phone.replace(/[^+\d]/g, "")}`}
            className="mt-1 inline-flex items-center justify-center rounded-full border border-white/25 bg-white/5 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-white hover:bg-white/10"
          >
            Call {phone}
          </a>
        </div>
      </header>

      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 pb-12 pt-2 lg:flex-row">
        {/* IMAGEN GRANDE + MINIATURAS */}
        <section className="flex-1">
          <Link
            href="/inventory"
            className="mb-3 inline-flex text-xs text-neutral-400 underline-offset-2 hover:underline"
          >
            ← Back to inventory
          </Link>

          <div className="overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900/70">
            {/* FOTO PRINCIPAL */}
            <div className="relative w-full bg-neutral-800 h-[260px] sm:h-[420px] flex items-center justify-center">
              {mainPhoto ? (
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(true)}
                  className="group flex h-full w-full items-center justify-center"
                >
                  <img
                    src={mainPhoto}
                    alt={car.title}
                    className="max-h-full max-w-full object-contain"
                  />
                  <span className="pointer-events-none absolute bottom-2 right-2 rounded bg-black/60 px-2 py-1 text-[10px] text-neutral-100">
                    Click to enlarge
                  </span>
                </button>
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-neutral-500">
                  Foto próximamente
                </div>
              )}
            </div>

            {/* MINIATURAS */}
            {car.photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto border-t border-neutral-800 bg-neutral-900/80 p-2">
                {car.photos.map((photo, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCurrent(idx);
                      setIsZoomed(false);
                    }}
                    className={`h-14 w-20 flex-none overflow-hidden rounded border ${
                      idx === current
                        ? "border-emerald-500"
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
              <p className="text-lg font-semibold text-emerald-400">
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

          {/* BLOQUE: Info extra desde el VIN */}
          <div className="mt-4 rounded border border-neutral-800 bg-neutral-900/80 p-3 text-[11px]">
            <p className="mb-2 text-[11px] font-semibold text-neutral-200">
              Info decodificada del VIN
            </p>

            {vinLoading && (
              <p className="text-neutral-400">Decoding VIN…</p>
            )}

            {vinError && (
              <p className="text-red-400 text-[11px]">{vinError}</p>
            )}

            {!vinLoading && !vinError && vinInfo && (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-neutral-300">
                {vinInfo.trim && (
                  <div>
                    <dt className="text-neutral-500">Trim</dt>
                    <dd>{vinInfo.trim}</dd>
                  </div>
                )}
                {vinInfo.bodyClass && (
                  <div>
                    <dt className="text-neutral-500">Body</dt>
                    <dd>{vinInfo.bodyClass}</dd>
                  </div>
                )}
                {vinInfo.engineCylinders && (
                  <div>
                    <dt className="text-neutral-500">Engine</dt>
                    <dd>
                      {vinInfo.engineCylinders} cyl
                      {vinInfo.engineDisplacementL &&
                        ` · ${vinInfo.engineDisplacementL}L`}
                    </dd>
                  </div>
                )}
                {vinInfo.transmission && (
                  <div>
                    <dt className="text-neutral-500">Transmission</dt>
                    <dd>{vinInfo.transmission}</dd>
                  </div>
                )}
                {vinInfo.driveType && (
                  <div>
                    <dt className="text-neutral-500">Drive</dt>
                    <dd>{vinInfo.driveType}</dd>
                  </div>
                )}
              </dl>
            )}

            {!vinLoading && !vinError && !vinInfo && (
              <p className="text-neutral-500">
                No extra VIN data available.
              </p>
            )}
          </div>

          {car.description && (
            <p className="mt-4 text-[11px] leading-relaxed text-neutral-300">
              {car.description}
            </p>
          )}

          {/* ACCIONES */}
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
              href={`tel:${phone.replace(/[^+\d]/g, "")}`}
              className="rounded bg-neutral-800 px-3 py-1 font-medium text-neutral-100 hover:bg-neutral-700"
            >
              Call Dealer
            </a>
            <Link
              href={`/pre-qualification?id=${encodeURIComponent(car.id)}`}
              className="rounded border border-neutral-700 px-3 py-1 font-medium text-neutral-100 hover:border-emerald-500 hover:text-emerald-400"
            >
              Pre-Qualify
            </Link>
            <button
              type="button"
              onClick={() => {
                setShowBhph((prev) => !prev);
                setShowOffer(false);
              }}
              className="rounded border border-neutral-700 px-3 py-1 font-medium text-neutral-100 hover:border-blue-500 hover:text-blue-400"
            >
              BHPH Estimate
            </button>
            <button
              type="button"
              onClick={() => {
                setShowOffer((prev) => !prev);
                setShowBhph(false);
              }}
              className="rounded border border-neutral-700 px-3 py-1 font-medium text-neutral-100 hover:border-emerald-500 hover:text-emerald-400"
            >
              Make an Offer
            </button>
          </div>

          {/* PANEL BHPH */}
          {showBhph && (
            <div className="mt-5 rounded-lg border border-neutral-800 bg-neutral-900/80 p-4 space-y-4">
              <p className="text-[11px] font-semibold text-neutral-200">
                BHPH Payment Estimator (this vehicle)
              </p>

              {!vehiclePrice ? (
                <p className="text-[11px] text-neutral-400">
                  Price is not set for this vehicle. Please contact the dealer
                  for BHPH options.
                </p>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 text-[11px]">
                    <div className="space-y-2">
                      <div>
                        <p className="text-neutral-500">Vehicle price*</p>
                        <p className="font-semibold text-neutral-100">
                          ${vehiclePrice.toLocaleString()}
                        </p>
                        <p className="mt-0.5 text-[10px] text-neutral-500">
                          *Price shown does not include sales tax, DMV
                          registration, documentation, or other applicable fees.
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
                            <span>
                              {"<"} 600 or no credit · 22% APR
                            </span>
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

                    <div className="space-y-2 rounded border border-neutral-800 bg-neutral-950/80 p-3">
                      <p className="text-[11px] font-semibold text-neutral-200">
                        Estimated terms
                      </p>
                      <div className="space-y-1 text-[11px] text-neutral-300">
                        <div className="flex justify-between">
                          <span>Vehicle price</span>
                          <span>
                            ${vehiclePrice.toLocaleString(undefined, {
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

                      <div className="mt-3 rounded bg-neutral-900 p-3 text-[11px]">
                        <p className="text-neutral-500">Estimated payment</p>
                        <p className="text-lg font-semibold text-emerald-400">
                          {monthlyPayment
                            ? `$${monthlyPayment.toFixed(2)} / mo`
                            : "--"}
                        </p>
                        <p className="mt-1 text-[10px] text-neutral-500">
                          This calculation is for illustration only and does not
                          include sales tax, DMV registration, documentation, or
                          other applicable fees. Final terms are subject to full
                          credit review and written approval.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* FORMULARIO MAKE AN OFFER */}
          {showOffer && (
            <form
              onSubmit={handleMakeOfferSubmit}
              className="mt-5 space-y-3 rounded-lg border border-neutral-800 bg-neutral-900/80 p-4"
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
                className="mt-2 rounded bg-white px-3 py-1 text-[11px] font-medium text-neutral-900 hover:bg-neutral-200"
              >
                Send Offer
              </button>
            </form>
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
