import type { Product } from "@/domain/catalog/types";

function normalized(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-AR")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function formatWeight(weightGrams: number | null) {
  if (!weightGrams) return null;
  return weightGrams >= 1000
    ? `${Number((weightGrams / 1000).toFixed(2))} kg`
    : `${weightGrams} g`;
}

export function productDisplayName(product: Product) {
  const productName = product.name.trim();
  const brandName = product.brand.name.trim();
  const nameWithBrand = normalized(productName).includes(normalized(brandName))
    ? productName
    : `${brandName} ${productName}`;
  const purchasableVariants = product.variants.filter((variant) => variant.fulfillment.purchasable);
  const onlyWeight = purchasableVariants.length === 1
    ? formatWeight(purchasableVariants[0].weightGrams)
    : null;

  if (!onlyWeight || normalized(nameWithBrand).includes(normalized(onlyWeight))) {
    return nameWithBrand;
  }

  return `${nameWithBrand} ${onlyWeight}`;
}

export function productSeoTitle(product: Product) {
  const displayName = productDisplayName(product);
  const normalizedName = normalized(displayName);
  const speciesCopy = product.species === "dog"
    ? "perros"
    : product.species === "cat"
      ? "gatos"
      : null;

  if (!speciesCopy || normalizedName.includes(speciesCopy) || normalizedName.includes(speciesCopy.slice(0, -1))) {
    return `${displayName} | Patitas Inquietas`;
  }

  return `${displayName} para ${speciesCopy} | Patitas Inquietas`;
}
