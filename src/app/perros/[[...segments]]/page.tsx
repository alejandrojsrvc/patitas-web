import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { catalogPath, resolveCatalogRoute, type CatalogRoute } from "@/data/catalog-routes";
import { CatalogScreen } from "@/features/catalog/catalog-screen";
import { getBrands, getProductFacets, getProducts, safeCatalogCall } from "@/infrastructure/api/patitas-api";
import { hasCatalogFilterParams, normalizeCatalogSearchParams, productFiltersFromSearchParams } from "@/lib/catalog-search-params";
import { cacheLife, cacheTag } from "next/cache";

type Props = { params: Promise<{ segments?: string[] }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const route = resolveCatalogRoute("dog", (await params).segments ?? []);
  if (!route) return {};
  return {
    title: `${route.title} | Patitas Inquietas`,
    description: route.description,
    alternates: { canonical: catalogPath("dog", route.segments) },
    robots: hasCatalogFilterParams(await searchParams) ? { index: false, follow: false } : undefined,
  };
}

export default async function DogsCatalogPage({ params, searchParams }: Props) {
  const route = resolveCatalogRoute("dog", (await params).segments ?? []);
  if (!route) notFound();
  const query = normalizeCatalogSearchParams(await searchParams);
  delete query.q;
  delete query.species;
  delete query.category;
  if (route.brand) query.brand = [route.brand];
  if (route.lifeStage) query.lifeStage = [route.lifeStage];
  return <CachedDogsCatalog route={route} query={query} />;
}

async function CachedDogsCatalog({ route, query }: { route: CatalogRoute; query: Record<string, string | string[] | undefined> }) {
  "use cache";
  cacheLife({ stale: 30, revalidate: 60, expire: 86400 });
  cacheTag("catalog-products", "catalog-facets");
  const requestedBrand = route.brand;
  if (requestedBrand) {
    const brands = await safeCatalogCall(() => getBrands());
    if (brands.ok && !brands.data.some((brand) => brand.slug === requestedBrand)) notFound();
  }
  const pathname = catalogPath("dog", route.categorySegments);
  const filters = productFiltersFromSearchParams(query, { species: "dog", category: route.category });
  const [products, facets] = await Promise.all([
    safeCatalogCall(() => getProducts(filters)),
    safeCatalogCall(() => getProductFacets(filters)),
  ]);
  if (products.ok && (route.brand || route.lifeStage) && products.data.meta.total === 0 && hasOnlyPathFacets(query)) notFound();
  return (
    <CatalogScreen
      products={products}
      facets={facets.ok ? facets.data : null}
      species="dog"
      title={route.title}
      description={route.description}
      current={query}
      pathname={pathname}
    />
  );
}

function hasOnlyPathFacets(query: Record<string, string | string[] | undefined>) {
  return Object.keys(query).every((key) => ["brand", "lifeStage", "page"].includes(key));
}
