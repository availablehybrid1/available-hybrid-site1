// pages/[id].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps } from "next";
import Link from "next/link";
import Image from "next/image";
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
  titleStatus: string;
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
  const [touchStartX, setTouchStartX] = React.useState<number | null>(null);
const [touchEndX, setTouchEndX] = React.useState<number | null>(null);
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
    "availability" | "estimate" | "offer" | "testdrive" | null
  >(null);

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

// 🚀 PRELOAD DE IMÁGENES (NUEVO)
React.useEffect(() => {
  if (!car?.photos?.length) return;

  car.photos.forEach((url) => {
    const img = new window.Image();
    img.src = url;
  });
}, [car]);

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
  const cleanDescription = (car.description || "")
    .replace(
      /\b(?:\d{4}\s+)?(?:[A-Z0-9-]+\s+){0,5}available at Available Hybrid R&?M Inc\.?\s*/i,
      ""
    )
    .replace(/\s{2,}/g, " ")
    .trim();

  const friendlyOverview = (() => {
    const name = [car.year, car.make, car.model].filter(Boolean).join(" ");
    const body = vinInfo?.bodyClass || "";
    const drive = vinInfo?.driveType || "";
    const pieces: string[] = [];

    if (body) {
      pieces.push(
        `This ${name} is a ${body.toLowerCase()} with a straightforward, practical setup for everyday driving.`
      );
    } else {
      pieces.push(
        `This ${name} is a practical option for everyday driving.`
      );
    }

    if (/hybrid/i.test(car.fuel || "")) {
      pieces.push("Its hybrid powertrain is designed to help reduce fuel use in daily driving.");
    } else if (car.fuel) {
      pieces.push(`It uses ${car.fuel.toLowerCase()} fuel.`);
    }

    if (/all.?wheel|awd|4x4/i.test(drive)) {
      pieces.push("All-wheel drive adds extra traction when road conditions are less ideal.");
    }

    const notesOnly = cleanDescription
      .replace(/\bClean Title\b[\s·.-]*/gi, "")
      .replace(/\bSalvage Title\b[\s·.-]*/gi, "")
      .replace(/\bRebuilt Title\b[\s·.-]*/gi, "")
      .replace(/\b[\d,]+ miles\b[\s·.-]*/gi, "")
      .replace(/\b(?:Gasoline|Hybrid|Electric|Diesel)\b[\s·.-]*/gi, "")
      .replace(/\b(?:Automatic|Manual)\b[\s·.-]*/gi, "")
      .replace(/\b(?:Black|White|Silver|Gray|Grey|Red|Blue|Green|Beige|Brown|Gold) exterior\b[\s·.-]*/gi, "")
      .replace(/\b(?:FWD|RWD|AWD|4WD|4x4|Front-Wheel Drive|Rear-Wheel Drive|All-Wheel Drive)\b[\s·.-]*/gi, "")
      .replace(/\b\d+ cyl\b[\s·.-]*/gi, "")
      .replace(/\b\d(?:\.\d+)?L\b[\s·.-]*/gi, "")
      .replace(/\s{2,}/g, " ")
      .replace(/^[\s·.-]+|[\s·.-]+$/g, "")
      .trim();

    if (notesOnly.length > 12) pieces.push(notesOnly);

    return pieces.join(" ");
  })();

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

  // 💌 Confirm availability -> EmailJS
  const handleAvailabilitySubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const firstName = (formData.get("firstName") || "").toString();
    const lastName = (formData.get("lastName") || "").toString();
    const phone = (formData.get("phone") || "").toString();
    const email = (formData.get("email") || "").toString();
    const comments = (formData.get("comments") || "").toString();

    const page_url =
      typeof window !== "undefined" ? window.location.href : "";

    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "availability",
        vehicleId: car.id,
        vehicleTitle: `${car.year ?? ""} ${car.make} ${car.model}`,
        vin: car.vin ?? "",
        firstName,
        lastName,
        phone,
        email,
        comments,
        page_url,
      }),
    });

    if (!res.ok) {
      alert(
        "There was a problem sending your request. Please try again."
      );
      return;
    }

    alert("Your request was sent. We will contact you soon.");
    form.reset();
  };

  // 💰 Manejar submit de "Make an Offer" -> EmailJS
  const handleMakeOfferSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const name = (formData.get("name") || "").toString();
    const phone = (formData.get("phone") || "").toString();
    const email = (formData.get("email") || "").toString();
    const offer = (formData.get("offer") || "").toString();
    const message = (formData.get("message") || "").toString();

    const page_url =
      typeof window !== "undefined" ? window.location.href : "";

    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "offer",
        vehicleId: car.id,
        vehicleTitle: `${car.year ?? ""} ${car.make} ${car.model}`,
        vin: car.vin ?? "",
        name,
        phone,
        email,
        offer,
        message,
        page_url,
      }),
    });

    if (!res.ok) {
      alert(
        "There was a problem sending your offer. Please try again."
      );
      return;
    }

    alert("Your offer was sent. We will contact you soon.");
    form.reset();
  };

  // 🚗 Manejar submit de "Schedule Test Drive" -> EmailJS
  const handleTestDriveSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const name = (formData.get("name") || "").toString();
    const phone = (formData.get("phone") || "").toString();
    const email = (formData.get("email") || "").toString();
    const preferredContact = (
      formData.get("preferredContact") || ""
    ).toString();
    const preferredDate = (formData.get("preferredDate") || "").toString();
    const preferredTime = (formData.get("preferredTime") || "").toString();
    const comments = (formData.get("comments") || "").toString();

    const page_url =
      typeof window !== "undefined" ? window.location.href : "";

    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "testDrive",
        vehicleId: car.id,
        vehicleTitle: `${car.year ?? ""} ${car.make} ${car.model}`,
        vin: car.vin ?? "",
        name,
        phone,
        email,
        preferredContact,
        preferredDate,
        preferredTime,
        comments,
        page_url,
      }),
    });

    if (!res.ok) {
      alert(
        "There was a problem sending your request. Please try again."
      );
      return;
    }

    alert("Your test drive request was sent. We will contact you soon.");
    form.reset();
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
<div className="flex flex-row items-center gap-3">
  <a
    href={`https://wa.me/17473544098?text=${encodeURIComponent(
      `Hi, I am interested in this vehicle: ${car.title} - $${car.price}`
    )}`}
    target="_blank"
    rel="noreferrer"
    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-transparent shrink-0"
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
    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/[0.03] text-white/80 transition-all duration-300 hover:border-white hover:bg-white/[0.08] hover:text-white"
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
    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/[0.03] text-white/80 transition-all duration-300 hover:border-white hover:bg-white/[0.08] hover:text-white"
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
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        ry="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 11.37a4 4 0 1 1-7.75 1.26 4 4 0 0 1 7.75-1.26z"
      />
      <line
        x1="17.5"
        y1="6.5"
        x2="17.51"
        y2="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </a>
