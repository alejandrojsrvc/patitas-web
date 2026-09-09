import Link from "next/link";

import type { Species } from "@/domain/catalog/types";

export function CatalogIntro({ species, title, description }: { species?: Species; title: string; description: string }) {
  const showBreadcrumb = species && title !== "Todo para perros" && title !== "Todo para gatos";

  return (
    <section className="bg-catalog-page pb-3 pt-6 sm:pb-4 sm:pt-8">
      <div className="container-shell">
        <div className="max-w-3xl">
          {showBreadcrumb ? (
            <nav aria-label="Migas de pan" className="no-scrollbar mb-3 overflow-x-auto text-sm text-muted">
              <ol className="flex shrink-0 items-center gap-2">
                <li>
                  <Link
                    href={species === "dog" ? "/perros" : "/gatos"}
                    scroll={false}
                    className="min-h-11 py-3 hover:text-brand-blue hover:underline"
                  >
                    {species === "dog" ? "Perros" : "Gatos"}
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li className="font-semibold text-ink" aria-current="page">
                  {title}
                </li>
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
