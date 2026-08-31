import assert from "node:assert/strict";
import test from "node:test";

import { formatDeliveryCountdown, productDeliveryEstimate, productQuantityOptions, resolvedAvailableQuantity } from "./product-purchase.ts";

const variant = (availableQuantity?: number) => ({
  id: "variant-stable",
  sku: "SKU-1",
  presentation: "3 kg",
  weightGrams: 3000,
  salePrice: "12000",
  compareAtPrice: null,
  currency: "ARS" as const,
  fulfillment: {
    availability: "TODAY" as const,
    purchasable: true,
    label: "Disponible hoy",
    availableQuantity: availableQuantity ?? Number.NaN,
    orderBefore: "13:00",
    deliveryDate: "2026-09-01",
  },
});

test("uses backend stock and falls back to unavailable when it is invalid", () => {
  assert.equal(resolvedAvailableQuantity(variant(3)), 3);
  assert.equal(resolvedAvailableQuantity(variant(0)), 0);
  assert.equal(resolvedAvailableQuantity(variant()), 0);
});

test("caps the product quantity selector at five or the available stock", () => {
  assert.deepEqual(productQuantityOptions(3), [1, 2, 3]);
  assert.deepEqual(productQuantityOptions(12), [1, 2, 3, 4, 5]);
  assert.deepEqual(productQuantityOptions(0), []);
});

test("promises the next business day before the weekday cutoff", () => {
  const estimate = productDeliveryEstimate(new Date("2026-08-31T14:00:00.000Z")); // Monday 11:00 in Buenos Aires.
  assert.equal(estimate.deliveryDate, "2026-09-01");
  assert.equal(estimate.deliveryLabel, "Llega mañana");
  assert.equal(estimate.remainingSeconds, 7200);
});

test("moves the cutoff and delivery across the weekend", () => {
  const estimate = productDeliveryEstimate(new Date("2026-09-04T17:00:00.000Z")); // Friday 14:00 in Buenos Aires.
  assert.equal(estimate.cutoffAt, "2026-09-07T16:00:00.000Z");
  assert.equal(estimate.cutoffLabel, "Pedilo antes del lunes a las 13:00");
  assert.equal(estimate.deliveryDate, "2026-09-08");
});

test("formats long countdowns without truncating hours", () => {
  assert.equal(formatDeliveryCountdown(71 * 3600 + 65), "71:01:05");
});
