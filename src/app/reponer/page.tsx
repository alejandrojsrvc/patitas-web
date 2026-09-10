import { Calculator, Package, ShoppingBagOpen } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: "Reposición de alimento para mascotas en CABA | Patitas",
  description: "Calculá cuánto puede durar el alimento de tu perro o gato y prepará su próxima reposición en CABA.",
  alternates: { canonical: "/reponer" },
};

const steps = [
  [ShoppingBagOpen, "Elegí el alimento", "Buscá la marca y presentación que consume tu mascota."],
  [Calculator, "Calculá la duración", "Usamos la tabla del fabricante cuando está disponible."],
  [Package, "Compará presentaciones", "Usá la estimación como referencia para tu próxima compra."],
] as const;

export default function ReplenishPage() {
  return (
    <>
      <SiteHeader />
      <main id="contenido">
        <section className="bg-brand-blue py-16 text-white sm:py-24">
          <div className="container-shell">
            <h1 className="display-heading max-w-5xl text-5xl sm:text-7xl">Entendé cuánto puede durar antes de elegir otra bolsa.</h1>
            <p className="mt-6 max-w-2xl text-xl leading-8 text-white/75">
              La calculadora combina la presentación con los datos de tu mascota y explica de dónde sale cada estimación.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/calculadora-alimento"
                className="inline-flex min-h-14 items-center justify-center rounded-xl bg-brand-yellow px-6 font-semibold text-ink"
              >
                Probar calculadora
              </Link>
              <Link
                href="/perros/alimentos-balanceados"
                className="inline-flex min-h-14 items-center justify-center rounded-xl border border-white/35 px-6 font-semibold text-white hover:bg-white/10"
              >
                Ver alimentos
              </Link>
            </div>
          </div>
        </section>
        <section className="bg-page-bg py-16 sm:py-20">
          <div className="container-shell grid gap-8 md:grid-cols-3">
            {steps.map(([Icon, title, description]) => (
              <article key={title} className="border-t border-border pt-6">
                <Icon size={32} weight="duotone" className="text-brand-blue" />
                <h2 className="mt-8 font-display text-3xl font-semibold">{title}</h2>
                <p className="mt-3 text-muted">{description}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="bg-white py-16 sm:py-20">
          <div className="container-shell grid gap-10 lg:grid-cols-2">
            <div>
              <h2 className="display-heading text-4xl sm:text-5xl">Una referencia clara, no una promesa exacta.</h2>
              <p className="mt-5 max-w-xl text-lg text-muted">
                La actividad, la condición corporal y la recomendación veterinaria pueden cambiar la ración. Por eso siempre mostramos la
                fuente usada.
              </p>
            </div>
            <div className="rounded-2xl bg-soft-blue p-7">
              <p className="font-display text-2xl font-semibold">Qué necesitás para calcular</p>
              <ul className="mt-6 space-y-4 text-muted">
                <li className="border-b border-border pb-3">El alimento y su presentación</li>
                <li className="border-b border-border pb-3">El peso de tu perro o gato</li>
                <li>Su etapa de vida</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
