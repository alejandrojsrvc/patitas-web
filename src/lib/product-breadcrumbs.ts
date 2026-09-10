import { findBestCatalogLanding } from "@/data/catalog-routes";
import type { CatalogLanding, Product } from "@/domain/catalog/types";
import { productDisplayName } from "./product-seo.ts";

export type ProductBreadcrumbItem = { label: string; href: string };

export function productBreadcrumbs(product: Product, landings: CatalogLanding[]): ProductBreadcrumbItem[] {
  const landing = productCatalogLanding(product, landings, true);
  return [
    ...(landing?.breadcrumbs ?? [{ label: "Inicio", href: "/" }]),
    { label: productDisplayName(product), href: `/producto/${product.slug}` },
  ];
}

export function productCatalogLanding(product: Product, landings: CatalogLanding[], includeStage: boolean) {
  return findBestCatalogLanding(landings, {
    species: product.species ?? undefined,
    category: product.classification.category ?? undefined,
    foodType: product.classification.foodType ?? undefined,
    categorySlug: product.classification.category === "HYGIENE" ? product.category?.slug : undefined,
    lifeStage: includeStage ? product.lifeStage ?? undefined : undefined,
  });
}
