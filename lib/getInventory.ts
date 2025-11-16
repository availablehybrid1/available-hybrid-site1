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

  let res: Response;
  let text: string;

  try {
    res = await fetch(url);
    text = await res.text();
  } catch (err) {
    console.error("Error haciendo fetch a Google Sheets:", err);
    return [];
  }

  // Si la respuesta es HTML (empieza con <), no intentamos parsear JSON
  const trimmed = text.trim();
  if (trimmed.startsWith("<")) {
    console.error(
      "Google Sheets devolvió HTML (probablemente falta compartir la hoja como 'Anyone with the link - Viewer' o publicarla)."
    );
    return [];
  }

  // Intentar encontrar el primer bloque de JSON dentro del texto
 const match = text.match(/{[\s\S]*}/);
  if (!match) {
    console.error(
      "No se encontró un bloque JSON válido en la respuesta de Google Sheets."
    );
    return [];
  }

  let json: any;
  try {
    json = JSON.parse(match[0]);
  } catch (err) {
    console.error("Error al hacer JSON.parse del contenido de Google Sheets:", err);
    return [];
  }

  if (!json.table || !json.table.cols || !json.table.rows) {
    console.error("La estructura devuelta por Google Sheets no tiene 'table/cols/rows'.");
    return [];
  }

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
