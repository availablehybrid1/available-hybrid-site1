// pages/financing.tsx — Redirección a DealerCenter enviando referrer
import * as React from "react";
import Head from "next/head";

export default function FinancingRedirect() {
  // 🔗 Usa tu URL Standalone (SIN frameId)
  const dcUrl =
    "https://dwssecuredforms.dealercenter.net/CreditApplication/index/28816065?themecolor=0d0d0d&formtype=l&standalone=true&ls=Other";

  React.useEffect(() => {
    // Crea un <a> para asegurar que se envía el "referrer"
    const a = document.createElement("a");
    a.href = dcUrl;
    a.rel = "noopener";
    a.referrerPolicy = "origin-when-cross-origin";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [dcUrl]);

  return (
    <main className="min-h-screen bg-neutral-950 text-white grid place-items-center px-4">
      {/* Por si en algún sitio estaba seteado a no-referrer, lo fijamos aquí */}
      <Head>
        <meta name="referrer" content="origin-when-cross-origin" />
      </Head>

      <div className="max-w-lg text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-2">
          Redirigiendo a la Aplicación de Crédito…
        </h1>
        <p className="text-white/70 mb-6">
          Estamos enviándote al formulario seguro de DealerCenter. Si no avanza
          automáticamente, usa el botón de abajo.
        </p>

        <a
          href={dcUrl}
          referrerPolicy="origin-when-cross-origin"
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
