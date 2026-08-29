import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type {
  Brand,
  Category,
  FoodDurationResult,
  ProductDetail,
  ProductFilters,
  ProductPage,
  PublicOffer,
  ReplenishmentLeadInput,
} from "@/domain/catalog/types";

const apiUrl = (process.env.PATITAS_API_URL ?? "http://api.patitasinquietas.local/api/v1").replace(/\/$/, "");

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
  const params = new URLSearchParams();
  const scalarEntries: Array<[string, string | number | boolean | undefined]> = [
    ["q", filters.q], ["species", filters.species], ["category", filters.category],
    ["minPrice", filters.minPrice], ["maxPrice", filters.maxPrice],
    ["featured", filters.featured], ["sort", filters.sort],
    ["page", filters.page], ["perPage", filters.perPage],
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
  product: (slug: string) => request<ProductDetail>(`/products/${encodeURIComponent(slug)}`),
  categories: () => request<Category[]>("/categories"),
  category: (slug: string) => request<Category>(`/categories/${encodeURIComponent(slug)}`),
  brands: () => request<Brand[]>("/brands"),
  brand: (slug: string) => request<Brand>(`/brands/${encodeURIComponent(slug)}`),
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

export async function getCatalogFilterProducts(filters: Pick<ProductFilters, "species" | "category"> = {}) {
  "use cache";
  cacheLife({ stale: 60, revalidate: 300, expire: 3600 });
  cacheTag("catalog-products");

  const firstPage = await catalogApi.products({ ...filters, page: 1, perPage: 100 });
  if (firstPage.meta.totalPages <= 1) return firstPage.items;

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.meta.totalPages - 1 }, (_, index) =>
      catalogApi.products({ ...filters, page: index + 2, perPage: 100 }),
    ),
  );
  return [firstPage, ...remainingPages].flatMap((page) => page.items);
}

export async function getProduct(slug: string) {
  "use cache";
  cacheLife({ stale: 60, revalidate: 300, expire: 3600 });
  cacheTag("catalog-products", `catalog-product-${slug}`);
  return catalogApi.product(slug);
}

export async function getCategories() {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog-categories");
  return catalogApi.categories();
}

export async function getBrands() {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog-brands");
  return catalogApi.brands();
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
