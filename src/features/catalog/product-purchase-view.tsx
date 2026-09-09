"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import type { ProductDetail } from "@/domain/catalog/types";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { ProductBuyBox, ProductDescription, ProductDurationCalculator, ProductInfoColumn } from "./product-purchase-panel";
import { ProductViewTracker } from "./product-view-tracker";
import { PetShoppingBar } from "@/features/pets/pet-shopping-bar";

export function ProductPurchaseView({ product }: { product: ProductDetail }) {
  const [selectedVariantId, setSelectedVariantId] = useState(
    (product.variants.find((variant) => variant.fulfillment.purchasable) ?? product.variants[0])?.id,
  );
  const [quantity, setQuantity] = useState(1);
  const variant = useMemo(
    () => product.variants.find((item) => item.id === selectedVariantId) ?? product.variants[0],
    [product, selectedVariantId],
  );
  const hasPurchasableVariant = product.variants.some((item) => item.fulfillment.purchasable);

  function selectVariant(variantId: string) {
    setSelectedVariantId(variantId);
    setQuantity(1);
  }

  if (!variant || !hasPurchasableVariant) {
    return (
      <div className="mt-5 grid gap-7 lg:mt-6 lg:grid-cols-2 lg:gap-10">
        <ProductGallery media={product.media} productName={product.name} />
        <div className="h-fit rounded-xl bg-catalog-soft p-5">
          <p className="text-muted">No hay presentaciones disponibles para comprar en este momento.</p>
          <Link href="/buscar" className="mt-4 inline-flex min-h-11 items-center font-semibold text-brand-blue hover:underline">
            Buscar otra opción
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <ProductViewTracker product={product} variant={variant} />
      <div className="mt-5 lg:mt-6">
        <PetShoppingBar product={product} />
      </div>
      <div className="mt-5 grid items-start gap-7 lg:mt-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-x-10 lg:gap-y-8 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)_minmax(17rem,1fr)] xl:gap-6">
        <div className="order-1 min-w-0 lg:col-start-1 lg:row-span-2 xl:row-start-1">
          <ProductGallery key={selectedVariantId} media={product.media} productName={product.name} selectedVariantId={selectedVariantId} />
        </div>
        <div className="contents lg:col-start-2 lg:row-start-1 lg:block xl:col-start-2 xl:row-start-1">
          <ProductInfoColumn product={product} variant={variant} onSelectedVariantChange={selectVariant} />
          <ProductDescription product={product} />
        </div>
        <div className="order-3 min-w-0 lg:col-start-2 lg:row-start-2 xl:col-start-3 xl:row-start-1">
          <ProductBuyBox key={variant.id} product={product} variant={variant} quantity={quantity} onQuantityChange={setQuantity} />
        </div>
      </div>
      {variant.weightGrams ? <ProductDurationCalculator key={variant.id} product={product} variant={variant} /> : null}
    </>
  );
}
