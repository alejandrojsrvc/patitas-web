import { Suspense } from "react";

import { SiteHeader } from "@/components/layout/site-header";
import { emptyStorefrontShell } from "@/domain/storefront/types";

export default function Loading() {
  return (
    <>
      <Suspense fallback={<HeaderFallback />}>
        <SiteHeader initialShell={emptyStorefrontShell} />
      </Suspense>
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

function HeaderFallback() {
  return <header className="min-h-[7.25rem] bg-brand-blue lg:min-h-[7.75rem]" aria-hidden="true" />;
}
