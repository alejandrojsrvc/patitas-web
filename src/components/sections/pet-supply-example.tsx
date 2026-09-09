import { Bone, BowlFood, CalendarDots, Dog, Package, PencilSimple } from "@phosphor-icons/react/ssr";
import { kiaraPlan } from "@/data/mocks/landing";

const productIcons = {
  food: BowlFood,
  hygiene: Package,
  snack: Bone,
  accessory: Package,
};

const deliveryDate = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  timeZone: "America/Argentina/Buenos_Aires",
}).format(new Date(kiaraPlan.nextDelivery));

export function PetSupplyExample() {
  return (
    <section id="que-recibes" className="anchor-section section-space bg-soft-blue">
      <div className="container-shell grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div>
          <h2 className="display-heading text-4xl sm:text-5xl lg:text-[3.25rem]">El abastecimiento de Kiara, ya organizado.</h2>
          <p className="body-copy mt-5 max-w-md text-lg">
            No es un carrito esperando que vuelvas. Es una próxima entrega preparada alrededor de lo que Kiara consume, con los productos
            que ya conocés y la frecuencia que elegiste.
          </p>
          <p className="body-copy mt-4 max-w-md text-muted">
            Cada Patitas se arma según la rutina de tu mascota. Si algo cambia, podés ajustarlo antes de que salga.
          </p>
          <div className="mt-8 flex items-center gap-3 text-sm font-semibold text-brand-blue">
            <PencilSimple size={20} weight="bold" aria-hidden="true" />
            Podés cambiar esta entrega antes de que salga
          </div>
        </div>

        <article className="overflow-hidden rounded-[1.75rem] bg-surface shadow-[0_12px_32px_rgba(0,50,145,0.10)]">
          <div className="grid gap-6 bg-brand-blue p-6 text-white sm:grid-cols-[1fr_auto] sm:p-8">
            <div className="flex items-center gap-4">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-white/12 text-brand-yellow">
                <Dog size={38} weight="duotone" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-3xl font-semibold">{kiaraPlan.pet.name}</h3>
                  <span className="rounded-full bg-brand-yellow px-2.5 py-1 text-[0.65rem] font-bold tracking-wide text-ink">EJEMPLO</span>
                </div>
                <p className="mt-1 text-sm text-white/90">
                  {kiaraPlan.pet.description} · {kiaraPlan.pet.weightKg} kg
                </p>
              </div>
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-bold tracking-[0.1em] text-white/90">FRECUENCIA</p>
              <p className="mt-1 font-display text-2xl font-semibold capitalize">{kiaraPlan.frequency}</p>
            </div>
          </div>

          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[0.72fr_1.28fr]">
            <div className="rounded-2xl bg-soft-yellow p-5">
              <div className="flex items-center gap-2 text-sm font-bold text-ink">
                <CalendarDots size={20} weight="bold" aria-hidden="true" />
                PRÓXIMA PATITAS
              </div>
              <p className="mt-5 font-display text-5xl font-semibold uppercase leading-none tracking-[-0.03em]">{deliveryDate}</p>
              <p className="mt-3 text-sm text-muted">Fecha ilustrativa · plan mensual</p>
            </div>

            <div>
              <div className="flex items-center gap-2 border-b border-border pb-4">
                <Package size={22} weight="duotone" className="text-brand-blue" aria-hidden="true" />
                <p className="font-display text-xl font-semibold">Lo que llega</p>
              </div>
              <ul className="divide-y divide-border">
                {kiaraPlan.products.map((product) => {
                  const Icon = productIcons[product.category];

                  return (
                    <li key={product.id} className="flex items-center gap-4 py-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-soft-blue text-brand-blue">
                        <Icon size={22} weight="duotone" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-ink">{product.name}</p>
                        <p className="text-sm text-muted">{product.detail}</p>
                      </div>
                      {product.optional ? <span className="text-xs font-bold text-brand-blue">OPCIONAL</span> : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
