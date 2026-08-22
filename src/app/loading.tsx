import { SiteHeader } from "@/components/layout/site-header";

export default function Loading() {
  return (
    <>
      <SiteHeader />
      <main id="contenido" className="min-h-[70vh] bg-catalog-canvas py-14" aria-busy="true" aria-label="Cargando página">
        <div className="container-shell space-y-5">
          <div className="h-5 w-48 animate-pulse rounded-lg bg-catalog-soft" />
          <div className="h-14 max-w-2xl animate-pulse rounded-xl bg-catalog-soft" />
          <div className="h-5 max-w-xl animate-pulse rounded-lg bg-catalog-soft" />
          <div className="mt-10 h-64 animate-pulse rounded-2xl bg-catalog-soft" />
        </div>
      </main>
    </>
  );
}
