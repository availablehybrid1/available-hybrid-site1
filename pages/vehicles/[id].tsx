// @ts-nocheck
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
          {/* Imagen */}
          <div className="relative w-full h-72 md:h-96 rounded overflow-hidden">
            <Image
              src={img}
              alt={car.title}
              fill
              className="object-cover"
              sizes="(max-width:768px) 100vw, 50vw"
              priority
            />
          </div>

          {/* Datos */}
          <section>
            <h1 className="text-2xl font-bold">{car.title}</h1>
            <ul className="space-y-2 text-gray-800 mt-4">
              <li><strong>Año:</strong> {car.year}</li>
              <li><strong>Marca/Modelo:</strong> {car.make} {car.model}</li>
              <li><strong>Millaje:</strong> {car.mileage.toLocaleString()} mi</li>
              <li><strong>Transmisión:</strong> {car.transmission}</li>
              {car.fuel && <li><strong>Combustible:</strong> {car.fuel}</li>}
              {car.trim && <li><strong>Trim:</strong> {car.trim}</li>}
              {car.exterior && <li><strong>Exterior:</strong> {car.exterior}</li>}
              {car.interior && <li><strong>Interior:</strong> {car.interior}</li>}
              {car.vin && <li><strong>VIN:</strong> {car.vin}</li>}
            </ul>

            {car.price != null ? (
              <p className="mt-4 text-2xl font-bold">${car.price.toLocaleString()}</p>
            ) : null}

            {car.description ? (
              <p className="
