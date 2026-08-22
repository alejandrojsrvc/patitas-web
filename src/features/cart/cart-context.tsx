"use client";

import { createContext, Suspense, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { Cart, CartItem } from "@/domain/cart/types";

type CartContextValue = {
  cart: Cart | null;
  items: CartItem[];
  count: number;
  subtotal: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addItem: (variantId: string, quantity?: number) => Promise<void>;
  updateQuantity: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

type CartProviderProps = {
  children: React.ReactNode;
  initialCart?: Cart | null;
  skipInitialRefresh?: boolean;
};

type CartStateProviderProps = CartProviderProps & {
  skipRefreshForPath?: boolean;
};

export function CartProvider(props: CartProviderProps) {
  return (
    <Suspense fallback={<CartStateProvider {...props} />}>
      <PathAwareCartProvider {...props} />
    </Suspense>
  );
}

function PathAwareCartProvider(props: CartProviderProps) {
  const pathname = usePathname();

  return (
    <CartStateProvider
      {...props}
      skipRefreshForPath={pathname.startsWith("/checkout") || pathname === "/carrito"}
    />
  );
}

function CartStateProvider({ children, initialCart = null, skipInitialRefresh = false, skipRefreshForPath = false }: CartStateProviderProps) {
  const [cart, setCart] = useState<Cart | null>(initialCart);
  const [loading, setLoading] = useState(!skipInitialRefresh);
  const [error, setError] = useState<string | null>(null);
  const shouldSkipInitialRefresh = skipInitialRefresh || skipRefreshForPath;

  const requestCart = useCallback(async (path: string, init?: RequestInit) => {
    const response = await fetch(`/api/commerce${path}`, {
      ...init,
      headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers },
    });
    const payload = await response.json().catch(() => null) as Cart | { message?: string } | null;
    if (response.status === 409) {
      const latest = await fetch("/api/commerce/cart");
      const latestPayload = await latest.json().catch(() => null) as Cart | null;
      if (latest.ok && latestPayload && "items" in latestPayload) setCart(latestPayload);
    }
    if (!response.ok || !payload || !("items" in payload)) {
      throw new Error(payload && "message" in payload ? payload.message : "No pudimos actualizar el carrito.");
    }
    setCart(payload);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { await requestCart("/cart"); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "No pudimos cargar el carrito."); }
    finally { setLoading(false); }
  }, [requestCart]);

  useEffect(() => {
    if (shouldSkipInitialRefresh) {
      const onAuthChanged = () => { void refresh(); };
      window.addEventListener("patitas-auth-changed", onAuthChanged);
      return () => window.removeEventListener("patitas-auth-changed", onAuthChanged);
    }
    const timer = window.setTimeout(() => { void refresh(); }, 0);
    const onAuthChanged = () => { void refresh(); };
    window.addEventListener("patitas-auth-changed", onAuthChanged);
    return () => { window.clearTimeout(timer); window.removeEventListener("patitas-auth-changed", onAuthChanged); };
  }, [refresh, shouldSkipInitialRefresh]);

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
  const value = useMemo<CartContextValue>(() => ({
    cart,
    items,
    count: items.reduce((total, item) => total + item.quantity, 0),
    subtotal: Number(cart?.subtotal ?? 0),
    loading,
    error,
    refresh,
    addItem,
    updateQuantity,
    removeItem,
  }), [addItem, cart, error, items, loading, refresh, removeItem, updateQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart debe usarse dentro de CartProvider.");
  return value;
}
