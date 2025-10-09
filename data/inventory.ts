// data/inventory.ts
export type Vehicle = {
  id: string;
  title: string;
  year: number;
  make: string;
  model: string;
  trim?: string;         // opcional
  mileage: number;
  price: number;
  transmission: string;
  fuel: string;
  exterior?: string;     // corregido
  interior?: string;     // corregido
  vin?: string;          // opcional
  description?: string;  // opcional
  photos: string[];
};

export const inventory: Vehicle[] = [
  {
    id: "priusc-2013",
    title: "Toyota Prius C 2013",
    year: 2013,
    make: "Toyota",
    model: "Prius C",
    mileage: 172000,
    price: 6000,
    transmission: "Automatic",
    fuel: "Hybrid",
    exterior: "Blanco",
    interior: "Gris claro",
    description:
      "Excelente opción económica y confiable. Este Toyota Prius C 2013 combina eficiencia híbrida con bajo mantenimiento. Interior limpio, aire acondicionado frío y manejo suave. Ideal para uso diario o trabajo de transporte gracias a su excelente rendimiento de gasolina (hasta 50 MPG). Título limpio y listo para transferir.",
    photos: [
      "/WhatsApp Image 2025-10-08 at 7.39.45 AM.jpeg",
      "/WhatsApp Image 2025-10-08 at 7.39.45 AM (1).jpeg",
      "/WhatsApp Image 2025-10-08 at 7.39.46 AM.jpeg",
      "/WhatsApp Image 2025-10-08 at 7.39.46 AM (1).jpeg",
      "/WhatsApp Image 2025-10-08 at 7.39.46 AM (2).jpeg"
    ]
  },
  {
    id: "cruze-2012",
    title: "Chevrolet Cruze 2012",
    year: 2012,
    make: "Chevrolet",
    model: "Cruze",
    mileage: 121800,
    price: 3500,
    transmission: "Automatic",
    fuel: "Gasoline",
    exterior: "Azul",
    interior: "Negro",
    description:
      "Chevrolet Cruze 2012 en excelentes condiciones mec
