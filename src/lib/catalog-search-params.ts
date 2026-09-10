import { findBestCatalogLanding } from "@/data/catalog-routes";
import type {
  CatalogAvailability,
  CatalogLanding,
  CatalogLandingFilters,
  CatalogSpecies,
  FoodType,
  LifeStage,
  ProductCategory,
  ProductFilters,
} from "@/domain/catalog/types";

export type CatalogSearchParams = Record<string, string | string[] | undefined>;
export type CatalogNavigation = { landing: CatalogLanding; landings: CatalogLanding[] };

const MAX_PAGE = 250;
const MAX_FILTER_VALUES = 20;
const CATALOG_FILTER_PARAM_NAMES = [
  "q",
  "species",
  "category",
  "foodType",
  "categorySlug",
  "brand",
  "lifeStage",
  "weightGrams",
  "minPrice",
  "maxPrice",
  "availability",
  "sort",
  "page",
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

const enumValue = <T extends string>(input: string | string[] | undefined, allowed: readonly T[]): T | undefined => {
  const value = first(input);
  return allowed.includes(value as T) ? (value as T) : undefined;
};

const enumList = <T extends string>(input: string | string[] | undefined, allowed: readonly T[]): T[] | undefined => {
  const requested = list(input, 40)?.filter((value): value is T => allowed.includes(value as T));
  return requested?.length ? requested : undefined;
};

export function normalizeCatalogSearchParams(searchParams: CatalogSearchParams): CatalogSearchParams {
  const requestedSort = text(searchParams.sort, 24);
  const page = positiveInteger(searchParams.page);
  const normalized: CatalogSearchParams = {
    q: text(searchParams.q, 80),
    species: enumValue(searchParams.species, ["DOG", "CAT"] as const),
    category: enumValue(searchParams.category, ["FOOD", "SNACK", "HYGIENE"] as const),
    foodType: enumValue(searchParams.foodType, ["DRY", "WET"] as const),
    categorySlug: slug(searchParams.categorySlug),
    brand: list(searchParams.brand, 220)?.filter(isSlug),
    lifeStage: enumList(searchParams.lifeStage, ["PUPPY", "ADULT", "SENIOR"] as const),
    weightGrams: list(searchParams.weightGrams, 12)
      ?.map(Number)
      .filter((weight) => Number.isInteger(weight) && weight > 0 && weight <= 100_000)
      .map(String),
    minPrice: decimal(searchParams.minPrice),
    maxPrice: decimal(searchParams.maxPrice),
    availability: enumValue(searchParams.availability, ["AVAILABLE", "OUT_OF_STOCK"] as const),
    sort: ["featured", "name_asc", "price_asc", "price_desc"].includes(requestedSort ?? "") ? requestedSort : undefined,
    page: page > 1 ? String(page) : undefined,
  };
  return Object.fromEntries(
    Object.entries(normalized).filter(([, value]) => value !== undefined && (!Array.isArray(value) || value.length)),
  );
}

export function hasCatalogFilterParams(searchParams: CatalogSearchParams) {
  return CATALOG_FILTER_PARAM_NAMES.some((name) => {
    const value = searchParams[name];
    return Array.isArray(value) ? value.some((item) => item.trim().length > 0) : Boolean(value?.trim());
  });
}

export function productFiltersFromSearchParams(
  searchParams: CatalogSearchParams,
  fixed: CatalogLandingFilters | Partial<ProductFilters> = {},
): ProductFilters {
  const normalized = normalizeCatalogSearchParams(searchParams);
  const requestedSort = first(normalized.sort);
  return {
    q: first(normalized.q),
    species: fixed.species ?? (first(normalized.species) as CatalogSpecies | undefined),
    category: fixed.category ?? (first(normalized.category) as ProductCategory | undefined),
    foodType: fixed.foodType ?? (first(normalized.foodType) as FoodType | undefined),
    categorySlug: fixed.categorySlug ?? first(normalized.categorySlug),
    brand: fixed.brand ? values(fixed.brand) : list(normalized.brand, 220),
    lifeStage: fixed.lifeStage
      ? (values(fixed.lifeStage) as LifeStage[])
      : enumList(normalized.lifeStage, ["PUPPY", "ADULT", "SENIOR"] as const),
    weightGrams: list(normalized.weightGrams, 12)?.map(Number),
    minPrice: decimal(normalized.minPrice),
    maxPrice: decimal(normalized.maxPrice),
    availability: fixed.availability ?? (first(normalized.availability) as CatalogAvailability | undefined),
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
  navigation?: CatalogNavigation,
) {
  const params = toUrlSearchParams(normalizeCatalogSearchParams(searchParams));
  for (const [key, value] of Object.entries(changes)) {
    params.delete(key);
    if (key === "page" && Number(value) === 1) continue;
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const normalized = normalizeCatalogSearchParams(fromUrlSearchParams(params));
  let targetPathname = pathname;
  if (navigation?.landing.landingType === "CATALOG") {
    const candidate = navigationCandidate(navigation.landing, normalized, changes);
    const landing = findBestCatalogLanding(navigation.landings, candidate);
    if (landing) {
      targetPathname = landing.seo.canonical;
      removeLandingFilters(params, landing);
      preserveUnrepresentedSeoFilters(params, candidate, landing);
    }
  } else if (navigation) {
    removeLandingFilters(params, navigation.landing);
  }
  const query = params.toString();
  return query ? `${targetPathname}?${query}` : targetPathname;
}

export function promotedCatalogHref(query: CatalogSearchParams, navigation: CatalogNavigation): string | null {
  if (navigation.landing.landingType !== "CATALOG") return null;
  const filters = navigationCandidate(navigation.landing, query, {});
  const promoted = findBestCatalogLanding(navigation.landings, filters);
  if (!promoted) return null;
  const params = toUrlSearchParams(query);
  removeLandingFilters(params, promoted);
  const remaining = params.toString();
  const destination = remaining ? `${promoted.seo.canonical}?${remaining}` : promoted.seo.canonical;
  const currentParams = toUrlSearchParams(query).toString();
  const current = currentParams ? `${navigation.landing.seo.canonical}?${currentParams}` : navigation.landing.seo.canonical;
  return destination === current ? null : destination;
}

export function searchParamsWithLanding(query: CatalogSearchParams, landing: CatalogLanding): CatalogSearchParams {
  const result = { ...query };
  for (const name of ["species", "category", "foodType", "categorySlug"] as const) {
    const value = landing.filters[name];
    if (value !== undefined) result[name] = String(value);
  }
  if (landing.filters.brand) result.brand = values(landing.filters.brand);
  if (landing.filters.lifeStage) result.lifeStage = values(landing.filters.lifeStage);
  return result;
}

function navigationCandidate(
  landing: CatalogLanding,
  query: CatalogSearchParams,
  changes: Record<string, string | number | string[] | undefined>,
): Partial<ProductFilters> {
  const dynamic = productFiltersFromSearchParams(query);
  const candidate: Partial<ProductFilters> = {
    ...landing.filters,
    brand: landing.filters.brand ? [landing.filters.brand] : undefined,
    lifeStage: landing.filters.lifeStage ? [landing.filters.lifeStage] : undefined,
  };
  for (const name of ["species", "category", "foodType", "categorySlug", "brand", "lifeStage"] as const) {
    const value = dynamic[name];
    if (value !== undefined) candidate[name] = value as never;
    if (Object.hasOwn(changes, name)) {
      const changed = changes[name];
      if (changed === undefined || (Array.isArray(changed) && !changed.length)) delete candidate[name];
      else candidate[name] = changed as never;
    }
  }
  if (Object.hasOwn(changes, "category")) {
    delete candidate.foodType;
    delete candidate.categorySlug;
    delete candidate.lifeStage;
  }
  if (Object.hasOwn(changes, "foodType")) {
    delete candidate.categorySlug;
    if (candidate.foodType) candidate.category = "FOOD";
  }
  if (Object.hasOwn(changes, "categorySlug") && candidate.categorySlug) candidate.category = "HYGIENE";
  return candidate;
}

function removeLandingFilters(params: URLSearchParams, landing: CatalogLanding) {
  for (const name of ["species", "category", "foodType", "categorySlug", "brand", "lifeStage"] as const) {
    if (landing.filters[name] !== undefined) params.delete(name);
  }
}

function preserveUnrepresentedSeoFilters(
  params: URLSearchParams,
  filters: Partial<ProductFilters>,
  landing: CatalogLanding,
) {
  for (const name of ["species", "category", "foodType", "categorySlug", "brand", "lifeStage"] as const) {
    if (landing.filters[name] !== undefined || filters[name] === undefined) continue;
    params.delete(name);
    const value = filters[name];
    for (const item of Array.isArray(value) ? value : [value]) params.append(name, String(item));
  }
}

function toUrlSearchParams(input: CatalogSearchParams) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    for (const item of Array.isArray(value) ? value : value ? [value] : []) params.append(key, item);
  }
  return params;
}

function fromUrlSearchParams(params: URLSearchParams): CatalogSearchParams {
  const result: CatalogSearchParams = {};
  for (const key of new Set(params.keys())) {
    const values = params.getAll(key);
    result[key] = values.length > 1 ? values : values[0];
  }
  return result;
}

function slug(input: string | string[] | undefined) {
  const value = text(input, 220);
  return value && isSlug(value) ? value : undefined;
}

function isSlug(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function values(value: string | string[] | undefined): string[] {
  return Array.isArray(value) ? value : value ? [value] : [];
}
