import Link from 'next/link'
import Image from 'next/image'
import { inventory } from '../data/inventory'

export default function Home() {
  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">AVAILABLE HYBRID R&M INC.</h1>

      <ul className="grid gap-6 md:grid-cols-2">
        {inventory.map((car) => (
          <li key={car.id} className="border rounded-lg overflow-hidden">
            <div className="relative w-full h-56">
              <Image
                src={car.photos?.[0] ?? '/placeholder-car.jpg'}
                alt={car.title}
                fill
                className="object-cover"
                sizes="(max-width:768px) 100vw, 50vw"
                priority
              />
            </div>

            <div className="p-4">
              <h2 className="font-semibold">{car.title}</h2>
              <p className="text-sm text-gray-700">
                {car.make} {car.model} · {car.year}
              </p>
              <Link
                href={`/vehicles/${car.id}`}
                className="text-blue-600 underline mt-2 inline-block"
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
