// /data/inventory.ts

// ---- Tipos ----
export type Vehicle = {
  id: string;
  title: string;
  year: number;
  make: string;
  model: string;
  mileage: number;
  transmission?: string;
  fuel?: string;
  vin?: string;
  exterior?: string;
  interior?: string;
  price?: number;
  description?: string;
  photos: string[]; // garantizado por el normalizador
};

// Imagen de respaldo (DEBE existir en /public)
export const PLACEHOLDER_IMG = '/placeholder-car.jpg';

// ------------------------------------------------------------------
// 1) Agrega tus autos sin preocuparte por 'photos'.
//    Si no pones 'photos', se asignará automáticamente el placeholder.
// ------------------------------------------------------------------
const rawInventory: Array<Omit<Vehicle, 'photos'> & { photos?: string[] }> = [
  // Ejemplo:
  // {
  //   id: 'cruze-2012',
  //   title: 'Chevrolet Cruze 2012',
  //   year: 2012,
  //   make: 'Chevrolet',
  //   model: 'Cruze',
  //   mileage: 125000,
  //   price: 5990,
  //   photos: ['/car1.jpg', '/car2.jpg'], // opcional
  // },
];

// ------------------------------------------------------------------
// 2) Normalizamos para garantizar que 'photos' SIEMPRE exista.
// ------------------------------------------------------------------
export const inventory: Vehicle[] = rawInventory.map((v) => ({
  ...v,
  photos: v.photos && v.photos.length ? v.photos : [PLACEHOLDER_IMG],
}));
