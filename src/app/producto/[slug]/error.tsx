"use client";

import { ArrowLeft, ArrowClockwise, WarningCircle } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";

export default function ProductError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <>
      <header className="bg-brand-blue text-white">
        <div className="container-shell flex min-h-[4.5rem] items-center justify-between gap-4 py-2">
          <Link href="/" aria-label="Patitas Inquietas, ir al inicio">
            <Image
              src="/brand/patitas-logo-horizontal.png"
              alt="Patitas Inquietas"
              width={220}
              height={24}
              priority
              unoptimized
              className="h-auto w-[136px] brightness-0 invert sm:w-[148px]"
            />
          </Link>
          <Link href="/perros" className="min-h-11 inline-flex items-center rounded-xl px-3 text-sm font-semibold hover:bg-white/10">
            Ver catálogo
          </Link>
        </div>
      </header>
      <main id="contenido" className="min-h-[60vh] bg-catalog-page py-12 sm:py-20">
        <div className="container-shell">
          <div className="mx-auto flex max-w-xl flex-col items-center rounded-2xl bg-white px-6 py-10 text-center sm:px-10">
            <WarningCircle size={44} weight="duotone" className="text-brand-blue" aria-hidden="true" />
            <h1 className="mt-5 font-display text-3xl font-semibold text-ink sm:text-4xl">No pudimos cargar este producto</h1>
            <p className="mt-3 text-muted">Puede ser un problema momentáneo. Probá nuevamente o buscá otra opción en el catálogo.</p>
            <div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <button
                type="button"
                onClick={reset}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-blue px-5 font-semibold text-white hover:bg-[#0048dc]"
              >
                <ArrowClockwise size={18} weight="bold" aria-hidden="true" />
                Intentar nuevamente
              </button>
              <Link
                href="/buscar"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-soft-blue px-5 font-semibold text-brand-blue hover:bg-[#dbe8ff]"
              >
                <ArrowLeft size={18} weight="bold" aria-hidden="true" />
                Buscar otra opción
              </Link>
            </div>
          </div>
        </div>
      </main>
      <footer className="bg-brand-blue py-8 text-center text-sm text-white">
        <p>© 2026 Patitas Inquietas · Buenos Aires, Argentina</p>
      </footer>
    </>
  );
}
