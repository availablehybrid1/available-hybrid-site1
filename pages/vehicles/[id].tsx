// pages/vehicles/[id].tsx
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { inventory, type Vehicle } from "../../data/inventory";

/* ---------- Carrusel simple y tolerante ---------- */
function Carousel({
  images = [],
  alt,
}: {
  images?: string[];
  alt: string;
}) {
  const n = images.length;
  // Si no hay imágenes, no mostramos nada del carrusel
  if (!n) return null;

  const [i, setI] = useState(0);

  const prev = () => setI((v) => (v - 1 + n) % n);
  const next = () => setI((v) => (v + 1) % n);

  const current = images[i];

  return (
    <div className="w-full">
      <div className="relative w-full h-72 md:h-96 rounded overflow-hidden">
        <Image
          key={current}
          src={current}
          alt={`${alt} foto ${i + 1}`}
          fill
          className="object-cover"
          sizes="(max-width:768px) 100vw, 60vw"
          priority
        />

        {/* Flecha izquierda */}
        <button
          onClick={prev}
          aria-label="Anterior"
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full w-9 h-9 grid place-items-center hover:bg-black/75"
        >
          ‹
        </button>

        {/* Flecha derecha */}
        <button
          onClick={next}
          aria-label="Siguiente"
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full w-9 h-9 grid place-items-center hover:bg-black/75"
        >
          ›
        </button>
      </div>

      {/* Puntitos */}
      <div className="mt-3 flex items-center justify-center gap-2">
        {(images || []).map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            aria-label={`Ir a imagen ${idx + 1}`}
            className={`h-2.5 w-2.5 rounded-full ${
              i === idx ? "bg-gray-900" : "bg-gray-300 hover:bg-gray-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------- Página de detalle ---------- */
type Props = { car: Vehicle };

export default function VehiclePage({ car }: Props) {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-gray-900 text-white p-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">AVAILABLE HYBRID R&M INC.</h1>
          <Link href="/" className="underline text-sm hover:opacity-90">
            &larr; Volver
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        {/* Galería */}
        <section className="grid gap-6 md:grid-cols-2">
          <div>
            <Carousel images={car.photos || []} alt={car.title} />
          </div>

          <div>
            <h1 className="text-2xl font-bold">{car.title}</h1>

            <ul className="space-y-2 text-gray-800 mt-4">
              <li>
                <strong>Año:</strong> {car.year}
              </li>
              <li>
                <strong>Marca/Modelo:</strong> {car.make} {car.model}
              </li>
              <li>
                <strong>Millaje:</strong>{" "}
                {typeof car.mileage === "number"
                  ? car.mileage.toLocaleString()
                  : car.mileage}{" "}
                mi
              </li>
              <li>
                <strong>Transmisión:</strong> {car.transmission}
              </li>
              <li>
                <strong>Combustible:</strong> {car.fuel}
              </li>
              {/* VIN opcional */}
              {"vin" in car && (car as any).vin ? (
                <li>
                  <strong>VIN:</strong> {(car as any).vin}
                </li>
              ) : null}
              <li>
                <strong>Exterior:</strong> {car.exterior}
              </li>
              <li>
                <strong>Interior:</strong> {car.interior}
              </li>
            </ul>

            {/* Precio (opcional) */}
            {car.price ? (
              <p className="mt-4 text-2xl font-bold">
                ${car.price.toLocaleString()}
              </p>
            ) : null}

            {/* Descripción (opcional) */}
            {car.description ? (
              <p className="mt-4 text-gray-700">{car.description}</p>
            ) : null}

            {/* Contacto */}
            <div className="mt-6 flex gap-3">
              <a
                href="tel:7473544098"
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Llamar ahora
              </a>
              <a
                href="mailto:availablehybrid@gmail.com"
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Enviar correo
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white p-6 text-center mt-10">
        © {new Date().getFullYear()} AVAILABLE HYBRID R&M INC.
      </footer>
    </div>
  );
}

/* ---------- SSG ---------- */
export async function getStaticPaths() {
  return {
    paths: inventory.map((v) => ({ params: { id: v.id } })),
    fallback: false,
  };
}

export async function getStaticProps({
  params,
}: {
  params?: { id?: string };
}) {
  const id = String(params?.id || "");
  const car = inventory.find((v) => v.id === id) || null;

  if (!car) {
    return { notFound: true };
  }

  return { props: { car } };
}
