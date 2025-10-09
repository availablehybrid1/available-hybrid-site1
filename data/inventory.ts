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
  trim?: string;
  price?: number;
  description?: string;
  photos: string[]; // garantizado por el normalizador
};

// Debe existir en /public
export const PLACEHOLDER_IMG = '/placeholder-car.jpg';

const rawInventory: Array<Omit<Vehicle, 'photos'> & { photos?: string[] }> = [
  {
    id: 'prius-2013',
    title: 'Toyota Prius 2013',
    year: 2013,
    make: 'Toyota',
    model: 'Prius',
    mileage: 128_500,
    transmission: 'Automática',
    fuel: 'Híbrido',
    exterior: 'Gris',
    interior: 'Tela negra',
    price: 8990,
    photos: ['/car1.jpg', '/car2.jpg'],
    description: 'Muy económico, mantenimiento al día.',
  },
  {
    id: 'cruze-2012',
    title: 'Chevrolet Cruze 2012',
    year: 2012,
    make: 'Chevrolet',
    model: 'Cruze',
    mileage: 145_300,
    transmission: 'Automática',
    fuel: 'Gasolina',
    exterior: 'Azul',
    interior: 'Tela gris',
    price: 5990,
    photos: ['/car3.jpg'],
  },
  {
    id: 'civic-2014',
    title: 'Honda Civic 2014',
    year: 2014,
    make: 'Honda',
    model: 'Civic',
    mileage: 138_000,
    transmission: 'Automática',
    fuel: 'Gasolina',
    price: 7990,
    // sin fotos -> usa placeholder
  },
  {
    id: 'camry-2015',
    title: 'Toyota Camry 2015',
    year: 2015,
    make: 'Toyota',
    model: 'Camry',
    mileage: 110_200,
    transmission: 'Automática',
    fuel: 'Gasolina',
    exterior: 'Blanco',
    price: 10_900,
    // sin fotos -> usa placeholder
  },
  {
    id: 'accord-2016',
    title: 'Honda Accord 2016',
    year: 2016,
    make: 'Honda',
    model: 'Accord',
    mileage: 99_800,
    transmission: 'Automática',
    fuel: 'Gasolina',
    price: 12_500,
    // sin fotos -> usa placeholder
  },
];

export const inventory: Vehicle[] = rawInventory.map((v) => ({
  ...v,
  photos: v.photos && v.photos.length ? v.photos : [PLACEHOLDER_IMG],
}));
