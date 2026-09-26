import { listStoredVehicles } from "./blobInventory";

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

async function getSheetInventory(): Promise<Car[]> {
  const sheetId = process.env.NEXT_PUBLIC_SHEET_ID;
  if (!sheetId) return [];

  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;

  try {
    const res = await fetch(url);
    const text = await res.text();
    const trimmed = text.trim();

    if (trimmed.startsWith("<")) return [];

    const match = text.match(/{[\s\S]*}/);
    if (!match) return [];

    const json = JSON.parse(match[0]);
    if (!json.table || !json.table.cols || !json.table.rows) return [];

    const headers = json.table.cols.map((col: any) =>
      (col.label || "").toLowerCase()
    );

    return json.table.rows.map((r: any) =>
      r.c.reduce((obj: any, cell: any, i: number) => {
        const key = headers[i];
        obj[key] = cell ? cell.v : "";
        return obj;
      }, {} as Car)
    );
  } catch (err) {
    console.error("Error reading Google Sheets inventory:", err);
    return [];
  }
}

export async function getInventory(): Promise<Car[]> {
  const [sheetCars, blobCars] = await Promise.all([
    getSheetInventory(),
    listStoredVehicles().catch((err) => {
      console.error("Error reading Blob inventory:", err);
      return [];
    }),
  ]);

  const combined = new Map<string, Car>();

  for (const car of sheetCars) {
    if (car?.id) combined.set(String(car.id).trim(), car);
  }

  for (const car of blobCars) {
    if (!car?.id) continue;
    const carId = String(car.id).trim();
    if (String(car.status || "").toLowerCase() === "sold") {
      combined.delete(carId);
      continue;
    }

    const photoUrls = Object.entries(car)
      .filter(
        ([key, value]) =>
          key.toLowerCase().startsWith("photo") &&
          typeof value === "string" &&
          value.startsWith("http")
      )
      .map(([, value]) => String(value));

    combined.set(carId, {
      ...car,
      photos: photoUrls.join(" "),
    } as Car);
  }

  return Array.from(combined.values());
}
