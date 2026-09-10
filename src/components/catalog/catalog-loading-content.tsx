export function CatalogHeaderSkeleton() {
  return (
    <header className="min-h-[4.5rem] animate-pulse bg-brand-blue lg:min-h-[5rem]" aria-hidden="true">
      <div className="container-shell flex min-h-[4.5rem] items-center gap-4 lg:min-h-[5rem]">
        <div className="h-6 w-36 rounded bg-white/25" />
        <div className="hidden h-10 flex-1 rounded-lg bg-white/15 lg:block" />
        <div className="h-10 w-24 rounded-lg bg-white/20" />
      </div>
    </header>
  );
}

export function CatalogLoadingContent({ title, description }: { title?: string; description?: string } = {}) {
  return (
    <main id="contenido" className="bg-catalog-page pb-20 [overflow-anchor:none]" aria-busy="true" aria-label="Cargando catálogo">
      <section className="container-shell pb-3 pt-6 sm:pb-4 sm:pt-8">
        <div className="max-w-3xl space-y-3 opacity-70" aria-hidden="true">
          {title ? <p className="font-display text-3xl font-semibold text-ink">{title}</p> : <div className="h-9 max-w-xl rounded-lg bg-catalog-soft" />}
          {description ? <p className="max-w-2xl text-sm leading-6 text-muted">{description}</p> : <div className="h-5 max-w-2xl rounded bg-catalog-soft" />}
        </div>
      </section>
      <section className="container-shell pb-10 pt-3 sm:pt-4">
        <div className="mb-4 h-14 animate-pulse border-y border-catalog-line opacity-70 lg:hidden" aria-hidden="true" />
        <div className="grid items-start gap-4 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
          <CatalogSidebarSkeleton />
          <div className="min-w-0">
            <div className="mb-4 hidden h-11 animate-pulse items-center justify-between border-b border-catalog-line pb-3 opacity-70 lg:flex" aria-hidden="true">
              <div className="h-4 w-24 rounded bg-catalog-soft" />
              <div className="h-10 w-44 rounded-lg bg-white" />
            </div>
            <div className="mb-4 flex min-h-11 gap-2 opacity-70" aria-hidden="true">
              <div className="h-8 w-28 rounded-full bg-soft-blue" />
              <div className="h-8 w-36 rounded-full bg-soft-blue" />
            </div>
            <div className="mb-4 h-20 animate-pulse rounded-xl bg-soft-blue opacity-70" aria-hidden="true" />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4" aria-hidden="true">
              {Array.from({ length: 12 }, (_, index) => (
                <CatalogCardSkeleton key={index} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function CatalogSidebarSkeleton() {
  return (
    <aside className="hidden animate-pulse self-start opacity-70 lg:block" aria-hidden="true">
      <div className="mb-3 h-6 w-20 rounded bg-catalog-soft" />
      {Array.from({ length: 6 }, (_, groupIndex) => (
        <div key={groupIndex} className="border-b border-catalog-line py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="h-4 w-24 rounded bg-catalog-soft" />
            <div className="h-4 w-10 rounded bg-catalog-soft" />
          </div>
          {groupIndex < 3 ? (
            <div className="mt-3 grid gap-2">
              {Array.from({ length: groupIndex === 0 ? 3 : 2 }, (_, optionIndex) => (
                <div key={optionIndex} className="h-9 rounded-lg bg-white" />
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </aside>
  );
}

function CatalogCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl bg-white p-1.5 opacity-70">
      <div className="aspect-square rounded-lg bg-catalog-soft" />
      <div className="space-y-2 px-1 pt-2">
        <div className="h-3 w-1/3 rounded bg-catalog-soft" />
        <div className="h-4 w-full rounded bg-catalog-soft" />
        <div className="h-4 w-4/5 rounded bg-catalog-soft" />
        <div className="h-9 rounded-lg bg-catalog-soft" />
        <div className="h-6 w-2/5 rounded bg-catalog-soft" />
        <div className="h-10 rounded-lg bg-catalog-soft" />
      </div>
    </div>
  );
}
