// pages/thank-you.tsx — Página de confirmación simple y profesional
export default function ThankYouPage() {
  return (
    <main className="min-h-screen bg-neutral-950 flex items-center justify-center text-center text-white">
      <div className="max-w-md p-6">
        <h1 className="text-3xl font-bold text-red-500 mb-4">¡Gracias por aplicar!</h1>
        <p className="text-white/80 mb-6">
          Hemos recibido tu solicitud de crédito. Un representante de <strong>Available Hybrid R&M Inc.</strong> se comunicará contigo pronto para continuar el proceso.
        </p>
        <a
          href="/"
          className="inline-block rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
        >
          ← Volver al inicio
        </a>
      </div>
    </main>
  );
}
