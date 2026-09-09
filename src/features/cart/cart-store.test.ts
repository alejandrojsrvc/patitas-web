import assert from "node:assert/strict";
import test from "node:test";
import type { Cart } from "@/domain/cart/types";
import { createCartStore } from "./cart-store.ts";

function fixture() {
  let cart: Cart = { id: "cart-1", customerId: null, status: "ACTIVE", currency: "ARS", subtotal: "0.00", lastActivityAt: null, items: [] };
  const calls: Array<{ method: string; variant: string; quantity?: number }> = [];
  let failNext = false;
  const request: typeof fetch = async (input, init) => {
    const method = init?.method ?? "GET";
    const variant = String(input).split("/").at(-1)!;
    const quantity = init?.body ? (JSON.parse(String(init.body)).quantity as number) : undefined;
    calls.push({ method, variant, quantity });
    await Promise.resolve();
    if (failNext) {
      failNext = false;
      return Response.json({ message: "No hay stock suficiente." }, { status: 409 });
    }
    if (method === "PUT") {
      cart = {
        ...cart,
        subtotal: "1234.56",
        items: [
          ...cart.items.filter((item) => item.variantId !== variant),
          {
            id: variant,
            variantId: variant,
            productId: "product",
            productName: "Alimento",
            slug: "alimento",
            sku: null,
            presentation: "3 kg",
            imageUrl: null,
            unitPrice: "1234.56",
            lineTotal: "1234.56",
            quantity: quantity!,
            availableQuantity: 20,
            role: "EXTRA",
            petId: null,
            planId: null,
          },
        ],
      };
    }
    if (method === "PATCH") {
      cart = {
        ...cart,
        items: cart.items.map((item) => (item.id === variant ? { ...item, quantity: quantity!, lineTotal: "1234.56" } : item)),
      };
    }
    if (method === "DELETE") cart = { ...cart, items: cart.items.filter((item) => item.id !== variant) };
    return Response.json(cart);
  };
  return {
    calls,
    request,
    fail: () => {
      failNext = true;
    },
  };
}

test("agregar desde dos tarjetas conserva ambos productos y sumar el mismo aumenta unidades", async () => {
  const api = fixture();
  const store = createCartStore(api.request);
  await Promise.all([store.addItem("a", 2), store.addItem("b"), store.addItem("a")]);
  assert.equal(store.getSnapshot().cart?.items.find((item) => item.variantId === "a")?.quantity, 3);
  assert.equal(store.getSnapshot().cart?.items.find((item) => item.variantId === "b")?.quantity, 1);
  assert.deepEqual(
    api.calls.map((call) => call.method),
    ["GET", "PUT", "GET", "PUT", "GET", "PUT"],
  );
  assert.equal(store.getSnapshot().cart?.subtotal, "1234.56", "preserves the API total without calculating it");
});

test("modificar fija la cantidad, eliminar quita el producto y se puede volver a agregar", async () => {
  const store = createCartStore(fixture().request);
  await store.addItem("a", 4);
  await store.updateQuantity("a", 2);
  assert.equal(store.getSnapshot().cart?.items[0].quantity, 2);
  await store.removeItem("a");
  assert.deepEqual(store.getSnapshot().cart?.items, []);
  await store.addItem("b");
  assert.equal(store.getSnapshot().cart?.items[0].variantId, "b");
  assert.equal(store.getSnapshot().loading, false);
});

test("el header y las páginas prefetched no pisan el carrito confirmado", async () => {
  const store = createCartStore(fixture().request);
  await store.addItem("a");
  const confirmed = store.getSnapshot().cart;
  store.hydrate({ id: "old", itemCount: 0, subtotal: "0", currency: "ARS" });
  store.hydrate({ ...confirmed!, items: [] });
  store.hydrate(null);
  assert.equal(store.getSnapshot().cart, confirmed);
});

test("carga inicial desconocida no es carrito vacío y las lecturas simultáneas se deduplican", async () => {
  const api = fixture();
  const store = createCartStore(api.request);
  assert.equal(store.getSnapshot().cart, null);
  assert.equal(store.getSnapshot().loading, true);
  await Promise.all([store.refresh(), store.refresh()]);
  assert.equal(api.calls.length, 1);
  assert.deepEqual(store.getSnapshot().cart?.items, []);
  assert.equal(store.getSnapshot().loading, false);
});

test("un conflicto recupera los productos y libera los controles para reintentar", async () => {
  const api = fixture();
  const store = createCartStore(api.request);
  await store.addItem("a");
  api.fail();
  await assert.rejects(store.updateQuantity("a", 99), /stock/);
  assert.equal(store.getSnapshot().loading, false);
  assert.equal(store.getSnapshot().cart?.items[0].quantity, 1);
  assert.match(store.getSnapshot().error!, /stock/);
  await store.removeItem("a");
  assert.equal(store.getSnapshot().error, null);
});

test("una lectura pendiente no puede revertir una mutación posterior", async () => {
  const store = createCartStore(fixture().request);
  await Promise.all([store.refresh(), store.addItem("a")]);
  assert.equal(store.getSnapshot().cart?.items[0].variantId, "a");
});
