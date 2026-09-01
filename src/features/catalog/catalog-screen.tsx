import type { ProductFacets, ProductPage, Species } from "@/domain/catalog/types";
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
  current,
  pathname,
  searchQuery,
}: {
  products: CatalogLoadResult;
  facets: ProductFacets | null;
  species?: Species;
  title: string;
  description: string;
  current: Record<string, string | string[] | undefined>;
  pathname: string;
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
          current={current}
          pathname={pathname}
        />
      ) : (
        <CatalogFailure title={title} message={products.error} />
      )}
      <SiteFooter />
    </>
  );
}
