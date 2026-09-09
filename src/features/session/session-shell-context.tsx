"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { emptyStorefrontShell, type StorefrontShell } from "@/domain/storefront/types";
import { useCart } from "@/features/cart/cart-context";

type SessionShellState = {
  shell: StorefrontShell | null;
  status: "loading" | "ready" | "error";
  retry: () => void;
};

const SessionShellContext = createContext<SessionShellState | null>(null);

export function SessionShellProvider({ children }: { children: React.ReactNode }) {
  const { refresh } = useCart();
  const [shell, setShell] = useState<StorefrontShell | null>(null);
  const [status, setStatus] = useState<SessionShellState["status"]>("loading");
  const requestVersion = useRef(0);
  const load = useCallback(async () => {
    const version = ++requestVersion.current;
    setStatus("loading");
    try {
      // Let the cart request finish any cookie/session renewal first.
      await refresh();
      if (version !== requestVersion.current) return;
      const response = await fetch("/api/commerce/storefront/bootstrap", { cache: "no-store" });
      if (version !== requestVersion.current) return;
      if (!response.ok) {
        if (response.status === 401)
          setShell((current) => ({
            ...(current ?? emptyStorefrontShell),
            viewer: { authenticated: false },
            location: null,
          }));
        if (version === requestVersion.current) setStatus(response.status === 401 ? "ready" : "error");
        return;
      }
      const next = (await response.json()) as StorefrontShell;
      if (version === requestVersion.current) {
        setShell(next);
        setStatus("ready");
      }
      // CartProvider owns the cart. Never hydrate it from a header summary or
      // localStorage; neither contains authoritative cart items.
    } catch {
      if (version === requestVersion.current) setStatus("error");
    }
  }, [refresh]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    const refresh = () => {
      void load();
    };
    window.addEventListener("patitas-session-changed", refresh);
    return () => {
      window.clearTimeout(timer);
      requestVersion.current += 1;
      window.removeEventListener("patitas-session-changed", refresh);
    };
  }, [load]);
  const retry = useCallback(() => {
    void load();
  }, [load]);

  return <SessionShellContext.Provider value={{ shell, status, retry }}>{children}</SessionShellContext.Provider>;
}

export function useSessionShell() {
  return useContext(SessionShellContext);
}

export function notifySessionChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("patitas-session-changed"));
}
