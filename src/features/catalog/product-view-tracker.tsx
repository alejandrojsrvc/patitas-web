"use client";

import { useEffect } from "react";
import type { Product, ProductVariant } from "@/domain/catalog/types";
import { variantLabel } from "@/lib/catalog-variants";

type ViewedProduct = {
  slug: string;
  name: string;
  brandName: string;
  imageUrl: string | null;
  variantId: string;
  presentation: string;
  price: string;
};

const RECENT_PRODUCTS_KEY = "patitas:recent-products";

export function ProductViewTracker({ product, variant }: { product: Product; variant: ProductVariant }) {
  useEffect(() => {
    rememberProduct({
      slug: product.slug,
      name: product.name,
      brandName: product.brand.name,
      imageUrl: product.media[0]?.url ?? null,
      variantId: variant.id,
      presentation: variantLabel(variant),
      price: variant.salePrice,
    });
  }, [product, variant]);

  useEffect(() => {
    const url = `/api/commerce/products/${encodeURIComponent(product.slug)}/view`;
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
  }, [product.slug]);

  return null;
}

function rememberProduct(product: ViewedProduct) {
  try {
    const stored = window.localStorage.getItem(RECENT_PRODUCTS_KEY);
    const previous = stored ? (JSON.parse(stored) as unknown) : [];
    const products = Array.isArray(previous) ? previous.filter(isViewedProduct) : [];
    const next = [product, ...products.filter((item) => item.slug !== product.slug)].slice(0, 8);
    window.localStorage.setItem(RECENT_PRODUCTS_KEY, JSON.stringify(next));
  } catch {
    // El tracking local no debe interrumpir la navegación.
  }
}

function isViewedProduct(value: unknown): value is ViewedProduct {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<ViewedProduct>;
  return (
    typeof item.slug === "string" &&
    typeof item.name === "string" &&
    typeof item.brandName === "string" &&
    (typeof item.imageUrl === "string" || item.imageUrl === null) &&
    typeof item.variantId === "string" &&
    typeof item.presentation === "string" &&
    typeof item.price === "string"
  );
}
