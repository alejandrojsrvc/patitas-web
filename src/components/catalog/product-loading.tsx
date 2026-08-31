import { SiteHeader } from "@/components/layout/site-header";
import { emptyStorefrontShell } from "@/domain/storefront/types";

export function ProductLoading() {
  return (
    <>
      <SiteHeader initialShell={emptyStorefrontShell} />
      <main id="contenido" className="bg-catalog-canvas py-8 sm:py-12" aria-busy="true" aria-label="Cargando producto">
        <div className="container-shell">
          <div className="h-5 w-72 animate-pulse rounded-lg bg-catalog-soft" />
          <div className="mt-6 grid gap-7 lg:grid-cols-2 lg:gap-10 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)_minmax(17rem,1fr)] xl:gap-6">
            <div className="aspect-square animate-pulse rounded-2xl bg-catalog-soft lg:row-span-2 xl:row-span-1" />
            <div className="space-y-5">
              <div className="h-4 w-28 animate-pulse rounded bg-catalog-soft" />
              <div className="h-14 max-w-xl animate-pulse rounded-xl bg-catalog-soft" />
              <div className="h-24 animate-pulse rounded-xl bg-catalog-soft" />
              <div className="h-14 animate-pulse rounded-xl bg-catalog-soft" />
            </div>
            <div className="h-96 animate-pulse rounded-2xl bg-white" />
          </div>
        </div>
      </main>
    </>
  );
}
