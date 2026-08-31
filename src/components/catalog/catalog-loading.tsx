import { SiteHeader } from "@/components/layout/site-header";
import { emptyStorefrontShell } from "@/domain/storefront/types";

export function CatalogLoading() {
  return (
    <>
      <SiteHeader initialShell={emptyStorefrontShell} />
      <main id="contenido" className="bg-catalog-canvas pb-20" aria-busy="true" aria-label="Cargando catálogo">
        <section className="bg-catalog-soft py-12 sm:py-16">
          <div className="container-shell space-y-4">
            <div className="h-12 max-w-xl animate-pulse rounded-xl bg-white/70" />
            <div className="h-5 max-w-2xl animate-pulse rounded-lg bg-white/60" />
          </div>
        </section>
        <section className="container-shell grid gap-6 py-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10">
          <div className="h-80 animate-pulse rounded-2xl bg-white" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => <div key={index} className="h-80 animate-pulse rounded-xl bg-white" />)}
          </div>
        </section>
      </main>
    </>
  );
}
