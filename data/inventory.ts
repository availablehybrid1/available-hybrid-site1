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
  // OBLIGATORIO: siempre existirá gracias al normalizador de abajo
  photos: string[];
};

// Imagen de respaldo (asegúrate de que exista en /public/placeholder-car.jpg)
const PLACEHOLDER = "/placeholder-car.jpg";
// Exportamos con el nombre que usa index.tsx
export const PLACEHOLDER_IMG = PLACEHOLDER;

// ------------------------------------------------------------------
// 1) Tu inventario SIN preocuparte por 'photos'.
//    Si no pones 'photos', se asigna automáticamente el placeholder.
// ------------------------------------------------------------------
const rawInventory: Array<Omit<Vehicle, "photos"> & { photos?: string[] }> = [
  // Ejemplo (puedes borrar/editar):
  // {
  //   id: "cruze-2012",
  //   title: "Chevrolet Cruze 2012",
  //   year: 2012,
  //   make: "Chevrolet",
  //   model: "Cruze",
  //   mileage: 125000,
  //   price: 5990,
  //   // photos: ["/car1.jpg", "/car2.jpg"],
  // },
];

// ------------------------------------------------------------------
// 2) Normalizamos para garantizar que 'photos' SIEMPRE exista.
// ------------------------------------------------------------------
export const inventory: Vehicle[] = rawInventory.map((v) => ({
  photos: v.photos && v.photos.length ? v.photos : [PLACEHOLDER],
  ...v,
}));
