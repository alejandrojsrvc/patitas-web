import type { Metadata } from "next";
import { CatalogResults } from "@/components/catalog/catalog-results";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getBrands, getCategories, getCatalogFilterProducts, getProducts, safeCatalogCall } from "@/infrastructure/api/patitas-api";
import { productFiltersFromSearchParams } from "@/lib/catalog-search-params";

export const metadata: Metadata = { title: "Buscar productos | Patitas Inquietas", robots: { index: false, follow: true } };
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
export default async function SearchPage({ searchParams }: Props) {
  const query = await searchParams;
  const q = Array.isArray(query.q) ? query.q[0] : query.q;
  const filters = productFiltersFromSearchParams(query);
  const [products, brands, categories, filterProducts] = await Promise.all([
    safeCatalogCall(() => getProducts(filters)),
    safeCatalogCall(() => getBrands()),
    safeCatalogCall(() => getCategories()),
    safeCatalogCall(() => getCatalogFilterProducts({ species: filters.species, category: filters.category })),
  ]);
  return <><SiteHeader searchQuery={q} />{products.ok ? <CatalogResults result={products.data} brands={brands.ok ? brands.data : []} categories={categories.ok ? categories.data : []} filterProducts={filterProducts.ok ? filterProducts.data : undefined} title={q ? `Resultados para “${q}”` : "Buscar productos"} description="Buscá por producto, línea o marca. También podés usar los filtros para acotar la selección." current={query} pathname="/buscar" /> : <main id="contenido" className="container-shell min-h-[60vh] bg-catalog-canvas py-20"><h1 className="display-heading text-5xl">Buscar productos</h1><div className="mt-10 rounded-2xl bg-soft-yellow p-6"><h2 className="font-display text-2xl font-semibold">No pudimos cargar el catálogo</h2><p className="mt-2 text-muted">{products.error} Volvé a intentar en unos minutos.</p></div></main>}<SiteFooter /></>;
}
