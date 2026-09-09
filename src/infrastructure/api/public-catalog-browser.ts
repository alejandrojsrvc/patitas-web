import type { ProductAutocompleteResponse, ProductFacets, ProductFilters, ProductPage } from "@/domain/catalog/types";

const requestTimeoutMs = 15_000;
const autocompleteInFlight = new Map<string, Promise<ProductAutocompleteResponse>>();

export async function getPublicCatalog(filters: ProductFilters) {
  const productsQuery = catalogQuery(filters, true);
  const facetsQuery = catalogQuery(filters, false);
  const products = await request<ProductPage>(`/products${productsQuery}`);
  const facets = await request<ProductFacets>(`/products/facets${facetsQuery}`).catch(() => null);
  return [products, facets] as const;
}

export function getPublicProductAutocomplete(query: string) {
  const normalizedQuery = query.trim().replace(/\s+/g, " ");
  if (normalizedQuery.length < 2) return Promise.resolve({ items: [] });

  let pending = autocompleteInFlight.get(normalizedQuery);
  if (!pending) {
    const params = new URLSearchParams({ q: normalizedQuery });
    pending = request<ProductAutocompleteResponse>(`/products/autocomplete?${params.toString()}`)
      .finally(() => autocompleteInFlight.delete(normalizedQuery));
    autocompleteInFlight.set(normalizedQuery, pending);
  }
  return pending;
}

async function request<T>(path: string): Promise<T> {
  const requestController = new AbortController();
  const timeout = window.setTimeout(
    () => requestController.abort(new DOMException("Patitas API tardó demasiado en responder.", "TimeoutError")),
    requestTimeoutMs,
  );

  try {
    const response = await fetch(`/api/commerce${path}`, {
      headers: { Accept: "application/json", "X-Patitas-Catalog-Client": "storefront" },
      signal: requestController.signal,
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      throw new Error(body?.message ? `${body.message} (HTTP ${response.status})` : `No pudimos consultar el catálogo (HTTP ${response.status}).`);
    }
    return response.json() as Promise<T>;
  } finally {
    window.clearTimeout(timeout);
  }
}

function catalogQuery(filters: ProductFilters, includePagination: boolean) {
  const params = new URLSearchParams();
  const scalarEntries: Array<[string, string | number | boolean | undefined]> = [
    ["q", filters.q],
    ["species", filters.species],
    ["category", filters.category],
    ["minPrice", filters.minPrice],
    ["maxPrice", filters.maxPrice],
    ["featured", filters.featured],
    ["sort", includePagination ? filters.sort : undefined],
    ["page", includePagination ? filters.page : undefined],
    ["perPage", includePagination ? filters.perPage : undefined],
  ];
  for (const [key, value] of scalarEntries) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  for (const brand of filters.brand ?? []) params.append("brand", brand);
  for (const stage of filters.lifeStage ?? []) params.append("lifeStage", stage);
  for (const weight of filters.weightGrams ?? []) params.append("weightGrams", String(weight));
  const query = params.toString();
  return query ? `?${query}` : "";
}
