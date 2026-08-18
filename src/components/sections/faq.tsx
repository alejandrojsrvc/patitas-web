import { Plus } from "@phosphor-icons/react/ssr";
import { faqs } from "@/data/mocks/landing";

export function FAQ() {
  return (
    <section id="preguntas" className="anchor-section section-space bg-cream">
      <div className="container-shell grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
        <div>
          <h2 className="display-heading text-4xl sm:text-5xl lg:text-[3.25rem]">
            Antes de armar su Patitas.
          </h2>
          <p className="body-copy mt-5 max-w-md text-lg">
            Lo importante, sin letra chica ni promesas que todavía no podemos
            hacer.
          </p>
          <div id="cobertura" className="anchor-section mt-8 rounded-2xl bg-soft-yellow p-5">
            <p className="text-xs font-bold tracking-[0.1em] text-ink">ZONA INICIAL</p>
            <p className="mt-2 font-display text-2xl font-semibold">Villa Crespo, CABA</p>
          </div>
        </div>

        <div className="border-t border-border">
          {faqs.map((faq) => (
            <details key={faq.question} className="group border-b border-border">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 font-display text-xl font-semibold leading-tight marker:hidden sm:text-2xl [&::-webkit-details-marker]:hidden">
                <span>{faq.question}</span>
                <Plus
                  size={22}
                  weight="bold"
                  className="shrink-0 text-brand-blue"
                  aria-hidden="true"
                />
              </summary>
              <p className="max-w-2xl pb-6 pr-10 text-muted">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
