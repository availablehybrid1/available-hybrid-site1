// pages/financing.tsx — Apertura directa del formulario DealerCenter (sin embed)

import { useEffect } from "react";

export default function FinancingRedirect() {
  useEffect(() => {
    const dcUrl =
      "https://dwssecuredforms.dealercenter.net/CreditApplication/index/288160657?themecolor=0d0d0d&formtype=l&standalone=true&ls=Other";

    // Abre en nueva pestaña automáticamente
    window.open(dcUrl, "_blank", "noopener,noreferrer");

    // Redirige localmente a una página de confirmación o mensaje
    window.location.href = "/thank-you";
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
      <h1 className="text-xl font-semibold mb-2">Redirigiendo a la Aplicación de Crédito...</h1>
      <p className="text-sm text-gray-400">Si no se abre automáticamente, haz clic en el botón de abajo.</p>
      <a
        href="https://dwssecuredforms.dealercenter.net/CreditApplication/index/288160657?themecolor=0d0d0d&formtype=l&standalone=true&ls=Other"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 rounded-lg bg-red-600 px-4 py-2 font-semibold hover:bg-red-500 transition"
      >
        Ir al Formulario de DealerCenter
      </a>
    </main>
  );
}
