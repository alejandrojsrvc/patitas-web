export function CatalogFailure({ title, message }: { title: string; message: string }) {
  return (
    <main id="contenido" className="container-shell min-h-[60vh] py-20">
      <h1 className="display-heading text-5xl">{title}</h1>
      <div className="mt-10 rounded-2xl bg-soft-yellow p-6">
        <h2 className="font-display text-2xl font-semibold">No pudimos cargar el catálogo</h2>
        <p className="mt-2 text-muted">{message} Revisá que Patitas API esté disponible y volvé a intentar.</p>
      </div>
    </main>
  );
}
