// pages/financing.tsx — Redirección 302 (server-side) a DealerCenter

export async function getServerSideProps() {
  const dcUrl =
    "https://dwssecuredforms.dealercenter.net/CreditApplication/index/288160657?themecolor=0d0d0d&formtype=l&standalone=true&ls=Other";

  return {
    redirect: { destination: dcUrl, permanent: false },
  };
}

export default function FinancingRedirect() {
  return null;
}
