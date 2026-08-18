import { BowlFood, CheckCircle } from "@phosphor-icons/react/ssr";
import { foodBrands } from "@/data/mocks/landing";

export function FamiliarFood() {
  return (
    <section className="section-space bg-cream">
      <div className="container-shell">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <BowlFood size={42} weight="duotone" className="text-brand-blue" aria-hidden="true" />
            <h2 className="display-heading mt-5 max-w-[12ch] text-4xl sm:text-5xl lg:text-[3.25rem]">
              Su alimento de siempre. Sin cambiarle la rutina.
            </h2>
          </div>
          <div className="lg:pb-1">
            <p className="body-copy max-w-xl text-lg">
              Patitas repone lo que tu mascota ya consume. Elegís su marca y
              variedad habitual; nosotros organizamos cuándo vuelve a llegar.
            </p>
            <p className="mt-5 flex items-center gap-2 text-sm font-semibold text-ink">
              <CheckCircle size={20} weight="fill" className="text-brand-blue" aria-hidden="true" />
              No hace falta cambiar su alimentación para usar Patitas.
            </p>
          </div>
        </div>

        <div className="mt-14 border-y border-border py-7">
          <p className="mb-5 text-xs font-bold tracking-[0.12em] text-muted">
            EJEMPLOS ILUSTRATIVOS · DISPONIBILIDAD A CONFIRMAR
          </p>
          <ul className="flex flex-wrap items-center gap-x-9 gap-y-4">
            {foodBrands.map((brand) => (
              <li key={brand.name} translate="no" className="font-display text-2xl font-semibold text-ink sm:text-3xl">
                {brand.name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
