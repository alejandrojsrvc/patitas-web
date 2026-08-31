import Link from "next/link";

import type { ProductBreadcrumbItem } from "@/lib/product-breadcrumbs";

export function ProductBreadcrumbs({ items }: { items: ProductBreadcrumbItem[] }) {
  return (
    <nav aria-label="Migas de pan" className="no-scrollbar overflow-x-auto">
      <ol className="flex min-w-max items-center gap-2 text-xs text-muted sm:text-sm">
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1;
          return (
            <li key={item.href} className="flex items-center gap-2">
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              {isCurrent ? (
                <span className="max-w-[18rem] truncate font-semibold text-ink" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="hover:text-brand-blue hover:underline">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
