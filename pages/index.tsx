import type { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {
      inventory: []   // inventario vacío
    },
    revalidate: 60,
  };
};
