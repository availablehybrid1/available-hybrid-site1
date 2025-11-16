export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const cars: Car[] = await getSheetInventory();

  const cleaned = (cars || []).filter(
    (c) => c && (c.id || c.make || c.model || c.year)
  );

  const inventory: Vehicle[] = cleaned.map((c) => ({
    id: c.id ?? `${c.year ?? ""}-${c.make ?? ""}-${c.model ?? ""}` || "no-id",
    title:
      `${c.year ?? ""} ${c.make ?? ""} ${c.model ?? ""}`.trim() ||
      c.id ||
      "Vehicle",
    year:
      c.year !== undefined && c.year !== null ? Number(c.year) : null,
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
    status: "exclusive",
  }));

  return {
    props: {
      inventory,
    },
    revalidate: 60,
  };
};
