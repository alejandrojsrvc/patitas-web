import type { ProductFilters, Species } from "@/domain/catalog/types";
import { catalogFacetedPath } from "@/data/catalog-routes";

export type CatalogSearchParams = Record<string, string | string[] | undefined>;

const MAX_PAGE = 250;
const MAX_FILTER_VALUES = 20;
const CATALOG_FILTER_PARAM_NAMES = [
  "q",
  "species",
  "category",
  "brand",
  "lifeStage",
  "weightGrams",
  "minPrice",
  "maxPrice",
  "sort",
] as const;

const first = (input: string | string[] | undefined) => (Array.isArray(input) ? input[0] : input);

const text = (input: string | string[] | undefined, maxLength: number) => {
  const value = first(input)?.trim().replace(/\s+/g, " ");
  return value && value.length <= maxLength ? value : undefined;
};

const list = (input: string | string[] | undefined, maxLength: number) =>
  input
    ? [
        ...new Set(
          (Array.isArray(input) ? input : [input]).flatMap((value) =>
            value
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
          ),
        ),
      ]
        .filter((value) => value.length <= maxLength)
        .slice(0, MAX_FILTER_VALUES)
    : undefined;

const positiveInteger = (input: string | string[] | undefined) => {
  const parsed = Number(first(input) ?? 1);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= MAX_PAGE ? parsed : 1;
};

const decimal = (input: string | string[] | undefined) => {
  const value = first(input);
  if (!value || value.length > 24) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? String(parsed) : undefined;
};

export function normalizeCatalogSearchParams(searchParams: CatalogSearchParams): CatalogSearchParams {
  const requestedSpecies = text(searchParams.species, 32);
  const requestedSort = text(searchParams.sort, 24);
  const page = positiveInteger(searchParams.page);
  const normalized: CatalogSearchParams = {
    q: text(searchParams.q, 80),
    species: requestedSpecies === "dog" || requestedSpecies === "cat" ? requestedSpecies : undefined,
    category: text(searchParams.category, 220),
    brand: list(searchParams.brand, 220),
    lifeStage: list(searchParams.lifeStage, 120),
    weightGrams: list(searchParams.weightGrams, 12)
      ?.map(Number)
      .filter((weight) => Number.isInteger(weight) && weight > 0 && weight <= 100_000)
      .map(String),
    minPrice: decimal(searchParams.minPrice),
    maxPrice: decimal(searchParams.maxPrice),
    sort: ["featured", "name_asc", "price_asc", "price_desc"].includes(requestedSort ?? "") ? requestedSort : undefined,
    page: page > 1 ? String(page) : undefined,
  };

  return Object.fromEntries(Object.entries(normalized).filter(([, value]) => value !== undefined));
}

export function hasCatalogFilterParams(searchParams: CatalogSearchParams) {
  return CATALOG_FILTER_PARAM_NAMES.some((name) => {
    const value = searchParams[name];
    return Array.isArray(value) ? value.some((item) => item.trim().length > 0) : Boolean(value?.trim());
  });
}

export function productFiltersFromSearchParams(
  searchParams: CatalogSearchParams,
  fixed: { species?: Species; category?: string } = {},
): ProductFilters {
  const normalized = normalizeCatalogSearchParams(searchParams);
  const requestedSpecies = first(normalized.species);
  const requestedSort = first(normalized.sort);

  return {
    q: first(normalized.q),
    species: fixed.species ?? (requestedSpecies === "dog" || requestedSpecies === "cat" ? requestedSpecies : undefined),
    category: fixed.category ?? first(normalized.category),
    brand: list(normalized.brand, 220),
    lifeStage: list(normalized.lifeStage, 120),
    weightGrams: list(normalized.weightGrams, 12)
      ?.map(Number)
      .filter((weight) => Number.isInteger(weight) && weight > 0 && weight <= 100_000),
    minPrice: decimal(normalized.minPrice),
    maxPrice: decimal(normalized.maxPrice),
    sort: ["featured", "name_asc", "price_asc", "price_desc"].includes(requestedSort ?? "")
      ? (requestedSort as ProductFilters["sort"])
      : "featured",
    page: positiveInteger(normalized.page),
    perPage: 24,
  };
}

export function catalogHref(
  pathname: string,
  searchParams: CatalogSearchParams,
  changes: Record<string, string | number | string[] | undefined>,
) {
  const normalized = normalizeCatalogSearchParams(searchParams);
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(normalized)) {
    for (const item of Array.isArray(value) ? value : value ? [value] : []) {
      params.append(key, item);
    }
  }
  for (const [key, value] of Object.entries(changes)) {
    params.delete(key);
    if (key === "page" && Number(value) === 1) continue;
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else if (value !== undefined && value !== "") params.set(key, String(value));
  }
  let targetPathname = pathname;
  const species = speciesFromCatalogPath(pathname);
  const brands = params.getAll("brand");
  const lifeStages = params.getAll("lifeStage");
  if (species && brands.length <= 1 && lifeStages.length <= 1) {
    const facetedPath = catalogFacetedPath(pathname, species, brands[0], lifeStages[0]);
    if (facetedPath) {
      targetPathname = facetedPath;
      params.delete("brand");
      params.delete("lifeStage");
    }
  }
  const query = params.toString();
  return query ? `${targetPathname}?${query}` : targetPathname;
}

function speciesFromCatalogPath(pathname: string): Species | null {
  if (pathname === "/perros" || pathname.startsWith("/perros/")) return "dog";
  if (pathname === "/gatos" || pathname.startsWith("/gatos/")) return "cat";
  return null;
}
