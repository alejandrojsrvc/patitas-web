import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type {
  Brand,
  CalculatorProductProjection,
  FoodDurationResult,
  ProductDetail,
  ProductFacets,
  ProductFilters,
  ProductPage,
  PublicOffer,
  ReplenishmentLeadInput,
  SitemapProductProjection,
} from "@/domain/catalog/types";

const apiUrl = (process.env.PATITAS_API_URL ?? "http://api.patitasinquietas.local/api/v1").replace(/\/$/, "");
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
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string } | null;
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
    ["q", filters.q], ["species", filters.species], ["category", filters.category],
    ["minPrice", filters.minPrice], ["maxPrice", filters.maxPrice],
    ["featured", filters.featured], ["sort", includePagination ? filters.sort : undefined],
    ["page", includePagination ? filters.page : undefined], ["perPage", includePagination ? filters.perPage : undefined],
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
  calculatorProjection: () => request<CalculatorProductProjection[]>("/products/projections/calculator"),
  sitemapProjection: () => request<SitemapProductProjection[]>("/products/projections/sitemap"),
  offers: () => request<PublicOffer[]>("/offers"),
  calculateFoodDuration: (input: {
    productSlug: string;
    variantId: string;
    petWeightKg: number;
    lifeStage?: string;
    attributes?: Record<string, string>;
  }) => request<FoodDurationResult>("/calculator/food-duration", {
    method: "POST",
    body: JSON.stringify(input),
  }),
  captureReplenishmentLead: (input: ReplenishmentLeadInput) => request<{ id: string; status: string }>("/replenishment-leads", {
    method: "POST",
    body: JSON.stringify(input),
  }),
};

export async function getProducts(filters: ProductFilters = {}) {
  "use cache";
  cacheLife({ stale: 60, revalidate: 300, expire: 3600 });
  cacheTag("catalog-products");
  return catalogApi.products(filters);
}

export async function getProductFacets(filters: ProductFilters = {}) {
  const facetFilters = { ...filters };
  delete facetFilters.page;
  delete facetFilters.perPage;
  delete facetFilters.sort;
  return getCachedProductFacets(facetFilters);
}

async function getCachedProductFacets(filters: ProductFilters) {
  "use cache";
  cacheLife({ stale: 60, revalidate: 300, expire: 3600 });
  cacheTag("catalog-facets");
  return catalogApi.productFacets(filters);
}

export async function getProduct(slug: string) {
  "use cache";
  cacheLife({ stale: 60, revalidate: 300, expire: 3600 });
  cacheTag("catalog-products", `catalog-product-${slug}`);
  return catalogApi.product(slug);
}

export async function getBrands() {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog-brands");
  return catalogApi.brands();
}

export async function getBrand(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog-brands", `catalog-brand-${slug}`);
  return catalogApi.brand(slug);
}

export async function getCalculatorProducts() {
  "use cache";
  cacheLife({ stale: 300, revalidate: 1800, expire: 7200 });
  cacheTag("catalog-products", "catalog-calculator-projection");
  return catalogApi.calculatorProjection();
}

export async function getSitemapProducts() {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog-products", "catalog-sitemap-projection");
  return catalogApi.sitemapProjection();
}

export async function safeCatalogCall<T>(operation: () => Promise<T>): Promise<
  { ok: true; data: T } | { ok: false; error: string }
> {
  try {
    return { ok: true, data: await operation() };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "No pudimos consultar el catálogo.",
    };
  }
}
