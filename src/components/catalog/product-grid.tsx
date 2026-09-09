import { ArrowRight, Package } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import type { Product } from "@/domain/catalog/types";
import { ProductCard } from "./product-card";

export function ProductGrid({
  products,
  emptyCopy,
  emptyAction,
  variant = "catalog",
}: {
  products: Product[];
  emptyCopy?: string;
  emptyAction?: { href: string; label: string };
  variant?: "catalog" | "featured";
}) {
  if (products.length === 0) {
    const EmptyHeading = variant === "featured" ? "h3" : "h2";

    return (
      <div className="flex min-h-72 flex-col items-center justify-center bg-white px-6 py-8 text-center sm:rounded-xl sm:py-10">
        <Package size={42} weight="duotone" className="mb-4 text-brand-blue" aria-hidden="true" />
        <EmptyHeading className="font-display text-2xl font-semibold tracking-[-0.025em]">No encontramos productos</EmptyHeading>
        <p className="mt-2 max-w-md text-muted">
          {emptyCopy ?? "Todavía no hay productos disponibles en esta selección. Probá otra categoría del catálogo."}
        </p>
        {emptyAction ? (
          <Link
            href={emptyAction.href}
            className="mt-5 inline-flex min-h-11 items-center gap-2 font-semibold text-brand-blue hover:underline"
          >
            {emptyAction.label} <ArrowRight size={17} weight="bold" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    );
  }
  return (
    <div
      className={
        variant === "featured"
          ? "grid auto-rows-fr grid-cols-2 items-stretch gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-4"
          : "grid auto-rows-fr grid-cols-2 items-stretch gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4"
      }
    >
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} variant={variant} priority={index === 0} />
      ))}
    </div>
  );
}
