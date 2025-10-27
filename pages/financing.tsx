// pages/financing.tsx — Formulario de crédito (DealerCenter embebido)
import * as React from "react";

export default function FinancingDealerCenter() {
  // URL oficial que generaste en DealerCenter (déjala tal cual)
  const dcUrl =
    "https://dwssecuredforms.dealercenter.net/CreditApplication/index/28816065?themecolor=060606&formtype=l&frameId=dws_frame_0&standalone=true&ls=Other";

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-3xl font-bold mb-2 text-red-500">
          Aplicación de Crédito – Available Hybrid R&M Inc.
        </h1>
        <p className="text-white/70 mb-4">
          Completa la siguiente aplicación segura. Tus datos se enviarán
          directamente a nuestro sistema de financiamiento (DealerCenter).
        </p>

        {/* Formulario oficial embebido */}
        <div className="w-full h-[1650px] rounded-xl overflow-hidden border border-white/10 bg-black">
          <iframe
            src={dcUrl}
            width="100%"
            height="100%"
            style={{ border: "none" }}
            // Permisos útiles por si DealerCenter los solicita
            allow="clipboard-write; geolocation; microphone; camera"
          />
        </div>

        {/* Enlace de respaldo por si el iframe no carga en algún navegador */}
        <p className="mt-4 text-center text-sm text-white/60">
          ¿Problemas para ver el formulario?{" "}
          <a
            href={dcUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white"
          >
            Abrir en una ventana nueva
          </a>
        </p>

        <p className="text-xs text-white/40 mt-6 text-center">
          © {new Date().getFullYear()} Available Hybrid R&M Inc. Todos los derechos reservados.
        </p>
      </div>
    </main>
  );
}
