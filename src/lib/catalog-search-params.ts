import type { ProductFilters, Species } from "@/domain/catalog/types";

export type CatalogSearchParams = Record<
  string,
  string | string[] | undefined
>;

const first = (input: string | string[] | undefined) =>
  Array.isArray(input) ? input[0] : input;

const list = (input: string | string[] | undefined) =>
  input
    ? [...new Set((Array.isArray(input) ? input : [input]).flatMap((value) => value.split(",").map((item) => item.trim()).filter(Boolean)))]
    : undefined;

const positiveInteger = (input: string | string[] | undefined) => {
  const parsed = Number(first(input) ?? 1);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
};

const decimal = (input: string | string[] | undefined) => {
  const value = first(input);
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? String(parsed) : undefined;
};

export function productFiltersFromSearchParams(
  searchParams: CatalogSearchParams,
  fixed: { species?: Species; category?: string } = {},
): ProductFilters {
  const requestedSpecies = first(searchParams.species);
  const requestedSort = first(searchParams.sort);

  return {
    q: first(searchParams.q),
    species:
      fixed.species ??
      (requestedSpecies === "dog" || requestedSpecies === "cat"
        ? requestedSpecies
        : undefined),
    category: fixed.category ?? first(searchParams.category),
    brand: list(searchParams.brand),
    lifeStage: list(searchParams.lifeStage),
    weightGrams: list(searchParams.weightGrams)
      ?.map(Number)
      .filter((weight) => Number.isInteger(weight) && weight > 0),
    minPrice: decimal(searchParams.minPrice),
    maxPrice: decimal(searchParams.maxPrice),
    sort: ["featured", "name_asc", "price_asc", "price_desc"].includes(
      requestedSort ?? "",
    )
      ? (requestedSort as ProductFilters["sort"])
      : "featured",
    page: positiveInteger(searchParams.page),
    perPage: 24,
  };
}

export function catalogHref(
  pathname: string,
  searchParams: CatalogSearchParams,
  changes: Record<string, string | number | string[] | undefined>,
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    for (const item of Array.isArray(value) ? value : value ? [value] : []) {
      params.append(key, item);
    }
  }
  for (const [key, value] of Object.entries(changes)) {
    params.delete(key);
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
