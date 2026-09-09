import Link from "next/link";

import type { ProductPage } from "@/domain/catalog/types";
import { catalogHref, type CatalogSearchParams } from "@/lib/catalog-search-params";

export function CatalogPagination({ result, pathname, current }: { result: ProductPage; pathname: string; current: CatalogSearchParams }) {
  const previousHref = catalogHref(pathname, current, { page: Math.max(1, result.meta.page - 1) });
  const nextHref = catalogHref(pathname, current, { page: Math.min(result.meta.totalPages, result.meta.page + 1) });

  return (
    <nav aria-label="Paginación del catálogo" className="mt-10 flex items-center justify-center gap-3">
      <Link
        aria-disabled={result.meta.page <= 1}
        tabIndex={result.meta.page <= 1 ? -1 : undefined}
        href={previousHref}
        prefetch={false}
        rel={hasNonPaginationQuery(previousHref) ? "nofollow" : undefined}
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
        rel={hasNonPaginationQuery(nextHref) ? "nofollow" : undefined}
        scroll={false}
        className={`rounded-xl px-4 py-3 text-sm font-semibold ${result.meta.page >= result.meta.totalPages ? "pointer-events-none opacity-40" : "bg-white shadow-[0_4px_12px_rgba(24,33,43,0.05)] hover:text-brand-blue"}`}
      >
        Siguiente
      </Link>
    </nav>
  );
}

function hasNonPaginationQuery(href: string) {
  const query = href.split("?", 2)[1];
  return query ? [...new URLSearchParams(query).keys()].some((key) => key !== "page") : false;
}
