import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { FoodCalculator } from "@/features/calculator/food-calculator";
import { getCalculatorProducts, safeCatalogCall } from "@/infrastructure/api/patitas-api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Calculadora de alimento para perros y gatos | Patitas",
  description: "Estimá cuánto debería durar una bolsa según el alimento, la presentación y el peso de tu mascota.",
  alternates: { canonical: "/calculadora-alimento" },
};
export default async function CalculatorPage() {
  const result = await safeCatalogCall(() => getCalculatorProducts());
  return (
    <>
      <SiteHeader />
      <main id="contenido" className="bg-catalog-page py-7 sm:py-10 lg:py-12">
        <div className="container-shell">
          <nav aria-label="Migas de pan" className="text-xs text-muted">
            <Link href="/" className="hover:text-brand-blue hover:underline">
              Inicio
            </Link>
            <span aria-hidden="true"> / </span>
            <span className="font-semibold text-ink">Calculadora de alimento</span>
          </nav>
          <div className="mt-5 grid items-start gap-7 lg:grid-cols-[0.68fr_1.32fr] lg:gap-12">
            <div className="lg:sticky lg:top-40">
              <h1 className="display-heading max-w-xl text-4xl sm:text-5xl">Calculá cuánto puede durar una bolsa</h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-muted">
                Elegí un alimento y contanos el peso de tu mascota. Usamos primero la tabla del fabricante y señalamos claramente cuando el
                resultado es una estimación general.
              </p>
              <div className="mt-7 rounded-xl bg-white p-5">
                <p className="font-semibold">Antes de calcular</p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  El resultado es orientativo. La actividad, la condición corporal y la recomendación veterinaria pueden modificar la ración
                  indicada.
                </p>
                <Link href="/guias" className="mt-4 inline-flex text-sm font-semibold text-brand-blue underline-offset-4 hover:underline">
                  Ver guías de alimentación →
                </Link>
              </div>
            </div>
            <FoodCalculator products={result.ok ? result.data : []} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
