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
  photos?: string[]; // <-- AHORA OPCIONAL
};

// Imagen de respaldo (asegúrate de que exista en /public)
const PLACEHOLDER = "/placeholder-car.jpg";

// ------------------------------------------------------------------
// 1) Coloca aquí tus autos SIN preocuparte por 'photos'.
//    Si no pones 'photos', se asignará automáticamente el placeholder.
// ------------------------------------------------------------------
const rawInventory: Array<Vehicle> = [
  // Ejemplo (puedes editar o agregar los tuyos):
  {
    id: "cruze-2012",
    title: "Chevrolet Cruze 2012",
    year: 2012,
    make: "Chevrolet",
    model: "Cruze",
    mileage: 125000,
    price: 5990,
    transmission: "Automatic",
    fuel: "Gasoline",
    // photos: ["/car1.jpg", "/car2.jpg"], // opcional
  },
  {
    id: "prius-c-2013",
    title: "Toyota Prius C 2013",
    year: 2013,
    make: "Toyota",
    model: "Prius C",
    mileage: 145000,
    price: 6990,
    transmission: "Automatic",
    fuel: "Hybrid",
    // photos: ["/WhatsApp Image 2025-10-08 at 7.39.45 AM (1).jpeg"], // opcional
  },
];

// ------------------------------------------------------------------
// 2) Normalizamos para garantizar que 'photos' SIEMPRE exista.
// ------------------------------------------------------------------
export const inventory: Vehicle[] = rawInventory.map((v) => ({
  ...v,
  photos: v.photos && v.photos.length ? v.photos : [PLACEHOLDER],
}));
