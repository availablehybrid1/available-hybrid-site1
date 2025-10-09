// /data/inventory.ts

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
  photos: string[];
};

export const PLACEHOLDER_IMG = '/placeholder-car.jpg';

// ----------------------------------------------------
// INVENTARIO COMPLETO (5 VEHÍCULOS)
// ----------------------------------------------------
export const inventory: Vehicle[] = [
  {
    id: 'priusc-2013',
    title: 'Toyota Prius C 2013',
    year: 2013,
    make: 'Toyota',
    model: 'Prius C',
    mileage: 172000,
    transmission: 'Automática',
    fuel: 'Híbrido',
    exterior: 'Blanco',
    interior: 'Gris claro',
    price: 7000,
    description:
      'Excelente opción económica y confiable. Este Toyota Prius C 2013 combina eficiencia híbrida con bajo mantenimiento. Interior limpio, aire acondicionado frío y manejo suave. Ideal para uso diario o trabajo de transporte gracias a su excelente rendimiento de gasolina (hasta 50 MPG). Título limpio y listo para transferir.',
    photos: [
      '/WhatsApp Image 2025-10-08 at 7.39.45 AM.jpeg',
      '/WhatsApp Image 2025-10-08 at 7.39.45 AM (1).jpeg',
      '/WhatsApp Image 2025-10-08 at 7.39.46 AM.jpeg',
      '/WhatsApp Image 2025-10-08 at 7.39.46 AM (1).jpeg',
      '/WhatsApp Image 2025-10-08 at 7.39.46 AM (2).jpeg'
    ],
  },
  {
  id: 'cruze-2012',
  title: 'Chevrolet Cruze 2012',
  year: 2012,
  make: 'Chevrolet',
  model: 'Cruze',
  mileage: 145000,
  transmission: 'Automática',
  fuel: 'Gasolina',
  exterior: 'Azul',
  interior: 'Negro',
  price: 3500,
  description:
    'Sedán confiable y económico en excelente estado mecánico. Aire acondicionado frío, transmisión suave y motor eficiente. Perfecto para transporte diario o primer vehículo. Título limpio y listo para transferir.',
  photos: [
    '/WhatsApp Image 2025-10-09 at 12.18.18 AM.jpeg',
    '/WhatsApp Image 2025-10-09 at 12.18.19 AM.jpeg',
    '/WhatsApp Image 2025-10-09 at 12.18.20 AM.jpeg'
  ],
},

  {
    id: 'prius-2015',
    title: 'Toyota Prius 2015',
    year: 2015,
    make: 'Toyota',
    model: 'Prius',
    mileage: 203382,
    transmission: 'Automática',
    fuel: 'Híbrido',
    exterior: 'Negro',
    interior: 'Gris oscuro',
    price: 6499,
    description:
      'Toyota Prius 2015 híbrido, reconocido por su durabilidad y bajo consumo de combustible. Interior limpio, aire acondicionado y sistema híbrido en excelente estado. Opción ideal para quienes buscan economía y confiabilidad.',
    photos: ['/car1.jpg', '/car2.jpg', '/car3.jpg'],
  },
  {
    id: 'priusv-2014',
    title: 'Toyota Prius V 2014',
    year: 2014,
    make: 'Toyota',
    model: 'Prius V',
    mileage: 172000,
    transmission: 'Automática',
    fuel: 'Híbrido',
    exterior: 'Blanco',
    interior: 'Gris claro',
    price: 6999,
    description:
      'Toyota Prius V 2014 con amplio espacio interior y excelente economía de combustible. Aire acondicionado, sistema híbrido eficiente y título limpio. Ideal para uso familiar o de trabajo, con el estilo confiable de Toyota.',
    photos: ['/car1.jpg', '/car2.jpg', '/car3.jpg'],
  },
  {
    id: 'prius-2010',
    title: 'Toyota Prius 2010',
    year: 2010,
    make: 'Toyota',
    model: 'Prius',
    mileage: 198000,
    transmission: 'Automática',
    fuel: 'Híbrido',
    exterior: 'Rojo',
    interior: 'Beige',
    price: 5500,
    description:
      'Toyota Prius 2010 híbrido en excelentes condiciones para su año. Motor silencioso, consumo muy bajo de gasolina y mantenimiento al día. Ideal para quien busca economía, confiabilidad y un vehículo listo para conducir.',
    photos: ['/car1.jpg', '/car2.jpg', '/car3.jpg'],
  },
];
