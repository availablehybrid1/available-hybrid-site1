// pages/thank-you.tsx — Página de confirmación simple y profesional
export default function ThankYouPage() {
  const whatsappLink =
    "https://wa.me/17473544098?text=Hola!%20Acabo%20de%20enviar%20un%20formulario%20en%20hybridrm.com%20y%20me%20gustar%C3%ADa%20saber%20cu%C3%A1les%20son%20los%20siguientes%20pasos.";

  return (
    <main className="min-h-screen bg-neutral-950 flex items-center justify-center text-center text-white">
      <div className="max-w-md p-6">
        <h1 className="text-3xl font-bold text-emerald-400 mb-2">
          ¡Gracias por aplicar!
        </h1>
        <p className="text-white/80 mb-1">
          Hemos recibido tu solicitud. Un representante de{" "}
          <strong>Available Hybrid R&M Inc.</strong> se comunicará contigo muy pronto.
        </p>
        <p className="text-xs text-neutral-500 mb-6">
          Thank you! We have received your information and will contact you soon.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href="/"
            className="inline-block rounded-lg bg-white text-neutral-900 px-4 py-2 text-sm font-semibold hover:bg-neutral-200"
          >
            ← Ver inventario / Back to inventory
          </a>

          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-emerald-400"
          >
            Escribir por WhatsApp
          </a>
        </div>
      </div>
    </main>
  );
}
