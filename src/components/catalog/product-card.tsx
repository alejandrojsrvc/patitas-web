"use client";

import Link from "next/link";
import { useState } from "react";

import type { Product, ProductVariant } from "@/domain/catalog/types";
import { AddToCartButton } from "@/features/cart/add-to-cart-button";
import { usePetShopping } from "@/features/pets/pet-shopping-context";
import { deliveryBadgeCopy, formatMoney, pricePerKilogram } from "@/lib/catalog-formatters";
import { petForProduct } from "@/lib/pet-shopping";
import { selectInitialVariant, variantLabel } from "@/lib/catalog-variants";
import { ProductImage } from "./product-image";

export function ProductCard({
  product,
  variant: cardVariant = "catalog",
  priority = false,
}: {
  product: Product;
  variant?: "catalog" | "featured";
  priority?: boolean;
}) {
  const initialVariant = selectInitialVariant(product);
  const [selectedVariantId, setSelectedVariantId] = useState(initialVariant?.id);
  const selectedVariant = product.variants.find((item) => item.id === selectedVariantId) ?? initialVariant;
  const { activePet } = usePetShopping();

  if (!selectedVariant) return null;

  const isFeatured = cardVariant === "featured";
  const Heading = isFeatured ? "h3" : "h2";
  const deliveryLabel = deliveryBadgeCopy(selectedVariant);
  const showSinglePresentation = Boolean(selectedVariant.presentation?.trim() || selectedVariant.weightGrams);
  const matchingPet = petForProduct(product, activePet);
  const isUsualFood = matchingPet?.currentFood?.productId === product.id;
  const namedOffers = product.offers.filter((offer) => offer.name.trim());
  const selectedMedia =
    product.media.find((media) => media.variantId === selectedVariant.id) ??
    product.media.find((media) => media.variantId === null) ??
    product.media[0];
  const mediaAlt = selectedMedia?.altText?.trim() || product.name;

  return (
    <article className={`group flex h-full min-w-0 flex-col bg-white ${isFeatured ? "p-2 sm:p-3" : "rounded-xl p-1.5"}`}>
      <Link
        href={`/producto/${product.slug}`}
        prefetch={false}
        className={`relative mb-1.5 block overflow-hidden bg-white focus-visible:outline-offset-2 ${isFeatured ? "aspect-square rounded-xl" : "aspect-square rounded-lg"}`}
      >
        <ProductImage
          src={selectedMedia?.url}
          alt={mediaAlt}
          priority={priority}
          sizes={
            isFeatured
              ? "(min-width: 1024px) 22vw, (min-width: 768px) 30vw, 50vw"
              : "(min-width: 1280px) 18vw, (min-width: 1024px) 24vw, (min-width: 640px) 32vw, 50vw"
          }
          className={isFeatured ? "p-4 sm:p-6" : "p-0 sm:p-0.5"}
        />
      </Link>

      <div className="flex flex-1 flex-col">
        <p className="h-4 overflow-hidden text-ellipsis whitespace-nowrap text-xs leading-5 text-muted">
          <Link
            href={`/marcas/${product.brand.slug}`}
            prefetch={false}
            className="block max-w-full overflow-hidden text-ellipsis whitespace-nowrap hover:underline"
            title={product.brand.name}
          >
            {product.brand.name}
          </Link>
        </p>

        <Heading
          className="h-14 overflow-hidden break-words line-clamp-3 font-display text-sm font-medium leading-5 tracking-[-0.025em] text-ink sm:h-[3.75rem] sm:text-base"
          title={product.name}
        >
          <Link
            href={`/producto/${product.slug}`}
            prefetch={false}
            className="block max-w-full underline-offset-4 hover:underline"
            title={product.name}
          >
            {product.name}
          </Link>
        </Heading>

        {namedOffers.length ? (
          <div className="mt-1 flex min-w-0 items-center gap-1.5 overflow-hidden" role="list" aria-label="Promociones disponibles">
            <OfferBadge name={namedOffers[0].name} />
            {namedOffers.length > 1 ? (
              <span className="shrink-0 text-xs font-semibold text-muted">
                +{namedOffers.length - 1} {namedOffers.length === 2 ? "promoción" : "promociones"}
              </span>
            ) : null}
          </div>
        ) : null}

        {product.variants.length > 1 || showSinglePresentation ? (
          <fieldset className="mt-1 min-h-9">
            <legend className="sr-only">Elegí la presentación de {product.name}</legend>
            {product.variants.length === 1 ? (
              <p className="flex min-h-9 items-center text-xs font-medium text-ink">{variantLabel(selectedVariant)}</p>
            ) : product.variants.length <= 3 ? (
              <div className="flex min-h-9 flex-wrap items-start gap-1.5">
                {product.variants.map((item) => (
                  <VariantButton
                    key={item.id}
                    item={item}
                    selected={item.id === selectedVariant.id}
                    onSelect={() => setSelectedVariantId(item.id)}
                  />
                ))}
              </div>
            ) : (
              <select
                aria-label={`Presentación de ${product.name}`}
                value={selectedVariant.id}
                onChange={(event) => setSelectedVariantId(event.target.value)}
                className="min-h-9 w-full rounded-lg border border-catalog-line bg-white px-3 text-sm font-semibold text-ink outline-none focus:border-brand-blue"
              >
                {product.variants.map((item) => (
                  <option key={item.id} value={item.id} disabled={!item.fulfillment.purchasable}>
                    {variantLabel(item)}
                    {!item.fulfillment.purchasable ? " · Sin stock" : ""}
                  </option>
                ))}
              </select>
            )}
          </fieldset>
        ) : null}

        {isUsualFood ? <p className="mt-1 text-xs font-medium text-brand-blue">Alimento habitual de {matchingPet.name}</p> : null}

        <div className="mt-1" aria-live="polite" aria-atomic="true">
          <p className="font-display text-xl font-bold leading-6 tracking-[-0.02em] tabular-nums text-ink">
            {formatMoney(selectedVariant.salePrice)}
          </p>
          {pricePerKilogram(selectedVariant) ? (
            <p className="mt-0.5 text-xs font-normal tabular-nums text-muted">
              Precio por kg: {formatMoney(pricePerKilogram(selectedVariant) ?? 0)}
            </p>
          ) : null}
          {selectedVariant.compareAtPrice ? (
            <p className="text-xs tabular-nums text-muted line-through">Antes: {formatMoney(selectedVariant.compareAtPrice)}</p>
          ) : null}
        </div>

        <div className="mt-auto pt-1">
          {selectedVariant.fulfillment.purchasable ? (
            <p
              className={`mt-1 min-h-4 text-xs font-medium leading-4 ${
                selectedVariant.fulfillment.availableQuantity < 2 ? "text-error" : "text-success"
              }`}
            >
              {stockCopy(selectedVariant.fulfillment.availableQuantity)}
            </p>
          ) : null}
          <div className="mt-1">
            <AddToCartButton key={selectedVariant.id} variant={selectedVariant} product={product} productName={product.name} compact />
          </div>
        </div>
      </div>
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {`Presentación: ${variantLabel(selectedVariant)}. Precio: ${formatMoney(selectedVariant.salePrice)}. ${selectedVariant.fulfillment.purchasable ? `Entrega: ${deliveryLabel}. Disponible para agregar al carrito.` : "No disponible: sin stock."}`}
      </p>
    </article>
  );
}

