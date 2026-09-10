import type { Product } from "@/domain/catalog/types";
import type { CustomerPet } from "@/domain/customer/types";

const FOOD_CATEGORY_SLUGS = new Set(["alimento-seco", "alimento-humedo"]);

export function petForProduct(product: Product | undefined, activePet: CustomerPet | null) {
  if (!product || !activePet || product.species?.toLowerCase() !== activePet.species || !product.category) return null;
  return FOOD_CATEGORY_SLUGS.has(product.category.slug) ? activePet : null;
}
