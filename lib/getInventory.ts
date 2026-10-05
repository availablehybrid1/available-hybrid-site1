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
    const res = await fetch(url, { cache: "no-store" });
    const text = await res.text();
    const trimmed = text.trim();

    if (!res.ok || trimmed.startsWith("<")) return [];

    const match = text.match(/{[\s\S]*}/);
    if (!match) return [];

    const json = JSON.parse(match[0]);
    if (!json.table || !json.table.cols || !json.table.rows) return [];

    const headers = json.table.cols.map((col: any) =>
      (col.label || "").toLowerCase()
    );

    return json.table.rows.map((row: any) =>
      row.c.reduce((obj: any, cell: any, i: number) => {
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
      console.error("Error reading bot inventory:", err);
      return [];
    }),
  ]);

  const combined = new Map<string, Car>();

  // Restore the older Google Sheets inventory first.
  for (const car of sheetCars) {
    if (!car?.id) continue;
    combined.set(String(car.id).trim(), car);
  }

  // Telegram/Vercel Blob remains supported and overrides matching Sheet IDs.
  for (const vehicle of blobCars) {
    if (!vehicle?.id) continue;

    const id = String(vehicle.id).trim();
    if (String(vehicle.status || "").toLowerCase() === "sold") {
      combined.delete(id);
      continue;
    }

    const photoUrls = Object.entries(vehicle)
      .filter(
        ([key, value]) =>
          /^photo\d+$/i.test(key) &&
          typeof value === "string" &&
          value.startsWith("http")
      )
      .sort(([a], [b]) => Number(a.slice(5)) - Number(b.slice(5)))
      .map(([, value]) => String(value));

    combined.set(id, {
      ...vehicle,
      studioCover: "",
      photos: photoUrls.join(" "),
    } as Car);
  }

  return Array.from(combined.values()).filter(
    (vehicle) =>
      vehicle?.id &&
      String(vehicle.status || "").toLowerCase() !== "sold"
  );
}
