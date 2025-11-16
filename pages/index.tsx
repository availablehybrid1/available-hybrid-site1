export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const cars: Car[] = await getSheetInventory();

  // Filtramos filas totalmente vacías (por si hay renglones en blanco en la hoja)
  const cleaned = (cars || []).filter(
    (c) => c && (c.id || c.make || c.model || c.year)
  );

  const inventory: Vehicle[] = cleaned.map((c) => ({
    id: c.id ?? `${c.year ?? ""}-${c.make ?? ""}-${c.model ?? ""}` || "no-id",

    title:
      `${c.year ?? ""} ${c.make ?? ""} ${c.model ?? ""}`
        .trim()
        || c.id
        || "Vehicle",

    // Números o null (nunca undefined)
    year: c.year !== undefined && c.year !== null ? Number(c.year) : null,
    mileage:
      c.mileage !== undefined && c.mileage !== null
        ? Number(c.mileage)
        : null,
    price:
      c.price !== undefined && c.price !== null ? Number(c.price) : null,

    // Strings o "" (nunca undefined)
    make: c.make ?? "",
    model: c.model ?? "",
    transmission: c.transmission ?? "",
    fuel: c.fuel ?? "",
    vin: c.vin ?? "",
    exterior: c.exterior ?? "",
    description: c.description ?? "",

    // Array de fotos (nunca undefined)
    photos: c.photos ? c.photos.toString().split(/\s+/) : [],

    // Puedes cambiar esto si luego agregas una columna "status" en la hoja
    status: null,
  }));

  return {
    props: {
      inventory,
    },
    revalidate: 60,
  };
};
