import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Car, Phone, Mail, MapPin, Clock, ShieldCheck, Search, Fuel, Filter, Facebook, Instagram, Globe, ArrowRight, PhoneCall, CreditCard, Wrench, BadgeCheck, Languages } from 'lucide-react'

// Datos de inventario de ejemplo
const INVENTORY = [
  { id: '1', title: 'Toyota Prius 2015 Two', price: 10990, year: 2015, miles: 112450, fuel: 'Híbrido', image: '/car1.jpg', features: ['1.8L HSD', 'Cámara reversa', 'Bluetooth'] },
  { id: '2', title: 'Honda Accord 2018 EX-L', price: 15990, year: 2018, miles: 86500, fuel: 'Gasolina', image: '/car2.jpg', features: ['Leather', 'Sunroof', 'Apple CarPlay'] },
  { id: '3', title: 'Toyota Prius 2017 Three Touring', price: 13990, year: 2017, miles: 98500, fuel: 'Híbrido', image: '/car3.jpg', features: ['Sensor de punto ciego', 'Navegación', 'Keyless'] },
]

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
          <p className="mt-2 text-gray-700">Teléfono: 747-354-4098 | Email: availablehybrid@gmail.com</p>
          <p className="mt-2 text-gray-700">Dirección: 6726 Reseda Blvd, Unit A-7, Reseda, CA 91335</p>
        </section>

        <section className="py-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Car className="h-5 w-5" /> Inventario (ejemplo)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {INVENTORY.map((car) => (
              <div key={car.id} className="border rounded-xl overflow-hidden shadow hover:shadow-lg">
                <img src={car.image} alt={car.title} className="w-full h-40 object-cover" />
                <div className="p-4">
                  <h3 className="text-lg font-semibold">{car.title}</h3>
                  <p className="text-gray-600">${car.price.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">{car.year} · {car.miles.toLocaleString()} mi</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="py-12">
          <h2 className="text-2xl font-bold mb-4">Contáctanos</h2>
          <p className="text-gray-700">¿Dudas o quieres agendar una cita? Llámanos o escríbenos:</p>
          <div className="mt-4 flex gap-4">
            <a href="tel:7473544098" className="bg-blue-600 text-white px-4 py-2 rounded">Llamar</a>
            <a href="mailto:availablehybrid@gmail.com" className="bg-green-600 text-white px-4 py-2 rounded">Email</a>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white p-6 text-center">
        © {new Date().getFullYear()} AVAILABLE HYBRID R&M INC.
      </footer>
    </div>
  )
}
