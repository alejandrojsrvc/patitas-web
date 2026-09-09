import type { Cart, CartItemContext } from "@/domain/cart/types";
import type { StorefrontCartSummary } from "@/domain/storefront/types";

export type CartSeed = Cart | StorefrontCartSummary | null;
type Snapshot = { cart: Cart | null; seed: CartSeed; loading: boolean; error: string | null };

// Serialize reads and writes. Header/SSR summaries are only initial hints;
// they must never replace a detailed cart already fetched in the browser.
export function createCartStore(request: typeof fetch, initial: CartSeed = null) {
  let snapshot: Snapshot = { cart: isFullCart(initial) ? initial : null, seed: initial, loading: true, error: null };
  const serverSnapshot = snapshot;
  const listeners = new Set<() => void>();
  let started = false;
  let pending = 0;
  let queue = Promise.resolve();
  let refreshing: Promise<void> | null = null;
  const publish = (next: Partial<Snapshot>) => {
    snapshot = { ...snapshot, ...next };
    listeners.forEach((listener) => listener());
  };
  function accept(cart: Cart) {
    publish({ cart, seed: cart, error: null });
  }
  async function read(path: string, init?: RequestInit): Promise<Cart> {
    const response = await request(`/api/commerce${path}`, {
      ...init,
      cache: "no-store",
      headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers },
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !isFullCart(payload)) {
      if (response.status === 409 && path !== "/cart") {
        try {
          accept(await read("/cart"));
        } catch {
          /* Preserve the last confirmed cart. */
        }
      }
      throw new Error(typeof payload?.message === "string" ? payload.message : "No pudimos actualizar tu carrito. Intentá nuevamente.");
    }
    return payload;
  }
  function enqueue(operation: () => Promise<void>) {
    started = true;
    pending += 1;
    publish({ loading: true, error: null });
    const result = queue
      .then(operation)
      .catch((cause: unknown) => {
        publish({ error: cause instanceof Error ? cause.message : "No pudimos actualizar tu carrito." });
        throw cause;
      })
      .finally(() => {
        pending -= 1;
        publish({ loading: pending > 0 });
      });
    queue = result.catch(() => undefined);
    return result;
  }
  const refresh = () => {
    if (refreshing) return refreshing;
    refreshing = enqueue(async () => {
      accept(await read("/cart"));
    })
      .catch(() => undefined)
      .finally(() => {
        refreshing = null;
      });
    return refreshing;
  };
  const setVariantQuantity = async (variantId: string, quantity: number, context?: CartItemContext) => {
    accept(
      await read(
        `/cart/items/${encodeURIComponent(variantId)}`,
        quantity < 1 ? { method: "DELETE" } : { method: "PUT", body: JSON.stringify({ quantity, ...(context ?? {}) }) },
      ),
    );
  };
  const setLineQuantity = async (itemId: string, quantity: number) => {
    accept(
      await read(
        `/cart/line-items/${encodeURIComponent(itemId)}`,
        quantity < 1 ? { method: "DELETE" } : { method: "PATCH", body: JSON.stringify({ quantity }) },
      ),
    );
  };
  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => serverSnapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    hydrate: (seed: CartSeed) => {
      if (started || !seed || snapshot.cart) return;
      publish({ seed, cart: isFullCart(seed) ? seed : null });
    },
    refresh,
    addItem: (variantId: string, quantity = 1, context?: CartItemContext) =>
      enqueue(async () => {
        // PUT takes an absolute quantity. Read before adding units; amounts,
        // prices, totals and stock validation always come from the API.
        const current = await read("/cart");
        accept(current);
        const role = context?.role ?? "EXTRA";
        const petId = context?.petId ?? null;
        const planId = context?.planId ?? null;
        const existing =
          current.items.find((item) => item.variantId === variantId && item.role === role && item.petId === petId && item.planId === planId)
            ?.quantity ?? 0;
        await setVariantQuantity(variantId, existing + quantity, context);
      }),
    updateQuantity: (itemId: string, quantity: number) => enqueue(() => setLineQuantity(itemId, quantity)),
    removeItem: (itemId: string) => enqueue(() => setLineQuantity(itemId, 0)),
  };
}

function isFullCart(value: unknown): value is Cart {
  return Boolean(value && typeof value === "object" && "id" in value && "items" in value && Array.isArray(value.items));
}
