import "server-only";
import { unstable_rethrow } from "next/navigation";
import type {
  Brand,
  CatalogLandingManifest,
  CatalogPathResolution,
  CalculatorProductProjection,
  FoodDurationResult,
  ProductDetail,
  ProductFacets,
  ProductFilters,
  ProductPage,
  PublicOffer,
  ReplenishmentEstimate,
  SitemapProductProjection,
} from "@/domain/catalog/types";

const apiUrl = process.env.API_URL?.trim().replace(/\/$/, "");
if (!apiUrl) throw new Error("API_URL no está configurada.");
const originVerifySecret = process.env.API_ORIGIN_VERIFY_SECRET?.trim();
const requestTimeoutMs = 15_000;

export class PatitasApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "PatitasApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    signal: init?.signal ?? AbortSignal.timeout(requestTimeoutMs),
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
      ...(originVerifySecret ? { "X-Origin-Verify": originVerifySecret } : {}),
    },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new PatitasApiError(body?.message ?? "Patitas API no pudo completar la solicitud.", response.status);
  }
  return response.json() as Promise<T>;
}

function productQuery(filters: ProductFilters = {}) {
  return catalogQuery(filters, true);
}

function facetQuery(filters: ProductFilters = {}) {
  return catalogQuery(filters, false);
}

function catalogQuery(filters: ProductFilters, includePagination: boolean) {
  const params = new URLSearchParams();
  const scalarEntries: Array<[string, string | number | boolean | undefined]> = [
    ["q", filters.q],
    ["species", filters.species],
    ["category", filters.category],
    ["foodType", filters.foodType],
    ["categorySlug", filters.categorySlug],
    ["minPrice", filters.minPrice],
    ["maxPrice", filters.maxPrice],
    ["availability", filters.availability],
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

export const catalogApi = {
  products: (filters?: ProductFilters) => request<ProductPage>(`/products${productQuery(filters)}`),
  productFacets: (filters?: ProductFilters) => request<ProductFacets>(`/products/facets${facetQuery(filters)}`),
  product: (slug: string) => request<ProductDetail>(`/products/${encodeURIComponent(slug)}`),
  brands: () => request<Brand[]>("/brands"),
  brand: (slug: string) => request<Brand>(`/brands/${encodeURIComponent(slug)}`),
  taxonomy: (path: string) => request<CatalogPathResolution>(`/catalog/taxonomy/resolve?path=${encodeURIComponent(path)}`),
  taxonomyLandings: () => request<CatalogLandingManifest>("/catalog/taxonomy/landings"),
  calculatorProjection: () => request<CalculatorProductProjection[]>("/products/projections/calculator"),
  sitemapProjection: () => request<SitemapProductProjection[]>("/products/projections/sitemap"),
  offers: () => request<PublicOffer[]>("/offers"),
  calculateFoodDuration: (input: {
    productSlug: string;
    variantId: string;
    petWeightKg: number;
    lifeStage?: string;
    attributes?: Record<string, string>;
  }) =>
    request<FoodDurationResult>("/calculator/food-duration", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  createReplenishmentEstimate: (input: {
    pet: { name: string; species: string; weightKg: number; lifeStage: string };
    food: { productId: string; variantId: string };
  }) =>
    request<ReplenishmentEstimate>("/replenishment-estimates", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  createReplenishmentReminder: (input: { estimateId: string; email: string; consent: boolean; consentVersion: string }, token?: string) =>
    request<{ id: string; status: string; nextReminderAt: string }>("/replenishment-reminders", {
      method: "POST",
      headers: token ? { "X-Replenishment-Token": token } : undefined,
      body: JSON.stringify(input),
    }),
};

export async function getProducts(filters: ProductFilters = {}) {
  return catalogApi.products(filters);
}

export async function getProductFacets(filters: ProductFilters = {}) {
  const facetFilters = { ...filters };
  delete facetFilters.page;
  delete facetFilters.perPage;
  delete facetFilters.sort;
  return catalogApi.productFacets(facetFilters);
}

export async function getProduct(slug: string) {
  return catalogApi.product(slug);
}

export async function getBrands() {
  return catalogApi.brands();
}

export async function getBrand(slug: string) {
  return catalogApi.brand(slug);
}

export async function resolveCatalogPath(path: string) {
  return catalogApi.taxonomy(path);
}

export async function getCatalogLandings() {
  return catalogApi.taxonomyLandings();
}

export async function getCalculatorProducts() {
  try {
    return await catalogApi.calculatorProjection();
  } catch (error) {
    unstable_rethrow(error);
    // The calculator renders its explicit empty state when the projection is unavailable.
    return [];
  }
}

export async function getSitemapProducts() {
  return catalogApi.sitemapProjection();
}

export async function safeCatalogCall<T>(operation: () => Promise<T>): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    return { ok: true, data: await operation() };
  } catch (error) {
    unstable_rethrow(error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "No pudimos consultar el catálogo.",
    };
  }
}
