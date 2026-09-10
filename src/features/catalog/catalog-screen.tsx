import type { CatalogBreadcrumb, CatalogSpecies, ProductFacets, ProductPage } from "@/domain/catalog/types";
import type { CatalogNavigation } from "@/lib/catalog-search-params";
import { CatalogFailure } from "@/components/catalog/catalog-failure";
import { CatalogResults } from "@/components/catalog/catalog-results";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

type CatalogLoadResult = { ok: true; data: ProductPage } | { ok: false; error: string };

export function CatalogScreen({
  products,
  facets,
  species,
  title,
  description,
  breadcrumbs,
  current,
  pathname,
  navigation,
  searchQuery,
}: {
  products: CatalogLoadResult;
  facets: ProductFacets | null;
  species?: CatalogSpecies;
  title: string;
  description: string;
  breadcrumbs?: CatalogBreadcrumb[];
  current: Record<string, string | string[] | undefined>;
  pathname: string;
  navigation?: CatalogNavigation;
  searchQuery?: string;
}) {
  return (
    <>
      <SiteHeader publicOnly searchQuery={searchQuery} />
      {products.ok ? (
        <CatalogResults
          result={products.data}
          facets={facets}
          species={species}
          title={title}
          description={description}
          breadcrumbs={breadcrumbs}
          current={current}
          pathname={pathname}
          navigation={navigation}
        />
      ) : (
        <CatalogFailure title={title} message={products.error} />
      )}
      <SiteFooter />
    </>
  );
}
