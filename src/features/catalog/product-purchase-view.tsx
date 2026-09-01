"use client";

import { useMemo, useState } from "react";

import type { ProductDetail } from "@/domain/catalog/types";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { ProductBuyBox, ProductDurationCalculator, ProductInfoColumn } from "./product-purchase-panel";
import { ProductViewTracker } from "./product-view-tracker";

export function ProductPurchaseView({ product }: { product: ProductDetail }) {
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants[0]?.id);
  const [quantity, setQuantity] = useState(1);
  const variant = useMemo(
    () => product.variants.find((item) => item.id === selectedVariantId) ?? product.variants[0],
    [product, selectedVariantId],
  );

  function selectVariant(variantId: string) {
    setSelectedVariantId(variantId);
    setQuantity(1);
  }

  if (!variant) {
    return (
      <div className="mt-5 grid gap-7 lg:mt-6 lg:grid-cols-2 lg:gap-10">
        <ProductGallery media={product.media} productName={product.name} />
        <p className="h-fit rounded-xl bg-catalog-soft p-5 text-muted">Este producto todavía no tiene una presentación vendible.</p>
      </div>
    );
  }

  return (
    <>
      <ProductViewTracker product={product} variant={variant} />
      <div className="mt-5 grid items-start gap-7 lg:mt-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-x-10 lg:gap-y-8 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)_minmax(17rem,1fr)] xl:gap-6">
        <div className="lg:row-span-2 xl:row-span-1">
          <ProductGallery key={selectedVariantId} media={product.media} productName={product.name} selectedVariantId={selectedVariantId} />
        </div>
        <ProductInfoColumn product={product} variant={variant} onSelectedVariantChange={selectVariant} />
        <ProductBuyBox key={variant.id} product={product} variant={variant} quantity={quantity} onQuantityChange={setQuantity} />
      </div>
      {variant.weightGrams ? <ProductDurationCalculator key={variant.id} product={product} variant={variant} /> : null}
    </>
  );
}
