import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogResults } from "@/components/catalog/catalog-results";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { resolveCatalogRoute } from "@/data/catalog-routes";
import { getBrands, getCategories, getCatalogFilterProducts, getProducts, safeCatalogCall } from "@/infrastructure/api/patitas-api";
import { productFiltersFromSearchParams } from "@/lib/catalog-search-params";

type Props = { params: Promise<{ segments?: string[] }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const route = resolveCatalogRoute("cat", (await params).segments ?? []);
  if (!route) return {};
  return { title: `${route.title} | Patitas Inquietas`, description: route.description, alternates: { canonical: `/gatos${route.segments.length ? `/${route.segments.join("/")}` : ""}` } };
}

export default async function CatsCatalogPage({ params, searchParams }: Props) {
  const route = resolveCatalogRoute("cat", (await params).segments ?? []);
  if (!route) notFound();
  const query = await searchParams;
  const pathname = `/gatos${route.segments.length ? `/${route.segments.join("/")}` : ""}`;
  const filters = productFiltersFromSearchParams(query, { species: "cat", category: route.category });
  const [products, brands, categories, filterProducts] = await Promise.all([
    safeCatalogCall(() => getProducts(filters)),
    safeCatalogCall(() => getBrands()),
    safeCatalogCall(() => getCategories()),
    safeCatalogCall(() => getCatalogFilterProducts({ species: "cat", category: route.category })),
  ]);
  return <><SiteHeader />{products.ok ? <CatalogResults result={products.data} brands={brands.ok ? brands.data : []} categories={categories.ok ? categories.data : []} filterProducts={filterProducts.ok ? filterProducts.data : undefined} species="cat" title={route.title} description={route.description} current={query} pathname={pathname} /> : <main id="contenido" className="container-shell min-h-[60vh] py-20"><h1 className="display-heading text-5xl">{route.title}</h1><div className="mt-10 rounded-2xl bg-soft-yellow p-6"><h2 className="font-display text-2xl font-semibold">No pudimos cargar el catálogo</h2><p className="mt-2 text-muted">{products.error} Revisá que Patitas API esté disponible y volvé a intentar.</p></div></main>}<SiteFooter /></>;
}
