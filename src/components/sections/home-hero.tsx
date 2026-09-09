import { ArrowRight, CalendarBlank } from "@phosphor-icons/react/ssr";
import Image from "next/image";
import Link from "next/link";

export function HomeHero() {
  return (
    <section className="overflow-hidden bg-page-bg py-8 sm:py-10 lg:py-14" aria-labelledby="home-hero-title">
      <div className="container-shell grid items-center gap-8 lg:grid-cols-[minmax(0,0.88fr)_minmax(32rem,1.12fr)] lg:gap-12">
        <div className="max-w-2xl py-2 lg:py-8">
          <h1 id="home-hero-title" className="display-heading text-[clamp(2.75rem,7.5vw,4.75rem)]">
            <span className="block">Comprá su alimento hoy.</span>
            <span className="mt-1 block text-brand-blue">Sabé cuándo vas a necesitarlo de nuevo.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted sm:text-xl">
            Alimentos y esenciales para perros y gatos, con una estimación de cuánto puede durar cada compra.
          </p>

          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <Link
              href="/perros/alimentos"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-brand-blue px-6 py-3.5 text-center font-semibold text-white transition-colors hover:bg-[#0048dc] active:bg-[#003fbe]"
            >
              Comprar alimento <ArrowRight size={19} weight="bold" aria-hidden="true" />
            </Link>
          </div>

          <p className="mt-5 text-sm font-medium text-muted">Comprá de forma puntual, sin suscribirte.</p>
        </div>

        <div className="relative min-h-[17rem] overflow-hidden rounded-2xl bg-soft-blue sm:min-h-[30rem] lg:min-h-[34rem]">
          <Image
            src="/brand/landing/hero-petshop-clean-v1.png"
            alt="Perro y gato junto a bolsas de alimento y otros esenciales"
            fill
            preload
            sizes="(min-width: 1024px) 54vw, calc(100vw - 1.25rem)"
            className="object-cover object-[68%_center] sm:object-[64%_center]"
          />

          <div className="absolute inset-x-3 bottom-3 max-w-sm rounded-xl bg-white p-4 text-ink shadow-[0_12px_32px_rgba(0,50,145,0.16)] sm:inset-x-auto sm:bottom-5 sm:left-5 sm:w-[19rem] sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-muted">Bolsa de 15 kg</p>
                <p className="mt-1 font-display text-3xl font-semibold tracking-[-0.03em]">30 días aprox.</p>
              </div>
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-yellow text-ink">
                <CalendarBlank size={22} weight="bold" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between gap-4 border-t border-border pt-3 text-sm">
              <span className="text-muted">15 kg ÷ 500 g por día</span>
              <strong className="shrink-0 text-brand-blue">En 30 días</strong>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted">
              Ejemplo matemático. La calculadora indica cuándo usa la tabla del fabricante o una estimación general.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
