import Link from "next/link";

import type { Species } from "@/domain/catalog/types";

export function CatalogIntro({ species, title, description }: { species?: Species; title: string; description: string }) {
  return (
    <section className="py-4 sm:py-7">
      <div className="container-shell">
        <div className="max-w-4xl">
          {species ? (
            <nav aria-label="Migas de pan" className="no-scrollbar mb-3 overflow-x-auto text-xs text-muted">
              <ol className="flex shrink-0 items-center gap-2">
                <li>
                  <Link href="/" className="hover:text-brand-blue hover:underline">
                    Inicio
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
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted sm:text-base">{description}</p>
        </div>
      </div>
    </section>
  );
}
