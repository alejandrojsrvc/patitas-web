import {
  Bone,
  BowlFood,
  Cookie,
  PuzzlePiece,
} from "@phosphor-icons/react/ssr";
import { CtaLink } from "@/components/ui/cta-link";
import { addOns } from "@/data/mocks/landing";

const icons = [BowlFood, Cookie, Bone, PuzzlePiece];

export function AddOns() {
  return (
    <section className="section-space bg-cream">
      <div className="container-shell">
        <div className="max-w-2xl">
          <h2 className="display-heading text-4xl sm:text-5xl lg:text-[3.25rem]">
            Un extra puede viajar con lo de siempre.
          </h2>
          <p className="body-copy mt-5 max-w-xl text-lg">
            Sumalo una vez a una próxima Patitas. No todo tiene que volverse
            recurrente.
          </p>
        </div>

        <div className="mt-12 grid overflow-hidden rounded-[1.75rem] bg-surface shadow-[0_12px_32px_rgba(23,23,23,0.07)] lg:grid-cols-[1.35fr_0.65fr]">
          <ul className="grid sm:grid-cols-2">
            {addOns.map((product, index) => {
              const Icon = icons[index];
              return (
                <li
                  key={product.id}
                  className={`flex min-h-44 items-start gap-4 p-6 sm:p-7 ${index > 0 ? "border-t border-border" : ""} ${index === 1 ? "sm:border-l sm:border-t-0" : ""} ${index === 2 ? "sm:border-t" : ""} ${index === 3 ? "sm:border-l sm:border-t" : ""}`}
                >
                  <Icon
                    size={30}
                    weight="duotone"
                    className="mt-1 shrink-0 text-brand-blue"
                    aria-hidden="true"
                  />
                  <div>
                    <h3 className="font-display text-2xl font-semibold">{product.name}</h3>
                    <p className="mt-2 text-sm text-muted">{product.detail}</p>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-col justify-between bg-brand-yellow p-7 text-ink sm:p-9">
            <div>
              <p className="font-display text-3xl font-semibold leading-tight">
                Un gustito extra, una sola entrega.
              </p>
              <p className="mt-4 max-w-xs text-sm leading-6 text-ink/75">
                Elegís qué sumar y a cuál de las próximas entregas. Después,
                la rutina sigue como estaba.
              </p>
            </div>
            <CtaLink href="/armar" variant="secondary" className="mt-10 bg-surface">
              Armar mi Patitas
            </CtaLink>
          </div>
        </div>
      </div>
    </section>
  );
}
