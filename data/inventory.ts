// data/inventory.ts

export type Vehicle = {
  id: string
  title: string
  year: number
  make: string
  model: string
  mileage: number
  transmission: string
  fuel?: string
  trim?: string
  exterior?: string
  interior?: string
  vin?: string
  price?: number
  description?: string
  photos?: string[] // ⬅️ ahora opcional
}

// Imagen local de respaldo (colócala en /public/placeholder-car.jpg)
export const PLACEHOLDER_IMG = '/placeholder-car.jpg'

// ⬇️ Deja/pon aquí tu inventario real. “photos” puede omitirse.
export const inventory: Vehicle[] = [
  // Ejemplo:
  // {
  //   id: 'cruze-2012',
  //   title: 'Chevrolet Cruze 2012',
  //   year: 2012,
  //   make: 'Chevrolet',
  //   model: 'Cruze',
  //   mileage: 123456,
  //   transmission: 'Automática',
  //   price: 5990,
  //   // photos: [], // puedes no ponerlo
  // },
]
