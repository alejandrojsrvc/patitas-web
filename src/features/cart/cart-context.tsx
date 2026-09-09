"use client";

import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { createCartStore, type CartSeed } from "./cart-store";

type CartStore = ReturnType<typeof createCartStore>;
const CartContext = createContext<CartStore | null>(null);

export function CartProvider({ children, initialCart = null }: { children: React.ReactNode; initialCart?: CartSeed }) {
  const [store] = useState(() => createCartStore((...args) => fetch(...args), initialCart));
  useEffect(() => {
    void store.refresh();
    const refresh = () => {
      void store.refresh();
    };
    const restore = (event: PageTransitionEvent) => {
      if (event.persisted) refresh();
    };
    window.addEventListener("patitas-session-changed", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", restore);
    return () => {
      window.removeEventListener("patitas-session-changed", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", restore);
    };
  }, [store]);
  return <CartContext.Provider value={store}>{children}</CartContext.Provider>;
}

export function CartHydrator({ cart }: { cart: CartSeed }) {
  const { hydrate } = useCart();
  useEffect(() => {
    hydrate(cart);
  }, [cart, hydrate]);
  return null;
}

export function useCart() {
  const store = useContext(CartContext);
  if (!store) throw new Error("useCart debe usarse dentro de CartProvider.");
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  return useMemo(
    () => ({
      cart: snapshot.cart,
      items: snapshot.cart?.items ?? [],
      count: snapshot.cart
        ? snapshot.cart.items.reduce((total, item) => total + item.quantity, 0)
        : snapshot.seed && "itemCount" in snapshot.seed
          ? snapshot.seed.itemCount
          : 0,
      subtotal: Number(snapshot.cart?.subtotal ?? snapshot.seed?.subtotal ?? 0),
      hasState: snapshot.seed !== null,
      loading: snapshot.loading,
      error: snapshot.error,
      refresh: store.refresh,
      addItem: store.addItem,
      updateQuantity: store.updateQuantity,
      removeItem: store.removeItem,
      hydrate: store.hydrate,
    }),
    [snapshot, store],
  );
}
