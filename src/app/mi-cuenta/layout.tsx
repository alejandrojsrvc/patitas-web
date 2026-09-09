import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { emptyStorefrontShell } from "@/domain/storefront/types";
import { AccountFrame } from "@/features/account/account-page";
import { AccountProvider } from "@/features/account/account-context";
import { SessionRefreshBoundary } from "@/features/auth/session-refresh-boundary";
import { CartHydrator } from "@/features/cart/cart-context";
import { getAccountScreen } from "@/infrastructure/api/commerce-server";

const bootstrapRequest = { section: "overview" } as const;

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const result = await getAccountScreen(bootstrapRequest);

  if (result.refreshRequired) {
    return (
      <SessionRefreshBoundary required failure={<AccountRefreshFailure />}>
        <AccountShellFallback />
      </SessionRefreshBoundary>
    );
  }

  const shell = result.data?.shell ?? emptyStorefrontShell;

  return (
    <>
      <CartHydrator cart={shell.cart} />
      <SiteHeader initialShell={shell} />
      <main id="contenido" className="min-h-[65vh] bg-catalog-canvas py-6 sm:py-10">
        <div className="container-shell">
          <AccountProvider
            initialData={result.data}
            initialError={result.error}
            initialRequest={bootstrapRequest}
            initialGuest={!result.data && !result.error}
          >
            <AccountFrame>{children}</AccountFrame>
          </AccountProvider>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function AccountShellFallback() {
  return (
    <>
      <CartHydrator cart={emptyStorefrontShell.cart} />
      <SiteHeader initialShell={emptyStorefrontShell} />
      <main id="contenido" className="min-h-[65vh] bg-catalog-canvas py-6 sm:py-10">
        <div className="container-shell">
          <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10" aria-busy="true" aria-label="Cargando tu cuenta">
            <div className="hidden h-72 animate-pulse rounded-2xl bg-white lg:block" />
            <AccountCenterSkeleton />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function AccountCenterSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-12 w-2/3 animate-pulse rounded-xl bg-white" />
      <div className="h-5 w-full max-w-xl animate-pulse rounded-lg bg-white" />
      <div className="h-56 animate-pulse rounded-2xl bg-white" />
    </div>
  );
}

function AccountRefreshFailure() {
  return (
    <>
      <CartHydrator cart={emptyStorefrontShell.cart} />
      <SiteHeader initialShell={emptyStorefrontShell} />
      <main id="contenido" className="min-h-[65vh] bg-catalog-canvas py-6 sm:py-10">
        <div className="container-shell">
          <section className="max-w-xl rounded-2xl border border-catalog-line bg-white p-6 sm:p-8">
            <h1 className="font-display text-2xl font-semibold">No pudimos renovar tu sesión</h1>
            <p className="mt-2 text-muted">Iniciá sesión de nuevo para acceder a tus datos.</p>
            <Link
              href="/mi-cuenta"
              className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-brand-blue px-4 font-semibold text-white"
            >
              Iniciar sesión
            </Link>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
