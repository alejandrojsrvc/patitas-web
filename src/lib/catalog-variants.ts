import type { Product, ProductVariant } from "@/domain/catalog/types";

export function selectInitialVariant(product: Product): ProductVariant | undefined {
  return product.variants.find((variant) => variant.fulfillment.status === "IN_STOCK" && variant.fulfillment.purchasable)
    ?? product.variants.find((variant) => variant.fulfillment.status === "ON_REQUEST" && variant.fulfillment.purchasable)
    ?? product.variants[0];
}

export function variantAvailabilityCopy(product: Product) {
  if (product.variants.some((variant) => variant.fulfillment.status === "IN_STOCK" && variant.fulfillment.purchasable)) {
    return "Hay presentaciones disponibles";
  }
  if (product.variants.some((variant) => variant.fulfillment.status === "ON_REQUEST" && variant.fulfillment.purchasable)) {
    return "Disponible bajo pedido";
  }
  return "Sin stock";
}

export function variantAvailabilityTone(product: Product) {
  return product.variants.some((variant) => variant.fulfillment.purchasable) ? "available" : "unavailable";
}

export function variantLabel(variant: ProductVariant) {
  return variant.presentation ?? (variant.weightGrams ? `${variant.weightGrams >= 1000 ? variant.weightGrams / 1000 : variant.weightGrams}${variant.weightGrams >= 1000 ? " kg" : " g"}` : "Presentación");
}
