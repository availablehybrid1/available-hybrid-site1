import { listStoredVehicles, saveVehicle, type StoredVehicle } from "./blobInventory";

export type Car = {
  id: string;
  year: string;
  make: string;
  model: string;
  mileage: string;
  price: string;
  exterior: string;
  transmission: string;
  fuel: string;
  vin: string;
  photos: string;
  status: string;
  description: string;
  [key: string]: any;
};

const recoveryDeployments = [
  "https://available-hybrid-site1-guv8-4sjwb7xl0.vercel.app",
  "https://available-hybrid-site1-guv8-mowjsz77u.vercel.app",
];

function parseNextDataInventory(html: string): any[] {
  const match = html.match(
    /<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i
  );
  if (!match?.[1]) return [];

  try {
    const data = JSON.parse(match[1]);
    const inventory = data?.props?.pageProps?.inventory;
    return Array.isArray(inventory) ? inventory : [];
  } catch {
    return [];
  }
}

async function recoverFromPreviousDeployment(): Promise<Car[]> {
  for (const baseUrl of recoveryDeployments) {
    try {
      const res = await fetch(`${baseUrl}/inventory`, {
        cache: "no-store",
        headers: {
          "User-Agent": "AvailableHybridInventoryRecovery/1.0",
        },
      });

      if (!res.ok) continue;

      const html = await res.text();
      const recovered = parseNextDataInventory(html);
      if (!recovered.length) continue;

      return recovered
        .filter((car) => car?.id)
        .map((car) => ({
          ...car,
          id: String(car.id),
          year: car.year != null ? String(car.year) : "",
          make: car.make ?? "",
          model: car.model ?? "",
          mileage: car.mileage != null ? String(car.mileage) : "",
          price: car.price != null ? String(car.price) : "",
          exterior: car.exterior ?? "",
          transmission: car.transmission ?? "",
          fuel: car.fuel ?? "",
          vin: car.vin ?? "",
          photos: Array.isArray(car.photos)
            ? car.photos.filter((url: unknown) => typeof url === "string").join(" ")
            : String(car.photos ?? ""),
          status: car.status ?? "available",
          description: car.description ?? "",
          cardHoverPhoto: car.cardHoverPhoto ?? "",
          studioCover: car.studioCover ?? "",
        })) as Car[];
    } catch (err) {
      console.error("Previous deployment recovery failed:", baseUrl, err);
    }
  }

  return [];
}

async function migrateRecoveredCars(cars: Car[]) {
  for (const car of cars) {
    try {
      const photoUrls = String(car.photos || "")
        .split(/\s+/)
        .map((url) => url.trim())
        .filter((url) => url.startsWith("http"));

      const vehicle: StoredVehicle = {
        id: String(car.id),
        year: String(car.year || ""),
        make: String(car.make || ""),
        model: String(car.model || ""),
        mileage: String(car.mileage || ""),
        price: String(car.price || ""),
        exterior: String(car.exterior || ""),
        transmission: String(car.transmission || ""),
        fuel: String(car.fuel || ""),
        vin: String(car.vin || ""),
        status: String(car.status || "available"),
        description: String(car.description || ""),
        cardHoverPhoto: String(car.cardHoverPhoto || ""),
        studioCover: String(car.studioCover || ""),
      };

      photoUrls.forEach((url, index) => {
        vehicle[`photo${index + 1}`] = url;
      });

      await saveVehicle(vehicle);
    } catch (err) {
      console.error("Could not migrate recovered vehicle:", car.id, err);
    }
  }
}

function normalizeBlobCars(vehicles: StoredVehicle[]): Car[] {
  return vehicles
    .filter(
      (vehicle) =>
        vehicle?.id &&
        String(vehicle.status || "").toLowerCase() !== "sold"
    )
    .map((vehicle) => {
      const photoUrls = Object.entries(vehicle)
        .filter(
          ([key, value]) =>
            /^photo\d+$/i.test(key) &&
            typeof value === "string" &&
            value.startsWith("http")
        )
        .sort(([a], [b]) => Number(a.slice(5)) - Number(b.slice(5)))
        .map(([, value]) => String(value));

      return {
        ...vehicle,
        studioCover: vehicle.studioCover || "",
        photos: photoUrls.join(" "),
      } as Car;
    });
}

export async function getInventory(): Promise<Car[]> {
  const currentVehicles = await listStoredVehicles().catch((err) => {
    console.error("Error reading bot inventory:", err);
    return [];
  });

  const currentCars = normalizeBlobCars(currentVehicles);
  if (currentCars.length) return currentCars;

  // One-time recovery path: older Vercel deployments can retain the
  // environment snapshot that was connected to the previous Blob store.
  const recoveredCars = await recoverFromPreviousDeployment();
  if (!recoveredCars.length) return [];

  // Recreate the metadata in the currently connected Blob so both the
  // website and Telegram bot can use the recovered vehicles again.
  await migrateRecoveredCars(recoveredCars);

  return recoveredCars.filter(
    (vehicle) =>
      vehicle?.id &&
      String(vehicle.status || "").toLowerCase() !== "sold"
  );
}
