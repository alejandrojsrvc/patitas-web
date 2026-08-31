"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Cart, CartItem } from "@/domain/cart/types";
import type { StorefrontCartSummary } from "@/domain/storefront/types";

type CartSeed = Cart | StorefrontCartSummary | null;

type CartContextValue = {
  cart: Cart | null;
  items: CartItem[];
  count: number;
  subtotal: number;
  hasState: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addItem: (variantId: string, quantity?: number) => Promise<void>;
  updateQuantity: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  hydrate: (cart: CartSeed) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

type CartProviderProps = {
  children: React.ReactNode;
  initialCart?: CartSeed;
};

export function CartProvider({ children, initialCart = null }: CartProviderProps) {
  const [cartState, setCartState] = useState<CartSeed>(initialCart);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cart = isFullCart(cartState) ? cartState : null;

  const requestCart = useCallback(async (path: string, init?: RequestInit) => {
    const response = await fetch(`/api/commerce${path}`, {
      ...init,
      headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers },
    });
    const payload = await response.json().catch(() => null) as Cart | { message?: string } | null;
    if (response.status === 409) {
      const latest = await fetch("/api/commerce/cart");
      const latestPayload = await latest.json().catch(() => null) as Cart | null;
      if (latest.ok && latestPayload && "items" in latestPayload) setCartState(latestPayload);
    }
    if (!response.ok || !payload || !("items" in payload)) {
      throw new Error(payload && "message" in payload ? payload.message : "No pudimos actualizar el carrito.");
    }
    setCartState(payload);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { await requestCart("/cart"); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "No pudimos cargar el carrito."); }
    finally { setLoading(false); }
  }, [requestCart]);

  const addItem = useCallback(async (variantId: string, quantity = 1) => {
    await requestCart(`/cart/items/${encodeURIComponent(variantId)}`, { method: "PUT", body: JSON.stringify({ quantity }) });
  }, [requestCart]);

  const updateQuantity = useCallback(async (variantId: string, quantity: number) => {
    if (quantity < 1) return requestCart(`/cart/items/${encodeURIComponent(variantId)}`, { method: "DELETE" });
    await requestCart(`/cart/items/${encodeURIComponent(variantId)}`, { method: "PUT", body: JSON.stringify({ quantity }) });
  }, [requestCart]);

  const removeItem = useCallback(async (variantId: string) => {
    await requestCart(`/cart/items/${encodeURIComponent(variantId)}`, { method: "DELETE" });
  }, [requestCart]);

  const items = useMemo(() => cart?.items ?? [], [cart]);
  const count = cart
    ? items.reduce((total, item) => total + item.quantity, 0)
    : isCartSummary(cartState) ? cartState.itemCount : 0;
  const subtotal = Number(cartState?.subtotal ?? 0);
  const hydrate = useCallback((nextCart: CartSeed) => setCartState(nextCart), []);
  const value = useMemo<CartContextValue>(() => ({
    cart,
    items,
    count,
    subtotal,
    hasState: cartState !== null,
    loading,
    error,
    refresh,
    addItem,
    updateQuantity,
    removeItem,
    hydrate,
  }), [addItem, cart, cartState, count, error, hydrate, items, loading, refresh, removeItem, subtotal, updateQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function CartHydrator({ cart }: { cart: CartSeed }) {
  const { hydrate } = useCart();

  useEffect(() => {
    hydrate(cart);
  }, [cart, hydrate]);

  return null;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart debe usarse dentro de CartProvider.");
  return value;
}

function isFullCart(cart: CartSeed): cart is Cart {
  return Boolean(cart && "items" in cart);
}

function isCartSummary(cart: CartSeed): cart is StorefrontCartSummary {
  return Boolean(cart && "itemCount" in cart);
}
