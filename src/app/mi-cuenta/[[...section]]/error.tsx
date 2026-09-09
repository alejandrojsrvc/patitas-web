"use client";

export default function AccountSectionError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="mt-7 rounded-2xl border border-catalog-line bg-white p-6">
      <h2 className="font-display text-xl font-semibold">No pudimos cargar esta sección</h2>
      <p role="alert" className="mt-2 text-muted">
        Revisá tu conexión y volvé a intentarlo sin salir de tu cuenta.
      </p>
      <button type="button" onClick={reset} className="mt-5 min-h-11 rounded-xl bg-brand-blue px-4 font-semibold text-white">
        Reintentar carga
      </button>
    </section>
  );
}
