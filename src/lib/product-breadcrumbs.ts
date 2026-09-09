import type { Product } from "@/domain/catalog/types";
import { categoryPathForSpecies } from "../data/catalog-routes.ts";
import { productDisplayName } from "./product-seo.ts";

export type ProductBreadcrumbItem = {
  label: string;
  href: string;
};

export function productBreadcrumbs(product: Product): ProductBreadcrumbItem[] {
  return [
    { label: "Inicio", href: "/" },
    ...(product.species
      ? [
          {
            label: product.species === "dog" ? "Perros" : "Gatos",
            href: product.species === "dog" ? "/perros" : "/gatos",
          },
        ]
      : []),
    ...(product.category ? [{ label: product.category.name, href: categoryHref(product) }] : []),
    { label: productDisplayName(product), href: `/producto/${product.slug}` },
  ];
}

function categoryHref(product: Product) {
  if (product.species && product.category) {
    return categoryPathForSpecies(product.species, product.category.slug) ?? (product.species === "dog" ? "/perros" : "/gatos");
  }

  return product.species === "dog" ? "/perros" : product.species === "cat" ? "/gatos" : "/";
}
