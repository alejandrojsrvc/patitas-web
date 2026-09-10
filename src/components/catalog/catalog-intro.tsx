import Link from "next/link";

import type { CatalogBreadcrumb } from "@/domain/catalog/types";

export function CatalogIntro({
  title,
  description,
  breadcrumbs = [],
}: {
  title: string;
  description: string;
  breadcrumbs?: CatalogBreadcrumb[];
}) {
  return (
    <section className="bg-catalog-page pb-3 pt-6 sm:pb-4 sm:pt-8">
      <div className="container-shell">
        <div className="max-w-3xl">
          {breadcrumbs.length > 1 ? (
            <nav aria-label="Migas de pan" className="no-scrollbar mb-3 overflow-x-auto text-sm text-muted">
              <ol className="flex shrink-0 items-center gap-2">
                {breadcrumbs.map((item, index) => (
                  <li key={item.href} className="flex items-center gap-2">
                    {index ? <span aria-hidden="true">/</span> : null}
                    {index === breadcrumbs.length - 1 ? (
                      <span className="font-semibold text-ink" aria-current="page">{item.label}</span>
                    ) : (
                      <Link href={item.href} scroll={false} className="min-h-11 py-3 hover:text-brand-blue hover:underline">
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}
          <h1 className="display-heading text-3xl sm:text-4xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-base">{description}</p>
        </div>
      </div>
    </section>
  );
}
