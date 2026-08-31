import assert from "node:assert/strict";
import test from "node:test";

import type { Product } from "@/domain/catalog/types";
import { selectInitialVariant, variantAvailabilityCopy } from "./catalog-variants.ts";

function product(statuses: Array<["TODAY" | "LATER" | "OUT_OF_STOCK", boolean]>): Product {
  return {
    id: "product",
    name: "Producto",
    slug: "producto",
    description: null,
    line: null,
    species: "dog",
    lifeStage: "adult",
    breedSize: null,
    brand: { id: "brand", name: "Marca", slug: "marca", description: null, seoTitle: null, seoDescription: null, logoUrl: null },
    category: null,
    media: [],
    offers: [],
    variants: statuses.map(([availability, purchasable], index) => ({
      id: `variant-${index}`,
      sku: `SKU-${index}`,
      presentation: `${index + 1} kg`,
      weightGrams: (index + 1) * 1000,
      salePrice: String(index + 1),
      compareAtPrice: null,
      currency: "ARS",
      fulfillment: {
        availability,
        purchasable,
        label: availability === "TODAY"
          ? "Hay presentaciones disponibles"
          : availability === "LATER"
            ? "Disponible bajo pedido"
            : "Sin stock",
        availableQuantity: purchasable ? 5 : 0,
        orderBefore: null,
        deliveryDate: null,
      },
    })),
  };
}

test("selecciona primero una variante en stock y comprable", () => {
  assert.equal(selectInitialVariant(product([["OUT_OF_STOCK", false], ["TODAY", true]]))?.id, "variant-1");
});

test("prioriza bajo pedido cuando no hay stock inmediato", () => {
  assert.equal(selectInitialVariant(product([["OUT_OF_STOCK", false], ["LATER", true]]))?.id, "variant-1");
});

test("resume disponibilidad de un producto agrupado", () => {
  assert.equal(variantAvailabilityCopy(product([["OUT_OF_STOCK", false], ["TODAY", true]])), "Hay presentaciones disponibles");
  assert.equal(variantAvailabilityCopy(product([["OUT_OF_STOCK", false], ["LATER", true]])), "Disponible bajo pedido");
  assert.equal(variantAvailabilityCopy(product([["OUT_OF_STOCK", false]])), "Sin stock");
});
