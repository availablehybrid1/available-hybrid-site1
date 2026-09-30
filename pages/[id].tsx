// pages/[id].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Car as CarIcon,
  Cog,
  FileText,
  Fuel,
  Gauge,
  GitBranch,
  Palette,
  Settings,
  MessageCircle,
  Calculator,
  BadgeCheck,
  BadgeDollarSign,
  CalendarDays,
  Phone,
  Instagram,
} from "lucide-react";
import { getInventory, type Car } from "../lib/getInventory";
import { PreQualificationForm } from "./pre-qualification";

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
  transmissionDetail: string;
  fuel: string;
  engine: string;
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
  fuel?: string | null;
  driveType?: string | null;
  mpgCity?: number | null;
  mpgHighway?: number | null;
  mpgCombined?: number | null;
  mpgSource?: string | null;
};

function vehicleOnlyDescription(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ").replace(/&amp;/gi, "&").replace(/&nbsp;/gi, " ")
    .replace(/(?:available at|offered by|for sale at|disponible en|a la venta en)\s+Available\s+Hybrid\s+R\s*&?\s*M(?:\s+Inc\.?)?[.!]?/gi, "")
    .split(/\r?\n|(?<=[.!?])\s+/)
    .filter(part => !/available\s+hybrid|hybridrm\.com|\b(?:visit us|contact us|call us|financing available|our dealership)\b|(?:ll[aá]manos|vis[ií]tanos)/i.test(part))
    .map(part => part.trim()).filter(Boolean).join("\n").replace(/[ \t]+/g, " ").trim();
}

function displayTransmission(raw: string) {
  if (/\b(cvt|automatic|auto|continuously variable|e-cvt)\b/i.test(raw)) return "Automatic";
  if (/\b(manual|stick shift)\b/i.test(raw)) return "Manual";
  return raw || "N/A";
}

type DetailProps = {
  car: Vehicle | null;
  suggestions: Vehicle[];
  inventoryOptions: Vehicle[];
};

