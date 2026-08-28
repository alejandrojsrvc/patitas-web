"use client";

import { useState } from "react";

import type { ProductDetail } from "@/domain/catalog/types";
import { selectInitialVariant } from "@/lib/catalog-variants";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { ProductPurchasePanel } from "./product-purchase-panel";

export function ProductPurchaseView({ product }: { product: ProductDetail }) {
  const [selectedVariantId, setSelectedVariantId] = useState(selectInitialVariant(product)?.id);

  return (
    <div className="mt-5 grid gap-7 lg:mt-6 lg:grid-cols-2 lg:gap-16">
      <ProductGallery key={selectedVariantId} media={product.media} productName={product.name} selectedVariantId={selectedVariantId} />
      <ProductPurchasePanel product={product} selectedVariantId={selectedVariantId} onSelectedVariantChange={setSelectedVariantId} />
    </div>
  );
}
