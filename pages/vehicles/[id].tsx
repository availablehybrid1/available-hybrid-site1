import { GetStaticPaths, GetStaticProps } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { inventory, type Vehicle } from '../../data/inventory'

type Props = { car: Vehicle }

/** Carrusel sencillo (flechas, teclado, táctil, puntitos) */
function Carousel({ images, alt }: { images: string[]; alt: string }) {
  const [i, setI] = useState(0)
  const prev = useCallback(() => setI(v => (v - 1 + images.length) % images.length), [images.length])
  const next = useCallback(() => setI(v => (v + 1) % images.length), [images.length])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next])

  useEffect(() => {
    let startX = 0
    const el = document.getElementById('carousel')!
    const onStart = (e: TouchEvent) => (startX = e.touches[0].clientX)
    const onEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX
      if (dx > 40) prev()
      if (dx < -40) next()
    }
    el?.addEventListener('touchstart', onStart, { passive: true })
    el?.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      el?.removeEventListener('touchstart', onStart)
      el?.removeEventListener('touchend', onEnd)
    }
  }, [prev, next])

  return (
    <div id="carousel" className="w-full">
      <div className="relative w-full h-72 md:h-96 rounded overflow-hidden">
        <Image
          key={images[i]}
          src={images[i]}
          alt={`${alt} ${i + 1}`}
          fill
          className="object-cover transition-opacity duration-300"
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
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            aria-label={`Ir a ${idx + 1}`}
            className={`h-2.5 w-2.5 rounded-full ${i === idx ? 'bg-gray-900' : 'bg-gray-300 hover:bg-gray-400'}`}
          />
        ))}
      </div>

      <div className="mt-3 hidden md:flex gap-2">
        {images.map((src, idx) => (
          <button
            key={src + idx}
            onClick={() => setI(idx)}
            className={`relative h-16 w-24 overflow-hidden rounded border ${i === idx ? 'border-gray-900' : 'border-gray-200'}`}
          >
            <Image src={src} alt={`${alt} mini ${idx + 1}`} fill className="object-cover" sizes="96px" />
          </button>
        ))}
      </div>
    </div>
  )
}

export default function VehiclePage({ car }: Props) {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-gray-900 text-white p-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-sm underline">← Volver</Link>
          <h1 className="text-xl font-bold">{car.title}</h1>
          <div />
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Carousel images={car.photos} alt={car.title} />
          <div>
            <h2 className="text-2xl font-semibold mb-4">{car.title}</h2>
            <ul className="space-y-2 text-gray-800">
              <li><strong>Año:</strong> {car.year}</li>
              <li><strong>Marca/Modelo:</strong> {car.make} {car.model}</li>
              {car.trim && <li><strong>Trim:</strong> {car.trim}</li>}
              {car.mileage && <li><strong>Millaje:</strong> {car.mileage.toLocaleString()} mi</li>}
              {car.transmission && <li><strong>Transmisión:</strong> {car.transmission}</li>}
              {car.fuel && <li><strong>Combustible:</strong> {car.fuel}</li>}
              {car.vin && <li><strong>VIN:</strong> {car.vin}</li>}
              {car.exterior && <li><strong>Exterior:</strong> {car.exterior}</li>}
              {car.interior && <li><strong>Interior:</strong> {car.interior}</li>}
            </ul>

            {car.price && <p className="mt-4 text-2xl font-bold">${car.price.toLocaleString()}</p>}
            {car.description && <p className="mt-4">{car.description}</p>}

            <div className="mt-6 flex gap-3">
              <a href="tel:7473544098" className="bg-blue-600 text-white px-4 py-2 rounded">Llamar ahora</a>
              <a href="mailto:availablehybrid@gmail.com" className="bg-green-600 text-white px-4 py-2 rounded">Enviar correo</a>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: inventory.map(v => ({ params: { id: v.id } })),
  fallback: false,
})

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const car = inventory.find(v => v.id === params?.id) as Vehicle
  return { props: { car } }
}
