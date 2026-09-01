"use client";

import Link from "next/link";
import { useState } from "react";

import type { Product, ProductVariant } from "@/domain/catalog/types";
import { AddToCartButton } from "@/features/cart/add-to-cart-button";
import { deliveryBadgeCopy, formatMoney, pricePerKilogram } from "@/lib/catalog-formatters";
import { variantLabel } from "@/lib/catalog-variants";
import { ProductImage } from "./product-image";

export function ProductCard({ product, variant: cardVariant = "catalog" }: { product: Product; variant?: "catalog" | "featured" }) {
  const firstVariant = product.variants[0];
  const [selectedVariantId, setSelectedVariantId] = useState(firstVariant?.id);
  const selectedVariant = product.variants.find((item) => item.id === selectedVariantId) ?? firstVariant;

  if (!selectedVariant) return null;

  const isFeatured = cardVariant === "featured";
  const deliveryLabel = deliveryBadgeCopy(selectedVariant);

  return (
    <article className={`group flex h-full min-w-0 flex-col bg-white ${isFeatured ? "p-2 sm:p-3" : "rounded-xl p-1 sm:p-2"}`}>
      <Link
        href={`/producto/${product.slug}`}
        prefetch={false}
        className={`relative mb-3 block aspect-square overflow-hidden bg-white focus-visible:outline-offset-2 ${isFeatured ? "rounded-xl" : "rounded-lg"}`}
      >
        <ProductImage
          src={product.media[0]?.url}
          alt={product.media[0]?.altText ?? product.name}
          sizes={
            isFeatured
              ? "(min-width: 1024px) 22vw, (min-width: 768px) 30vw, 50vw"
              : "(min-width: 1280px) 18vw, (min-width: 1024px) 24vw, (min-width: 640px) 32vw, 50vw"
          }
          className={isFeatured ? "p-4 sm:p-6" : "p-3 sm:p-5"}
        />
      </Link>

      <div className="flex flex-1 flex-col">
        <h3 className="min-h-10 line-clamp-2 font-display text-[15px] font-semibold leading-5 tracking-[-0.025em] text-ink sm:text-lg">
          <Link href={`/producto/${product.slug}`} prefetch={false} className="underline-offset-4 hover:underline">
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 truncate text-sm font-semibold text-muted">
          <Link href={`/marcas/${product.brand.slug}`} prefetch={false} className="hover:underline">
            {product.brand.name}
          </Link>
        </p>

        {product.offers.length ? (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <OfferBadge product={product} />
          </div>
        ) : null}

        <fieldset className="mt-3">
          <legend className="sr-only">Elegí la presentación de {product.name}</legend>
          <div className="flex flex-wrap items-start gap-1.5">
            {product.variants.map((item) => (
              <VariantButton
                key={item.id}
                item={item}
                selected={item.id === selectedVariant.id}
                onSelect={() => setSelectedVariantId(item.id)}
              />
            ))}
          </div>
        </fieldset>

        <div className="mt-3">
          <p className="font-display text-xl font-semibold tabular-nums text-ink">{formatMoney(selectedVariant.salePrice)}</p>
          {pricePerKilogram(selectedVariant) ? (
            <p className="mt-0.5 text-[11px] font-normal tabular-nums text-muted">
              {formatMoney(pricePerKilogram(selectedVariant) ?? 0)} por kg
            </p>
          ) : null}
          {selectedVariant.compareAtPrice ? (
            <p className="text-xs tabular-nums text-muted line-through">{formatMoney(selectedVariant.compareAtPrice)}</p>
          ) : null}
        </div>

        <div className="mt-auto pt-3">
          <DeliveryBadge label={deliveryLabel} unavailable={!selectedVariant.fulfillment.purchasable} />
          <AddToCartButton variant={selectedVariant} compact />
        </div>
      </div>
    </article>
  );
}

function VariantButton({ item, selected, onSelect }: { item: ProductVariant; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`flex min-h-8 w-fit max-w-full items-center rounded-lg bg-white px-2.5 py-1 text-left text-[11px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue ${selected ? "font-semibold text-brand-blue underline decoration-2 underline-offset-4" : "text-ink hover:bg-brand-blue/5"}`}
    >
      <span className={`max-w-[9rem] truncate whitespace-nowrap font-semibold ${item.fulfillment.purchasable ? "text-ink" : "text-muted"}`}>
        {variantLabel(item)}
      </span>
    </button>
  );
}

function OfferBadge({ product }: { product: Product }) {
  const offer = product.offers[0];
  if (!offer) return null;
  return <span className="inline-flex w-fit rounded-full bg-soft-yellow px-2.5 py-1 text-[10px] font-bold text-ink">{offer.name}</span>;
}

function DeliveryBadge({ label, unavailable }: { label: string; unavailable: boolean }) {
  return (
    <span
      className={`mt-2 flex w-fit rounded-full px-3 py-1.5 text-xs font-bold leading-4 ${unavailable ? "bg-white text-muted" : "bg-soft-blue text-brand-blue"}`}
    >
      {label}
    </span>
  );
}
