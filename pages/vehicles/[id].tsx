// /pages/vehicles/[id].tsx
// @ts-nocheck
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { inventory, PLACEHOLDER_IMG, type Vehicle } from '../../data/inventory'

type Props = { car: Vehicle }

export default function VehiclePage({ car }: Props) {
  const photos = (car.photos?.length ? car.photos : [PLACEHOLDER_IMG]).filter(Boolean)
  const [photoIndex, setPhotoIndex] = useState(0)

  const nextPhoto = () => setPhotoIndex((i) => (i + 1) % photos.length)
  const prevPhoto = () => setPhotoIndex((i) => (i - 1 + photos.length) % photos.length)

  return (
    <div className="min-h-screen bg-white">
      {/* HEADER */}
      <header className="bg-gray-900 text-white p-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">AVAILABLE HYBRID R&M INC.</h1>
          <Link href="/" className="underline text-sm hover:opacity-90">&larr; Volver</Link>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-5xl mx-auto p-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* GALERÍA */}
          <div>
            <div className="relative w-full h-72 md:h-96 rounded overflow-hidden">
              <Image
                key={photos[photoIndex]}
                src={photos[photoIndex]}
                alt={`${car.title} foto ${photoIndex + 1}`}
                fill
                className="object-cover"
                sizes="(max-width:768px) 100vw, 50vw"
                priority
              />

              {photos.length > 1 && (
                <>
                  <button
                    onClick={prevPhoto}
                    aria-label="Foto anterior"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 text-white px-3 py-1 rounded-full"
                  >
                    ◀
                  </button>
                  <button
                    onClick={nextPhoto}
                    aria-label="Foto siguiente"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 text-white px-3 py-1 rounded-full"
                  >
                    ▶
                  </button>
                  <div className="absolute bottom-2 left-0 right-0 text-center text-white text-xs bg-black/40 py-1">
                    {photoIndex + 1} / {photos.length}
                  </div>
                </>
              )}
            </div>

            {/* MINIATURAS */}
            {photos.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {photos.map((src, idx) => (
                  <button
                    key={src + idx}
                    onClick={() => setPhotoIndex(idx)}
                    aria-label={`Ir a la foto ${idx + 1}`}
                    className={`relative h-16 w-24 flex-shrink-0 rounded overflow-hidden border
                      ${idx === photoIndex ? 'border-gray-900' : 'border-gray-300 hover:border-gray-400'}`}
                  >
                    <Image
                      src={src}
                      alt={`${car.title} miniatura ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* DATOS */}
          <section>
            <h1 className="text-2xl font-bold">{car.title}</h1>
            <ul className="space-y-2 text-gray-800 mt-4">
              <li><strong>Año:</strong> {car.year}</li>
              <li><strong>Marca/Modelo:</strong> {car.make} {car.model}</li>
              <li><strong>Millaje:</strong> {car.mileage.toLocaleString()} mi</li>
              <li><strong>Transmisión:</strong> {car.transmission}</li>
              {car.fuel && <li><strong>Combustible:</strong> {car.fuel}</li>}
              {car.exterior && <li><strong>Exterior:</strong> {car.exterior}</li>}
              {car.interior && <li><strong>Interior:</strong> {car.interior}</li>}
              {car.vin && <li><strong>VIN:</strong> {car.vin}</li>}
            </ul>

            {car.price != null && (
              <p className="mt-4 text-2xl font-bold">${car.price.toLocaleString()}</p>
            )}

            {car.description && (
              <p className="mt-4 text-gray-700">{car.description}</p>
            )}

            <div className="mt-6 flex gap-4">
              <a
                href="tel:+18183340474"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                Llamar ahora
              </a>
              <a
                href="mailto:availablehybrid@gmail.com"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
              >
                Enviar correo
              </a>
            </div>
          </section>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="text-center text-gray-600 text-sm mt-10 mb-4">
        © {new Date().getFullYear()} AVAILABLE HYBRID R&M INC.
      </footer>
    </div>
  )
}

/* SSG */
export async function getStaticPaths() {
  return {
    paths: inventory.map((car) => ({ params: { id: car.id } })),
    fallback: false,
  }
}

export async function getStaticProps({ params }) {
  const car = inventory.find((v) => v.id === params.id)
  return { props: { car } }
}
