// data/inventory.ts
export type Vehicle = {
  id: string;
  title: string;
  year: number;
  make: string;
  model: string;
  mileage: number;
  price: number;
  transmission: string;
  fuel: string;
  exterior: string;
  interior: string;
  description: string;
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
    photos: ["/car1.jpg", "/car2.jpg", "/car3.jpg"]
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
      "Chevrolet Cruze 2012 en excelentes condiciones mecánicas. Motor eficiente y transmisión suave. Aire acondicionado frío, interior bien cuidado y título limpio. Perfecto como primer vehículo o para transporte diario a bajo costo.",
    photos: ["/car1.jpg", "/car2.jpg", "/car3.jpg"]
  },
  {
    id: "prius-2015",
    title: "Toyota Prius 2015",
    year: 2015,
    make: "Toyota",
    model: "Prius",
    mileage: 203382,
    price: 6499,
    transmission: "Automatic",
    fuel: "Hybrid",
    exterior: "Negro",
    interior: "Gris oscuro",
    description:
      "Toyota Prius 2015 híbrido, reconocido por su durabilidad y bajo consumo de combustible. Interior limpio, aire acondicionado y sistema híbrido en excelente estado. Opción ideal para quienes buscan economía y confiabilidad.",
    photos: ["/car1.jpg", "/car2.jpg", "/car3.jpg"]
  },
  {
    id: "priusv-2014",
    title: "Toyota Prius V 2014",
    year: 2014,
    make: "Toyota",
    model: "Prius V",
    mileage: 172000,
    price: 6999,
    transmission: "Automatic",
    fuel: "Hybrid",
    exterior: "Blanco",
    interior: "Gris claro",
    description:
      "Toyota Prius V 2014 con amplio espacio interior y excelente economía de combustible. Aire acondicionado, sistema híbrido eficiente y título limpio. Ideal para uso familiar o de trabajo, con el estilo confiable de Toyota.",
    photos: ["/car1.jpg", "/car2.jpg", "/car3.jpg"]
  },
  {
    id: "prius-2010",
    title: "Toyota Prius 2010",
    year: 2010,
    make: "Toyota",
    model: "Prius",
    mileage: 198000,
    price: 5500,
    transmission: "Automatic",
    fuel: "Hybrid",
    exterior: "Rojo",
    interior: "Beige",
    description:
      "Toyota Prius 2010 híbrido en excelentes condiciones para su año. Motor silencioso, consumo muy bajo de gasolina y mantenimiento al día. Ideal para quien busca economía, confiabilidad y un vehículo listo para conducir.",
    photos: ["/car1.jpg", "/car2.jpg", "/car3.jpg"]
  }
];
