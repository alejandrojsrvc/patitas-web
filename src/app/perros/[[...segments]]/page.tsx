import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogResults } from "@/components/catalog/catalog-results";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { resolveCatalogRoute } from "@/data/catalog-routes";
import { getBrands, getCategories, getProducts, safeCatalogCall } from "@/infrastructure/api/patitas-api";
import { productFiltersFromSearchParams } from "@/lib/catalog-search-params";

type Props = { params: Promise<{ segments?: string[] }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const route = resolveCatalogRoute("dog", (await params).segments ?? []);
  if (!route) return {};
  return { title: `${route.title} | Patitas Inquietas`, description: route.description, alternates: { canonical: `/perros${route.segments.length ? `/${route.segments.join("/")}` : ""}` } };
}

export default async function DogsCatalogPage({ params, searchParams }: Props) {
  const route = resolveCatalogRoute("dog", (await params).segments ?? []);
  if (!route) notFound();
  const query = await searchParams;
  const pathname = `/perros${route.segments.length ? `/${route.segments.join("/")}` : ""}`;
  const filters = productFiltersFromSearchParams(query, { species: "dog", category: route.category });
  const [products, brands, categories] = await Promise.all([
    safeCatalogCall(() => getProducts(filters)),
    safeCatalogCall(() => getBrands()),
    safeCatalogCall(() => getCategories()),
  ]);
  return <><SiteHeader />{products.ok ? <CatalogResults result={products.data} brands={brands.ok ? brands.data : []} categories={categories.ok ? categories.data : []} species="dog" title={route.title} description={route.description} current={query} pathname={pathname} /> : <CatalogFailure title={route.title} message={products.error} />}<SiteFooter /></>;
}

function CatalogFailure({ title, message }: { title: string; message: string }) {
  return <main id="contenido" className="container-shell min-h-[60vh] py-20"><h1 className="display-heading text-5xl">{title}</h1><div className="mt-10 rounded-2xl bg-soft-yellow p-6"><h2 className="font-display text-2xl font-semibold">No pudimos cargar el catálogo</h2><p className="mt-2 text-muted">{message} Revisá que Patitas API esté disponible y volvé a intentar.</p></div></main>;
}
