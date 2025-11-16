// /data/inventory.ts

// Tipo base (puedes ampliar con más campos si quieres)
export type Vehicle = {
  id: string;                 // único, usado para la URL: /{id}
  title?: string;             // si no lo pones, se arma con year/make/model
  year?: number;
  make?: string;
  model?: string;
  mileage?: number;
  transmission?: string;
  fuel?: string;
  vin?: string;
  exterior?: string;
  interior?: string;
  price?: number;
  description?: string;
  photos?: string[];          // rutas en /public o URLs completas
  // Campos opcionales usados por la UI (badges/chips)
  tags?: string[];            // ej.: ["Hybrid","Clean Title"]
  status?: "just_arrived" | "pending_detail";
};

export const PLACEHOLDER_IMG = "/placeholder-car.jpg";

// ----------------------------------------------------
// INVENTARIO (ejemplos)
// ----------------------------------------------------
export const inventory: Vehicle[] = [
  {
    id: "priusc-2013",
    title: "Toyota Prius C 2013",
    year: 2013,
    make: "Toyota",
    model: "Prius C",
    mileage: 172000,
    transmission: "Automática",
    fuel: "Híbrido",
    exterior: "Blanco",
    interior: "Gris claro",
    price: 7000,
    description:
      "Excelente opción económica y confiable. Interior limpio, aire acondicionado frío y manejo suave. Hasta 50 MPG. Título limpio y listo para transferir.",
    photos: [
      "/WhatsApp Image 2025-10-08 at 7.39.45 AM.jpeg",
      "/WhatsApp Image 2025-10-08 at 7.39.45 AM (1).jpeg",
      "/WhatsApp Image 2025-10-08 at 7.39.46 AM.jpeg",
      "/WhatsApp Image 2025-10-08 at 7.39.46 AM (1).jpeg",
      "/WhatsApp Image 2025-10-08 at 7.39.46 AM (2).jpeg",
    ],
    tags: ["Hybrid", "Clean Title"],
    status: "just_arrived",
  },
 
  {
    id: "prius-2015",
    title: "Toyota Prius 2015",
    year: 2015,
    make: "Toyota",
    model: "Prius",
    mileage: 203382,
    transmission: "Automática",
    fuel: "Híbrido",
    exterior: "Negro",
    interior: "Gris oscuro",
    price: 6499,
    description:
      "Híbrido reconocido por durabilidad y bajo consumo. Interior limpio y sistema híbrido en excelente estado.",
    photos: ["/car1.jpg", "/car2.jpg", "/car3.jpg"],
    tags: ["Hybrid"],
  },
  {
    id: "priusv-2014",
    title: "Toyota Prius V 2014",
    year: 2014,
    make: "Toyota",
    model: "Prius V",
    mileage: 172000,
    transmission: "Automática",
    fuel: "Híbrido",
    exterior: "Blanco",
    interior: "Gris claro",
    price: 6999,
    description:
      "Amplio espacio interior y excelente economía de combustible. Ideal para uso familiar o de trabajo.",
    photos: ["/car1.jpg", "/car2.jpg", "/car3.jpg"],
    tags: ["Family", "Hybrid"],
  },
  {
    id: "prius-2010",
    title: "Toyota Prius 2010",
    year: 2010,
    make: "Toyota",
    model: "Prius",
    mileage: 198000,
    transmission: "Automática",
    fuel: "Híbrido",
    exterior: "Rojo",
    interior: "Beige",
    price: 5500,
    description:
      "Silencioso, muy bajo consumo y mantenimiento al día. Listo para conducir.",
    photos: ["/car1.jpg", "/car2.jpg", "/car3.jpg"],
    tags: ["Hybrid", "Value"],
  },
];

// Export default (opcional, pero nuestro código lo soporta)
export default inventory;
