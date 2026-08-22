import type { ProductVariant } from "@/domain/catalog/types";

export const formatMoney = (amount: string | number, currency = "ARS") =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(amount));

export const formatWeight = (grams: number | null) => {
  if (!grams) return null;
  if (grams < 1000) return `${grams} g`;
  return `${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(grams / 1000)} kg`;
};

export const pricePerKilogram = (variant: ProductVariant) => {
  if (!variant.weightGrams || variant.weightGrams <= 0) return null;
  return Number(variant.salePrice) / (variant.weightGrams / 1000);
};

export const fulfillmentCopy = (variant: ProductVariant) => {
  if (variant.fulfillment.status === "IN_STOCK") return "Disponible";
  if (variant.fulfillment.status === "ON_REQUEST") {
    if (!variant.fulfillment.leadTimeHours) return "Disponible bajo pedido";
    const days = Math.max(1, Math.ceil(variant.fulfillment.leadTimeHours / 24));
    return `Bajo pedido · despacho estimado en ${days} ${days === 1 ? "día" : "días"}`;
  }
  return "Sin stock";
};
