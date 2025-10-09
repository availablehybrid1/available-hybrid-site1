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
                alt={`${car.title}
