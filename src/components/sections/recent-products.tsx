"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ProductImage } from "@/components/catalog/product-image";
import { formatMoney } from "@/lib/catalog-formatters";

export type RecentProduct = {
  slug: string;
  name: string;
  brandName: string;
  imageUrl: string | null;
  variantId: string;
  presentation: string;
  price: string;
};

const RECENT_PRODUCTS_KEY = "patitas:recent-products";

export function RecentProducts() {
  const [products, setProducts] = useState<RecentProduct[]>([]);

  useEffect(() => {
    let active = true;

    try {
      const stored = window.localStorage.getItem(RECENT_PRODUCTS_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as unknown;
      if (!Array.isArray(parsed)) return;
      const nextProducts = parsed.filter(isRecentProduct).slice(0, 8);
      const timer = window.setTimeout(() => {
        if (active) setProducts(nextProducts);
      }, 0);

      return () => {
        active = false;
        window.clearTimeout(timer);
      };
    } catch {
      // El historial es opcional y puede estar bloqueado por la configuración del navegador.
    }

    return () => {
      active = false;
    };
  }, []);

  if (!products.length) return null;

  return (
    <section className="bg-white py-10 sm:py-14" aria-labelledby="recent-products-title">
      <div className="container-shell">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="recent-products-title" className="display-heading text-2xl sm:text-3xl">
              Vistos recientemente
            </h2>
            <p className="mt-1 text-sm text-muted">Volvé rápido a lo que estabas mirando.</p>
          </div>
        </div>
        <div className="no-scrollbar mt-5 flex snap-x gap-3 overflow-x-auto pb-1">
          {products.map((product) => (
            <Link
              key={`${product.slug}-${product.variantId}`}
              href={`/producto/${product.slug}`}
              prefetch={false}
              className="w-[13.5rem] shrink-0 snap-start rounded-xl bg-white p-2.5 sm:w-[15.5rem]"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-white">
                <ProductImage src={product.imageUrl} alt={product.name} preset="card" sizes="248px" />
              </div>
              <div className="mt-3">
                <p className="truncate text-xs font-semibold text-muted">{product.brandName}</p>
                <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-ink">{product.name}</h3>
                <div className="mt-3 flex items-end justify-between gap-2">
                  <span className="min-w-0 truncate rounded-md bg-white px-0 py-1 text-xs font-medium text-ink">
                    {product.presentation}
                  </span>
                  <span className="shrink-0 font-display text-lg font-semibold tabular-nums text-ink">{formatMoney(product.price)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export const recentProductsStorageKey = RECENT_PRODUCTS_KEY;

function isRecentProduct(value: unknown): value is RecentProduct {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<RecentProduct>;
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