</div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-8 px-4 pb-14 pt-5">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="min-w-0">
            <Link
              href="/inventory"
              className="mb-3 inline-flex text-xs text-neutral-400 underline-offset-2 hover:underline"
            >
              ← Back to inventory
            </Link>

            <div className="flex min-h-[320px] w-full items-center justify-center sm:min-h-[420px] lg:min-h-[500px]">
              {mainPhoto ? (
                <div className="relative inline-flex max-w-full items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setIsLightboxOpen(true)}
                    className="group relative inline-flex max-w-full items-center justify-center"
                  >
                    <img
                      src={mainPhoto}
                      alt={car.title}
                      className="block h-auto max-h-[500px] max-w-full rounded-lg object-contain sm:max-h-[560px]"
                    />
                    <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-2">
                      <span className="rounded-full bg-black/70 px-2.5 py-1 text-[10px] text-neutral-100 backdrop-blur">
                        {current + 1} / {car.photos.length}
                      </span>
                      <span className="hidden rounded-full bg-black/70 px-2.5 py-1 text-[10px] text-neutral-100 backdrop-blur sm:inline">
                        View full size
                      </span>
                    </div>
                  </button>

                  {hasMultiplePhotos && (
                    <>
                      <button
                        type="button"
                        onClick={goPrev}
                        className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-lg text-white backdrop-blur transition hover:bg-black/80"
                        aria-label="Previous photo"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        onClick={goNext}
                        className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-lg text-white backdrop-blur transition hover:bg-black/80"
                        aria-label="Next photo"
                      >
                        ›
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex h-[320px] w-full items-center justify-center text-xs text-neutral-500 sm:h-[420px]">
                  Photo coming soon
                </div>
              )}
            </div>

</section>

          <section className="rounded-2xl border border-white/10 bg-neutral-900/70 p-5 text-xs shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur lg:sticky lg:top-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-neutral-500">
                  Available Hybrid R&amp;M
                </p>
                <h1 className="mt-2 text-2xl font-semibold uppercase leading-tight text-neutral-50">
                  {car.make} {car.model} {car.year}
                </h1>
              </div>
              {car.price != null && (
                <div className="text-right">
                  <p className="text-[11px] text-neutral-500">Our Price</p>
                  <p className="text-2xl font-semibold tracking-tight text-emerald-400 sm:text-3xl">
                    ${car.price.toLocaleString()}
                  </p>
                  {estimatedFees > 0 && (
                    <p className="mt-1 text-[9px] text-neutral-500">
                      Est. taxes &amp; fees ${estimatedFees.toFixed(0)}
                    </p>
                  )}
                </div>
              )}
            </div>

            {car.status && (
              <span className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {car.status}
              </span>
            )}

            <dl className="mt-5 grid grid-cols-2 border-y border-neutral-800/80 text-[11px]">
              <div className="border-r border-neutral-800/80 py-3 pr-3">
                <dt className="text-[10px] uppercase tracking-[0.12em] text-neutral-600">
                  Mileage
                </dt>
                <dd className="mt-1 text-neutral-100">
                  {car.mileage != null
                    ? `${car.mileage.toLocaleString()} mi`
                    : "N/A"}
                </dd>
              </div>
              <div className="py-3 pl-3">
                <dt className="text-[10px] uppercase tracking-[0.12em] text-neutral-600">
                  Title
                </dt>
                <dd className="mt-1 text-neutral-100">
                  {car.titleStatus || "N/A"}
                </dd>
              </div>
            </dl>

            <div className="mt-5 grid grid-cols-1 gap-2 text-[11px]">
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
                    setActivePanel((current) =>
                      current === tab.id
                        ? null
                        : (tab.id as
                            | "availability"
                            | "estimate"
                            | "offer"
                            | "testdrive")
                    )
                  }
                  className={`min-h-[44px] rounded-lg border px-3 py-2.5 text-center font-semibold transition ${
                    activePanel === tab.id
                      ? "border-white bg-white text-black"
                      : tab.id === "availability"
                      ? "border-neutral-200 bg-neutral-100 text-black hover:bg-white"
                      : "border-neutral-700 bg-black/25 text-neutral-100 hover:border-neutral-500 hover:bg-neutral-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activePanel === "availability" && (
              <form
                onSubmit={handleAvailabilitySubmit}
                className="mt-5 space-y-3 border-t border-neutral-800 pt-5"
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

            {activePanel === "estimate" && (
              <div className="mt-5 space-y-4 border-t border-neutral-800 pt-5">
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

                    <div className="space-y-2 border-l border-neutral-800 pl-4">
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

            {activePanel === "offer" && (
              <form
                onSubmit={handleMakeOfferSubmit}
                className="mt-5 space-y-3 border-t border-neutral-800 pt-5"
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

            {activePanel === "testdrive" && (
              <form
                onSubmit={handleTestDriveSubmit}
                className="mt-5 space-y-3 border-t border-neutral-800 pt-5"
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
                      name="preferredContact"
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
                      name="preferredDate"
                      className="w-full rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-100 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] text-neutral-400">
                      Preferred time
                    </label>
                    <input
                      type="time"
                      name="preferredTime"
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

        <section className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-neutral-900/55 p-5 text-[11px] shadow-[0_14px_40px_rgba(0,0,0,0.18)] sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-neutral-100">
                Vehicle details
              </p>
              <span className="text-[10px] uppercase tracking-[0.14em] text-neutral-600">
                Used vehicle
              </span>
            </div>
            <div className="grid gap-x-6 gap-y-3 sm:grid-cols-3">
              <div>
                <p className="text-neutral-500">Fuel</p>
                <p className="text-neutral-200">{car.fuel || "N/A"}</p>
              </div>
              <div>
                <p className="text-neutral-500">Exterior</p>
                <p className="text-neutral-200">{car.exterior || "N/A"}</p>
              </div>
              <div>
                <p className="text-neutral-500">Transmission</p>
                <p className="text-neutral-200">
                  {vinInfo?.transmission || car.transmission || "N/A"}
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
                <p className="text-neutral-500">Drivetrain</p>
                <p className="text-neutral-200">
                  {vinInfo?.driveType || "N/A"}
                </p>
              </div>
              <div className="sm:col-span-3">
                <p className="text-neutral-500">VIN</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-neutral-300">
                  {car.vin || "N/A"}
                </p>
              </div>
            </div>

            {friendlyOverview && (
              <div className="mt-5 border-t border-neutral-800 pt-4">
                <p className="mb-2 text-[10px] uppercase tracking-[0.14em] text-neutral-600">
                  Overview
                </p>
                <p className="max-w-4xl leading-relaxed text-neutral-300">
                  {friendlyOverview}
                </p>
              </div>
            )}

            <details className="mt-4 border-t border-neutral-800 pt-3">
              <summary className="cursor-pointer select-none text-[11px] font-medium text-neutral-400 hover:text-neutral-200">
                More VIN details
              </summary>
              <div className="mt-3">
                {vinLoading && (
                  <p className="text-neutral-400">Decoding VIN…</p>
                )}
                {vinError && (
                  <p className="text-[11px] text-red-400">{vinError}</p>
                )}
                {!vinLoading && !vinError && vinInfo && (
                  <div className="grid gap-x-6 gap-y-2 text-[11px] text-neutral-300 sm:grid-cols-3">
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
            </details>
          </div>

          {suggestions.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-neutral-900/55 p-5 text-[11px] sm:p-6">
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
                      className="group overflow-hidden rounded-xl border border-white/10 bg-black/30 p-2 transition hover:-translate-y-0.5 hover:border-neutral-500"
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

          <div className="flex justify-center border-t border-neutral-900 pt-7">
            <a
              href="https://www.google.com/maps/search/?api=1&query=6726+Reseda+Blvd+Suite+A7+Reseda+CA+91335"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-neutral-700 px-5 py-2.5 text-[11px] font-medium text-neutral-300 transition hover:border-neutral-400 hover:bg-neutral-900 hover:text-white"
            >
              View dealership location
            </a>
          </div>
        </section>
      </div>

      {isLightboxOpen && mainPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
          onClick={closeLightbox}
        >
        <div className="relative max-h-[90vh] max-w-[90vw] overflow-hidden">

  <div className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded bg-black/70 px-3 py-1 text-[11px] text-neutral-100">
  {current + 1} / {car.photos.length}
</div>

<div className="absolute bottom-10 left-1/2 z-20 flex -translate-x-1/2 gap-2">
  {car.photos.map((_, i) => (
    <span
      key={i}
      className={`h-2 w-2 rounded-full ${
        current === i ? "bg-white" : "bg-white/35"
      }`}
    />
  ))}
</div>

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
  onClick={(e) => {
    e.stopPropagation();
    handleLightboxImageClick(e);
  }}
  onTouchStart={(e) => {
    setTouchStartX(e.touches[0].clientX);
  }}
  onTouchMove={(e) => {
    setTouchEndX(e.touches[0].clientX);
  }}
  onTouchEnd={() => {
  if (touchStartX === null || touchEndX === null) {
    setTouchStartX(null);
    setTouchEndX(null);
    return;
  }

  const distance = touchStartX - touchEndX;

  if (Math.abs(distance) > 50) {
    if (distance > 0) {
      goNext();
    } else {
      goPrev();
    }
  }

  setTouchStartX(null);
  setTouchEndX(null);
}}
  className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain transition-all duration-300"
  style={{
    transformOrigin: `${zoomOrigin.x} ${zoomOrigin.y}`,
    transform: isZoomed ? "scale(2)" : "scale(1)",
    cursor: isZoomed ? "zoom-out" : "zoom-in",
  }}
/>
          </div>
        </div>
      )}
      <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4 sm:hidden">
  <div className="flex w-full max-w-md gap-2">

    <a
      href={`https://wa.me/17473544098?text=${encodeURIComponent(
        `Hi, I am interested in this vehicle: ${car.title} - $${car.price}`
      )}`}
      target="_blank"
      className="flex-1 rounded-lg bg-green-500 px-4 py-3 text-center text-sm font-semibold text-white"
    >
      WhatsApp
    </a>

    <a
      href="tel:+17473544098"
      className="flex-1 rounded-lg bg-white px-4 py-3 text-center text-sm font-semibold text-black"
    >
      Call
    </a>

    <a
  href="https://www.instagram.com/availablehybridrm/"
  target="_blank"
  rel="noreferrer"
  className="flex-1 rounded-lg bg-gradient-to-r from-pink-500 to-yellow-500 px-4 py-3 text-center text-sm font-semibold text-white"
>
  IG
</a>

  </div>
</div>
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
    fallback: "blocking",
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

    const titleBase = `${c.year ?? ""} ${c.make ?? ""} ${c.model ?? ""}`.trim();

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
      titleStatus:
        (c as any).titleStatus ??
        (c as any).title_status ??
        ((c as any).description?.match(/\b(Clean Title|Salvage Title|Rebuilt Title)\b/i)?.[1] || ""),
      description: (c as any).description ?? "",
      photos,
    };
  };

  const car = mapCarToVehicle(raw);

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
