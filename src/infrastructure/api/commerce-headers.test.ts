import assert from "node:assert/strict";
import test from "node:test";

import { buildCommerceHeaders } from "./commerce-headers.ts";

test("el BFF reenvía Idempotency-Key y solo los headers de integración permitidos", () => {
  const headers = buildCommerceHeaders({ path: "/checkout/sessions/order-1/confirm", checkoutToken: "checkout-token", visitorId: "visitor-1", idempotencyKey: "attempt-1" });
  assert.deepEqual(headers, { "X-Visitor-Id": "visitor-1", "X-Checkout-Token": "checkout-token", "Idempotency-Key": "attempt-1" });
  assert.equal("Cookie" in headers, false);
  assert.equal("Authorization" in headers, false);
});

test("el mismo Idempotency-Key queda disponible para el retry técnico", () => {
  const first = buildCommerceHeaders({ path: "/checkout/sessions/order-1/confirm", visitorId: "visitor-1", idempotencyKey: "attempt-1" });
  const retry = buildCommerceHeaders({ path: "/checkout/sessions/order-1/confirm", visitorId: "visitor-1", idempotencyKey: "attempt-1" });
  assert.equal(first["Idempotency-Key"], retry["Idempotency-Key"]);
});

test("el token de orden también se reenvía al endpoint de enlace de pago", () => {
  const headers = buildCommerceHeaders({ path: "/payments/orders/order-1/link", orderToken: "order-token", visitorId: "visitor-1" });
  assert.equal(headers["X-Order-Token"], "order-token");
});

test("el token de orden se conserva aunque exista bearer autenticado", () => {
  const headers = buildCommerceHeaders({ path: "/checkout/orders/order-1", accessToken: "access-token", orderToken: "order-token", visitorId: "visitor-1" });
  assert.equal(headers.Authorization, "Bearer access-token");
  assert.equal(headers["X-Order-Token"], "order-token");
});
