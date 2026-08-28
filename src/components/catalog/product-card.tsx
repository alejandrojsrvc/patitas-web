import Link from "next/link";
import type { Product } from "@/domain/catalog/types";
import { formatMoney, fulfillmentCopy, pricePerKilogram } from "@/lib/catalog-formatters";
import { variantAvailabilityCopy, variantAvailabilityTone, variantLabel } from "@/lib/catalog-variants";
import { AddToCartButton } from "@/features/cart/add-to-cart-button";
import { ProductImage } from "./product-image";

export function ProductCard({ product, variant: cardVariant = "catalog" }: { product: Product; variant?: "catalog" | "featured" }) {
  const variant = product.variants[0];
  if (!variant) return null;
  const hasMultipleVariants = product.variants.length > 1;
  const availability = variantAvailabilityCopy(product);
  const availabilityTone = variantAvailabilityTone(product);

  if (cardVariant === "featured") {
    return (
      <article className="group flex h-full min-w-0 flex-col bg-white p-2 sm:p-3">
        <Link href={`/producto/${product.slug}`} prefetch={false} className="relative mb-3 block aspect-square overflow-hidden rounded-xl bg-catalog-canvas focus-visible:outline-offset-2">
          <ProductImage src={product.media[0]?.url} alt={product.media[0]?.altText ?? product.name} sizes="(min-width: 1024px) 22vw, (min-width: 768px) 30vw, 50vw" className="p-4 sm:p-6" />
        </Link>
        <div className="flex flex-1 flex-col">
          <p className="truncate text-[11px] font-bold uppercase tracking-[0.08em] text-brand-blue"><Link href={`/marcas/${product.brand.slug}`} prefetch={false} className="underline-offset-4 hover:underline">{product.brand.name}</Link></p>
          <OfferBadge product={product} />
          <h3 className="mt-1 min-h-10 line-clamp-2 font-display text-[15px] font-semibold leading-5 tracking-[-0.025em] text-ink sm:text-lg">
            <Link href={`/producto/${product.slug}`} prefetch={false} className="underline-offset-4 hover:underline">{product.name}</Link>
          </h3>
          <p className="mt-3 text-xs text-muted">{hasMultipleVariants ? `${product.variants.length} presentaciones` : variantLabel(variant)}</p>
          <p className="mt-1 font-display text-xl font-semibold tabular-nums text-ink">{hasMultipleVariants ? `Desde ${formatMoney(Math.min(...product.variants.map((item) => Number(item.salePrice))))}` : formatMoney(variant.salePrice)}</p>
          {variant.compareAtPrice ? <p className="text-xs text-muted line-through">{formatMoney(variant.compareAtPrice)}</p> : null}
          <p className={`mt-2 min-h-10 text-xs font-semibold leading-5 ${availabilityTone === "unavailable" ? "text-muted" : "text-[#17643a]"}`}>{hasMultipleVariants ? availability : fulfillmentCopy(variant)}</p>
          <div className="mt-auto pt-3">{hasMultipleVariants ? <Link href={`/producto/${product.slug}`} prefetch={false} className="inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-brand-blue px-3 text-xs font-semibold text-brand-blue hover:bg-soft-blue">Ver presentaciones</Link> : <AddToCartButton variant={variant} compact />}</div>
        </div>
      </article>
    );
  }

  return (
    <article className="group flex h-full min-w-0 flex-col rounded-xl bg-white p-1 sm:p-2">
      <Link href={`/producto/${product.slug}`} prefetch={false} className="relative mb-2 block aspect-square overflow-hidden rounded-lg bg-white focus-visible:outline-offset-2">
        <ProductImage src={product.media[0]?.url} alt={product.media[0]?.altText ?? product.name} sizes="(min-width: 1280px) 18vw, (min-width: 1024px) 24vw, (min-width: 640px) 32vw, 50vw" className="p-3 sm:p-5" />
      </Link>
      <div className="flex flex-1 flex-col">
        <p className="h-4 truncate text-[11px] font-bold uppercase tracking-[0.08em] text-brand-blue"><Link href={`/marcas/${product.brand.slug}`} prefetch={false} className="hover:underline">{product.brand.name}</Link></p>
        <OfferBadge product={product} />
        <h3 className="mt-1 min-h-10 line-clamp-2 font-display text-[15px] font-semibold leading-5 tracking-[-0.025em] text-ink sm:text-lg">
          <Link href={`/producto/${product.slug}`} prefetch={false} className="underline-offset-4 hover:underline">{product.name}</Link>
        </h3>
        <p className="mt-2 text-xs font-semibold text-ink">{product.variants.length === 1 ? "1 presentación" : `${product.variants.length} presentaciones`}</p>
        <ul className="mt-2 max-h-56 space-y-1.5 overflow-y-auto rounded-xl bg-catalog-canvas p-2 sm:max-h-64" aria-label={`Presentaciones disponibles de ${product.name}`}>
          {product.variants.map((item) => {
            const presentation = variantLabel(item);
            const itemUnitPrice = pricePerKilogram(item);
            return <li key={item.id} className="flex min-h-10 items-center justify-between gap-2 rounded-md px-2.5 py-2 text-base leading-5"><span className="min-w-0 truncate text-muted">{presentation}</span><span className="shrink-0 text-right font-bold tabular-nums text-ink">{formatMoney(item.salePrice)}{item.compareAtPrice ? <del className="ml-1 font-normal text-[10px] text-muted">{formatMoney(item.compareAtPrice)}</del> : null}{itemUnitPrice ? <span className="ml-1 font-normal text-[10px] text-muted sm:hidden">· {formatMoney(itemUnitPrice)}/kg</span> : null}</span></li>;
          })}
        </ul>
        <p className={`mt-2 min-h-10 line-clamp-2 text-xs font-semibold leading-5 ${availabilityTone === "unavailable" ? "text-muted" : "text-[#17643a]"}`}>
          {hasMultipleVariants ? availability : fulfillmentCopy(variant)}
        </p>
        <div className="mt-auto grid min-h-10 grid-cols-[minmax(0,1fr)_auto] items-center gap-1.5 pt-2 sm:gap-2">
          <p className="min-w-0 line-clamp-2 text-[10px] leading-4 text-muted sm:text-[11px]">Podés calcular su reposición</p>
          {hasMultipleVariants ? <Link href={`/producto/${product.slug}`} prefetch={false} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-brand-blue px-2 text-[11px] font-semibold text-brand-blue hover:bg-soft-blue sm:px-3">Ver opciones</Link> : <AddToCartButton variant={variant} compact />}
        </div>
      </div>
    </article>
  );
}

function OfferBadge({ product }: { product: Product }) {
  const offer = product.offers[0];
  if (!offer) return null;
  return <p className="mt-2 w-fit rounded-full bg-soft-yellow px-2.5 py-1 text-[10px] font-bold text-ink">{offer.name}</p>;
}
