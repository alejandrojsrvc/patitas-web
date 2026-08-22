import {
  Bone,
  BowlFood,
  Check,
  Dog,
  Package,
} from "@phosphor-icons/react/ssr";
import Image from "next/image";
import { CtaLink } from "@/components/ui/cta-link";

export function Hero() {
  return (
    <section id="inicio" className="anchor-section overflow-hidden bg-cream pb-18 pt-12 sm:pb-24 sm:pt-16 lg:pb-28 lg:pt-20">
      <div className="container-shell grid items-center gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
        <div>
          <h1 className="display-heading max-w-[11ch] text-[clamp(3rem,7vw,5.25rem)] text-ink">
            Que nunca le falte lo que necesita.
          </h1>
          <p className="body-copy mt-6 max-w-[35rem] text-lg leading-8 sm:text-xl">
            Configurá una vez su alimento y esenciales. Patitas se ocupa de
            que lleguen según su ritmo, sin que tengas que recordar cada
            compra. Elegís la frecuencia, y vos seguís teniendo el control
            de cada entrega.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <CtaLink href="/armar">Armar mi Patitas</CtaLink>
            <CtaLink href="#como-funciona" variant="secondary">
              Ver cómo funciona
            </CtaLink>
          </div>

          <ul className="mt-7 flex flex-col gap-3 text-sm font-semibold text-ink sm:flex-row sm:flex-wrap sm:gap-x-6">
            <li className="flex items-center gap-2">
              <Check className="text-brand-blue" size={18} weight="bold" aria-hidden="true" />
              Cambiá una entrega
            </li>
            <li className="flex items-center gap-2">
              <Check className="text-brand-blue" size={18} weight="bold" aria-hidden="true" />
              Saltala cuando quieras
            </li>
            <li className="flex items-center gap-2">
              <Check className="text-brand-blue" size={18} weight="bold" aria-hidden="true" />
              Sin permanencia rígida
            </li>
          </ul>
        </div>

        <div
          className="relative mx-auto w-full max-w-[38rem]"
          role="img"
          aria-label="Una entrega Patitas con alimento y esenciales preparada para una mascota"
        >
          <div className="absolute -left-8 top-8 size-40 rounded-full bg-brand-yellow sm:size-52" aria-hidden="true" />
          <div className="relative min-h-[30rem] overflow-hidden rounded-[2rem] bg-brand-blue p-6 text-white sm:min-h-[36rem] sm:p-9">
            <Image
              src="/brand/patitas-isotipo.png"
              alt=""
              width={736}
              height={876}
              loading="eager"
              priority
              className="absolute -right-16 -top-16 w-72 rotate-12 opacity-15 sm:w-96"
            />

            <div className="relative flex items-start justify-between">
              <p className="max-w-[11rem] font-display text-2xl font-semibold leading-[1.05] sm:text-3xl">
                Todo listo para cuando toca.
              </p>
              <span className="rounded-full bg-brand-yellow px-3 py-1.5 text-xs font-bold text-ink">
                PLAN MENSUAL
              </span>
            </div>

            <div className="absolute bottom-7 left-6 right-6 sm:bottom-9 sm:left-9 sm:right-9">
              <div className="relative flex min-h-72 items-end justify-center">
                <Dog
                  size={190}
                  weight="duotone"
                  className="absolute -left-6 bottom-14 text-brand-yellow sm:left-0 sm:size-[230px]"
                  aria-hidden="true"
                />

                <div className="relative ml-auto w-[68%] rounded-[1.5rem] bg-surface p-5 text-ink shadow-[0_14px_34px_rgba(0,26,78,0.24)] sm:w-[62%] sm:p-6">
                  <div className="flex items-center gap-3 border-b border-border pb-4">
                    <Package size={30} weight="duotone" className="text-brand-blue" aria-hidden="true" />
                    <div>
                      <p className="font-display text-xl font-semibold leading-none">Tu próxima Patitas</p>
                      <p className="mt-1 text-xs text-muted">Alimento + esenciales</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-around text-brand-blue">
                    <BowlFood size={34} weight="duotone" aria-hidden="true" />
                    <Bone size={34} weight="duotone" aria-hidden="true" />
                    <span className="font-display text-2xl font-semibold text-ink">28</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
