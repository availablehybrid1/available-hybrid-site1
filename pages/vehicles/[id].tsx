// @ts-nocheck
// pages/vehicles/[id].tsx
import Image from 'next/image'
import Link from 'next/link'
import { inventory, PLACEHOLDER_IMG, type Vehicle } from '../../data/inventory'

type Props = { car: Vehicle }

export default function VehiclePage({ car }: Props) {
  const img = car.photos?.[0] ?? PLACEHOLDER_IMG

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
        <div className="grid gap-6 md:grid-cols-2">
          {/* Imagen principal */}
          <div className="relative w-full h-72 md:h-96 rounded overflow-hidden bg-gray-100">
            <Image
              src={img}
              alt={car.title}
              fill
              className="object-cover"
              sizes="(max-width:768px) 100vw, 50vw"
              priority
            />
          </div>

          {/* Datos del vehículo */}
          <section>
            <h1 className="text-2xl font-bold">{car.title}</h1>

            <ul className="space-y-2 text-gray-800 mt-4">
              <li><strong>Año:</strong> {car.year}</li>
              <li><strong>Marca/Modelo:</strong> {car.make} {car.model}</li>
              <li>
                <strong>Millaje:</strong>{' '}
                {typeof car.mileage === 'number' ? car.mileage.toLocaleString() : car.mileage} mi
              </li>
              {car.transmission && <li><strong>Transmisión:</strong> {car.transmission}</li>}
              {car.fuel && <li><strong>Combustible:</strong> {car.fuel}</li>}
              {car.exterior && <li><strong>Exterior:</strong> {car.exterior}</li>}
              {car.interior && <li><strong>Interior:</strong> {car.interior}</li>}
              {car.vin && <li><strong>VIN:</strong> {car.vin}</li>}
            </ul>

            {car.price != null && (
              <p className="mt-4 text-2xl font-bold">
                ${car.price.toLocaleString()}
              </p>
            )}

            {car.description && (
              <p className="mt-4 text-gray-700">{car.description}</p>
            )}

            <div className="mt-6 flex gap-3">
              <a href="tel:7473544098" className="bg-blue-600 text-white px-4 py-2 rounded">
                Llamar ahora
              </a>
              <a href="mailto:availablehybrid@gmail.com" className="bg-green-600 text-white px-4 py-2 rounded">
                Enviar correo
              </a>
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

/* SSG: rutas estáticas de detalle */
export async function getStaticPaths() {
  return {
    paths: inventory.map((v) => ({ params: { id: v.id } })),
    fallback: false,
  }
}

export async function getStaticProps({ params }: { params?: { id?: string } }) {
  const id = String(params?.id || '')
  const car = inventory.find((v) => v.id === id) || null

  if (!car) {
    return { notFound: true }
  }

  return { props: { car } }
}
