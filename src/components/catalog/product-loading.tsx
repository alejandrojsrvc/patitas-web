import { SiteHeader } from "@/components/layout/site-header";

export function ProductLoading() {
  return (
    <>
      <SiteHeader />
      <main id="contenido" className="bg-catalog-canvas py-8 sm:py-12" aria-busy="true" aria-label="Cargando producto">
        <div className="container-shell">
          <div className="h-5 w-72 animate-pulse rounded-lg bg-catalog-soft" />
          <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="aspect-square animate-pulse rounded-2xl bg-catalog-soft" />
            <div className="space-y-5">
              <div className="h-4 w-28 animate-pulse rounded bg-catalog-soft" />
              <div className="h-14 max-w-xl animate-pulse rounded-xl bg-catalog-soft" />
              <div className="h-24 animate-pulse rounded-xl bg-catalog-soft" />
              <div className="h-14 animate-pulse rounded-xl bg-catalog-soft" />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
