import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { CatalogScreen } from "@/features/catalog/catalog-screen";
import {
  getCatalogLandings,
  getProductFacets,
  getProducts,
  PatitasApiError,
  resolveCatalogPath,
  safeCatalogCall,
} from "@/infrastructure/api/patitas-api";
import {
  hasCatalogFilterParams,
  normalizeCatalogSearchParams,
  productFiltersFromSearchParams,
  promotedCatalogHref,
  searchParamsWithLanding,
  type CatalogNavigation,
  type CatalogSearchParams,
} from "@/lib/catalog-search-params";

export async function catalogLandingMetadata(path: string, searchParams: CatalogSearchParams): Promise<Metadata> {
  const landing = await resolveLanding(path);
  if (!landing || landing.kind === "REDIRECT") return {};
  const filtered = hasCatalogFilterParams(normalizeCatalogSearchParams(searchParams));
  return {
    title: `${landing.seo.title} | Patitas Inquietas`,
    description: landing.seo.description,
    alternates: { canonical: landing.seo.canonical },
    robots: filtered ? { index: false, follow: false } : landing.seo.robots,
  };
}

export async function CatalogLandingPage({ path, searchParams }: { path: string; searchParams: CatalogSearchParams }) {
  const resolution = await resolveLanding(path);
  if (!resolution) notFound();
  if (resolution.kind === "REDIRECT") {
    const params = new URLSearchParams();
    for (const [key, rawValue] of Object.entries(normalizeCatalogSearchParams(searchParams))) {
      for (const value of Array.isArray(rawValue) ? rawValue : rawValue ? [rawValue] : []) params.append(key, value);
    }
    const query = params.toString();
    permanentRedirect(query ? `${resolution.destination}?${query}` : resolution.destination);
  }

  const query = normalizeCatalogSearchParams(searchParams);
  if (resolution.filters.species) delete query.species;
  const manifest = await getCatalogLandings();
  const navigation: CatalogNavigation = { landing: resolution, landings: manifest.items };
  const promoted = promotedCatalogHref(query, navigation);
  if (promoted) permanentRedirect(promoted);

  const filters = productFiltersFromSearchParams(query, resolution.filters);
  const [products, facets] = await Promise.all([
    safeCatalogCall(() => getProducts(filters)),
    safeCatalogCall(() => getProductFacets(filters)),
  ]);

  return (
    <>
      <BreadcrumbJsonLd breadcrumbs={resolution.breadcrumbs} />
      <CatalogScreen
        products={products}
        facets={facets.ok ? facets.data : null}
        species={resolution.filters.species}
        title={resolution.seo.h1}
        description={resolution.seo.description}
        breadcrumbs={resolution.breadcrumbs}
        current={searchParamsWithLanding(query, resolution)}
        pathname={resolution.seo.canonical}
        navigation={navigation}
      />
    </>
  );
}

async function resolveLanding(path: string) {
  try {
    return await resolveCatalogPath(path);
  } catch (error) {
    if (error instanceof PatitasApiError && error.status === 404) return null;
    throw error;
  }
}
