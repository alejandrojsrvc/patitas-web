import Link from "next/link";

import type { ProductPage } from "@/domain/catalog/types";
import { catalogHref, type CatalogNavigation, type CatalogSearchParams } from "@/lib/catalog-search-params";

export function CatalogPagination({
  result,
  pathname,
  current,
  navigation,
}: {
  result: ProductPage;
  pathname: string;
  current: CatalogSearchParams;
  navigation?: CatalogNavigation;
}) {
  const previousHref = catalogHref(pathname, current, { page: Math.max(1, result.meta.page - 1) }, navigation);
  const nextHref = catalogHref(pathname, current, { page: Math.min(result.meta.totalPages, result.meta.page + 1) }, navigation);

  return (
    <nav aria-label="Paginación del catálogo" className="mt-10 flex items-center justify-center gap-3">
      <Link
        aria-disabled={result.meta.page <= 1}
        tabIndex={result.meta.page <= 1 ? -1 : undefined}
        href={previousHref}
        prefetch={false}
        rel={previousHref.includes("?") ? "nofollow" : undefined}
        scroll={false}
        className={`rounded-xl px-4 py-3 text-sm font-semibold ${result.meta.page <= 1 ? "pointer-events-none opacity-40" : "bg-white shadow-[0_4px_12px_rgba(24,33,43,0.05)] hover:text-brand-blue"}`}
      >
        Anterior
      </Link>
      <span className="px-2 text-sm text-muted">
        {result.meta.page} de {result.meta.totalPages}
      </span>
      <Link
        aria-disabled={result.meta.page >= result.meta.totalPages}
        tabIndex={result.meta.page >= result.meta.totalPages ? -1 : undefined}
        href={nextHref}
        prefetch={false}
        rel={nextHref.includes("?") ? "nofollow" : undefined}
        scroll={false}
        className={`rounded-xl px-4 py-3 text-sm font-semibold ${result.meta.page >= result.meta.totalPages ? "pointer-events-none opacity-40" : "bg-white shadow-[0_4px_12px_rgba(24,33,43,0.05)] hover:text-brand-blue"}`}
      >
        Siguiente
      </Link>
    </nav>
  );
}
