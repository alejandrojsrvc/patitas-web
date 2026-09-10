import type { CatalogLanding, ProductFilters } from "@/domain/catalog/types";

const SEO_FILTER_KEYS = ["species", "category", "foodType", "categorySlug", "lifeStage", "brand"] as const;

export function findCatalogLanding(landings: CatalogLanding[], filters: Partial<ProductFilters>) {
  return landings.find((landing) =>
    SEO_FILTER_KEYS.every((key) => equalFilterValue(landing.filters[key], filters[key])),
  );
}

export function findBestCatalogLanding(landings: CatalogLanding[], filters: Partial<ProductFilters>) {
  return landings
    .filter((landing) =>
      landing.landingType === "CATALOG" &&
      SEO_FILTER_KEYS.every((key) => {
        const landingValue = landing.filters[key];
        return landingValue === undefined || equalFilterValue(landingValue, filters[key]);
      }),
    )
    .sort((left, right) => seoFilterCount(right.filters) - seoFilterCount(left.filters))[0];
}

function seoFilterCount(filters: Partial<ProductFilters>) {
  return SEO_FILTER_KEYS.filter((key) => filters[key] !== undefined).length;
}

function equalFilterValue(left: unknown, right: unknown) {
  const leftValues = values(left);
  const rightValues = values(right);
  return leftValues.length === rightValues.length && leftValues.every((value, index) => value === rightValues[index]);
}

function values(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).sort();
  return value === undefined ? [] : [String(value)];
}
