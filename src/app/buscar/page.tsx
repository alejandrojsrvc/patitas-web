import type { Metadata } from "next";
import { CatalogScreen } from "@/features/catalog/catalog-screen";
import { getProductFacets, getProducts, safeCatalogCall } from "@/infrastructure/api/patitas-api";
import { productFiltersFromSearchParams } from "@/lib/catalog-search-params";

export const metadata: Metadata = { title: "Buscar productos | Patitas Inquietas", robots: { index: false, follow: true } };
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
export default async function SearchPage({ searchParams }: Props) {
  const query = await searchParams;
  const q = Array.isArray(query.q) ? query.q[0] : query.q;
  const filters = productFiltersFromSearchParams(query);
  const [products, facets] = await Promise.all([
    safeCatalogCall(() => getProducts(filters)),
    safeCatalogCall(() => getProductFacets(filters)),
  ]);
  return (
    <CatalogScreen
      products={products}
      facets={facets.ok ? facets.data : null}
      title={q ? `Resultados para “${q}”` : "Buscar productos"}
      description="Buscá por producto, línea o marca. También podés usar los filtros para acotar la selección."
      current={query}
      pathname="/buscar"
      searchQuery={q}
    />
  );
}
