import { CalendarDots, Timer } from "@phosphor-icons/react/ssr";

export function DeliveryRhythm() {
  return (
    <section className="section-space bg-surface">
      <div className="container-shell">
        <div className="max-w-2xl">
          <h2 className="display-heading text-4xl sm:text-5xl lg:text-[3.25rem]">
            Elegí el ritmo que mejor entra en tu casa.
          </h2>
          <p className="body-copy mt-5 text-lg">
            Dos formas simples de organizar la reposición. Sin cálculos
            complicados ni un plan rígido.
          </p>
        </div>

        <div className="mt-14 grid border-y border-border md:grid-cols-2">
          <article className="py-8 md:pr-12 lg:py-12 lg:pr-16">
            <div className="flex items-center justify-between gap-6">
              <h3 className="font-display text-3xl font-semibold sm:text-4xl">Quincenal</h3>
              <Timer size={38} weight="duotone" className="text-brand-blue" aria-hidden="true" />
            </div>
            <p className="body-copy mt-5 max-w-md text-lg">
              Para recibir cantidades más pequeñas, guardar menos y reponer
              con mayor frecuencia.
            </p>
          </article>
          <article className="border-t border-border py-8 md:border-l md:border-t-0 md:pl-12 lg:py-12 lg:pl-16">
            <div className="flex items-center justify-between gap-6">
              <h3 className="font-display text-3xl font-semibold sm:text-4xl">Mensual</h3>
              <CalendarDots size={38} weight="duotone" className="text-brand-blue" aria-hidden="true" />
            </div>
            <p className="body-copy mt-5 max-w-md text-lg">
              Para resolver todo el mes en una sola entrega y volver a pensar
              en esto el mes siguiente.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
