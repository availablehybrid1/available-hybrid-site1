// @ts-nocheck
// pages/vehicles/[id].tsx
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { inventory } from '../../data/inventory'

/** Carrusel simple con botones y gesto táctil */
function Carousel({ images, alt }) {
  const [i, setI] = useState(0)
  const n = images?.length || 1

  const prev = () => setI(v => (v - 1 + n) % n)
  const next = () => setI(v => (v + 1) % n)

  let startX = 0
  const onTouchStart = (e) => { startX = e.touches?.[0]?.clientX || 0 }
  const onTouchEnd = (e) => {
    const dx = (e.changedTouches?.[0]?.clientX || 0) - startX
    if (dx > 40) prev()
    if (dx < -40) next()
  }

  const src = images?.[i] || '/car1.jpg'

  return (
    <div className="w-full">
      <div
        className="relative w-full h-72 md:h-96 rounded overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <Image
          key={src}
          src={src}
          alt={`${alt} foto ${i + 1}`}
          fill
          className="object-cover"
          sizes="(max-width:768px) 100vw, 50vw"
          priority
        />
        <button
          onClick={prev}
          aria-label="Anterior"
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-9 h-9 grid place-items-center hover:bg-black/70"
        >
          ‹
        </button>
        <button
          onClick={next}
          aria-label="Siguiente"
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-9 h-9 grid place-items-center hover:bg-black/70"
        >
          ›
        </button>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2">
        {(images || []).map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            aria-label={`Ir a imagen ${idx + 1}`}
            className={`h-2.5 w-2.5 rounded-full ${i === idx ? 'bg-gray-900' : 'bg-gray-300 hover:bg-gray-400'}`}
          />
        ))}
      </div>
    </div>
  )
}

export default function VehiclePage({ car }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-gray-900 text-white p-6">
        <h1 className="text-2xl font-bold">AVAILABLE HYBRID R&M INC.</h1>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        <div className="mb-4">
          <Link href="/" className="text-blue-600 hover:underline">
            &larr; Volver
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Carousel images={car.photos} alt={car.title} />

          <section>
            <h1 className="text-2xl font-bold">{car.title}</h1>

            <ul className="space-y-2 text-gray-800 mt-4">
              <li><strong>Año:</strong> {car.year}</li>
              <li><strong>Marca/Modelo:</strong> {car.make} {car.model}</li>
              <li><strong>Millaje:</strong> {car.mileage?.toLocaleString?.() ?? car.mileage} mi</li>
              <li><strong>Transmisión:</strong> {car.transmission}</li>
              <li><strong>Combustible:</strong> {car.fuel}</li>
              {car.vin ? <li><strong>VIN:</strong> {car.vin}</li> : null}
              <li><strong>Exterior:</strong> {car.exterior}</li>
              <li><strong>Interior:</strong> {car.interior}</li>
            </ul>

            {car.price ? (
              <p className="mt-4 text-2xl font-bold">${(car.price?.toLocaleString?.() ?? car.price)}</p>
            ) : null}

            {car.description ? <p className="mt-4">{car.description}</p> : null}

            <div className="mt-6 flex gap-3">
              <a href="tel:7473544098" className="bg-blue-600 text-white px-4 py-2 rounded">Llamar ahora</a>
              <a href="mailto:availablehybrid@gmail.com" className="bg-green-600 text-white px-4 py-2 rounded">Enviar correo</a>
            </div>
          </section>
        </div>
      </main>

      <footer className="bg-gray-900 text-white p-6 text-center">
        © {new Date().getFullYear()} AVAILABLE HYBRID R&M INC.
      </footer>
    </div>
  )
}

/** SSG (Páginas estáticas) */
export async function getStaticPaths() {
  return {
    paths: inventory.map(v => ({ params: { id: v.id } })),
    fallback: false,
  }
}

export async function getStaticProps({ params }) {
  const id = String(params?.id || '')
  const car = inventory.find(v => v.id === id) || null
  return { props: { car } }
}
