import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveCatalogRoute } from "@/data/catalog-routes";
import { CatalogScreen } from "@/features/catalog/catalog-screen";
import { getProductFacets, getProducts, safeCatalogCall } from "@/infrastructure/api/patitas-api";
import { productFiltersFromSearchParams } from "@/lib/catalog-search-params";

type Props = { params: Promise<{ segments?: string[] }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const route = resolveCatalogRoute("cat", (await params).segments ?? []);
  if (!route) return {};
  return {
    title: `${route.title} | Patitas Inquietas`,
    description: route.description,
    alternates: { canonical: `/gatos${route.segments.length ? `/${route.segments.join("/")}` : ""}` },
  };
}

export default async function CatsCatalogPage({ params, searchParams }: Props) {
  const route = resolveCatalogRoute("cat", (await params).segments ?? []);
  if (!route) notFound();
  const query = await searchParams;
  const pathname = `/gatos${route.segments.length ? `/${route.segments.join("/")}` : ""}`;
  const filters = productFiltersFromSearchParams(query, { species: "cat", category: route.category });
  const [products, facets] = await Promise.all([
    safeCatalogCall(() => getProducts(filters)),
    safeCatalogCall(() => getProductFacets(filters)),
  ]);
  return (
    <CatalogScreen
      products={products}
      facets={facets.ok ? facets.data : null}
      species="cat"
      title={route.title}
      description={route.description}
      current={query}
      pathname={pathname}
    />
  );
}
