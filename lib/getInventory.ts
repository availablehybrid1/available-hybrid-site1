import { listStoredVehicles } from "./blobInventory";
import { listStudioCovers, studioKey } from "./photoProcessing";

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

export async function getInventory(): Promise<Car[]> {
  const vehicles = await listStoredVehicles().catch((err) => {
    console.error("Error reading bot inventory:", err);
    return [];
  });

  const covers = await listStudioCovers().catch(() => new Map());

  return vehicles
    .filter((vehicle) => vehicle?.id && String(vehicle.status || "").toLowerCase() !== "sold")
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
        studioCover: covers.get(studioKey(vehicle.id, vehicle.photo1 || ""))?.coverUrl || "",
        photos: photoUrls.join(" "),
      } as Car;
    });
}

