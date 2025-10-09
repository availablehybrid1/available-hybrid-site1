import { GetStaticPaths, GetStaticProps } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { inventory, type Vehicle } from '../../data/inventory'

type Props = { car: Vehicle }

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
          {/* Galería */}
          <div className="space-y-4">
            {car.photos.map((src, i) => (
              <div key={i} className="relative w-full h-64">
                <Image
                  src={src}
                  alt={`${car.title} ${i + 1}`}
                  fill
                  className="object-cover rounded"
                  sizes="(max-width:768px) 100vw, 50vw"
                />
              </div>
            ))}
          </div>

          {/* Datos */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">{car.title}</h2>
            <ul className="space-y-2 text-gray-800">
              <li><strong>Año:</strong> {car.year}</li>
              <li><strong>Marca/Modelo:</strong> {car.make} {car.model}</li>
              {car.trim && <li><strong>Trim:</strong> {car.trim}</li>}
              {car.mileage && <li><strong>Millaje:</strong> {car.mileage.toLocaleString()} mi</li>}
              {car.transmission && <li><strong>Transmisión:</strong> {car.transmission}</li>}
              {car.fuel && <li><strong>Combustible:</strong> {car.fuel}</li>}
              {car.exterior && <li><strong>Exterior:</strong> {car.exterior}</li>}
              {car.interior && <li><strong>Interior:</strong> {car.interior}</li>}
            </ul>

            {car.price && (
              <p className="mt-4 text-2xl font-bold">${car.price.toLocaleString()}</p>
            )}

            {car.description && <p className="mt-4">{car.description}</p>}

            <div className="mt-6 flex gap-3">
              <a href="tel:7473544098" className="bg-blue-600 text-white px-4 py-2 rounded">
                Llamar ahora
              </a>
              <a href="mailto:availablehybrid@gmail.com" className="bg-green-600 text-white px-4 py-2 rounded">
                Enviar correo
              </a>
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
