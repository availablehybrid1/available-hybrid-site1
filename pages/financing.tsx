// pages/financing.tsx — Redirección 302 (server-side) a DealerCenter

export async function getServerSideProps() {
  const dcUrl =
    "https://dwssecuredforms.dealercenter.net/CreditApplication/index/28816065?themecolor=0d0d0d&formtype=l&standalone=true&ls=Other"; // SIN frameId

  // Redirección HTTP 302; el navegador enviará Referer = /financing
  return {
    redirect: {
      destination: dcUrl,
      permanent: false,
    },
  };
}

// Este componente nunca se renderiza porque el server redirige antes.
// Lo dejamos por si Next requiere un default export.
export default function FinancingRedirect() {
  return null;
}
