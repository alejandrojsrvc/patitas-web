import type { Product, ProductVariant } from "@/domain/catalog/types";

export function selectInitialVariant(product: Product): ProductVariant | undefined {
  return (
    product.variants.find((variant) => variant.fulfillment.availability === "TODAY" && variant.fulfillment.purchasable) ??
    product.variants.find((variant) => variant.fulfillment.availability === "TOMORROW" && variant.fulfillment.purchasable) ??
    product.variants.find((variant) => variant.fulfillment.availability === "LATER" && variant.fulfillment.purchasable) ??
    product.variants[0]
  );
}

export function variantAvailabilityCopy(product: Product) {
  const available = selectInitialVariant(product);
  return available?.fulfillment.purchasable ? available.fulfillment.label : "Sin stock";
}

export function variantAvailabilityTone(product: Product) {
  return product.variants.some((variant) => variant.fulfillment.purchasable) ? "available" : "unavailable";
}

export function variantLabel(variant: ProductVariant) {
  return (
    variant.presentation ??
    (variant.weightGrams
      ? `${variant.weightGrams >= 1000 ? variant.weightGrams / 1000 : variant.weightGrams}${variant.weightGrams >= 1000 ? " kg" : " g"}`
      : "Presentación")
  );
}
