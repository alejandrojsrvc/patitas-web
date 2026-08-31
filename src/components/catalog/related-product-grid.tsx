import Link from "next/link";

import type { ProductDetail } from "@/domain/catalog/types";
import { formatMoney } from "@/lib/catalog-formatters";
import { ProductImage } from "./product-image";

export function RelatedProductGrid({ products }: { products: ProductDetail["relatedProducts"] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <article key={product.id} className="flex min-w-0 flex-col rounded-xl bg-white p-2">
          <Link href={`/producto/${product.slug}`} prefetch={false} className="relative aspect-square overflow-hidden rounded-lg bg-white">
            <ProductImage src={product.imageUrl} alt={product.name} className="p-4" />
          </Link>
          <p className="mt-3 truncate text-[11px] font-bold uppercase tracking-[0.08em] text-brand-blue">{product.brand.name}</p>
          <h3 className="mt-1 line-clamp-2 min-h-10 font-display text-base font-semibold leading-5">
            <Link href={`/producto/${product.slug}`} prefetch={false} className="hover:text-brand-blue">{product.name}</Link>
          </h3>
          <p className="mt-3 font-display text-lg font-semibold tabular-nums">Desde {formatMoney(product.startingPrice)}</p>
        </article>
      ))}
    </div>
  );
}
