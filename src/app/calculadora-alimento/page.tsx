import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { FoodCalculator } from "@/features/calculator/food-calculator";
import { getProducts, safeCatalogCall } from "@/infrastructure/api/patitas-api";

export const metadata: Metadata = { title: "Calculadora de alimento para perros y gatos | Patitas", description: "Estimá cuánto debería durar una bolsa según el alimento, la presentación y el peso de tu mascota.", alternates: { canonical: "/calculadora-alimento" } };
export default async function CalculatorPage() {
  const result = await safeCatalogCall(() => getProducts({ category: "alimentos", perPage: 100 }));
  return <><SiteHeader /><main id="contenido" className="bg-cream py-14 sm:py-20"><div className="container-shell grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr]"><div><h1 className="display-heading text-5xl sm:text-7xl">¿Cuánto debería durar esta bolsa?</h1><p className="mt-6 max-w-xl text-lg leading-8 text-muted">Elegí el alimento, la presentación y el peso de tu mascota. Patitas usa primero la tabla del fabricante y te avisa cuando solo puede dar una estimación general.</p><div className="mt-8 border-t border-border pt-6"><p className="font-semibold">El resultado es orientativo.</p><p className="mt-2 text-sm leading-6 text-muted">La actividad, condición corporal y recomendación veterinaria pueden cambiar la ración. No reemplaza la indicación del envase ni de un profesional.</p></div><Link href="/guias" className="mt-7 inline-flex font-semibold text-brand-blue underline-offset-4 hover:underline">Leer las guías de alimentación →</Link></div><FoodCalculator products={result.ok ? result.data.items : []} /></div></main><SiteFooter /></>;
}
