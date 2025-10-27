// pages/financing.tsx — Redirección segura a DealerCenter (Plan B)
import * as React from "react";

export default function FinancingRedirect() {
  // 🔗 Enlace oficial que generaste en DealerCenter
  const dcUrl =
    "https://dwssecuredforms.dealercenter.net/CreditApplication/index/28816065?themecolor=060606&formtype=l&frameId=dws_frame_0&standalone=true&ls=Other";

  React.useEffect(() => {
    // Redirección automática (misma pestaña)
    window.location.replace(dcUrl);
  }, [dcUrl]);

  return (
    <main className="min-h-screen bg-neutral-950 text-white grid place-items-center px-4">
      <div className="max-w-lg text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-2">
          Redirigiendo a la Aplicación de Crédito…
        </h1>
        <p className="text-white/70 mb-6">
          Estamos enviándote al formulario seguro de DealerCenter. Si no avanza
          automáticamente en unos segundos, haz clic en el botón de abajo.
        </p>

        <a
          href={dcUrl}
          className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 transition"
        >
          Ir a la Aplicación de Crédito
        </a>

        <p className="mt-6 text-xs text-white/40">
          © {new Date().getFullYear()} Available Hybrid R&M Inc.
        </p>
      </div>
    </main>
  );
}
