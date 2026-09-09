import assert from "node:assert/strict";
import test from "node:test";

import { requestAccountScreen } from "./account-api.ts";
import { accountRequestKey, accountSectionFromPathname, resolveAccountRoute } from "./account-routing.ts";

test("resuelve las secciones de cuenta y la paginación de pedidos", () => {
  assert.deepEqual(resolveAccountRoute(["direcciones"]).request, {
    section: "addresses",
    orderId: undefined,
    page: undefined,
    perPage: undefined,
  });
  const orders = resolveAccountRoute(["pedidos"], 3).request;
  assert.deepEqual(orders, { section: "orders", orderId: undefined, page: 3, perPage: 10 });
  assert.equal(accountRequestKey(orders), "orders:page:3:per-page:10");
});

test("distingue el detalle de pedido y conserva el resumen como fallback", () => {
  const detail = resolveAccountRoute(["pedidos", "order-42"]).request;
  assert.deepEqual(detail, { section: "orders", orderId: "order-42", page: undefined, perPage: undefined });
  assert.equal(accountRequestKey(detail), "orders:order:order-42");
  assert.equal(accountSectionFromPathname("/mi-cuenta/desconocida"), "resumen");
  assert.equal(accountSectionFromPathname("/mi-cuenta/mascotas"), "mascotas");
});

test("solicita y acepta la sección de cuenta correspondiente", async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = "";
  globalThis.fetch = (async (input) => {
    requestedUrl = String(input);
    return Response.json(accountScreen({ type: "addresses", addresses: [] }));
  }) as typeof fetch;

  try {
    const screen = await requestAccountScreen({ section: "addresses" });
    assert.equal(requestedUrl, "/api/commerce/me/account?section=addresses");
    assert.equal(screen.section.type, "addresses");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("rechaza una respuesta perteneciente a otra sección", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => Response.json(accountScreen({ type: "overview", orderCount: 0, recentOrders: [] }))) as typeof fetch;

  try {
    await assert.rejects(requestAccountScreen({ section: "pets" }), /algo salió mal al cargar estos datos/i);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

function accountScreen(section: Record<string, unknown>) {
  return {
    shell: {
      viewer: { authenticated: true, id: "user-1", email: "persona@patitas.test", displayName: "Persona", role: "customer" },
      location: null,
      cart: { id: null, itemCount: 0, subtotal: "0.00", currency: "ARS" },
    },
    profile: {
      id: "customer-1",
      userId: "user-1",
      fullName: "Persona",
      email: "persona@patitas.test",
      phone: null,
      active: true,
      createdAt: "2026-09-07T00:00:00.000Z",
      updatedAt: "2026-09-07T00:00:00.000Z",
    },
    section,
  };
}
