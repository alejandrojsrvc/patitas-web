import { Cat, Check, Dog } from "@phosphor-icons/react/ssr";
import { petSupplies } from "@/data/mocks/landing";

const petGroups = [
  {
    title: "Para perros",
    description: "Lo que acompaña paseos, comidas y rutinas de todos los días.",
    supplies: petSupplies.dogs,
    icon: Dog,
    className: "bg-brand-blue text-white",
    mutedClassName: "text-white/90",
    checkClassName: "text-brand-yellow",
  },
  {
    title: "Para gatos",
    description: "Comida, higiene y esos esenciales que no conviene olvidar.",
    supplies: petSupplies.cats,
    icon: Cat,
    className: "bg-soft-blue text-ink",
    mutedClassName: "text-muted",
    checkClassName: "text-brand-blue",
  },
];

export function PetsCovered() {
  return (
    <section className="section-space bg-surface">
      <div className="container-shell">
        <div className="max-w-2xl">
          <h2 className="display-heading text-4xl sm:text-5xl lg:text-[3.25rem]">
            Perros y gatos. Cada uno con su propia Patitas.
          </h2>
          <p className="body-copy mt-5 max-w-xl text-lg">
            La configuración parte de la mascota, no de un catálogo infinito.
            Contanos qué consume tu perro o gato y armamos su Patitas con
            los productos exactos que necesita, en la cantidad y frecuencia
            que mejor se adapte.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          {petGroups.map((group) => {
            const Icon = group.icon;
            return (
              <article key={group.title} className={`relative min-h-[28rem] overflow-hidden rounded-[1.75rem] p-7 sm:p-10 ${group.className}`}>
                <Icon
                  size={260}
                  weight="duotone"
                  className="absolute -bottom-12 -right-8 opacity-20 sm:size-[320px]"
                  aria-hidden="true"
                />
                <div className="relative max-w-sm">
                  <Icon size={46} weight="duotone" aria-hidden="true" />
                  <h3 className="mt-6 font-display text-4xl font-semibold">{group.title}</h3>
                  <p className={`mt-4 text-lg ${group.mutedClassName}`}>{group.description}</p>
                  <ul className="mt-8 space-y-3">
                    {group.supplies.map((supply) => (
                      <li key={supply} className="flex items-center gap-3 font-semibold">
                        <Check size={18} weight="bold" className={group.checkClassName} aria-hidden="true" />
                        {supply}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
