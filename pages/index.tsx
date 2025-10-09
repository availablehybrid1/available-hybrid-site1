import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Car, Phone, Mail, MapPin, Clock, ShieldCheck, Search, Fuel, Filter, Facebook, Instagram, Globe, ArrowRight, PhoneCall, CreditCard, Wrench, BadgeCheck, Languages } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { inventory } from '../data/inventory'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-gray-900 text-white p-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Car className="h-6 w-6" /> AVAILABLE HYBRID R&M INC.
        </h1>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        <section className="py-12">
          <h2 className="text-3xl font-bold">Bienvenido</h2>
          <p className="mt-2 text-gray-700">
            Teléfono: 747-354-4098 | Email: availablehybrid@gmail.com
          </p>
          <p className="mt-2 text-gray-700">
            Dirección: 6726 Reseda Blvd, Unit A-7, Reseda, CA 91335
          </p>
        </section>

        {/* Inventario real */}
        <section className="mx-auto max-w-7xl px-4 py-10">
          <h2 className="text-2xl font-bold mb-6">Inventario</h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {inventory.map((car) => (
              <Link
                key={car.id}
                href={`/vehicles/${car.id}`}
                className="border rounded-lg overflow-hidden hover:shadow-md transition block"
              >
                <div className="relative w-full h-56">
                  <Image
                    src={car.photos[0]}
