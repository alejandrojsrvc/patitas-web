import Link from "next/link";
import type { Product } from "@/domain/catalog/types";
import { formatMoney, formatWeight, fulfillmentCopy, pricePerKilogram } from "@/lib/catalog-formatters";
import { AddToCartButton } from "@/features/cart/add-to-cart-button";
import { ProductImage } from "./product-image";

export function ProductCard({ product }: { product: Product }) {
  const variant = product.variants[0];
  if (!variant) return null;

  return (
    <article className="group flex h-full min-w-0 flex-col rounded-xl bg-white p-1 sm:p-2">
      <Link href={`/producto/${product.slug}`} prefetch={false} className="relative mb-2 block aspect-square overflow-hidden rounded-lg bg-white focus-visible:outline-offset-2">
        <ProductImage src={product.media[0]?.url} alt={product.media[0]?.altText ?? product.name} sizes="(min-width: 1280px) 18vw, (min-width: 1024px) 24vw, (min-width: 640px) 32vw, 50vw" className="p-3 sm:p-5" />
      </Link>
      <div className="flex flex-1 flex-col">
        <p className="h-4 truncate text-[11px] font-bold uppercase tracking-[0.08em] text-brand-blue"><Link href={`/marcas/${product.brand.slug}`} prefetch={false} className="hover:underline">{product.brand.name}</Link></p>
        <h3 className="mt-1 min-h-10 line-clamp-2 font-display text-[15px] font-semibold leading-5 tracking-[-0.025em] text-ink sm:text-lg">
          <Link href={`/producto/${product.slug}`} prefetch={false} className="underline-offset-4 hover:underline">{product.name}</Link>
        </h3>
        <p className="mt-2 text-xs font-semibold text-ink">{product.variants.length === 1 ? "1 presentación" : `${product.variants.length} presentaciones`}</p>
        <ul className="mt-2 h-20 space-y-1 overflow-y-auto pr-1 sm:h-24" aria-label={`Presentaciones disponibles de ${product.name}`}>
          {product.variants.map((item) => {
            const presentation = item.presentation ?? formatWeight(item.weightGrams) ?? "Presentación";
            const itemUnitPrice = pricePerKilogram(item);
            return <li key={item.id} className="flex min-h-7 items-center justify-between gap-2 rounded-md bg-catalog-canvas px-2 py-1 text-[11px] leading-4"><span className="min-w-0 truncate text-muted">{presentation}</span><span className="shrink-0 text-right font-semibold tabular-nums text-ink">{formatMoney(item.salePrice)}{itemUnitPrice ? <span className="ml-1 font-normal text-[10px] text-muted">· {formatMoney(itemUnitPrice)}/kg</span> : null}</span></li>;
          })}
        </ul>
        <p className={`mt-2 min-h-10 line-clamp-2 text-xs font-semibold leading-5 ${variant.fulfillment.status === "OUT_OF_STOCK" ? "text-muted" : "text-[#17643a]"}`}>
          {fulfillmentCopy(variant)}
        </p>
        <div className="mt-auto grid min-h-10 grid-cols-[minmax(0,1fr)_auto] items-center gap-1.5 pt-2 sm:gap-2">
          <p className="min-w-0 line-clamp-2 text-[10px] leading-4 text-muted sm:text-[11px]">Podés calcular su reposición</p>
          <AddToCartButton variant={variant} compact />
        </div>
      </div>
    </article>
  );
}
