"use client";

import { useMemo, useState } from "react";

import type { ProductMedia } from "@/domain/catalog/types";
import { ProductImage } from "./product-image";

export function ProductGallery({ media, productName, selectedVariantId }: { media: ProductMedia[]; productName: string; selectedVariantId?: string }) {
  const [selected, setSelected] = useState(0);
  const visibleMedia = useMemo(() => {
    if (!selectedVariantId) return media;
    const variantMedia = media.filter((item) => item.variantId === selectedVariantId);
    if (!variantMedia.length) return media;
    return [...variantMedia, ...media.filter((item) => item.variantId === null)];
  }, [media, selectedVariantId]);
  const current = visibleMedia[selected];

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-catalog-soft">
        <ProductImage src={current?.url} alt={current?.altText ?? productName} priority sizes="(min-width: 1024px) 50vw, 100vw" className="p-6 sm:p-10" />
      </div>
      {visibleMedia.length > 1 ? (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-5 sm:gap-3" aria-label="Imágenes del producto">
          {visibleMedia.map((item, index) => (
            <button key={`${item.url}-${index}`} type="button" onClick={() => setSelected(index)} aria-label={`Ver imagen ${index + 1} de ${productName}`} aria-pressed={selected === index} className={`relative size-16 shrink-0 overflow-hidden rounded-xl border bg-white sm:size-auto sm:aspect-square ${selected === index ? "border-brand-blue" : "border-border hover:border-brand-blue"}`}>
              <ProductImage src={item.url} alt="" className="p-2" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
