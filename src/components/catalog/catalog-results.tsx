import type { ProductFacets, ProductPage, Species } from "@/domain/catalog/types";
import type { CatalogSearchParams } from "@/lib/catalog-search-params";
import { CatalogIntro } from "./catalog-intro";
import { CatalogFilterSidebar } from "./catalog-filter-sidebar";
import { CatalogPagination } from "./catalog-pagination";
import { CatalogSortOptions } from "./catalog-sort-options";
import { ProductGrid } from "./product-grid";

export function CatalogResults({
  result,
  facets,
  species,
  title,
  description,
  current,
  pathname,
}: {
  result: ProductPage;
  facets?: ProductFacets | null;
  species?: Species;
  title: string;
  description: string;
  current: CatalogSearchParams;
  pathname: string;
}) {
  const selectedBrands = values(current.brand);
  const selectedStages = values(current.lifeStage);
  const selectedWeights = values(current.weightGrams);
  const filters = {
    categories: withSelectedOptions(
      flattenCategories(facets?.categories ?? [])
        .filter((category) => !species || category.species.map((value) => value.toLowerCase()).includes(species))
        .map((category) => [category.value, category.displayLabel] as const),
      first(current.category) ? [first(current.category)!] : [],
    ),
    brands: withSelectedOptions(facets?.brands.map((option) => [option.value, option.label] as const) ?? [], selectedBrands),
    stages: withSelectedOptions(facets?.lifeStages.map((option) => [option.value, option.label] as const) ?? [], selectedStages),
    weights: withSelectedOptions(facets?.weights.map((option) => [String(option.value), option.label] as const) ?? [], selectedWeights),
  };

  return (
    <main id="contenido" className="bg-catalog-page pb-20">
      <CatalogIntro species={species} title={title} description={description} />

      <section className="container-shell py-5 sm:py-7 lg:py-9">
        <div className="grid items-start gap-4 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10">
          <CatalogFilterSidebar pathname={pathname} current={current} species={species} {...filters} />

          <div className="min-w-0">
            <div className="mb-5 flex min-w-0 flex-col gap-3 border-b border-catalog-line pb-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pb-5">
              <div>
                <p className="text-sm text-muted">
                  <strong className="text-ink">{result.meta.total}</strong> productos
                </p>
                {result.meta.totalPages > 1 ? (
                  <p className="mt-1 text-xs text-muted">
                    Página {result.meta.page} de {result.meta.totalPages}
                  </p>
                ) : null}
              </div>
              <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-ink">
                <span className="shrink-0">Ordenar</span>
                <CatalogSortOptions current={current} pathname={pathname} />
              </div>
            </div>
            <ProductGrid products={result.items} />
            {result.meta.totalPages > 1 ? <CatalogPagination result={result} pathname={pathname} current={current} /> : null}
          </div>
        </div>
      </section>
    </main>
  );
}

const first = (input: string | string[] | undefined) => (Array.isArray(input) ? input[0] : input);
const values = (input: string | string[] | number[] | undefined) =>
  Array.isArray(input) ? input.map(String) : input ? [String(input)] : [];

function flattenCategories(categories: CategoryFacetOption[], depth = 0): Array<CategoryFacetOption & { displayLabel: string }> {
  return categories.flatMap((category) => [
    { ...category, displayLabel: `${depth ? "— ".repeat(depth) : ""}${category.label}` },
    ...flattenCategories(category.children ?? [], depth + 1),
  ]);
}

function withSelectedOptions(options: Array<readonly [string, string]>, selectedValues: string[]) {
  const known = new Set(options.map(([value]) => value));
  return [...options, ...selectedValues.filter((value) => !known.has(value)).map((value) => [value, value] as const)];
}
