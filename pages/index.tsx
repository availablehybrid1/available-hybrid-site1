export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const cars: Car[] = await getSheetInventory();

  const inventory: Vehicle[] = cars.map((c) => ({
    id: c?.id ?? "",
    title: `${c?.year ?? ""} ${c?.make ?? ""} ${c?.model ?? ""}`.trim() || c?.id ?? "",
    year: c?.year ? Number(c.year) : null,
    make: c?.make ?? null,
    model: c?.model ?? null,
    mileage: c?.mileage ? Number(c.mileage) : null,
    transmission: c?.transmission ?? null,
    fuel: c?.fuel ?? null,
    vin: c?.vin ?? null,
    exterior: c?.exterior ?? null,
    price: c?.price ? Number(c.price) : null,
    description: c?.description ?? null,
    photos: c?.photos ? c.photos.split(/\s+/) : [],
    status: null
  }));

  return {
    props: {
      inventory
    },
    revalidate: 60
  };
};
