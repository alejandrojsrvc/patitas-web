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
  if (variant.fulfillment.label) return variant.fulfillment.label;
  if (variant.fulfillment.availability === "TODAY") return "Disponible hoy";
  if (variant.fulfillment.availability === "TOMORROW") return "Disponible mañana";
  if (variant.fulfillment.availability === "LATER") return "Disponible bajo pedido";
  return "Sin stock";
};

export const deliveryBadgeCopy = (variant: ProductVariant) => {
  if (!variant.fulfillment.purchasable) return "Sin stock";
  if (variant.fulfillment.availability === "TODAY") return "Llega hoy entre las 13 y las 19 h";
  if (variant.fulfillment.availability === "TOMORROW") return "Llega mañana";
  return fulfillmentCopy(variant);
};
