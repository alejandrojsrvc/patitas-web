import Link from "next/link";

import type { ProductDetail } from "@/domain/catalog/types";
import { RelatedProductGrid } from "@/components/catalog/related-product-grid";

export function ProductRelatedSection({ product, products }: { product: ProductDetail; products: ProductDetail["relatedProducts"] }) {
  if (!products.length) return null;
  return (
    <section className="mt-12 border-t border-catalog-line pt-8 sm:mt-16 sm:pt-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-7">
        <div>
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">También podés mirar</h2>
          <p className="mt-2 text-muted">Otras opciones de la misma marca o categoría.</p>
        </div>
        <Link href={`/marcas/${product.brand.slug}`} className="font-semibold text-brand-blue hover:underline">
          Ver toda la marca
        </Link>
      </div>
      <RelatedProductGrid products={products} />
    </section>
  );
}
