import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center bg-page-bg px-6 text-center">
      <p className="text-sm font-bold tracking-[0.12em] text-brand-blue">404</p>
      <h1 className="mt-4 font-display text-4xl font-semibold text-ink sm:text-5xl">No encontramos esta página.</h1>
      <p className="mt-4 max-w-md text-lg text-muted">Puede que el enlace esté roto o que la página se haya movido.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="flex min-h-12 items-center justify-center rounded-xl bg-brand-blue px-6 text-sm font-semibold text-white transition-colors hover:bg-[#0048dc]"
        >
          Volver al inicio
        </Link>
        <Link
          href="/armar"
          className="flex min-h-12 items-center justify-center rounded-xl border border-border px-6 text-sm font-semibold text-ink transition-colors hover:bg-soft-blue"
        >
          Armar mi Patitas
        </Link>
      </div>
    </section>
  );
}
