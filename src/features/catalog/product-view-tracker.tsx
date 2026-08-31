"use client";

import { useEffect } from "react";

export function ProductViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const url = `/api/commerce/products/${encodeURIComponent(slug)}/view`;
    let cancelled = false;
    let idleId: number | null = null;
    let timerId: number | null = null;

    const send = () => {
      if (cancelled) return;
      if (navigator.sendBeacon?.(url, new Blob([], { type: "application/json" }))) return;
      void fetch(url, { method: "POST", keepalive: true }).catch(() => undefined);
    };

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(send, { timeout: 2_000 });
    } else {
      timerId = window.setTimeout(send, 1_000);
    }

    return () => {
      cancelled = true;
      if (idleId !== null && "cancelIdleCallback" in window) window.cancelIdleCallback(idleId);
      if (timerId !== null) window.clearTimeout(timerId);
    };
  }, [slug]);

  return null;
}
