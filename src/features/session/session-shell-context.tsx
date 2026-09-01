"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { StorefrontShell } from "@/domain/storefront/types";
import { useCart } from "@/features/cart/cart-context";

const storageKey = "patitas:session-shell";
const SessionShellContext = createContext<StorefrontShell | null>(null);

export function SessionShellProvider({ children }: { children: React.ReactNode }) {
  const { hydrate } = useCart();
  const [shell, setShell] = useState<StorefrontShell | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/commerce/storefront/bootstrap", { cache: "no-store" });
      if (!response.ok) return;
      const next = await response.json() as StorefrontShell;
      setShell(next);
      hydrate(next.cart);
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // La cache visual local mantiene el header usable si el API no responde.
    }
  }, [hydrate]);

  useEffect(() => {
    let hydrationTimer: number | null = null;
    let loadTimer: number | null = null;

    try {
      const cached = window.localStorage.getItem(storageKey);
      if (cached) {
        const parsed = JSON.parse(cached) as StorefrontShell;
        hydrationTimer = window.setTimeout(() => {
          setShell(parsed);
          hydrate(parsed.cart);
        }, 0);
      }
    } catch {
      window.localStorage.removeItem(storageKey);
    }
    loadTimer = window.setTimeout(() => void load(), 0);
    const refresh = () => void load();
    window.addEventListener("patitas-session-changed", refresh);
    return () => {
      if (hydrationTimer) window.clearTimeout(hydrationTimer);
      if (loadTimer) window.clearTimeout(loadTimer);
      window.removeEventListener("patitas-session-changed", refresh);
    };
  }, [hydrate, load]);

  const value = useMemo(() => shell, [shell]);
  return <SessionShellContext.Provider value={value}>{children}</SessionShellContext.Provider>;
}

export function useSessionShell() {
  return useContext(SessionShellContext);
}

export function notifySessionChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("patitas-session-changed"));
}
