import { CheckCircle } from "@phosphor-icons/react/ssr";
import Image from "next/image";
import { CtaLink } from "@/components/ui/cta-link";

export function FinalCTA() {
  return (
    <section id="armar" className="anchor-section overflow-hidden bg-brand-blue py-18 text-white sm:py-24 lg:py-28">
      <div className="container-shell relative">
        <Image
          src="/brand/patitas-isotipo.png"
          alt=""
          width={736}
          height={876}
          className="absolute -right-24 -top-28 w-72 rotate-12 opacity-12 sm:w-[28rem]"
        />
        <div className="relative max-w-3xl">
          <h2 className="display-heading text-5xl sm:text-6xl lg:text-[4.5rem]">
            De lo que necesita tu mascota podemos acordarnos nosotros.
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-8 text-white/90 sm:text-xl">
            Probá una primera configuración y descubrí qué ritmo puede tener la
            Patitas de tu mascota.
          </p>

          <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <CtaLink href="/armar" variant="yellow">
              Armar su Patitas
            </CtaLink>
            <p id="cta-status" className="flex items-center gap-2 text-sm font-semibold text-white">
              <CheckCircle size={20} weight="fill" className="text-brand-yellow" aria-hidden="true" />
              Sin pagos ni compromiso
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
