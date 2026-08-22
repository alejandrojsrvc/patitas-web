import {
  CalendarDots,
  Dog,
  Package,
} from "@phosphor-icons/react/ssr";

const steps = [
  {
    title: "Contanos sobre tu mascota",
    description:
      "Qué come, cuánto pesa, qué necesita regularmente. La configuración toma un momento y se hace una sola vez.",
    icon: Dog,
  },
  {
    title: "Armamos su Patitas",
    description:
      "Organizamos una entrega quincenal o mensual según su consumo, con los productos que ya conocés.",
    icon: Package,
  },
  {
    title: "Llega justo cuando toca",
    description:
      "Podés modificar, adelantar, retrasar o saltar futuras entregas. Vos tenés el control de cada una.",
    icon: CalendarDots,
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="anchor-section section-space bg-surface">
      <div className="container-shell">
        <div className="max-w-2xl">
          <h2 className="display-heading text-4xl sm:text-5xl lg:text-[3.25rem]">
            Una vez configurado, deja de ser una compra pendiente.
          </h2>
          <p className="body-copy mt-5 max-w-xl text-lg">
            Configurás qué necesita tu mascota y Patitas organiza la
            reposición. Vos seguís teniendo el control.
          </p>
        </div>

        <ol className="relative mt-14 grid gap-10 before:absolute before:left-[16.66%] before:right-[16.66%] before:top-8 before:hidden before:h-px before:bg-border md:grid-cols-3 md:gap-8 md:before:block">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <li key={step.title} className="relative grid grid-cols-[4rem_1fr] gap-4 md:block">
                <div className="relative z-10 flex size-16 items-center justify-center rounded-2xl bg-soft-blue text-brand-blue md:mx-auto">
                  <Icon size={30} weight="duotone" aria-hidden="true" />
                </div>
                <div className="md:mt-6 md:text-center">
                  <p className="text-xs font-bold tracking-[0.12em] text-brand-blue">
                    PASO {index + 1}
                  </p>
                  <h3 className="mt-2 font-display text-2xl font-semibold leading-tight">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-muted md:mx-auto md:max-w-[18rem]">
                    {step.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
