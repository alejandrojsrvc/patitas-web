import {
  Bone,
  BowlFood,
  Package,
  PawPrint,
} from "@phosphor-icons/react/ssr";

const essentials = [
  { label: "Alimento", icon: BowlFood },
  { label: "Arena y bolsas", icon: Package },
  { label: "Snacks", icon: Bone },
  { label: "Esenciales", icon: PawPrint },
];

export function RecurringBenefit() {
  return (
    <section className="section-space overflow-hidden bg-brand-blue text-white">
      <div className="container-shell grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <div>
          <h2 className="display-heading max-w-[12ch] text-5xl sm:text-6xl lg:text-[4.5rem]">
            Vos cuidás de ellos. Nosotros nos acordamos.
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-8 text-white/90 sm:text-xl">
            El alimento, la arena, las bolsas, los snacks: todo lo que se
            termina una y otra vez puede dejar de ocupar lugar en tu cabeza.
            Patitas te lo organiza una vez y vos seguís teniendo el control
            de cada entrega.
          </p>
        </div>

        <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-white/20">
          {essentials.map((essential, index) => {
            const Icon = essential.icon;
            return (
              <li
                key={essential.label}
                className={`${index === 0 ? "bg-brand-yellow text-ink" : "bg-[#0752e7] text-white"} flex min-h-36 flex-col justify-between p-5 sm:min-h-40 sm:p-6`}
              >
                <Icon size={30} weight="duotone" aria-hidden="true" />
                <span className="font-display text-xl font-semibold sm:text-2xl">
                  {essential.label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
