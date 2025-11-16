import type { GetStaticProps } from "next";

interface HomeProps {
  inventory: any[];
}

export default function Home({ inventory }: HomeProps) {
  return (
    <main className="p-10 text-white">
      <h1 className="text-3xl font-bold">AVAILABLE HYBRID R&M INC</h1>
      <p>Inventario temporalmente vacío ({inventory.length} vehículos)</p>
    </main>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  return {
    props: {
      inventory: [], // inventario vacío temporal
    },
    revalidate: 60,
  };
};
