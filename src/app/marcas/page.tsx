import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getBrands, safeCatalogCall } from "@/infrastructure/api/patitas-api";

export const metadata: Metadata = { title: "Marcas para perros y gatos | Patitas Inquietas", description: "Encontrá el alimento que tu mascota ya consume y compará sus presentaciones.", alternates: { canonical: "/marcas" } };

export default async function BrandsPage() {
  const result = await safeCatalogCall(() => getBrands());
  return <><SiteHeader /><main id="contenido" className="min-h-[65vh] bg-cream py-14 sm:py-20"><div className="container-shell"><h1 className="display-heading text-5xl sm:text-7xl">Marcas</h1><p className="mt-5 max-w-2xl text-lg text-muted">Volvé directo a la marca que tu perro o gato ya conoce.</p>{result.ok && result.data.length ? <div className="mt-10 grid border-t border-border sm:grid-cols-2 lg:grid-cols-3">{result.data.map((brand) => <Link key={brand.id} href={`/marcas/${brand.slug}`} className="group border-b border-border py-7 sm:odd:pr-7 sm:even:border-l sm:even:pl-7 lg:border-l lg:px-7 lg:first:border-l-0"><h2 className="font-display text-3xl font-semibold group-hover:text-brand-blue">{brand.name} →</h2><p className="mt-2 text-sm text-muted">{brand.description ?? "Ver productos, presentaciones y disponibilidad."}</p></Link>)}</div> : <div className="mt-10 rounded-2xl bg-soft-blue p-7"><h2 className="font-display text-2xl font-semibold">Todavía no hay marcas publicables</h2><p className="mt-2 text-muted">{result.ok ? "Una marca aparece cuando tiene al menos un producto activo con precio." : result.error}</p></div>}</div></main><SiteFooter /></>;
}