function VariantButton({ item, selected, onSelect }: { item: ProductVariant; selected: boolean; onSelect: () => void }) {
  const label = variantLabel(item);
  const unavailable = !item.fulfillment.purchasable;
  return (
    <button
      type="button"
      disabled={unavailable}
      aria-pressed={selected}
      aria-label={`${label}${unavailable ? ", sin stock" : ""}`}
      title={unavailable ? `${label} · Sin stock` : label}
      onClick={onSelect}
      className={`flex min-h-9 w-fit max-w-full items-center rounded-lg border p-1.5 text-left text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:cursor-not-allowed ${selected ? "border-brand-blue bg-soft-blue font-medium text-brand-blue" : unavailable ? "border-catalog-line bg-catalog-soft text-muted" : "border-catalog-line bg-white text-ink hover:border-brand-blue/60 hover:bg-soft-blue"}`}
    >
      <span className="max-w-[9rem] truncate whitespace-nowrap font-medium text-sm cursor-pointer">{label}</span>
    </button>
  );
}

function OfferBadge({ name }: { name: string }) {
  if (!name.trim()) return null;
  return (
    <span role="listitem" className="inline-flex max-w-full rounded-full bg-soft-yellow px-2 py-0.5 text-xs font-bold leading-4 text-ink">
      {name}
    </span>
  );
}

function stockCopy(quantity: number) {
  if (quantity === 1) return "Queda 1 unidad disponible";
  return `Quedan ${new Intl.NumberFormat("es-AR").format(quantity)} unidades disponibles`;
}
