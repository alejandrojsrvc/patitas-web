import type { CategoryFacetOption, ProductFacets, ProductPage, Species } from "@/domain/catalog/types";
import type { CatalogSearchParams } from "@/lib/catalog-search-params";
import { CatalogAppliedFilters } from "./catalog-applied-filters";
import { CatalogIntro } from "./catalog-intro";
import { CatalogFilterSidebar } from "./catalog-filter-sidebar";
import { CatalogPagination } from "./catalog-pagination";
import { CatalogSortOptions } from "./catalog-sort-options";
import { ProductGrid } from "./product-grid";
import { PetShoppingBar } from "@/features/pets/pet-shopping-bar";

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
    <main id="contenido" className="bg-catalog-page pb-20 [overflow-anchor:none]">
      <CatalogIntro species={species} title={title} description={description} />

      <section className="container-shell pb-8 pt-3 sm:pb-10 sm:pt-4">
        <div className="grid items-start gap-4 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
          <CatalogFilterSidebar pathname={pathname} current={current} species={species} resultCount={result.meta.total} {...filters} />

          <div className="min-w-0">
            <div className="mb-4 hidden min-h-11 min-w-0 items-center justify-between gap-4 border-b border-catalog-line pb-3 lg:flex">
              <p className="text-sm text-muted">
                <strong className="font-semibold text-ink">{result.meta.total}</strong> {result.meta.total === 1 ? "producto" : "productos"}
              </p>
              <CatalogSortOptions current={current} pathname={pathname} />
            </div>
            <CatalogAppliedFilters pathname={pathname} current={current} species={species} {...filters} />
            <div className="mb-4">
              <PetShoppingBar />
            </div>
            <ProductGrid
              products={result.items}
              emptyCopy="No encontramos productos con esta combinación. Quitá algún filtro para ampliar los resultados."
              emptyAction={{ href: pathname, label: "Ver todos los productos" }}
            />
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
