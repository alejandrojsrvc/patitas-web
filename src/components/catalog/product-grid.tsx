import { Package } from "@phosphor-icons/react/ssr";
import type { Product } from "@/domain/catalog/types";
import { ProductCard } from "./product-card";

export function ProductGrid({
  products,
  emptyCopy,
  variant = "catalog",
}: {
  products: Product[];
  emptyCopy?: string;
  variant?: "catalog" | "featured";
}) {
  if (products.length === 0) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl bg-white px-6 text-center">
        <Package size={42} weight="duotone" className="mb-4 text-brand-blue" aria-hidden="true" />
        <h2 className="font-display text-2xl font-semibold tracking-[-0.025em]">Estamos preparando esta selección</h2>
        <p className="mt-2 max-w-md text-muted">{emptyCopy ?? "Todavía no hay productos publicables con esos filtros. Probá otra combinación dentro del catálogo."}</p>
      </div>
    );
  }
  return (
    <div className={variant === "featured"
      ? "grid grid-cols-2 items-stretch gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-4"
      : "grid grid-cols-2 items-stretch gap-1 sm:grid-cols-3 sm:gap-2 lg:grid-cols-3 lg:gap-2 xl:grid-cols-4"}>
      {products.map((product, index) => <ProductCard key={product.id} product={product} variant={variant} priority={index === 0} />)}
    </div>
  );
}
