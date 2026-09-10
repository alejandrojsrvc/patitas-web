import type { CatalogBreadcrumb, CatalogSpecies, CategoryFacetOption, ProductFacets, ProductPage } from "@/domain/catalog/types";
import type { CatalogNavigation, CatalogSearchParams } from "@/lib/catalog-search-params";
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
  breadcrumbs,
  current,
  pathname,
  navigation,
}: {
  result: ProductPage;
  facets?: ProductFacets | null;
  species?: CatalogSpecies;
  title: string;
  description: string;
  breadcrumbs?: CatalogBreadcrumb[];
  current: CatalogSearchParams;
  pathname: string;
  navigation?: CatalogNavigation;
}) {
  const displayCurrent =
    navigation?.landing.landingType === "BRAND"
      ? Object.fromEntries(Object.entries(current).filter(([key]) => key !== "brand"))
      : current;
  const selectedBrands = values(displayCurrent.brand);
  const selectedStages = values(displayCurrent.lifeStage);
  const selectedWeights = values(displayCurrent.weightGrams);
  const filters = {
    categories: withSelectedOptions(
      flattenCategories(facets?.categories ?? [])
        .filter((category) => !species || category.species.includes(species))
        .map((category) => [category.value, category.displayLabel] as const),
      first(displayCurrent.category) ? [first(displayCurrent.category)!] : [],
    ),
    brands:
      navigation?.landing.landingType === "BRAND"
        ? []
        : withSelectedOptions(facets?.brands.map((option) => [option.value, option.label] as const) ?? [], selectedBrands),
    stages: withSelectedOptions(facets?.lifeStages.map((option) => [option.value, option.label] as const) ?? [], selectedStages),
    weights: withSelectedOptions(facets?.weights.map((option) => [String(option.value), option.label] as const) ?? [], selectedWeights),
    foodTypes: withSelectedOptions(facets?.foodTypes.map((option) => [option.value, option.label] as const) ?? [], first(displayCurrent.foodType) ? [first(displayCurrent.foodType)!] : []),
    subcategories: withSelectedOptions(facets?.subcategories.map((option) => [option.value, option.label] as const) ?? [], first(displayCurrent.categorySlug) ? [first(displayCurrent.categorySlug)!] : []),
    availability: withSelectedOptions(facets?.availability.map((option) => [option.value, option.label] as const) ?? [], first(displayCurrent.availability) ? [first(displayCurrent.availability)!] : []),
  };

  return (
    <main id="contenido" className="bg-catalog-page pb-20 [overflow-anchor:none]">
      <CatalogIntro title={title} description={description} breadcrumbs={breadcrumbs} />

      <section className="container-shell pb-8 pt-3 sm:pb-10 sm:pt-4">
        <div className="grid items-start gap-4 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
          <CatalogFilterSidebar pathname={pathname} current={displayCurrent} species={species} resultCount={result.meta.total} navigation={navigation} {...filters} />

          <div className="min-w-0">
            <div className="mb-4 hidden min-h-11 min-w-0 items-center justify-between gap-4 border-b border-catalog-line pb-3 lg:flex">
              <p className="text-sm text-muted">
                <strong className="font-semibold text-ink">{result.meta.total}</strong> {result.meta.total === 1 ? "producto" : "productos"}
              </p>
              <CatalogSortOptions current={displayCurrent} pathname={pathname} navigation={navigation} />
            </div>
            <CatalogAppliedFilters pathname={pathname} current={displayCurrent} species={species} navigation={navigation} {...filters} />
            <div className="mb-4">
              <PetShoppingBar />
            </div>
            <ProductGrid
              products={result.items}
              emptyCopy="No encontramos productos con esta combinación. Quitá algún filtro para ampliar los resultados."
              emptyAction={{ href: pathname, label: "Ver todos los productos" }}
            />
            {result.meta.totalPages > 1 ? <CatalogPagination result={result} pathname={pathname} current={displayCurrent} navigation={navigation} /> : null}
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
