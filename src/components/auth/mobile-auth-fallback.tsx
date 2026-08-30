import Image from "next/image";
import Link from "next/link";

type MobileAuthFallbackProps = {
  title: string;
  description: string;
  appHref: string | null;
  invalidMessage: string;
};

export function MobileAuthFallback({
  title,
  description,
  appHref,
  invalidMessage,
}: MobileAuthFallbackProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-5 py-12">
      <section className="w-full max-w-md rounded-3xl border border-border bg-white px-6 py-9 text-center shadow-[0_20px_55px_rgba(23,23,23,0.08)] sm:px-10 sm:py-11">
        <Image
          src="/brand/patitas-logo-horizontal.png"
          alt="Patitas Inquietas"
          width={220}
          height={24}
          priority
          className="mx-auto h-auto w-[180px]"
        />

        <div className="mx-auto mt-9 flex size-16 items-center justify-center rounded-full bg-soft-blue text-3xl" aria-hidden="true">
          🐾
        </div>

        <h1 className="mt-6 text-3xl font-semibold tracking-[-0.035em] text-ink">
          {title}
        </h1>

        {appHref ? (
          <>
            <p className="mt-4 text-base leading-7 text-muted">{description}</p>
            <a
              href={appHref}
              className="mt-8 inline-flex min-h-14 w-full items-center justify-center rounded-xl bg-brand-blue px-6 py-3.5 font-semibold text-white transition-colors hover:bg-[#0048dc]"
            >
              Abrir Patitas Inquietas
            </a>
            <p className="mt-4 text-sm leading-6 text-muted">
              Si la aplicación no se abre, instalá o actualizá la última versión y volvé a tocar el enlace del correo.
            </p>
          </>
        ) : (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium leading-6 text-red-700">
            {invalidMessage}
          </p>
        )}

        <Link
          href="/"
          className="mt-7 inline-flex min-h-11 items-center justify-center px-3 text-sm font-semibold text-brand-blue underline-offset-4 hover:underline"
        >
          Ir al inicio
        </Link>
      </section>
    </main>
  );
}
