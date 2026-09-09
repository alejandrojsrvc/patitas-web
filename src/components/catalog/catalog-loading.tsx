import { SiteHeader } from "@/components/layout/site-header";
import { emptyStorefrontShell } from "@/domain/storefront/types";

export function CatalogLoading() {
  return (
    <>
      <SiteHeader initialShell={emptyStorefrontShell} />
      <main id="contenido" className="bg-catalog-page pb-20 [overflow-anchor:none]" aria-busy="true" aria-label="Cargando catálogo">
        <section className="container-shell pb-3 pt-6 sm:pb-4 sm:pt-8">
          <div className="space-y-3">
            <div className="h-9 max-w-xl animate-pulse rounded-lg bg-catalog-soft" />
            <div className="h-5 max-w-2xl animate-pulse rounded bg-catalog-soft" />
          </div>
        </section>
        <section className="container-shell pb-10 pt-3 sm:pt-4">
          <div className="mb-4 h-14 animate-pulse border-y border-catalog-line lg:hidden" />
          <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
            <div className="hidden h-80 animate-pulse border-y border-catalog-line lg:block" />
            <div>
              <div className="mb-4 h-16 animate-pulse rounded-xl bg-soft-blue" />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 xl:grid-cols-4">
                {Array.from({ length: 8 }, (_, index) => (
                  <div key={index} className="aspect-[0.62] animate-pulse rounded-xl bg-white" />
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
