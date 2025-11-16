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
};

export async function getInventory(): Promise<Car[]> {
  const sheetId = process.env.NEXT_PUBLIC_SHEET_ID;
  if (!sheetId) {
    console.error("NEXT_PUBLIC_SHEET_ID no está definido");
    return [];
  }

  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;

  const res = await fetch(url);
  const text = await res.text();

  // Google devuelve texto extra antes del json
  const json = JSON.parse(text.substring(47).slice(0, -2));

  const headers = json.table.cols.map((col: any) =>
    (col.label || "").toLowerCase()
  );

  const rows: Car[] = json.table.rows.map((r: any) =>
    r.c.reduce((obj: any, cell: any, i: number) => {
      const key = headers[i];
      obj[key] = cell ? cell.v : "";
      return obj;
    }, {} as Car)
  );

  return rows;
}
