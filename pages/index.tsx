import Link from 'next/link'
import { Car } from 'lucide-react'
import Image from 'next/image'
import { inventory } from '../data/inventory'

export default function Home() {
  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">AVAILABLE HYBRID R&M INC.</h1>

      <ul className="grid gap-6 md:grid-cols-2">
        {inventory.map((car) => (
          <li key={car.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="relative w-full h-56 bg-gray-100">
              <Image
                src={car.photos?.[0] ?? '/placeholder-car.jpg'}
                alt={car.title || 'Vehicle image'}
                fill
                className="object-cover"
                sizes="(max-width:768px) 100vw, 50vw"
                priority
              />
            </div>

            <div className="p-4">
              <h2 className="font-semibold text-lg">{car.title}</h2>
              <p className="text-sm text-gray-700 mb-2">
                {car.make} {car.model} · {car.year}
              </p>

              {car.price && (
                <p className="text-base font-bold text-green-700 mb-2">
                  ${car.price.toLocaleString()}
                </p>
              )}

              <Link
                href={`/vehicles/${car.id}`}
                className="text-blue-600 underline hover:text-blue-800 transition-colors"
              >
                Ver detalle
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}
