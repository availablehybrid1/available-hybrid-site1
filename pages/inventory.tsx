      {/* HEADER */}
      <header className="border-b border-neutral-900 bg-black/90">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          {/* LOGO */}
          <Link href="/" className="flex items-center justify-between">
            <div className="relative h-16 w-40 sm:h-[120px] sm:w-[360px]">
              <img
                src="/logo. available hybrid premium.png"
                alt="Available Hybrid R&M Inc. logo"
                className="h-full w-full object-contain"
              />
            </div>
          </Link>

          {/* NAV SOLO EN ESCRITORIO */}
          <nav className="hidden flex-1 items-center justify-center gap-6 text-xs font-medium text-neutral-300 sm:flex">
            <Link
              href="/inventory"
              className="hover:text-white transition-colors"
            >
              {text.inventoryNav}
            </Link>
            <Link
              href="/pre-qualification"
              className="hover:text-white transition-colors"
            >
              {text.prequalifyNav}
            </Link>
          </nav>

          {/* BLOQUE DERECHA: DIRECCIÓN + WHATSAPP + TEL + IDIOMA */}
          <div className="flex w-full flex-col items-end gap-2 text-right text-[11px] text-neutral-400 sm:w-auto">
            {/* Dirección solo en pantallas grandes */}
            <span className="hidden sm:block">
              6726 Reseda Blvd Suite A7 · Reseda, CA 91335
            </span>

            <div className="flex w-full items-center justify-end gap-2 sm:gap-3">
              {/* WhatsApp (asegúrate de tener /public/whatsapp-green.png) */}
              <a
                href={`https://wa.me/${whatsappDigits}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-transparent"
                aria-label="WhatsApp"
              >
                <img
                  src="/whatsapp-green.png"
                  alt="WhatsApp"
                  className="h-full w-full object-contain"
                />
              </a>

              {/* Teléfono: un poco más compacto en mobile */}
              <a
                href={`tel:${phone.replace(/[^+\d]/g, "")}`}
                className="inline-flex items-center justify-center rounded-full border border-neutral-700 bg-neutral-950 px-3 py-1 text-[10px] font-semibold tracking-[0.16em] text-neutral-100 hover:border-neutral-300 hover:bg-neutral-800 sm:px-4 sm:py-1.5 sm:text-[11px]"
              >
                {phone}
              </a>

              {/* Toggle EN / ES */}
              <button
                type="button"
                onClick={() => setLang(lang === "en" ? "es" : "en")}
                className="rounded-full border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-200 hover:border-neutral-300 hover:bg-neutral-800"
              >
                {lang === "en" ? "ES" : "EN"}
              </button>
            </div>
          </div>
        </div>
      </header>
