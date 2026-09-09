"use client";

export function CatalogFailure({ title, message }: { title: string; message?: string }) {
  return (
    <main id="contenido" className="container-shell min-h-[60vh] py-12 sm:py-16">
      <h1 className="display-heading text-3xl sm:text-4xl">{title}</h1>
      <div className="mt-8 max-w-2xl rounded-xl bg-soft-yellow p-6">
        <h2 className="font-display text-2xl font-semibold">No pudimos cargar el catálogo</h2>
        <p className="mt-2 text-muted">{message ?? "Hubo un problema al obtener los productos. Tu selección sigue guardada; volvé a intentar."}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-blue px-5 text-sm font-semibold text-white hover:bg-[#0048dc]"
        >
          Reintentar
        </button>
      </div>
    </main>
  );
}