export default function VehicleDetail({ car, suggestions, inventoryOptions }: DetailProps) {
  const [theme, setTheme] = React.useState<"dark" | "light">("dark");
  const selectTheme = (value: "dark" | "light") => {
    setTheme(value);
    try { window.localStorage.setItem("hybridrm-inventory-theme", value); } catch {}
  };
  const [detailTab, setDetailTab] = React.useState<"description" | "specification">("specification");
  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem("hybridrm-inventory-theme");
      if (saved === "light" || saved === "dark") setTheme(saved);
    } catch {}
  }, []);
  const [current, setCurrent] = React.useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);
  const [isDescriptionOpen, setIsDescriptionOpen] = React.useState(false);
  const [isPrequalOpen, setIsPrequalOpen] = React.useState(false);
  const galleryTouchStart = React.useRef<{ x: number; y: number } | null>(null);
  const suppressGalleryClick = React.useRef(false);

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

  // Compact vehicle actions
  const [activePanel, setActivePanel] = React.useState<
    "contact" | "estimate" | null
  >(null);
  const [contactAction, setContactAction] = React.useState<
    "availability" | "offer" | "testdrive"
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
    <main data-theme={theme} className="vehicle-page min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-sm text-neutral-400">Vehicle not found.</p>
        <Link
          href="/"
          className="mt-4 inline-flex text-sm text-neutral-300 underline-offset-2 hover:underline"
        >
          ← Back to inventory
        </Link>
      </div>
      <style jsx>{`
        .vehicle-page {--detail-text-50:#fafafa;--detail-bg-50:#fafafa;--detail-border-50:#fafafa;--detail-text-100:#f5f5f5;--detail-bg-100:#f5f5f5;--detail-border-100:#f5f5f5;--detail-text-200:#e5e5e5;--detail-bg-200:#e5e5e5;--detail-border-200:#e5e5e5;--detail-text-300:#d4d4d4;--detail-bg-300:#d4d4d4;--detail-border-300:#d4d4d4;--detail-text-400:#a3a3a3;--detail-bg-400:#a3a3a3;--detail-border-400:#a3a3a3;--detail-text-500:#737373;--detail-bg-500:#737373;--detail-border-500:#737373;--detail-text-600:#525252;--detail-bg-600:#525252;--detail-border-600:#525252;--detail-text-700:#404040;--detail-bg-700:#404040;--detail-border-700:#404040;--detail-text-800:#262626;--detail-bg-800:#262626;--detail-border-800:#262626;--detail-text-900:#171717;--detail-bg-900:#171717;--detail-border-900:#171717;--detail-text-950:#0a0a0a;--detail-bg-950:#0a0a0a;--detail-border-950:#0a0a0a;--detail-accent:#34d399;background:#050505;color:#f5f5f5;color-scheme:dark;}
        .vehicle-page[data-theme="light"] {--detail-text-50:#171717;--detail-bg-50:#171717;--detail-border-50:#171717;--detail-text-100:#171717;--detail-bg-100:#171717;--detail-border-100:#171717;--detail-text-200:#262626;--detail-bg-200:#171717;--detail-border-200:#171717;--detail-text-300:#404040;--detail-bg-300:#f5f5f5;--detail-border-300:#dedede;--detail-text-400:#5c5c5c;--detail-bg-400:#f5f5f5;--detail-border-400:#dedede;--detail-text-500:#666;--detail-bg-500:#f5f5f5;--detail-border-500:#dedede;--detail-text-600:#525252;--detail-bg-600:#f5f5f5;--detail-border-600:#dedede;--detail-text-700:#404040;--detail-bg-700:#f5f5f5;--detail-border-700:#dedede;--detail-text-800:#262626;--detail-bg-800:#f5f5f5;--detail-border-800:#dedede;--detail-text-900:#171717;--detail-bg-900:#f5f5f5;--detail-border-900:#dedede;--detail-text-950:#fafafa;--detail-bg-950:#ffffff;--detail-border-950:#dedede;--detail-accent:#047857;background:#ffffff;color:#171717;color-scheme:light;}
        header { color-scheme:dark; }
      `}</style>
    </main>
  );
}

  const mainPhoto = car.photos[current] ?? "";
  const simplifiedBodyType = (() => {
    const body = (vinInfo?.bodyClass || "").toLowerCase();

    if (!body) return "N/A";
    if (body.includes("sport utility") || body.includes("[suv]") || body.includes("multipurpose vehicle")) return "SUV";
    if (body.includes("pickup")) return "Pickup";
    if (body.includes("hatchback")) return "Hatchback";
    if (body.includes("sedan")) return "Sedan";
    if (body.includes("coupe")) return "Coupe";
    if (body.includes("convertible") || body.includes("cabriolet")) return "Convertible";
    if (body.includes("wagon")) return "Wagon";
    if (body.includes("minivan")) return "Minivan";
    if (body.includes("van")) return "Van";
    if (body.includes("roadster")) return "Roadster";

    return vinInfo?.bodyClass || "N/A";
  })();

  const cleanDescription = vehicleOnlyDescription(car.description || "");

  const friendlyOverview = (() => {
    const name = [car.year, car.make, car.model].filter(Boolean).join(" ");
    const body = simplifiedBodyType === "N/A" ? "" : simplifiedBodyType;
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
    if (vinInfo?.mpgCity || vinInfo?.mpgHighway || vinInfo?.mpgCombined) {
      const mpgParts = [
        vinInfo?.mpgCity ? `${vinInfo.mpgCity} city` : "",
        vinInfo?.mpgHighway ? `${vinInfo.mpgHighway} highway` : "",
        vinInfo?.mpgCombined ? `${vinInfo.mpgCombined} combined` : "",
      ].filter(Boolean);

      if (mpgParts.length) {
        pieces.push(`EPA fuel economy is approximately ${mpgParts.join(", ")} MPG.`);
      }
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
    const transmissionDetail = car.transmissionDetail || (/\b(cvt|continuously variable)\b/i.test(car.transmission) ? car.transmission : "");
    if (transmissionDetail && !cleanDescription.toLowerCase().includes(transmissionDetail.toLowerCase())) {
      pieces.push(`Transmission: ${transmissionDetail}.`);
    }

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
    <main data-theme={theme} className="vehicle-page min-h-screen">
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

      <div className="mx-auto max-w-7xl space-y-10 px-4 pb-24 pt-6 sm:px-8 sm:pb-12">
        <div className="space-y-10">
          <section className="min-w-0">
            <div className="mb-3 flex items-center justify-between gap-3">
              <Link
                href="/inventory"
                aria-label="Back to inventory"
                className="inline-flex h-11 w-11 items-center justify-center text-[color:var(--detail-text-100)] transition hover:bg-[var(--detail-bg-900)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m6-6-6 6 6 6" />
                </svg>
              </Link>
              <div role="group" aria-label="Appearance" className="inline-flex items-center rounded-full border border-[var(--detail-border-800)] bg-[var(--detail-bg-950)] p-1">
                {(["dark", "light"] as const).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    aria-label={mode === "dark" ? "Dark mode" : "Light mode"}
                    aria-pressed={theme === mode}
                    onClick={() => selectTheme(mode)}
                    className={`flex h-10 w-10 items-center justify-center rounded-full border text-[color:var(--detail-text-100)] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current ${theme === mode ? "border-[var(--detail-border-100)] bg-[var(--detail-bg-800)]" : "border-transparent hover:bg-[var(--detail-bg-900)]"}`}
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
                  </button>
                ))}
              </div>
            </div>
            <div className="relative flex w-full items-center justify-center">

              <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-10 h-40 bg-gradient-to-b from-black/60 to-transparent sm:h-52" />
              <div className="pointer-events-none absolute inset-x-14 top-5 z-10 flex flex-col items-center gap-3 text-center text-white sm:top-10">
                <h1 className="text-lg font-semibold uppercase leading-tight tracking-wide sm:text-2xl lg:text-3xl [text-shadow:0_2px_8px_rgba(0,0,0,0.7)]">
                  {car.year} {car.make} {car.model}
                </h1>
                {car.price != null && (
                  <p className="bg-black/75 px-4 py-1.5 text-base font-semibold tracking-wide sm:text-lg">
                    ${car.price.toLocaleString()}
                  </p>
                )}
              </div>
              {mainPhoto ? (
                <div className="relative flex w-full items-center justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (suppressGalleryClick.current) {
                        suppressGalleryClick.current = false;
                        return;
                      }
                      setIsLightboxOpen(true);
                    }}
                    onTouchStart={(e) => {
                      galleryTouchStart.current = {
                        x: e.touches[0].clientX,
                        y: e.touches[0].clientY,
                      };
                    }}
                    onTouchEnd={(e) => {
                      const start = galleryTouchStart.current;
                      galleryTouchStart.current = null;
                      if (!start || !hasMultiplePhotos) return;

                      const deltaX = e.changedTouches[0].clientX - start.x;
                      const deltaY = e.changedTouches[0].clientY - start.y;
                      if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
                        suppressGalleryClick.current = true;
                        if (deltaX < 0) goNext();
                        else goPrev();
                        window.setTimeout(() => {
                          suppressGalleryClick.current = false;
                        }, 400);
                      }
                    }}
                    onTouchCancel={() => {
                      galleryTouchStart.current = null;
                    }}
                    className="group relative flex w-full touch-pan-y items-center justify-center"
                  >
                    <img
                      src={mainPhoto}
                      alt={car.title}
                      className="block w-full max-h-[75vh] object-contain"
                    />
                    <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-2">
                      <span className="rounded-full bg-black/70 px-2.5 py-1 text-sm text-white backdrop-blur">
                        {current + 1} / {car.photos.length}
                      </span>
                      <span className="hidden rounded-full bg-black/70 px-2.5 py-1 text-sm text-white backdrop-blur sm:inline">
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
                <div className="flex h-[320px] w-full items-center justify-center text-xs text-[color:var(--detail-text-500)] sm:h-[420px]">
                  Photo coming soon
                </div>
              )}
            </div>


