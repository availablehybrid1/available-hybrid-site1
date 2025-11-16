// pages/[id].tsx — página de detalle de vehículo usando Google Sheets
import { GetStaticPaths, GetStaticProps } from "next";
import { getInventory, Car } from "../lib/getInventory";

type Vehicle = {
  id: string;
  title: string;
  year: number | null;
  make: string;
  model: string;
  mileage: number | null;
  transmission: string;
  fuel: string;
  vin: string;
  exterior: string;
  price: number | null;
  description: string;
  photos: string[];
};

type VehiclePageProps = {
  vehicle: Vehicle | null;
};

export default function VehiclePage({ vehicle }: VehiclePageProps) {
  if (!vehicle) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center">
        <p className="text-white/80">Vehicle not found.</p>
      </main>
    );
  }

  const photo = vehicle.photos[0] || "/placeholder-car.jpg";

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <section className="mx-auto max-w-5xl px-4 py-10">
        <a href="/" className="mb-4 inline-flex text-sm text-red-400 hover:text-red-300">
          ← Back to inventory
        </a>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="overflow-hidden rounded-xl border border-white/10">
            <img
              src={photo}
              alt={vehicle.title}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl font-semibold">{vehicle.title}</h1>
            {vehicle.price !== null && (
              <p className="text-xl font-bold text-red-400">
                ${vehicle.price.toLocaleString()}
              </p>
            )}

            <div className="grid grid-cols-2 gap-2 text-sm text-white/70">
              <div>Year: {vehicle.year ?? "—"}</div>
              <div>Mileage: {vehicle.mileage?.toLocaleString() ?? "—"} mi</div>
              <div>Transmission: {vehicle.transmission || "—"}</div>
              <div>Fuel: {vehicle.fuel || "—"}</div>
              <div>VIN: {vehicle.vin || "—"}</div>
              <div>Exterior: {vehicle.exterior || "—"}</div>
            </div>

            {vehicle.description && (
              <p className="mt-3 text-sm text-white/70">{vehicle.description}</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

// Genera las rutas estáticas usando Google Sheets
export const getStaticPaths: GetStaticPaths = async () => {
  const cars: Car[] = await getInventory();
  const cleaned = (cars || []).filter((c) => c && c.id);

  return {
    paths: cleaned.map((c) => ({
      params: { id: c.id },
    })),
    fallback: "blocking", // si no está pre-renderizado, se genera al vuelo
  };
};

// Trae los datos de un solo vehículo
export const getStaticProps: GetStaticProps<VehiclePageProps> = async ({ params }) => {
  const id = params?.id as string;

  const cars: Car[] = await getInventory();
  const c = (cars || []).find((car) => car.id === id);

  if (!c) {
    return {
      notFound: true,
      revalidate: 60,
    };
  }

  const vehicle: Vehicle = {
    id: c.id ?? "",
    title:
      `${c.year ?? ""} ${c.make ?? ""} ${c.model ?? ""}`.trim() ||
      c.id ||
      "Vehicle",
    year: c.year !== undefined && c.year !== null ? Number(c.year) : null,
    make: c.make ?? "",
    model: c.model ?? "",
    mileage:
      c.mileage !== undefined && c.mileage !== null
        ? Number(c.mileage)
        : null,
    transmission: c.transmission ?? "",
    fuel: c.fuel ?? "",
    vin: c.vin ?? "",
    exterior: c.exterior ?? "",
    price:
      c.price !== undefined && c.price !== null ? Number(c.price) : null,
    description: c.description ?? "",
    photos: c.photos ? c.photos.toString().split(/\s+/) : [],
  };

  return {
    props: {
      vehicle,
    },
    revalidate: 60,
  };
};