</section>

          <div className="mx-auto w-full max-w-4xl space-y-6">
            <section className="vehicle-information text-sm">
            <div role="tablist" aria-label="Vehicle information" className="flex border-b border-[var(--detail-border-800)]">
              {(["specification", "description"] as const).map(tab => (
                <button key={tab} id={`vehicle-${tab}-tab`} role="tab" type="button"
                  aria-selected={detailTab === tab} aria-controls={`vehicle-${tab}-panel`}
                  onClick={() => setDetailTab(tab)}
                  className={`border-b-2 px-5 py-4 text-sm sm:text-base font-semibold ${detailTab === tab ? "border-[var(--detail-border-100)] text-[color:var(--detail-text-100)]" : "border-transparent text-[color:var(--detail-text-400)]"}`}>
                  {tab === "description" ? "Description" : "Specification"}
                </button>
              ))}
            </div>
            <div id="vehicle-description-panel" role="tabpanel" aria-labelledby="vehicle-description-tab" hidden={detailTab !== "description"} className="py-8">
              <p className="whitespace-pre-line text-base leading-8 text-[color:var(--detail-text-300)]">{friendlyOverview || cleanDescription}</p>
            </div>
            <div id="vehicle-specification-panel" role="tabpanel" aria-labelledby="vehicle-specification-tab" hidden={detailTab !== "specification"}>
            <div className="mt-5 border-y border-[var(--detail-border-800)] py-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-7 text-sm">
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-medium uppercase tracking-[0.08em] text-[color:var(--detail-text-400)]"><Gauge className="h-3.5 w-3.5" />Mileage</p>
                  <p className="mt-1 text-sm font-medium text-[color:var(--detail-text-100)]">
                    {car.mileage != null ? `${car.mileage.toLocaleString()} mi` : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-medium uppercase tracking-[0.08em] text-[color:var(--detail-text-400)]"><FileText className="h-3.5 w-3.5" />Title</p>
                  <p className="mt-1 text-sm font-medium text-[color:var(--detail-text-100)]">{car.titleStatus || "N/A"}</p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-medium uppercase tracking-[0.08em] text-[color:var(--detail-text-400)]"><Fuel className="h-3.5 w-3.5" />Fuel</p>
                  <p className="mt-1 text-sm font-medium text-[color:var(--detail-text-100)]">{car.fuel || vinInfo?.fuel || "N/A"}</p>
                </div>
                {(vinInfo?.mpgCity || vinInfo?.mpgHighway || vinInfo?.mpgCombined) && (
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-medium uppercase tracking-[0.08em] text-[color:var(--detail-text-400)]"><Gauge className="h-3.5 w-3.5" />MPG</p>
                    <p className="mt-1 text-sm font-medium text-[color:var(--detail-text-100)]">
                      {vinInfo?.mpgCity ? `${vinInfo.mpgCity} city` : ""}
                      {vinInfo?.mpgCity && vinInfo?.mpgHighway ? " · " : ""}
                      {vinInfo?.mpgHighway ? `${vinInfo.mpgHighway} hwy` : ""}
                    </p>
                    {vinInfo?.mpgCombined && (
                      <p className="mt-0.5 text-sm text-[color:var(--detail-text-500)]">
                        {vinInfo.mpgCombined} combined
                      </p>
                    )}
                  </div>
                )}
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-medium uppercase tracking-[0.08em] text-[color:var(--detail-text-400)]"><Settings className="h-3.5 w-3.5" />Transmission</p>
                  <p className="mt-1 text-sm font-medium text-[color:var(--detail-text-100)]">
                    {displayTransmission(car.transmission || vinInfo?.transmission || "")}
                  </p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-medium uppercase tracking-[0.08em] text-[color:var(--detail-text-400)]"><Palette className="h-3.5 w-3.5" />Exterior</p>
                  <p className="mt-1 text-sm font-medium text-[color:var(--detail-text-100)]">{car.exterior || "N/A"}</p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-medium uppercase tracking-[0.08em] text-[color:var(--detail-text-400)]"><Cog className="h-3.5 w-3.5" />Engine</p>
                  <p className="mt-1 text-sm font-medium text-[color:var(--detail-text-100)]">
                    {vinInfo?.engineCylinders
                      ? `${vinInfo.engineCylinders} cyl${vinInfo.engineDisplacementL ? ` · ${vinInfo.engineDisplacementL}L` : ""}`
                      : car.engine || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-medium uppercase tracking-[0.08em] text-[color:var(--detail-text-400)]"><CarIcon className="h-3.5 w-3.5" />Body Type</p>
                  <p className="mt-1 text-sm font-medium text-[color:var(--detail-text-100)]">{simplifiedBodyType}</p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-medium uppercase tracking-[0.08em] text-[color:var(--detail-text-400)]"><GitBranch className="h-3.5 w-3.5" />Drivetrain</p>
                  <p className="mt-1 text-sm font-medium text-[color:var(--detail-text-100)]">{vinInfo?.driveType || "N/A"}</p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-sm font-medium uppercase tracking-[0.08em] text-[color:var(--detail-text-400)]">VIN</p>
                  <p className="mt-1 break-all font-mono text-sm uppercase text-[color:var(--detail-text-100)]">{car.vin || "N/A"}</p>
                </div>
                {vinInfo?.trim && (
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.08em] text-[color:var(--detail-text-400)]">Trim</p>
                    <p className="mt-1 text-sm font-medium text-[color:var(--detail-text-100)]">{vinInfo.trim}</p>
                  </div>
                )}
                {vinInfo?.make && vinInfo.make.toLowerCase().trim() !== car.make.toLowerCase().trim() && (
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.08em] text-[color:var(--detail-text-400)]">VIN Make</p>
                    <p className="mt-1 text-sm font-medium text-[color:var(--detail-text-100)]">{vinInfo.make}</p>
                  </div>
                )}
                {vinInfo?.model && vinInfo.model.toLowerCase().trim() !== car.model.toLowerCase().trim() && (
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.08em] text-[color:var(--detail-text-400)]">VIN Model</p>
                    <p className="mt-1 text-sm font-medium text-[color:var(--detail-text-100)]">{vinInfo.model}</p>
                  </div>
                )}
              </div>
            </div>

            {vinLoading && <p className="mt-4 text-sm text-[color:var(--detail-text-400)]">Decoding VIN…</p>}
            {vinError && <p className="mt-4 text-sm text-red-400">{vinError}</p>}


            </div>
            </section>
            <button
              type="button"
              onClick={() => setIsPrequalOpen(true)}
              className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-[var(--detail-bg-100)] px-4 py-3 text-sm font-semibold text-[color:var(--detail-text-950)] transition hover:bg-[var(--detail-bg-200)]"
            >
              Get Pre-Qualified for This Vehicle
            </button>
            <section className="vehicle-actions grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() =>
                  setActivePanel((current) =>
                    current === "contact" ? null : "contact"
                  )
                }
                className={`group flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                  activePanel === "contact"
                    ? "border-[var(--detail-border-200)] bg-[var(--detail-bg-100)] text-[color:var(--detail-text-950)]"
                    : "border-[var(--detail-border-800)] bg-[var(--detail-bg-900)] text-[color:var(--detail-text-100)] hover:border-[var(--detail-border-600)] hover:bg-[var(--detail-bg-900)]"
                }`}
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                  activePanel === "contact"
                    ? "border-black/10 bg-black/5"
                    : "border-[var(--detail-border-800)] bg-[var(--detail-bg-950)]"
                }`}>
                  <MessageCircle className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">Contact Dealer</span>
                  <span className={`mt-0.5 block text-sm ${
                    activePanel === "contact" ? "text-[color:var(--detail-text-600)]" : "text-[color:var(--detail-text-500)]"
                  }`}>
                    Availability, offer or test drive
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setActivePanel((current) =>
                    current === "estimate" ? null : "estimate"
                  )
                }
                className={`group flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                  activePanel === "estimate"
                    ? "border-[var(--detail-border-200)] bg-[var(--detail-bg-100)] text-[color:var(--detail-text-950)]"
                    : "border-[var(--detail-border-800)] bg-[var(--detail-bg-900)] text-[color:var(--detail-text-100)] hover:border-[var(--detail-border-600)] hover:bg-[var(--detail-bg-900)]"
                }`}
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                  activePanel === "estimate"
                    ? "border-black/10 bg-black/5"
                    : "border-[var(--detail-border-800)] bg-[var(--detail-bg-950)]"
                }`}>
                  <Calculator className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">Estimated Payment</span>
                  <span className={`mt-0.5 block text-sm ${
                    activePanel === "estimate" ? "text-[color:var(--detail-text-600)]" : "text-[color:var(--detail-text-500)]"
                  }`}>
                    Calculate an estimated monthly payment
                  </span>
                </span>
              </button>

            {activePanel === "contact" && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-sm"
                onClick={() => setActivePanel(null)}
              >
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="contact-dealer-title"
                  className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--detail-border-700)] bg-[var(--detail-bg-950)] p-5 shadow-2xl sm:p-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mb-4 flex items-center justify-between gap-4 border-b border-[var(--detail-border-800)] pb-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.14em] text-[color:var(--detail-text-500)]">
                        {car.make} {car.model} {car.year}
                      </p>
                      <h2 id="contact-dealer-title" className="mt-1 text-lg font-semibold text-[color:var(--detail-text-100)]">
                        Contact Dealer
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActivePanel(null)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--detail-text-400)] transition hover:bg-[var(--detail-bg-800)] hover:text-[color:var(--detail-text-100)]"
                      aria-label="Close contact dealer"
                    >
                      ✕
                    </button>
                  </div>
            {activePanel === "contact" && (
              <div className="mt-3 border-t border-[var(--detail-border-800)] pt-3">
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: "availability", label: "Confirm Availability", icon: BadgeCheck },
                    { id: "offer", label: "Make an Offer", icon: BadgeDollarSign },
                    { id: "testdrive", label: "Schedule Test Drive", icon: CalendarDays },
                  ].map((option) => { const OptionIcon = option.icon; return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        setContactAction(
                          option.id as "availability" | "offer" | "testdrive"
                        )
                      }
                      className={`rounded-md border px-2.5 py-1.5 text-sm font-medium transition ${
                        contactAction === option.id
                          ? "border-[var(--detail-border-300)] bg-[var(--detail-bg-100)] text-[color:var(--detail-text-950)]"
                          : "border-[var(--detail-border-700)] text-[color:var(--detail-text-300)] hover:border-[var(--detail-border-500)]"
                      }`}
                    >
                      <OptionIcon className="mr-1.5 inline h-3.5 w-3.5" />
                      {option.label}
                    </button>
                  ); })}
                </div>
              </div>
            )}

            {activePanel === "contact" && contactAction === "availability" && (
              <form
                onSubmit={handleAvailabilitySubmit}
                className="mt-5 space-y-3 border-t border-[var(--detail-border-800)] pt-5"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="block text-sm text-[color:var(--detail-text-400)]">
                      First Name
                    </label>
                    <input
                      name="firstName"
                      required
                      className="w-full rounded border border-[var(--detail-border-700)] bg-[var(--detail-bg-950)] px-2 py-1 text-sm text-[color:var(--detail-text-100)] outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm text-[color:var(--detail-text-400)]">
                      Last Name
                    </label>
                    <input
                      name="lastName"
                      required
                      className="w-full rounded border border-[var(--detail-border-700)] bg-[var(--detail-bg-950)] px-2 py-1 text-sm text-[color:var(--detail-text-100)] outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm text-[color:var(--detail-text-400)]">
                      Phone Number
                    </label>
                    <input
                      name="phone"
                      required
                      className="w-full rounded border border-[var(--detail-border-700)] bg-[var(--detail-bg-950)] px-2 py-1 text-sm text-[color:var(--detail-text-100)] outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm text-[color:var(--detail-text-400)]">
                      Email Address (optional)
                    </label>
                    <input
                      name="email"
                      type="email"
                      className="w-full rounded border border-[var(--detail-border-700)] bg-[var(--detail-bg-950)] px-2 py-1 text-sm text-[color:var(--detail-text-100)] outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm text-[color:var(--detail-text-400)]">
                    Comments (optional)
                  </label>
                  <textarea
                    name="comments"
                    rows={3}
                    className="w-full rounded border border-[var(--detail-border-700)] bg-[var(--detail-bg-950)] px-2 py-1 text-sm text-[color:var(--detail-text-100)] outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-2 w-full rounded bg-[var(--detail-bg-100)] px-3 py-2 text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--detail-text-950)] hover:bg-[var(--detail-bg-200)]"
                >
                  Confirm Availability
                </button>
              </form>
            )}

            {activePanel === "contact" && contactAction === "offer" && (
              <form
                onSubmit={handleMakeOfferSubmit}
                className="mt-5 space-y-3 border-t border-[var(--detail-border-800)] pt-5"
              >
                <p className="text-sm font-semibold text-[color:var(--detail-text-200)]">
                  Make an Offer
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="block text-sm text-[color:var(--detail-text-400)]">
                      Name
                    </label>
                    <input
                      name="name"
                      required
                      className="w-full rounded border border-[var(--detail-border-700)] bg-[var(--detail-bg-950)] px-2 py-1 text-sm text-[color:var(--detail-text-100)] outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm text-[color:var(--detail-text-400)]">
                      Phone
                    </label>
                    <input
                      name="phone"
                      required
                      className="w-full rounded border border-[var(--detail-border-700)] bg-[var(--detail-bg-950)] px-2 py-1 text-sm text-[color:var(--detail-text-100)] outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm text-[color:var(--detail-text-400)]">
                      Email (optional)
                    </label>
                    <input
                      name="email"
                      type="email"
                      className="w-full rounded border border-[var(--detail-border-700)] bg-[var(--detail-bg-950)] px-2 py-1 text-sm text-[color:var(--detail-text-100)] outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm text-[color:var(--detail-text-400)]">
                      Offer amount (USD)
                    </label>
                    <input
                      name="offer"
                      type="number"
                      min={0}
                      className="w-full rounded border border-[var(--detail-border-700)] bg-[var(--detail-bg-950)] px-2 py-1 text-sm text-[color:var(--detail-text-100)] outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm text-[color:var(--detail-text-400)]">
                    Message
                  </label>
                  <textarea
                    name="message"
                    rows={3}
                    className="w-full rounded border border-[var(--detail-border-700)] bg-[var(--detail-bg-950)] px-2 py-1 text-sm text-[color:var(--detail-text-100)] outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-2 w-full rounded bg-[var(--detail-bg-100)] px-3 py-2 text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--detail-text-950)] hover:bg-[var(--detail-bg-200)]"
                >
                  Send Offer
                </button>
              </form>
            )}

            {activePanel === "contact" && contactAction === "testdrive" && (
              <form
                onSubmit={handleTestDriveSubmit}
                className="mt-5 space-y-3 border-t border-[var(--detail-border-800)] pt-5"
              >
                <p className="text-sm font-semibold text-[color:var(--detail-text-200)]">
                  Schedule Test Drive
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="block text-sm text-[color:var(--detail-text-400)]">
                      Name
                    </label>
                    <input
                      name="name"
                      required
                      className="w-full rounded border border-[var(--detail-border-700)] bg-[var(--detail-bg-950)] px-2 py-1 text-sm text-[color:var(--detail-text-100)] outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm text-[color:var(--detail-text-400)]">
                      Phone
                    </label>
                    <input
                      name="phone"
                      required
                      className="w-full rounded border border-[var(--detail-border-700)] bg-[var(--detail-bg-950)] px-2 py-1 text-sm text-[color:var(--detail-text-100)] outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm text-[color:var(--detail-text-400)]">
                      Email (optional)
                    </label>
                    <input
                      name="email"
                      type="email"
                      className="w-full rounded border border-[var(--detail-border-700)] bg-[var(--detail-bg-950)] px-2 py-1 text-sm text-[color:var(--detail-text-100)] outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm text-[color:var(--detail-text-400)]">
                      Preferred contact
                    </label>
                    <select
                      name="preferredContact"
                      className="w-full rounded border border-[var(--detail-border-700)] bg-[var(--detail-bg-950)] px-2 py-1 text-sm text-[color:var(--detail-text-100)] outline-none focus:border-emerald-500"
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
                    <label className="block text-sm text-[color:var(--detail-text-400)]">
                      Preferred date
                    </label>
                    <input
                      type="date"
                      name="preferredDate"
                      className="w-full rounded border border-[var(--detail-border-700)] bg-[var(--detail-bg-950)] px-2 py-1 text-sm text-[color:var(--detail-text-100)] outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm text-[color:var(--detail-text-400)]">
                      Preferred time
                    </label>
                    <input
                      type="time"
                      name="preferredTime"
                      className="w-full rounded border border-[var(--detail-border-700)] bg-[var(--detail-bg-950)] px-2 py-1 text-sm text-[color:var(--detail-text-100)] outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm text-[color:var(--detail-text-400)]">
                    Comments
                  </label>
                  <textarea
                    name="comments"
                    rows={3}
                    className="w-full rounded border border-[var(--detail-border-700)] bg-[var(--detail-bg-950)] px-2 py-1 text-sm text-[color:var(--detail-text-100)] outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  className="mt-2 w-full rounded bg-[var(--detail-bg-100)] px-3 py-2 text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--detail-text-950)] hover:bg-[var(--detail-bg-200)]"
                >
                  Send Request
                </button>
              </form>
            )}
                </div>
              </div>
            )}
            </section>
          </div>
        </div>

            <div className="mt-3">
            {activePanel === "estimate" && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-sm"
                onClick={() => setActivePanel(null)}
              >
                <section
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="payment-estimator-title"
                  className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-[var(--detail-border-700)] bg-[var(--detail-bg-950)] p-5 text-xs shadow-2xl sm:p-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mb-4 flex items-center justify-between gap-4 border-b border-[var(--detail-border-800)] pb-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.14em] text-[color:var(--detail-text-500)]">
                        {car.make} {car.model} {car.year}
                      </p>
                      <h2 id="payment-estimator-title" className="mt-1 text-lg font-semibold text-[color:var(--detail-text-100)]">
                        Estimated Payment
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActivePanel(null)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--detail-text-400)] transition hover:bg-[var(--detail-bg-800)] hover:text-[color:var(--detail-text-100)]"
                      aria-label="Close payment estimator"
                    >
                      ✕
                    </button>
                  </div>
                {!vehiclePrice ? (
                  <p className="text-sm text-[color:var(--detail-text-400)]">
                    Price is not set for this vehicle. Please contact the dealer
                    for financing options.
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-[var(--detail-border-800)] bg-black/20">
                    <div className="grid lg:grid-cols-[0.9fr_1.35fr]">
                      <div className="flex flex-col justify-between border-b border-[var(--detail-border-800)] p-5 lg:border-b-0 lg:border-r sm:p-6">
                        <div>
                          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--detail-border-700)] bg-[var(--detail-bg-900)] text-lg text-[color:var(--detail-text-100)]">
                            $
                          </div>
                          <p className="text-lg font-semibold text-[color:var(--detail-text-100)]">
                            Estimate your payment
                          </p>
                          <p className="mt-1 max-w-sm text-sm leading-relaxed text-[color:var(--detail-text-400)]">
                            Get a quick payment estimate based on basic loan terms.
                          </p>

                          <div className="mt-5 space-y-2 border-t border-[var(--detail-border-800)] pt-4 text-sm">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-[color:var(--detail-text-500)]">Vehicle</span>
                              <span className="text-right font-medium text-[color:var(--detail-text-200)]">
                                {car.make} {car.model} {car.year}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-[color:var(--detail-text-500)]">Price</span>
                              <span className="font-semibold text-[color:var(--detail-accent)]">
                                {`${vehiclePrice.toLocaleString()}`}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-[color:var(--detail-text-500)]">Mileage</span>
                              <span className="text-[color:var(--detail-text-200)]">
                                {car.mileage != null
                                  ? `${car.mileage.toLocaleString()} mi`
                                  : "N/A"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-[color:var(--detail-text-500)]">Title</span>
                              <span className="text-[color:var(--detail-text-200)]">
                                {car.titleStatus || "N/A"}
                              </span>
                            </div>
                            <div className="mt-4 border-t border-[var(--detail-border-800)] pt-4">
                              <label className="block text-sm font-medium uppercase tracking-[0.08em] text-[color:var(--detail-text-400)]">
                                Estimate another vehicle
                              </label>
                              <select
                                value={car.id}
                                onChange={(e) => {
                                  const nextId = e.target.value;
                                  if (nextId && nextId !== car.id) {
                                    window.location.href = `/${encodeURIComponent(nextId)}`;
                                  }
                                }}
                                className="mt-2 h-10 w-full rounded-lg border border-[var(--detail-border-700)] bg-[var(--detail-bg-950)] px-3 text-sm text-[color:var(--detail-text-100)] outline-none focus:border-[var(--detail-border-400)]"
                              >
                                {inventoryOptions.map((vehicle) => (
                                  <option key={vehicle.id} value={vehicle.id}>
                                    {vehicle.year} {vehicle.make} {vehicle.model}
                                    {vehicle.price != null
                                      ? ` - ${vehicle.price.toLocaleString()}`
                                      : ""}
                                  </option>
                                ))}
                              </select>
                              <p className="mt-2 text-sm leading-relaxed text-[color:var(--detail-text-500)]">
                                Selecting another vehicle opens its page and loads its payment estimate.
                              </p>
                            </div>
                          </div>
                        </div>

                        <p className="mt-5 text-sm leading-relaxed text-[color:var(--detail-text-400)]">
                          Estimate only. Final terms depend on credit approval,
                          taxes, DMV fees and signed contract.
                        </p>
                      </div>

                      <div className="p-5 sm:p-6">
                        <div className="grid gap-3 sm:grid-cols-3">
                          <label className="space-y-1">
                            <span className="block text-sm uppercase tracking-[0.1em] text-[color:var(--detail-text-500)]">
                              Down Payment
                            </span>
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
                              className="h-10 w-full rounded-lg border border-[var(--detail-border-700)] bg-[var(--detail-bg-950)] px-3 text-sm text-[color:var(--detail-text-100)] outline-none focus:border-[var(--detail-border-400)]"
                            />
                          </label>

                          <label className="space-y-1">
                            <span className="block text-sm uppercase tracking-[0.1em] text-[color:var(--detail-text-500)]">
                              Loan Term
                            </span>
                            <select
                              value={termMonths}
                              onChange={(e) => setTermMonths(Number(e.target.value))}
                              className="h-10 w-full rounded-lg border border-[var(--detail-border-700)] bg-[var(--detail-bg-950)] px-3 text-sm text-[color:var(--detail-text-100)] outline-none focus:border-[var(--detail-border-400)]"
                            >
                              {[24, 36, 48, 60].map((months) => (
                                <option key={months} value={months}>
                                  {months} months
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="space-y-1">
                            <span className="block text-sm uppercase tracking-[0.1em] text-[color:var(--detail-text-500)]">
                              APR
                            </span>
                            <select
                              value={creditTier}
                              onChange={(e) =>
                                setCreditTier(
                                  e.target.value as
                                    | "low"
                                    | "midLow"
                                    | "midHigh"
                                    | "high"
                                )
                              }
                              className="h-10 w-full rounded-lg border border-[var(--detail-border-700)] bg-[var(--detail-bg-950)] px-3 text-sm text-[color:var(--detail-text-100)] outline-none focus:border-[var(--detail-border-400)]"
                            >
                              <option value="low">22.00%</option>
                              <option value="midLow">17.99%</option>
                              <option value="midHigh">12.99%</option>
                              <option value="high">6.99%</option>
                            </select>
                          </label>
                        </div>

                        <div className="mt-5">
                          <div className="min-w-[230px] rounded-lg border border-[var(--detail-border-800)] bg-[var(--detail-bg-950)] px-4 py-4 text-sm text-[color:var(--detail-text-400)]">
                            <div className="space-y-2">
                              <div className="flex justify-between gap-5">
                                <span>Vehicle price</span>
                                <span className="font-medium text-[color:var(--detail-text-200)]">
                                  ${vehiclePrice.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between gap-5">
                                <span>Down payment</span>
                                <span className="font-medium text-[color:var(--detail-text-200)]">
                                  -${downPayment.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between gap-5">
                                <span>Amount financed</span>
                                <span className="font-medium text-[color:var(--detail-text-100)]">
                                  ${amountFinanced.toLocaleString(undefined, {
                                    maximumFractionDigits: 0,
                                  })}
                                </span>
                              </div>
                              <div className="flex justify-between gap-5">
                                <span>APR (estimated)</span>
                                <span className="font-medium text-[color:var(--detail-text-200)]">
                                  {apr.toFixed(2)}%
                                </span>
                              </div>
                              <div className="flex justify-between gap-5">
                                <span>Term</span>
                                <span className="font-medium text-[color:var(--detail-text-200)]">
                                  {termMonths} months
                                </span>
                              </div>
                            </div>

                            <div className="mt-4 rounded-lg bg-[var(--detail-bg-900)] p-3">
                              <p className="text-sm text-[color:var(--detail-text-500)]">
                                Estimated payment
                              </p>
                              <p className="mt-1 text-2xl font-semibold text-[color:var(--detail-accent)]">
                                {monthlyPayment
                                  ? `${monthlyPayment.toFixed(2)} / mo`
                                  : "--"}
                              </p>
                              <p className="mt-2 text-sm leading-relaxed text-[color:var(--detail-text-400)]">
                                Example only. Does not include taxes, DMV fees or dealer charges.
                                Not all customers will qualify for these terms. Subject to credit
                                approval and signed contract.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                </section>
              </div>
            )}
          </div>

        <section className="space-y-3">
          {suggestions.length > 0 && (
            <div className="border-t border-[var(--detail-border-800)] pt-8 text-sm">
              <p className="mb-3 text-sm font-semibold text-[color:var(--detail-text-100)]">
                You may also like
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {suggestions.map((s) => {
                  const thumb = s.photos[0] ?? "/placeholder-car.jpg";
                  return (
                    <Link
                      key={s.id}
                      href={`/${encodeURIComponent(s.id)}`}
                      className="group overflow-hidden transition"
                    >
                      <div className="aspect-[16/10] w-full overflow-hidden bg-[var(--detail-bg-900)]">
                        <img
                          src={thumb}
                          alt={s.title}
                          className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform"
                        />
                      </div>
                      <p className="mt-2 text-sm text-[color:var(--detail-text-400)]">
                        {s.year} {s.make}
                      </p>
                      <p className="text-xs font-semibold text-[color:var(--detail-text-50)] line-clamp-1">
                        {s.model || s.title}
                      </p>
                      {s.price != null && (
                        <p className="mt-1 text-sm font-semibold text-[color:var(--detail-accent)]">
                          ${s.price.toLocaleString()}
                        </p>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-center border-t border-[var(--detail-border-900)] pt-7">
            <a
              href="https://www.google.com/maps/search/?api=1&query=6726+Reseda+Blvd+Suite+A7+Reseda+CA+91335"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-[var(--detail-border-700)] px-5 py-2.5 text-sm font-medium text-[color:var(--detail-text-300)] transition hover:border-[var(--detail-border-400)] hover:bg-[var(--detail-bg-900)] hover:text-[color:var(--detail-text-100)]"
            >
              View dealership location
            </a>
          </div>
        </section>
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => window.scrollTo({
              top: 0,
              behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
            })}
            className="inline-flex min-h-11 items-center gap-2 px-4 py-2 text-sm font-medium text-[color:var(--detail-text-300)] transition hover:text-[color:var(--detail-text-100)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m-6 6 6-6 6 6" />
            </svg>
            Back to top
          </button>
        </div>
      </div>

      {isPrequalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-3 py-4 backdrop-blur-sm sm:px-4"
          onClick={() => setIsPrequalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Get pre-qualified for this vehicle"
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[var(--detail-border-700)] bg-[var(--detail-bg-950)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <PreQualificationForm
              embedded
              selectedVehicle={[car.year, car.make, car.model].filter(Boolean).join(" ")}
              selectedVin={car.vin}
              onClose={() => setIsPrequalOpen(false)}
            />
          </div>
        </div>
      )}

      {isDescriptionOpen && friendlyOverview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
          onClick={() => setIsDescriptionOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="vehicle-description-title"
            className="relative w-full max-w-xl rounded-xl border border-[var(--detail-border-700)] bg-[var(--detail-bg-950)] p-5 shadow-2xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-[var(--detail-border-800)] pb-3">
              <h2
                id="vehicle-description-title"
                className="text-lg font-semibold text-[color:var(--detail-text-100)]"
              >
                Overview
              </h2>
              <button
                type="button"
                onClick={() => setIsDescriptionOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--detail-text-400)] transition hover:bg-[var(--detail-bg-800)] hover:text-[color:var(--detail-text-100)]"
                aria-label="Close description"
              >
                ✕
              </button>
            </div>
            <p className="mt-4 text-sm leading-6 text-[color:var(--detail-text-200)]">
              {friendlyOverview}
            </p>
          </div>
        </div>
      )}

      {isLightboxOpen && mainPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
          onClick={closeLightbox}
        >
        <div role="dialog" aria-modal="true" aria-label="Vehicle photo gallery" onClick={(e) => e.stopPropagation()} className="relative max-h-[90vh] max-w-[90vw] overflow-hidden">

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
    aria-label="Close photo gallery" className="absolute top-3 right-3 z-20 rounded-full bg-black/80 px-3 py-2 text-sm text-neutral-100 hover:bg-black"
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
      <nav aria-label="Quick contact" className="fixed bottom-4 left-0 right-0 z-40 flex justify-center px-4 sm:hidden">
        <div className="flex items-center gap-2 rounded-full border border-white/15 bg-neutral-950/90 p-1.5 shadow-xl backdrop-blur">
          <a
            href={`https://wa.me/17473544098?text=${encodeURIComponent(
              `Hi, I am interested in this vehicle: ${car.title} - ${car.price}`
            )}`}
            target="_blank"
            rel="noreferrer"
            aria-label="WhatsApp"
            className="flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/10"
          >
            <img src="/whatsapp-green.png" alt="" className="h-6 w-6 object-contain" />
          </a>
          <a
            href="tel:+17473544098"
            aria-label="Call"
            className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-100 transition hover:bg-white/10"
          >
            <Phone className="h-5 w-5" aria-hidden="true" />
          </a>
          <a
            href="https://www.instagram.com/availablehybridrm/"
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
            className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-100 transition hover:bg-white/10"
          >
            <Instagram className="h-5 w-5" aria-hidden="true" />
          </a>
        </div>
      </nav>
      <style jsx>{`
        .vehicle-page {--detail-text-50:#fafafa;--detail-bg-50:#fafafa;--detail-border-50:#fafafa;--detail-text-100:#f5f5f5;--detail-bg-100:#f5f5f5;--detail-border-100:#f5f5f5;--detail-text-200:#e5e5e5;--detail-bg-200:#e5e5e5;--detail-border-200:#e5e5e5;--detail-text-300:#d4d4d4;--detail-bg-300:#d4d4d4;--detail-border-300:#d4d4d4;--detail-text-400:#a3a3a3;--detail-bg-400:#a3a3a3;--detail-border-400:#a3a3a3;--detail-text-500:#737373;--detail-bg-500:#737373;--detail-border-500:#737373;--detail-text-600:#525252;--detail-bg-600:#525252;--detail-border-600:#525252;--detail-text-700:#404040;--detail-bg-700:#404040;--detail-border-700:#404040;--detail-text-800:#262626;--detail-bg-800:#262626;--detail-border-800:#262626;--detail-text-900:#171717;--detail-bg-900:#171717;--detail-border-900:#171717;--detail-text-950:#0a0a0a;--detail-bg-950:#0a0a0a;--detail-border-950:#0a0a0a;--detail-accent:#34d399;background:#050505;color:#f5f5f5;color-scheme:dark;}
        .vehicle-page[data-theme="light"] {--detail-text-50:#171717;--detail-bg-50:#171717;--detail-border-50:#171717;--detail-text-100:#171717;--detail-bg-100:#171717;--detail-border-100:#171717;--detail-text-200:#262626;--detail-bg-200:#171717;--detail-border-200:#171717;--detail-text-300:#404040;--detail-bg-300:#f5f5f5;--detail-border-300:#dedede;--detail-text-400:#5c5c5c;--detail-bg-400:#f5f5f5;--detail-border-400:#dedede;--detail-text-500:#666;--detail-bg-500:#f5f5f5;--detail-border-500:#dedede;--detail-text-600:#525252;--detail-bg-600:#f5f5f5;--detail-border-600:#dedede;--detail-text-700:#404040;--detail-bg-700:#f5f5f5;--detail-border-700:#dedede;--detail-text-800:#262626;--detail-bg-800:#f5f5f5;--detail-border-800:#dedede;--detail-text-900:#171717;--detail-bg-900:#f5f5f5;--detail-border-900:#dedede;--detail-text-950:#fafafa;--detail-bg-950:#ffffff;--detail-border-950:#dedede;--detail-accent:#047857;background:#ffffff;color:#171717;color-scheme:light;}
        header { color-scheme:dark; }
      `}</style>
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
        inventoryOptions: [],
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
      transmissionDetail: (c as any).transmissionDetail ?? "",
      fuel: c.fuel ?? "",
      engine: (c as any).engine ?? "",
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
  const inventoryOptions = cars
    .filter((c) => String((c as any).status ?? "available").toLowerCase() !== "sold")
    .map(mapCarToVehicle)
    .sort((a, b) => {
      const yearDiff = (b.year ?? 0) - (a.year ?? 0);
      if (yearDiff !== 0) return yearDiff;
      return `${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`);
    });

  return {
    props: {
      car,
      suggestions,
      inventoryOptions,
    },
    revalidate: 60,
  };
};

